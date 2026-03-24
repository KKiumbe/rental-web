# Water-Only Customer Meter Readings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Add Reading screen to let users record meter readings for water-only customers, below the building/unit selectors, using the same meter type and reading form.

**Architecture:** A new `PATCH /water-only-customers/:id/reading` endpoint handles rolling updates (new reading → currentReading, old currentReading → previousReading). The frontend adds a water-only customer Autocomplete below the building/unit selectors in the left panel; selecting a customer clears the building/unit and vice versa; the right-panel reading form is shared between both modes.

**Tech Stack:** Prisma (PostgreSQL), Node.js/Express, React + MUI

---

## Chunk 1: Database + Backend

### Task 1: Add meterType to WaterOnlyCustomer schema and migrate

**Files:**
- Modify: `api/API/prisma/schema.prisma`

**Working directory:** `/Volumes/Software/rentke/api/API`

#### Context
`WaterOnlyCustomer` model is defined in `schema.prisma` around line 707 (search for `model WaterOnlyCustomer`). The `MeterType` enum already exists (added for units in the previous feature). You are adding a single field.

- [ ] **Step 1: Add meterType field to WaterOnlyCustomer model**

In `schema.prisma`, find `model WaterOnlyCustomer` and add this field after `status`:
```prisma
meterType        MeterType      @default(NORMAL)
```

The model should look like:
```prisma
model WaterOnlyCustomer {
  id               String         @id @default(uuid())
  tenantId         Int
  firstName        String
  lastName         String
  phoneNumber      String
  previousReading  Float          @default(0)
  currentReading   Float          @default(0)
  closingBalance   Float          @default(0)
  status           CustomerStatus @default(ACTIVE)
  meterType        MeterType      @default(NORMAL)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  tenant           Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, phoneNumber])
  @@index([tenantId])
  @@index([status])
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Volumes/Software/rentke/api/API && npx prisma migrate dev --name add_meter_type_to_water_only_customer
```

Expected: migration file created, database updated. Output ends with "Your database is now in sync with your schema."

- [ ] **Step 3: Verify generated client includes meterType**

```bash
npx prisma generate
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Software/rentke/api/API && git add prisma/schema.prisma prisma/migrations/ && git commit -m "feat: add meterType to WaterOnlyCustomer model"
```

---

### Task 2: Update getAllWaterOnlyCustomers to include meterType

**Files:**
- Modify: `api/API/controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js`

**Working directory:** `/Volumes/Software/rentke/api/API`

#### Context
This controller uses an explicit Prisma `select` clause that currently selects these fields: `id, firstName, lastName, phoneNumber, previousReading, currentReading, closingBalance, status, createdAt, updatedAt`. The new `meterType` field must be added to this select so the frontend can pre-fill the meter type when a customer is selected.

- [ ] **Step 1: Add meterType to the select clause**

In `controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js`, find the `select` block and add `meterType: true` after `status: true`:

```js
select: {
  id: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  previousReading: true,
  currentReading: true,
  closingBalance: true,
  status: true,
  meterType: true,       // ← add this line
  createdAt: true,
  updatedAt: true,
},
```

- [ ] **Step 2: Verify the file looks correct**

Read the file and confirm `meterType: true` appears in the select block.

- [ ] **Step 3: Commit**

```bash
git add controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js && git commit -m "feat: include meterType in getAllWaterOnlyCustomers response"
```

---

### Task 3: Create PATCH /water-only-customers/:id/reading endpoint

**Files:**
- Create: `api/API/controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js`
- Modify: `api/API/routes/customer/waterOnlyCustomerRoutes.js`

**Working directory:** `/Volumes/Software/rentke/api/API`

#### Context
The existing routes file `routes/customer/waterOnlyCustomerRoutes.js` registers POST and GET routes with `verifyToken` and `checkAccess('customer', ...)` middleware. The new PATCH route follows the same pattern.

The controller receives `reading` (already in m³, converted by frontend) and `meterType`. It must:
1. Fetch the customer (verifying it belongs to the logged-in user's tenant)
2. Validate inputs
3. Shift: `previousReading = currentReading`, `currentReading = reading`
4. Update `meterType` if provided

- [ ] **Step 1: Create the controller file**

Create `controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js`:

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VALID_METER_TYPES = ['NORMAL', 'DIVIDE_1000', 'DIVIDE_10000'];

const updateWaterOnlyCustomerReading = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { reading, meterType } = req.body;

  // Validate reading
  const readingVal = parseFloat(reading);
  if (reading === undefined || reading === null || isNaN(readingVal) || readingVal < 0) {
    return res.status(400).json({ success: false, message: 'reading must be a non-negative number.' });
  }

  // Validate meterType if provided
  if (meterType !== undefined && !VALID_METER_TYPES.includes(meterType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid meterType. Valid values: ${VALID_METER_TYPES.join(', ')}`,
    });
  }

  try {
    // Verify customer belongs to this tenant
    const customer = await prisma.waterOnlyCustomer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Shift reading and update meterType
    const updated = await prisma.waterOnlyCustomer.update({
      where: { id },
      data: {
        previousReading: customer.currentReading,
        currentReading: readingVal,
        ...(meterType && { meterType }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Reading updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating water-only customer reading:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { updateWaterOnlyCustomerReading };
```

- [ ] **Step 2: Register the route**

In `routes/customer/waterOnlyCustomerRoutes.js`, add the import and register the route:

```js
const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken.js');
const checkAccess = require('../../middleware/roleVerify.js');
const { createWaterOnlyCustomer } = require('../../controller/customers/waterOnlyCustomers/createWaterOnlyCustomer.js');
const { getAllWaterOnlyCustomers } = require('../../controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js');
const { updateWaterOnlyCustomerReading } = require('../../controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js');

router.post('/water-only-customers', verifyToken, checkAccess('customer', 'create'), createWaterOnlyCustomer);
router.get('/water-only-customers', verifyToken, checkAccess('customer', 'read'), getAllWaterOnlyCustomers);
router.patch('/water-only-customers/:id/reading', verifyToken, checkAccess('customer', 'update'), updateWaterOnlyCustomerReading);

module.exports = router;
```

- [ ] **Step 3: Verify the controller and route look correct**

Read both files and confirm they match the code above.

- [ ] **Step 4: Commit**

```bash
git add controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js routes/customer/waterOnlyCustomerRoutes.js && git commit -m "feat: add PATCH /water-only-customers/:id/reading endpoint"
```

---

## Chunk 2: Frontend

### Task 4: Update addReadings.jsx with water-only customer support

**Files:**
- Modify: `web/src/pages/meterReadings/addReadings.jsx`

**Working directory:** `/Volumes/Software/rentke/rentalweb/web`

#### Context
`addReadings.jsx` is the existing meter reading form at `src/pages/meterReadings/addReadings.jsx`. It exports `CreateWaterReading` as default. The file has these key sections:
- Lines 1-33: imports
- Line 34: `const DIVISORS = { NORMAL: 1, DIVIDE_1000: 1000, DIVIDE_10000: 10000 };`
- Lines 36-51: state declarations
- Lines 92-133: `fetchBuildings` and `fetchLatestReading` callbacks
- Lines 148-164: `validateForm()`
- Lines 166-188: `handleSubmit()`
- Lines 190-198: `handleReset()`
- Lines 200-226: derived values (`divisor`, `currentM3`, `previousM3`, `consumption`, `formReady`)
- Lines 228-266: useEffects
- Lines 264-end: JSX render

You will make changes in **multiple places** in this file. Read the file carefully before editing. Make one change at a time and verify each before proceeding.

#### Sub-task 4a: Add imports and state

- [ ] **Step 1: Add Autocomplete import**

Find the MUI import block at the top of the file. Add `Autocomplete` to the imports from `@mui/material`. Also add `PersonIcon` from `@mui/icons-material/Person`.

The imports block currently starts with:
```js
import {
  Box,
  Button,
  Typography,
  FormControl,
```

Change to:
```js
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  FormControl,
```

And add the PersonIcon import after the existing icon imports:
```js
import PersonIcon from "@mui/icons-material/Person";
```

- [ ] **Step 2: Add new state variables**

After the existing `const [meterType, setMeterType] = useState(null);` line (currently line 51), add:

```js
const [waterOnlyCustomers, setWaterOnlyCustomers] = useState([]);
const [waterOnlyCustomersLoading, setWaterOnlyCustomersLoading] = useState(false);
const [selectedWaterOnlyCustomerId, setSelectedWaterOnlyCustomerId] = useState("");
```

#### Sub-task 4b: Add fetchWaterOnlyCustomers callback

- [ ] **Step 3: Add fetch callback**

After the `fetchLatestReading` useCallback (which ends around line 133), add:

```js
const fetchWaterOnlyCustomers = useCallback(async () => {
  try {
    setWaterOnlyCustomersLoading(true);
    const res = await axios.get(`${BASEURL}/water-only-customers`, { withCredentials: true });
    setWaterOnlyCustomers(res.data?.data || []);
  } catch (err) {
    if (err.response?.status === 401) { navigate("/login"); return; }
    showSnackbar("Failed to fetch water-only customers", "error");
  } finally {
    setWaterOnlyCustomersLoading(false);
  }
}, [navigate, BASEURL]);
```

#### Sub-task 4c: Update validateForm

- [ ] **Step 4: Make unit validation mode-aware**

In `validateForm()`, find this line:
```js
if (!selectedUnitId) errs.unit = "Please select a unit";
```

Change it to:
```js
if (!selectedUnitId && !selectedWaterOnlyCustomerId) errs.unit = "Please select a unit or water-only customer";
```

#### Sub-task 4d: Update handleSubmit

- [ ] **Step 5: Route submit to correct endpoint**

In `handleSubmit`, the current submit logic starts with:
```js
    try {
      const payload = {
        unitId: selectedUnitId,
        reading: parseFloat(form.currentReading) / divisor,   // converted to m³
        meterType,
        ...(form.previousReading !== "" && {
          previousReading: parseFloat(form.previousReading) / divisor,  // raw → m³
        }),
      };
      const res = await axios.post(`${BASEURL}/water-reading`, payload, { withCredentials: true });
```

Replace from `try {` through the `axios.post` line (keep the rest: `showSnackbar`, `setSubmitted`, catch, finally) with:

```js
    try {
      let res;
      if (selectedWaterOnlyCustomerId) {
        res = await axios.patch(
          `${BASEURL}/water-only-customers/${selectedWaterOnlyCustomerId}/reading`,
          {
            reading: parseFloat(form.currentReading) / divisor,
            meterType,
          },
          { withCredentials: true }
        );
      } else {
        const payload = {
          unitId: selectedUnitId,
          reading: parseFloat(form.currentReading) / divisor,
          meterType,
          ...(form.previousReading !== "" && {
            previousReading: parseFloat(form.previousReading) / divisor,
          }),
        };
        res = await axios.post(`${BASEURL}/water-reading`, payload, { withCredentials: true });
      }
```

#### Sub-task 4e: Update handleReset

- [ ] **Step 6: Reset water-only customer state**

In `handleReset()`, after `setMeterType(null);`, add:
```js
    setSelectedWaterOnlyCustomerId("");
```

Do NOT clear `waterOnlyCustomers` — the list should persist across resets.

#### Sub-task 4f: Update formReady

- [ ] **Step 7: Include water-only customer in formReady condition**

Find:
```js
  const formReady =
    selectedBuildingId && selectedUnitId && meterType && form.currentReading !== "" && !Object.keys(errors).length;
```

Replace with:
```js
  const formReady =
    ((selectedBuildingId && selectedUnitId) || selectedWaterOnlyCustomerId) &&
    meterType &&
    form.currentReading !== "" &&
    !Object.keys(errors).length;
```

#### Sub-task 4g: Update useEffects

- [ ] **Step 8: Add fetchWaterOnlyCustomers to page-load effect**

Find the useEffect that calls `fetchBuildings()`:
```js
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    fetchBuildings();
  }, [currentUser, navigate, fetchBuildings]);
```

Replace with:
```js
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    fetchBuildings();
    fetchWaterOnlyCustomers();
  }, [currentUser, navigate, fetchBuildings, fetchWaterOnlyCustomers]);
```

- [ ] **Step 9: Clear water-only customer on building change**

Find the `selectedBuildingId` useEffect:
```js
  useEffect(() => {
    if (selectedBuildingId) {
      const building = buildings.find((b) => b.id === selectedBuildingId);
      setUnits(building?.units || []);
    } else {
      setUnits([]);
    }
    setSelectedUnitId("");
    setMeterType(null);
    setForm({ previousReading: "", currentReading: "" });
    setLatestReading(null);
    setErrors({});
  }, [selectedBuildingId, buildings]);
```

Add `setSelectedWaterOnlyCustomerId("");` after `setSelectedUnitId("");`:

```js
  useEffect(() => {
    if (selectedBuildingId) {
      const building = buildings.find((b) => b.id === selectedBuildingId);
      setUnits(building?.units || []);
    } else {
      setUnits([]);
    }
    setSelectedUnitId("");
    setSelectedWaterOnlyCustomerId("");
    setMeterType(null);
    setForm({ previousReading: "", currentReading: "" });
    setLatestReading(null);
    setErrors({});
  }, [selectedBuildingId, buildings]);
```

- [ ] **Step 10: Add water-only customer auto-fill useEffect**

After the existing `useEffect(() => { ... }, [latestReading, meterType]);` (the auto-fill useEffect that watches latestReading), add a new useEffect:

```js
  // Auto-fill previousReading from water-only customer's currentReading (as raw units)
  useEffect(() => {
    if (!selectedWaterOnlyCustomerId || !meterType) return;
    const customer = waterOnlyCustomers.find((c) => c.id === selectedWaterOnlyCustomerId);
    if (customer) {
      setForm((prev) => ({
        ...prev,
        previousReading: String(customer.currentReading * (DIVISORS[meterType] ?? 1)),
      }));
    }
  }, [selectedWaterOnlyCustomerId, meterType, waterOnlyCustomers]);
```

#### Sub-task 4h: Update right panel opacity condition

- [ ] **Step 11: Enable right panel for water-only customer mode**

Find the right panel Paper that has:
```js
            opacity: selectedUnitId ? 1 : 0.55,
            pointerEvents: selectedUnitId ? "auto" : "none",
```

Replace with:
```js
            opacity: (selectedUnitId || selectedWaterOnlyCustomerId) ? 1 : 0.55,
            pointerEvents: (selectedUnitId || selectedWaterOnlyCustomerId) ? "auto" : "none",
```

#### Sub-task 4i: Add water-only customer section to left panel JSX

- [ ] **Step 12: Add Autocomplete below unit selector in left panel**

After the closing `</FormControl>` of the unit selector and before the `{selectedUnit && (` info card block, add the water-only customer section.

When a water-only customer is selected, clear `selectedUnitId` and `latestReading` but do NOT clear `selectedBuildingId` — the building selector is irrelevant in water-only mode and clearing it would trigger its useEffect unnecessarily.

```jsx
            {/* ── or divider ── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 0.5 }}>
              <Box sx={{ flex: 1, height: 1, bgcolor: borderColor }} />
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                or
              </Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: borderColor }} />
            </Box>

            {/* Water-only customer selector */}
            <Autocomplete
              options={waterOnlyCustomers}
              loading={waterOnlyCustomersLoading}
              value={waterOnlyCustomers.find((c) => c.id === selectedWaterOnlyCustomerId) || null}
              getOptionLabel={(c) => `${c.firstName} ${c.lastName} · ${c.phoneNumber}`}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              onChange={(_, customer) => {
                if (customer) {
                  // Clear unit selection state (keep building selected — it's irrelevant in water-only mode)
                  setSelectedUnitId("");
                  setLatestReading(null);
                  setForm({ previousReading: "", currentReading: "" });
                  setErrors({});
                  setSelectedWaterOnlyCustomerId(customer.id);
                  setMeterType(customer.meterType || null);
                } else {
                  setSelectedWaterOnlyCustomerId("");
                  setMeterType(null);
                  setForm({ previousReading: "", currentReading: "" });
                  setErrors({});
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Water-only Customer"
                  size="small"
                  sx={fieldSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PersonIcon sx={{ fontSize: 16, color: textSecondary }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2">{option.firstName} {option.lastName}</Typography>
                    <Typography variant="caption" sx={{ color: textSecondary }}>{option.phoneNumber}</Typography>
                  </Box>
                </Box>
              )}
              noOptionsText={waterOnlyCustomersLoading ? "Loading…" : "No water-only customers found"}
              sx={{ width: "100%" }}
            />
```

- [ ] **Step 13: Guard the unit info card to only show in unit mode**

The `{selectedUnit && (...)}` block already only renders when `selectedUnit` is set, which requires both `selectedUnitId` and a matching unit in the list. Since we clear `selectedUnitId` when a water-only customer is selected, this is automatically handled — no change needed.

Similarly, the latestReading info card (`{selectedUnitId && latestReadingLoading || latestReading ? ...}`) is guarded by `selectedUnitId`. Verify that the latestReading card is guarded and won't show for water-only customers.

Find the block that shows the previous reading on file card. It should be conditionally rendered. If it renders based on `latestReading` alone (not `selectedUnitId`), add `selectedUnitId &&` to the condition to prevent it showing in water-only mode.

#### Sub-task 4j: Commit

- [ ] **Step 14: Verify the changes compile**

```bash
cd /Volumes/Software/rentke/rentalweb/web && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors (warnings are OK).

- [ ] **Step 15: Commit**

```bash
cd /Volumes/Software/rentke/rentalweb/web && git add src/pages/meterReadings/addReadings.jsx && git commit -m "feat: add water-only customer meter reading to addReadings screen"
```

---

## Verification Checklist

After all tasks are complete, manually verify:

- [ ] Water-only customers appear in the Autocomplete below the "or" divider
- [ ] Selecting a water-only customer: unit selector clears, meter type pre-fills from customer record, previous reading auto-fills as raw units
- [ ] Selecting a unit after a water-only customer: Autocomplete clears
- [ ] Consumption preview shows correctly for water-only customers
- [ ] Submit records the reading (PATCH endpoint called, not POST)
- [ ] After submit, the success state shows; clicking "Record Another" resets the form including the Autocomplete
- [ ] Right panel is disabled (dimmed) until either a unit or water-only customer is selected
