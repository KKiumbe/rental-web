# Meter Type / Divider Feature — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Problem

Some physical water meters display raw pulse counts rather than m³ directly. To get the correct m³ consumption, the raw reading must be divided by a factor (1,000 or 10,000). The system currently assumes all meters are direct m³ meters (`current − previous = consumption`), which produces incorrect results for non-standard meters.

---

## Solution Overview

Store a `meterType` on each `Unit`. The first time a reading is created for a unit, the user selects the meter type. The system remembers it for all future readings. The frontend converts only the **raw current reading** to m³ before sending to the API. The previous reading is always handled in m³.

---

## Meter Types

| Value | Label | Divisor |
|---|---|---|
| `NORMAL` | Normal | 1 |
| `DIVIDE_1000` | ÷ 1,000 | 1,000 |
| `DIVIDE_10000` | ÷ 10,000 | 10,000 |

---

## Value Semantics (critical)

- **Previous Reading field** — always displayed and stored in **m³**. Auto-filled from `GET /water-readings/unit/latest` which returns the last stored m³ value. If the user manually overrides it, they enter m³ directly (field label: "Previous Reading (m³)"). This value is **never divided by the divisor**.
- **Current Reading field** — the user enters the **raw meter display value** (pulse count or m³ depending on meter type). The divisor is applied to this value only.
- Consumption preview = `(rawCurrent / divisor) − previousM3`
- Stored reading sent to API = `rawCurrent / divisor` (always in m³)

---

## Database Changes

**File:** `/Volumes/Software/rentke/api/API/prisma/schema.prisma`

1. Add enum:
```prisma
enum MeterType {
  NORMAL
  DIVIDE_1000
  DIVIDE_10000
}
```

2. Add field to `Unit` model:
```prisma
meterType MeterType @default(NORMAL)
```

3. Run: `npx prisma migrate dev --name add_meter_type_to_unit`

**Historical readings are unaffected.** All existing `WaterConsumption` and `AbnormalWaterReading` records were stored in m³ at the time of creation and remain correct. The new `meterType` field only influences how future raw readings are converted before submission — it does not alter stored data.

---

## Backend Changes

### `GET /buildings`
Both `getAllBuildings` and `getBuildingById` in `api/API/controller/building/building.js` use an explicit `select` on units that does not include `meterType`. Both must be patched.

**Action:** In `building.js`, add `meterType: true` to the `units.select` block in both `getAllBuildings` (lines ~514–543) and `getBuildingById` (lines ~97–128).

### `POST /water-reading`
**File:** relevant controller in `/Volumes/Software/rentke/api/API/controller/`

- Accept optional `meterType` (`NORMAL | DIVIDE_1000 | DIVIDE_10000`) in request body
- If `meterType` is provided and differs from the unit's current `meterType`, update the unit before creating the reading:
  ```js
  await prisma.unit.update({ where: { id: unitId }, data: { meterType } });
  ```
- The `reading` value in the payload is already in m³ (frontend applied the divisor) — consumption calculation logic is unchanged

---

## Frontend Changes

**File:** `src/pages/meterReadings/addReadings.jsx`

### New state
```js
const [meterType, setMeterType] = useState(null); // null = not yet set for this unit
```

### Divisor helper
```js
const DIVISORS = { NORMAL: 1, DIVIDE_1000: 1000, DIVIDE_10000: 10000 };
const divisor = meterType ? (DIVISORS[meterType] ?? 1) : 1;
```

### Latest reading response shape
The `GET /water-readings/unit/latest` endpoint returns `{ latestReading: { reading, consumption, period, ... } }`. The existing frontend code accesses `res.data?.data || res.data` then `.reading` — which silently returns `undefined` because the correct path is `res.data.latestReading.reading`. This must be fixed as part of this feature:

```js
const data = res.data?.latestReading || res.data?.data || null;
```

### Pre-fill and reset meterType on unit change
In the `useEffect` that reacts to `selectedUnitId`:
- When a unit is selected and `unit.meterType` is truthy, call `setMeterType(unit.meterType)`
- When a unit is deselected (or building changes), call `setMeterType(null)`

Also reset `meterType` to `null` in `handleReset()`.

### Meter Type selector
Placed in the "Meter Reading" card, above the reading fields. Three options:
- Normal
- ÷ 1,000
- ÷ 10,000

If `meterType` is `null` (first time for this unit), the field is required and shows helper text: "Select meter type to continue." The submit button disabled condition becomes:
```js
disabled={formLoading || !selectedUnitId || !meterType}
```

### Field labels
Field labels update dynamically based on meter type:
- `NORMAL`: "Current Reading (m³) *" — no change
- `DIVIDE_1000` or `DIVIDE_10000`: "Current Reading (raw meter value) *"

Previous Reading label always remains "Previous Reading (m³) — optional".

### Consumption preview

The preview computes both values in m³ before subtracting:

```js
const currentM3 =
  form.currentReading !== "" && !isNaN(form.currentReading) && meterType
    ? parseFloat(form.currentReading) / divisor
    : null;

const previousM3 =
  form.previousReading !== "" && !isNaN(form.previousReading)
    ? parseFloat(form.previousReading)  // always already in m³
    : null;

const consumption =
  currentM3 !== null && previousM3 !== null
    ? (currentM3 - previousM3).toFixed(2)
    : null;
```

The `formReady` derivation must also include `meterType`:
```js
const formReady = selectedBuildingId && selectedUnitId && meterType && form.currentReading !== "" && !Object.keys(errors).length;
```

The preview label shows the formula when divisor > 1, e.g.:
> `50,000 ÷ 10,000 = 5.00 m³ − 3.00 m³ = 2.00 m³ consumption`

### Validation
Update `validateForm()`:
- Add: if `!meterType` → `errs.meterType = "Please select a meter type"`
- Fix the current reading comparison to compare in m³:
  ```js
  const currM3 = parseFloat(form.currentReading) / divisor;
  const prevM3 = form.previousReading !== "" ? parseFloat(form.previousReading) : null;
  if (prevM3 !== null && !isNaN(prevM3) && currM3 < prevM3) {
    errs.currentReading = "Current reading cannot be less than the previous reading";
  }
  ```

### Submit payload
```js
const payload = {
  unitId: selectedUnitId,
  reading: parseFloat(form.currentReading) / divisor,   // converted to m³
  meterType,
  ...(form.previousReading !== "" && {
    previousReading: parseFloat(form.previousReading),  // already m³, no division
  }),
};
```

---

## UX Flow

1. User selects building → unit
2. System loads unit data (including `meterType` from the buildings response)
3. **If `meterType` is set on the unit:** Selector pre-filled; user can change if needed
4. **If `meterType` is null/not set:** Selector is blank and required; submit is disabled
5. User enters raw meter value; consumption preview shows the full conversion formula in real-time
6. On submit: converted reading (m³) + `meterType` sent to API; unit's `meterType` saved for future readings

---

## Out of Scope

- `UtilityReadingsForm` (onboarding) — that form does not currently support meter type awareness. It remains unchanged. If needed, it can be updated in a follow-up.
- Editing meter type on existing readings — readings are already stored in m³
- Showing meter type in the readings list or detail view — can be added later
- Gas meter dividers — separate feature

---

## Affected Files

| File | Change |
|---|---|
| `api/API/prisma/schema.prisma` | Add `MeterType` enum + `meterType` field on `Unit` |
| `api/API/controller/waterReading.js` (or equivalent) | Accept `meterType`, update unit if changed |
| `api/API/controller/buildings.js` (or equivalent) | Ensure `meterType` included in unit select clause |
| `web/src/pages/meterReadings/addReadings.jsx` | Meter type selector, divisor logic, updated validation, updated payload |
