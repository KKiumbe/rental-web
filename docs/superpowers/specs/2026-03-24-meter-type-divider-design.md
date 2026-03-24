# Meter Type / Divider Feature — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Problem

Some physical water meters display raw pulse counts rather than m³ directly. To get the correct m³ consumption, the raw reading must be divided by a factor (1,000 or 10,000). The system currently assumes all meters are direct m³ meters (`current − previous = consumption`), which produces incorrect results for non-standard meters.

---

## Solution Overview

Store a `meterType` on each `Unit`. The first time a reading is created for a unit, the user selects the meter type. The system remembers it for all future readings. The frontend converts the raw entered value to m³ before sending to the API.

---

## Meter Types

| Value | Label | Formula |
|---|---|---|
| `NORMAL` | Normal | `reading = raw` |
| `DIVIDE_1000` | ÷ 1,000 | `reading = raw ÷ 1,000` |
| `DIVIDE_10000` | ÷ 10,000 | `reading = raw ÷ 10,000` |

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

---

## Backend Changes

### `GET /buildings`
No code changes needed. Prisma will include `meterType` in unit data automatically once the schema field exists.

### `POST /water-reading`
**File:** relevant controller in `/Volumes/Software/rentke/api/API/controller/`

- Accept optional `meterType` (`NORMAL | DIVIDE_1000 | DIVIDE_10000`) in request body
- If `meterType` is provided and differs from the unit's current `meterType`, update the unit: `prisma.unit.update({ where: { id: unitId }, data: { meterType } })`
- The `reading` value in the payload is already in m³ (frontend handles conversion) — no change to consumption calculation logic

---

## Frontend Changes

**File:** `src/pages/meterReadings/addReadings.jsx`

### New state
```js
const [meterType, setMeterType] = useState(null); // null = not yet set
```

### Divisor helper
```js
const DIVISORS = { NORMAL: 1, DIVIDE_1000: 1000, DIVIDE_10000: 10000 };
const divisor = DIVISORS[meterType] ?? 1;
```

### Pre-fill from unit data
When a unit is selected and `unit.meterType` is set, call `setMeterType(unit.meterType)`.

### Meter Type selector
Placed in the "Meter Reading" card, above the reading fields. Three options:
- Normal (no division)
- ÷ 1,000
- ÷ 10,000

If `meterType` is `null` (first time for this unit), the field is required. A helper note reads: "Select meter type to continue." The submit button is disabled until a type is chosen.

### Consumption preview
```js
const consumption =
  form.previousReading !== "" && form.currentReading !== "" &&
  !isNaN(form.previousReading) && !isNaN(form.currentReading) && meterType
    ? ((parseFloat(form.currentReading) - parseFloat(form.previousReading)) / divisor).toFixed(2)
    : null;
```

The preview label shows the formula when divisor > 1, e.g.:
> `50,000 − 40,000 = 10,000 ÷ 10,000 = 1.00 m³`

### Submit payload
```js
const payload = {
  unitId: selectedUnitId,
  reading: parseFloat(form.currentReading) / divisor,
  meterType,
  ...(form.previousReading !== "" && { previousReading: parseFloat(form.previousReading) / divisor }),
};
```

### Validation
- `meterType` must not be `null` — add to `validateForm()`

---

## UX Flow

1. User selects building → unit
2. System loads unit data including `meterType`
3. **If `meterType` is set:** Selector pre-filled; user can change if needed
4. **If `meterType` is null/NORMAL (first time):** Selector is blank and required
5. User enters raw meter value; consumption preview shows converted result in real-time
6. On submit: converted reading (m³) + `meterType` sent to API; unit's `meterType` saved for future readings

---

## Affected Files

| File | Change |
|---|---|
| `api/API/prisma/schema.prisma` | Add `MeterType` enum + `meterType` field on `Unit` |
| `api/API/controller/waterReading.js` (or equivalent) | Accept `meterType`, update unit if changed |
| `web/src/pages/meterReadings/addReadings.jsx` | Meter type selector, divisor logic, updated payload |

---

## Out of Scope

- Editing meter type on existing readings (readings already stored in m³, conversion already applied)
- Showing meter type in the readings list or detail view (can be added later)
- Gas meter dividers (separate feature)
