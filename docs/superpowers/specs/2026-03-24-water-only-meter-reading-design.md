# Water-Only Customer Meter Readings — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Problem

Water-only customers have `previousReading` and `currentReading` stored directly on their record, but there is currently no workflow to record a new meter reading for them. Regular unit readings are recorded via `addReadings.jsx`; water-only customers are not supported there.

---

## Solution Overview

Extend `addReadings.jsx` to support water-only customers as a second selection mode in the left panel. Below the existing building → unit selectors, add a divider and a water-only customer selector. The right-panel reading form (meter type, previous reading, current reading, consumption preview) is fully shared between both modes. On submit, a new `PATCH /water-only-customers/:id/reading` endpoint shifts `currentReading → previousReading` and saves the new value.

---

## UI Layout

**Left panel — two sections, mutually exclusive:**

1. Building selector → Unit selector *(existing, unchanged)*
2. Divider: `— or —`
3. Water-only customer selector (MUI Autocomplete showing `firstName lastName · phoneNumber`)

Selecting a water-only customer: immediately clear `selectedBuildingId`, `selectedUnitId`, `latestReading`, `meterType`, `form`, and `errors`; then set `selectedWaterOnlyCustomerId` and pre-fill `meterType` from the customer record. The auto-fill useEffect then sets `previousReading`.

Selecting a building or unit: clear `selectedWaterOnlyCustomerId` (the existing building/unit useEffects already clear the rest).

**Right panel — shared, unchanged in structure:**

- Meter type selector (pre-filled from customer record; user can change)
- Previous reading (auto-filled as raw = `customer.currentReading × divisor`)
- Current reading (raw entry)
- Consumption preview
- Submit button (disabled until customer + meterType + currentReading are filled)

---

## Data Flow

### Selecting a water-only customer

1. Frontend fetches `GET /water-only-customers` on page load (alongside `GET /buildings`).
2. On customer selection:
   - Clear building/unit selection and related state
   - Pre-fill `meterType` from `customer.meterType`
   - Trigger the same `[latestReading/meterType]` auto-fill useEffect — but for water-only customers, `latestReading` is replaced by using `customer.currentReading` directly:
     - `previousReading = String(customer.currentReading * divisor)`
3. `latestReading` state is not used for water-only customers (no separate reading history). The previous reading value comes from the customer record.

### Submit payload

```js
PATCH /water-only-customers/:id/reading
Body: { reading: rawCurrent / divisor, meterType }
```

- `reading` is always in m³ (frontend applies divisor)
- `meterType` is included so the customer record stays in sync

### API logic

1. Validate `reading` (non-negative number)
2. Validate `meterType` if provided (must be `NORMAL | DIVIDE_1000 | DIVIDE_10000`)
3. Update customer:
   ```js
   previousReading: customer.currentReading,  // shift
   currentReading:  reading,                  // new value in m³
   meterType:       meterType ?? customer.meterType,
   ```
4. `closingBalance` is not modified.

---

## Database Changes

**File:** `api/API/prisma/schema.prisma`

Add field to `WaterOnlyCustomer` model:
```prisma
meterType  MeterType  @default(NORMAL)
```

`MeterType` enum already exists from the unit meter type feature.

Run: `npx prisma migrate dev --name add_meter_type_to_water_only_customer`

`getAllWaterOnlyCustomers` uses an explicit Prisma `select` clause that does not currently include `meterType`. Add `meterType: true` to the select in `api/API/controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js`.

---

## Backend Changes

### New controller
**File:** `api/API/controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js`

- Handler for `PATCH /water-only-customers/:id/reading`
- Validates `reading` and optional `meterType`
- Shifts `currentReading → previousReading`, saves new `currentReading`
- Updates `meterType` on the record

### Route registration
Register the new route in `api/API/routes/customer/waterOnlyCustomerRoutes.js`:
```js
router.patch('/:id/reading', updateWaterOnlyCustomerReading);
```

---

## Frontend Changes

**File:** `web/src/pages/meterReadings/addReadings.jsx`

### New state
```js
const [waterOnlyCustomers, setWaterOnlyCustomers] = useState([]);
const [waterOnlyCustomersLoading, setWaterOnlyCustomersLoading] = useState(false);
const [selectedWaterOnlyCustomerId, setSelectedWaterOnlyCustomerId] = useState("");
```

### Fetch water-only customers
On page load (alongside `fetchBuildings`), call `GET /water-only-customers` and store the result.

### Mutual exclusivity
- Selecting a water-only customer: clear `selectedBuildingId`, `selectedUnitId`, `latestReading`, `meterType`, `form`, `errors`; set `selectedWaterOnlyCustomerId`; pre-fill `meterType` from the customer record. The auto-fill useEffect (see below) then sets `previousReading`.
- Selecting a building or unit: clear `selectedWaterOnlyCustomerId` (the existing building/unit useEffects already clear the rest).

### Previous reading auto-fill for water-only customers
Add a `useEffect` watching `[selectedWaterOnlyCustomerId, meterType, waterOnlyCustomers]`:
```js
useEffect(() => {
  if (!selectedWaterOnlyCustomerId || !meterType) return;
  const customer = waterOnlyCustomers.find(c => c.id === selectedWaterOnlyCustomerId);
  if (customer) {
    setForm(prev => ({ ...prev, previousReading: String(customer.currentReading * (DIVISORS[meterType] ?? 1)) }));
  }
}, [selectedWaterOnlyCustomerId, meterType, waterOnlyCustomers]);
```
This mirrors the existing `[latestReading, meterType]` useEffect for units.

### Validation for water-only customers
The existing `validateForm()` runs regardless of mode. Its rules apply equally to water-only customers:
- `meterType` must be set
- `currentReading` must be a non-negative number
- `currentReading` (raw) must be ≥ `previousReading` (raw) — same raw-to-raw comparison already in place
- `previousReading`, if provided, must be a non-negative number

No additional validation rules differ for water-only customers.

### Submit
Check `selectedWaterOnlyCustomerId` to determine which endpoint to call:
```js
if (selectedWaterOnlyCustomerId) {
  await axios.patch(`${BASEURL}/water-only-customers/${selectedWaterOnlyCustomerId}/reading`, {
    reading: parseFloat(form.currentReading) / divisor,
    meterType,
  }, { withCredentials: true });
} else {
  // existing unit reading POST
}
```

### formReady / disabled condition
Include `selectedWaterOnlyCustomerId` in the OR for unit selection:
```js
const formReady =
  ((selectedBuildingId && selectedUnitId) || selectedWaterOnlyCustomerId) &&
  meterType &&
  form.currentReading !== "" &&
  !Object.keys(errors).length;
```

---

## Out of Scope

- Reading history for water-only customers (no separate history table; rolling update only)
- `closingBalance` update on reading submission
- Meter type on the water-only customer creation dialog (can be added later; defaults to `NORMAL`)

---

## Affected Files

| File | Change |
|---|---|
| `api/API/prisma/schema.prisma` | Add `meterType` field to `WaterOnlyCustomer` |
| `api/API/controller/customers/waterOnlyCustomers/getAllWaterOnlyCustomers.js` | Add `meterType: true` to select clause |
| `api/API/controller/customers/waterOnlyCustomers/updateWaterOnlyCustomerReading.js` | New controller |
| `api/API/routes/customer/waterOnlyCustomerRoutes.js` | Register new PATCH route |
| `web/src/pages/meterReadings/addReadings.jsx` | Water-only customer selector, mutual exclusivity, auto-fill, submit routing |
