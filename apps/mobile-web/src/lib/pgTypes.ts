// PG / Sharing-room data model — stored locally in localStorage per property

export type ElectricBillingType =
  | "per_unit_meter"
  | "building_shared"
  | "manual";
export type WaterBillingMode = "per_tenant" | "flat_monthly" | "manual";
export type RentMode = "equal_split" | "manual";

export interface PgBed {
  id: string;
  label: string; // "Bed A", "Bed B", etc.
  tenantId?: string;
}

export interface PgTenant {
  id: string;
  name: string;
  phone?: string;
  rentAmount: number;
  unitId: string;
  bedId?: string;
}

export interface PgUnit {
  id: string;
  name: string;
  floor?: string;
  meterNumber?: string;
  rentMode: RentMode;
  electricBillingType: ElectricBillingType;
  waterBillingMode: WaterBillingMode;
  beds: PgBed[];
  tenants: PgTenant[];
}

export interface PgUtility {
  id: string;
  month: string; // "2026-03"
  electricAmount: number;
  waterAmount: number;
  splitMode: "per_tenant" | "per_unit" | "manual";
  notes?: string;
}

export interface PgProperty {
  propertyId: string;
  units: PgUnit[];
  utilities: PgUtility[];
}

// helpers
export const BED_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const generateBeds = (count: number): PgBed[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `bed-${Date.now()}-${i}`,
    label: `Bed ${BED_LABELS[i] ?? String(i + 1)}`,
    tenantId: undefined,
  }));
