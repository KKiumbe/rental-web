/**
 * Pure helper functions for BuildingsScreen
 */

export const formatDate = (value) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    const day   = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year  = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '—';
  }
};

export const sanitizeBuilding = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid building data:', data);
    return null;
  }
  return {
    id:             data.id || '',
    name:           data.name || 'Unnamed',
    address:        data.address || 'N/A',
    unitCount:      Array.isArray(data.units) ? data.units.length : Number(data.unitCount ?? 0),
    managementRate: Number(data.managementRate ?? 0),
    gasRate:        Number(data.gasRate ?? 0),
    waterRate:      Number(data.waterRate ?? 0),
    createdAt:      data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    updatedAt:      data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
    landlord: data.landlord
      ? {
          id:          data.landlord.id || '',
          name:        data.landlord.name ||
                       `${data.landlord.firstName || ''} ${data.landlord.lastName || ''}`.trim() ||
                       'Unknown',
          email:       data.landlord.email || 'N/A',
          phoneNumber: data.landlord.phoneNumber || 'N/A',
        }
      : { id: '', name: 'Unknown', email: 'N/A', phoneNumber: 'N/A' },
    units: Array.isArray(data.units)
      ? data.units.map((unit) => ({
          id:                   unit.id || '',
          unitNumber:           unit.unitNumber || 'Unknown',
          monthlyCharge:        Number(unit.monthlyCharge ?? 0),
          depositAmount:        Number(unit.depositAmount ?? 0),
          garbageCharge:        Number(unit.garbageCharge ?? 0),
          serviceCharge:        Number(unit.serviceCharge ?? 0),
          securityCharge:       Number(unit.securityCharge ?? 0),
          amenitiesCharge:      Number(unit.amenitiesCharge ?? 0),
          backupGeneratorCharge:Number(unit.backupGeneratorCharge ?? 0),
          status:               unit.status || 'VACANT',
          customerCount:        Number(unit.customerCount ?? unit.customers?.length ?? 0),
          customers: Array.isArray(unit.customers)
            ? unit.customers.map((c) => ({
                id:                   c.id || '',
                firstName:            c.firstName || 'Unknown',
                lastName:             c.lastName || 'Unknown',
                email:                c.email || 'N/A',
                phoneNumber:          c.phoneNumber || 'N/A',
                secondaryPhoneNumber: c.secondaryPhoneNumber || 'N/A',
                nationalId:           c.nationalId || 'N/A',
                status:               c.status || 'UNKNOWN',
                closingBalance:       Number(c.closingBalance ?? 0),
                createdAt:            c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
              }))
            : [],
          createdAt: unit.createdAt ? new Date(unit.createdAt).toISOString() : new Date().toISOString(),
        }))
      : [],
    customerCount: Number(
      data.units?.reduce((sum, unit) => sum + (unit.customers?.length || 0), 0) ?? 0
    ),
  };
};

export const sanitizeRows = (rows) =>
  Array.isArray(rows)
    ? rows
        .filter((b) => b && typeof b === 'object' && b.id)
        .map((b) => ({
          id:             b.id,
          name:           b.name || 'Unnamed',
          address:        b.address || '',
          unitCount:      Array.isArray(b.units) ? b.units.length : Number(b.unitCount ?? 0),
          managementRate: Number(b.managementRate ?? 0),
          gasRate:        Number(b.gasRate ?? 0),
          waterRate:      Number(b.waterRate ?? 0),
          createdAt:      b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
          updatedAt:      b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
          landlord:       b.landlord?.name ||
                          `${b.landlord?.firstName || ''} ${b.landlord?.lastName || ''}`.trim() ||
                          'Unknown',
          occupiedUnits:  Array.isArray(b.units)
                            ? b.units.filter((u) =>
                                ['OCCUPIED', 'OCCUPIED_PENDING_PAYMENT'].includes(u.status)
                              ).length
                            : 0,
          units: Array.isArray(b.units) ? b.units : [],
        }))
    : [];

/** Status chip data map — used by both column defs and dialogs */
export const STATUS_MAP = {
  OCCUPIED:                { label: 'Occupied',        bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  OCCUPIED_PENDING_PAYMENT:{ label: 'Pending Payment', bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
  VACANT:                  { label: 'Vacant',          bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  MAINTENANCE:             { label: 'Maintenance',     bg: '#fce4ec', color: '#b71c1c', border: '#ef9a9a' },
};
