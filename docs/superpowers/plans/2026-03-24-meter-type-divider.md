# Meter Type / Divider Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-unit meter type (Normal / ÷1,000 / ÷10,000) to the water reading creation flow, storing raw meter values as m³ and remembering the meter type per unit.

**Architecture:** Add `MeterType` enum + field to the `Unit` Prisma model; expose it through the buildings API; accept `meterType` in `POST /water-reading` to persist it on the unit; add a selector + divisor logic to the frontend create-reading form.

**Tech Stack:** Node.js, Prisma (PostgreSQL), React, MUI

**Spec:** `docs/superpowers/specs/2026-03-24-meter-type-divider-design.md`

---

## Chunk 1: Database Migration

### Task 1: Add MeterType enum and field to Prisma schema

**Files:**
- Modify: `/Volumes/Software/rentke/api/API/prisma/schema.prisma`

- [ ] **Step 1: Add the MeterType enum to schema.prisma**

Open `/Volumes/Software/rentke/api/API/prisma/schema.prisma`. Append this enum after line 775 (the closing `}` of `enum UnitType`, the last enum in the file):

```prisma
enum MeterType {
  NORMAL
  DIVIDE_1000
  DIVIDE_10000
}
```

- [ ] **Step 2: Add meterType field to the Unit model**

In `schema.prisma`, find the `model Unit {` block (line 255). The last scalar field is `securityCharge Float?` at line 271. Insert the new field on line 272, immediately before the relation fields (`customers Customer[]`):

```prisma
  meterType             MeterType      @default(NORMAL)
```

The block around that area should look like:
```prisma
  securityCharge        Float?
  meterType             MeterType      @default(NORMAL)   ← new line
  customers             Customer[]
  CustomerUnit          CustomerUnit[]
```

- [ ] **Step 3: Run the Prisma migration**

```bash
cd /Volumes/Software/rentke/api/API
npx prisma migrate dev --name add_meter_type_to_unit
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied:
  migrations/YYYYMMDDHHMMSS_add_meter_type_to_unit/migration.sql
```

- [ ] **Step 4: Verify migration**

```bash
npx prisma studio
```

Open http://localhost:5555, navigate to the Unit table, confirm `meterType` column exists with value `NORMAL` on all existing rows. Then close Prisma Studio (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Software/rentke/api/API
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add MeterType enum and meterType field to Unit model"
```

---

## Chunk 2: Backend — Expose meterType in building responses

### Task 2: Add meterType to getAllBuildings unit select

**Files:**
- Modify: `/Volumes/Software/rentke/api/API/controller/building/building.js`

- [ ] **Step 1: Add meterType to getAllBuildings**

In `building.js`, find `getAllBuildings` (starts at line 467). Locate the `units: { select: {` block (lines 514–542). Add `meterType: true` after the existing `status: true` line (line 522):

```js
units: {
  select: {
    id: true,
    unitNumber: true,
    monthlyCharge: true,
    depositAmount: true,
    garbageCharge: true,
    serviceCharge: true,
    status: true,
    meterType: true,   // ← ADD THIS LINE
    createdAt: true,
    updatedAt: true,
    customers: {
      // ... unchanged
    },
  },
},
```

- [ ] **Step 2: Add meterType to getBuildingById**

In the same file, find `getBuildingById` (starts at line 44). Locate its `units: { select: {` block (lines 96–129, including the `orderBy` at the end). Add `meterType: true` after `status: true` (line 104):

```js
units: {
  select: {
    id: true,
    unitNumber: true,
    monthlyCharge: true,
    depositAmount: true,
    garbageCharge: true,
    serviceCharge: true,
    status: true,
    meterType: true,   // ← ADD THIS LINE
    createdAt: true,
    updatedAt: true,
    CustomerUnit: {
      // ... unchanged
    },
  },
  orderBy: { unitNumber: 'asc' },
},
```

- [ ] **Step 3: Verify**

Start the API server and call the endpoint:

```bash
cd /Volumes/Software/rentke/api/API
node server.js
# In another terminal:
curl -s -b <your-auth-cookie> "http://localhost:5000/api/buildings?page=1&limit=5" | jq '.buildings[0].units[0].meterType'
```

Expected output: `"NORMAL"` (or similar string value for an existing unit).

- [ ] **Step 4: Commit**

```bash
git add controller/building/building.js
git commit -m "feat: include meterType in unit data for getAllBuildings and getBuildingById"
```

---

## Chunk 3: Backend — Accept meterType in POST /water-reading

### Task 3: Save meterType to unit when creating a reading

**Files:**
- Modify: `/Volumes/Software/rentke/api/API/controller/utilitiesReadings/utilitiesReadings.js:25-30`

- [ ] **Step 1: Extract meterType from request body**

In `utilitiesReadings.js`, find `createWaterReading` (line 25). Change line 26 to also destructure `meterType`:

**Before:**
```js
const { unitId, reading, meterPhotoUrl, previousReading: previousReadingOverride } = req.body;
```

**After:**
```js
const { unitId, reading, meterPhotoUrl, previousReading: previousReadingOverride, meterType } = req.body;
```

- [ ] **Step 2: Add meterType validation**

Use a plain string array for validation (no need to import `MeterType` from `@prisma/client` — Prisma will reject invalid values at the DB level too, but an early check gives a better error message). This must go **before the `try` block** (before line 41), so it returns a proper 400 rather than a 500. Add it immediately after the `previousReadingOverride` check (after line 39):

```js
const VALID_METER_TYPES = ['NORMAL', 'DIVIDE_1000', 'DIVIDE_10000'];
if (meterType !== undefined && !VALID_METER_TYPES.includes(meterType)) {
  return res.status(400).json({ message: 'Invalid meterType. Must be NORMAL, DIVIDE_1000, or DIVIDE_10000.' });
}
```

- [ ] **Step 3: Persist meterType on the unit**

After the unit is fetched and validated (after line 70, after the closing `}` of the `if (!unit.building)` guard), add:

```js
// 🔹 Persist meterType on unit if provided and different from stored
if (meterType && unit.meterType !== meterType) {
  await prisma.unit.update({
    where: { id: unitId },
    data: { meterType },
  });
}
```

- [ ] **Step 4: Verify**

Restart the API server. Use a REST client or curl to POST a reading with `meterType: "DIVIDE_1000"` for a unit, then query that unit and confirm its `meterType` changed.

- [ ] **Step 5: Commit**

```bash
git add controller/utilitiesReadings/utilitiesReadings.js
git commit -m "feat: accept and persist meterType on unit when creating water reading"
```

---

## Chunk 4: Frontend — Meter type selector and divisor logic

### Task 4: Implement meter type feature in addReadings.jsx

**Files:**
- Modify: `/Volumes/Software/rentke/rentalweb/web/src/pages/meterReadings/addReadings.jsx`

This is the largest task. Work through it section by section.

---

#### Step 1: Fix the latest reading response accessor (bug fix)

- [ ] Find `fetchLatestReading` (around line 104). Change line 112:

**Before:**
```js
const data = res.data?.data || res.data || null;
```

**After:**
```js
const data = res.data?.latestReading || null;
```

The API response shape is `{ unitId, unit, customer, latestReading: { id, reading, ... } }` — there is no `data` key, so the old fallback `res.data?.data` was dead code. The `data.reading` access on line 114 still works correctly because `latestReading` has a `reading` property.

---

#### Step 2: Add meterType state

- [ ] After the existing `useState` declarations (around line 46), add:

```js
const [meterType, setMeterType] = useState(null); // null = not yet set for this unit
```

---

#### Step 3: Add DIVISORS constant at module scope and divisor derived value

- [ ] At the top of `addReadings.jsx`, **outside and above** the `export default function CreateWaterReading()` declaration, add the static constant (so it is not recreated on every render):

```js
const DIVISORS = { NORMAL: 1, DIVIDE_1000: 1000, DIVIDE_10000: 10000 };
```

- [ ] Then, inside the component body, near the `consumption` derivation (around line 190), add the derived `divisor`:

```js
const divisor = meterType ? (DIVISORS[meterType] ?? 1) : 1;
```

Note: `validateForm` (line 143) is a closure function inside the component, so it naturally has access to `divisor` via closure — no arguments needed.

---

#### Step 4: Fix consumption calculation to use divisor

- [ ] Replace the existing `consumption` derivation (lines 190-194):

**Before:**
```js
const consumption =
  form.previousReading !== "" && form.currentReading !== "" &&
  !isNaN(form.previousReading) && !isNaN(form.currentReading)
    ? (parseFloat(form.currentReading) - parseFloat(form.previousReading)).toFixed(2)
    : null;
```

**After:**
```js
const currentM3 =
  form.currentReading !== "" && !isNaN(form.currentReading) && meterType
    ? parseFloat(form.currentReading) / divisor
    : null;

const previousM3 =
  form.previousReading !== "" && !isNaN(form.previousReading)
    ? parseFloat(form.previousReading)   // always in m³ (auto-filled from API or manually entered)
    : null;

const consumption =
  currentM3 !== null && previousM3 !== null
    ? (currentM3 - previousM3).toFixed(2)
    : null;
```

---

#### Step 5: Fix formReady and submit button to require meterType

- [ ] Find `formReady` (around line 203). Replace:

**Before:**
```js
const formReady =
  selectedBuildingId && selectedUnitId && form.currentReading !== "" && !Object.keys(errors).length;
```

**After:**
```js
const formReady =
  selectedBuildingId && selectedUnitId && meterType && form.currentReading !== "" && !Object.keys(errors).length;
```

---

#### Step 6: Pre-fill meterType from unit data + reset on unit change

- [ ] Find the `useEffect` that watches `selectedUnitId` (around line 225). This effect already calls `fetchLatestReading(selectedUnitId)` and resets form state. Add the meterType pre-fill/reset:

**Before (the effect body):**
```js
useEffect(() => {
  if (selectedUnitId) {
    setForm({ previousReading: "", currentReading: "" });
    setErrors({});
    fetchLatestReading(selectedUnitId);
  } else {
    setForm({ previousReading: "", currentReading: "" });
    setLatestReading(null);
  }
}, [selectedUnitId, fetchLatestReading]);
```

**After:**
```js
useEffect(() => {
  if (selectedUnitId) {
    setForm({ previousReading: "", currentReading: "" });
    setErrors({});
    fetchLatestReading(selectedUnitId);
    // Pre-fill meterType from unit data
    const unit = units.find((u) => u.id === selectedUnitId);
    setMeterType(unit?.meterType || null);
  } else {
    setForm({ previousReading: "", currentReading: "" });
    setLatestReading(null);
    setMeterType(null);
  }
}, [selectedUnitId, fetchLatestReading, units]);
```

- [ ] Also find the `useEffect` that watches `selectedBuildingId` (around line 212). Add `setMeterType(null)` in its cleanup:

**Find this line inside the effect:**
```js
setSelectedUnitId("");
```

**Add after it:**
```js
setMeterType(null);
```

---

#### Step 7: Add meterType reset to handleReset

- [ ] Find `handleReset` (around line 180). Add `setMeterType(null)`:

**Before:**
```js
const handleReset = () => {
  setForm({ previousReading: "", currentReading: "" });
  setSelectedBuildingId("");
  setSelectedUnitId("");
  setLatestReading(null);
  setErrors({});
  setSubmitted(false);
};
```

**After:**
```js
const handleReset = () => {
  setForm({ previousReading: "", currentReading: "" });
  setSelectedBuildingId("");
  setSelectedUnitId("");
  setLatestReading(null);
  setMeterType(null);
  setErrors({});
  setSubmitted(false);
};
```

---

#### Step 8: Add meterType validation

- [ ] Find `validateForm` (around line 143). Add meterType check at the top of the function body:

```js
if (!meterType) errs.meterType = "Please select a meter type";
```

- [ ] Also fix the current reading comparison to compare in m³ (prevents false errors when raw value > previousM3):

**Before (around line 150):**
```js
const prev = form.previousReading !== "" ? parseFloat(form.previousReading) : null;
const curr = parseFloat(form.currentReading);
if (form.currentReading === "" || isNaN(curr) || curr < 0) {
  errs.currentReading = "Current reading must be a non-negative number";
} else if (prev !== null && !isNaN(prev) && curr < prev) {
  errs.currentReading = "Current reading cannot be less than the previous reading";
}
```

**After:**
```js
const prev = form.previousReading !== "" ? parseFloat(form.previousReading) : null;
const curr = parseFloat(form.currentReading);
const currM3 = isNaN(curr) ? NaN : curr / divisor;
if (form.currentReading === "" || isNaN(curr) || curr < 0) {
  errs.currentReading = "Current reading must be a non-negative number";
} else if (prev !== null && !isNaN(prev) && currM3 < prev) {
  errs.currentReading = "Current reading cannot be less than the previous reading";
}
```

---

#### Step 9: Update submit payload

- [ ] Find `handleSubmit` (around line 159). Replace the payload construction:

**Before:**
```js
const payload = {
  unitId: selectedUnitId,
  reading: parseFloat(form.currentReading),
  ...(form.previousReading !== "" && { previousReading: parseFloat(form.previousReading) }),
};
```

**After:**
```js
const payload = {
  unitId: selectedUnitId,
  reading: parseFloat(form.currentReading) / divisor,   // converted to m³
  meterType,
  ...(form.previousReading !== "" && {
    previousReading: parseFloat(form.previousReading),  // already in m³, no division
  }),
};
```

---

#### Step 10: Add the MUI FormControl for meter type selector

- [ ] Import `ToggleButton` and `ToggleButtonGroup` from MUI at the top of the file (add to existing MUI import):

```js
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
```

- [ ] In the JSX, find the "Meter Reading" card body (the `<Box component="form"` around line 434). Add the meter type selector **above** the "Previous reading info" block. Insert this JSX:

```jsx
{/* Meter Type Selector */}
<Box>
  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.75 }}>
    Meter Type *
  </Typography>
  <ToggleButtonGroup
    value={meterType}
    exclusive
    onChange={(_, val) => { if (val) { setMeterType(val); setErrors((p) => ({ ...p, meterType: "" })); } }}
    size="small"
    fullWidth
    sx={{
      "& .MuiToggleButton-root": {
        borderColor,
        color: textSecondary,
        textTransform: "none",
        fontSize: "0.8rem",
        fontWeight: 500,
        flex: 1,
        "&.Mui-selected": {
          bgcolor: alpha(accentGreen, 0.12),
          color: accentGreen,
          borderColor: accentGreen,
          fontWeight: 700,
        },
        "&:hover": { bgcolor: alpha(accentGreen, 0.06) },
      },
    }}
  >
    <ToggleButton value="NORMAL">Normal</ToggleButton>
    <ToggleButton value="DIVIDE_1000">÷ 1,000</ToggleButton>
    <ToggleButton value="DIVIDE_10000">÷ 10,000</ToggleButton>
  </ToggleButtonGroup>
  {errors.meterType && (
    <Typography variant="caption" sx={{ color: "#f44336", mt: 0.5, display: "block" }}>
      {errors.meterType}
    </Typography>
  )}
  {!meterType && (
    <Typography variant="caption" sx={{ color: "#ff9800", mt: 0.5, display: "block" }}>
      Select meter type to continue
    </Typography>
  )}
</Box>
```

---

#### Step 11: Update field labels dynamically

- [ ] Find the `TextField` for Current Reading (around line 512). Change the `label` prop:

**Before:**
```jsx
label="Current Reading (m³) *"
```

**After:**
```jsx
label={meterType && meterType !== "NORMAL" ? "Current Reading (raw meter value) *" : "Current Reading (m³) *"}
```

---

#### Step 12: Update consumption preview label to show formula

- [ ] Find the consumption preview `<Paper>` block (around line 542). Update the display to show the conversion when divisor > 1. Replace the consumption preview text section:

**Before:**
```jsx
<Box>
  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
    Consumption Summary
  </Typography>
  <Typography variant="h6" sx={{ fontWeight: 700, color: accentGreen, lineHeight: 1.2, mt: 0.25 }}>
    {consumption} m³
  </Typography>
  <Typography variant="caption" sx={{ color: textSecondary }}>
    {form.previousReading} → {form.currentReading} m³
  </Typography>
</Box>
```

**After:**
```jsx
<Box>
  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
    Consumption Summary
  </Typography>
  <Typography variant="h6" sx={{ fontWeight: 700, color: accentGreen, lineHeight: 1.2, mt: 0.25 }}>
    {consumption} m³
  </Typography>
  <Typography variant="caption" sx={{ color: textSecondary }}>
    {divisor > 1
      ? `${form.currentReading} ÷ ${divisor.toLocaleString()} = ${currentM3?.toFixed(3)} m³ − ${previousM3?.toFixed(3)} m³`
      : `${previousM3?.toFixed(3)} → ${currentM3?.toFixed(3)} m³`}
  </Typography>
</Box>
```

---

#### Step 13: Disable submit button when meterType not selected

- [ ] Find the submit `<Button>` (around line 611). Update the `disabled` prop:

**Before:**
```jsx
disabled={formLoading || !selectedUnitId}
```

**After:**
```jsx
disabled={formLoading || !selectedUnitId || !meterType}
```

---

#### Step 14: Verify in browser

- [ ] Start the frontend dev server:

```bash
cd /Volumes/Software/rentke/rentalweb/web
npm run dev
```

- [ ] Navigate to `/water-readings/create`. Verify:
  1. Meter type selector appears above reading fields
  2. Submit is disabled until meter type is chosen
  3. Selecting a unit with a saved meterType pre-fills the selector
  4. Selecting a new unit (no meterType) shows "Select meter type to continue" hint
  5. For a DIVIDE_10000 unit: enter `50000` as current reading and `3.00` m³ as previous → consumption preview shows `5.000 − 3.000 = 2.000 m³`
  6. Submit succeeds and unit's meterType is saved (confirm by reloading that unit — selector should be pre-filled next time)

---

#### Step 15: Commit

```bash
cd /Volumes/Software/rentke/rentalweb/web
git add src/pages/meterReadings/addReadings.jsx
git commit -m "feat: add meter type selector with divisor logic to water reading creation"
```

---

## Done

All four chunks complete. The meter type feature is fully implemented:

- Database: `Unit.meterType` persisted in PostgreSQL
- Backend: `meterType` exposed through building responses, saved on unit when reading is created
- Frontend: selector, divisor conversion, corrected consumption preview, fixed previous-reading response accessor bug
