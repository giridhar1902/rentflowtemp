import { useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";
import type { PgProperty, PgUnit, PgTenant, PgUtility } from "../lib/pgTypes";
import { useAuth } from "../context/AuthContext";

export const usePgData = (propertyId: string) => {
  const { token, profile } = useAuth();
  const [pgData, setPgData] = useState<PgProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyData = useCallback(async () => {
    if (!propertyId || !token || !profile) return;
    setIsLoading(true);
    setError(null);
    try {
      // First get the property basic info
      const property = await api.getProperty(token, propertyId);

      // Get Units
      const unitsData = await api.listUnits(token, propertyId);

      // For each unit, fetch beds and tenants
      const populatedUnits: PgUnit[] = await Promise.all(
        unitsData.map(async (u: any) => {
          const [bedsRes, tenantsRes] = await Promise.all([
            api.listBeds(token, u.id),
            api.listTenants(token, u.id),
          ]);

          // Format response to match frontend interface
          return {
            id: u.id,
            name: u.name,
            floor: u.floor || "",
            meterNumber: u.meterNumber || "",
            rentMode: u.rentMode || "equal_split",
            electricBillingType: u.electricBillingType || "manual",
            waterBillingMode: u.waterBillingMode || "manual",
            beds: bedsRes.map((b: any) => ({
              id: b.id,
              label: b.label,
              tenantId: b.tenantId || undefined,
            })),
            tenants: tenantsRes.map((t: any) => ({
              id: t.id,
              name: t.name,
              phone: t.phone || "",
              rentAmount: Number(t.rentAmount),
              bedId: t.bedId || undefined,
              unitId: u.id,
            })),
          };
        }),
      );

      // Get utilities
      const utilsRes = await api.listUtilities(token, propertyId);
      const utilitiesData = utilsRes.map((util: any) => ({
        id: util.id,
        month: util.billingMonth,
        electricAmount: util.type === "ELECTRICITY" ? Number(util.amount) : 0,
        waterAmount: util.type === "WATER" ? Number(util.amount) : 0,
        splitMode:
          util.splitMethod.toLowerCase() === "per_tenant"
            ? "per_tenant"
            : util.splitMethod.toLowerCase() === "per_unit"
              ? "per_unit"
              : "manual",
      }));

      // Merge duplicated months for utility records natively split on UI
      const mergedUtilsData = utilitiesData.reduce((acc: any[], curr: any) => {
        const existing = acc.find((item) => item.month === curr.month);
        if (existing) {
          existing.electricAmount += curr.electricAmount;
          existing.waterAmount += curr.waterAmount;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);

      setPgData({
        propertyId,
        units: populatedUnits,
        utilities: mergedUtilsData,
      });
    } catch (err: any) {
      console.error("Failed to load PG Data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, token, profile]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  const addUnit = useCallback(
    async (unitPayload: Omit<PgUnit, "id" | "beds" | "tenants">) => {
      if (!token) return;
      try {
        await api.createPgUnit(token, {
          propertyId,
          name: unitPayload.name,
          floor: unitPayload.floor,
          meterNumber: unitPayload.meterNumber,
        });
        await fetchPropertyData();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [propertyId, fetchPropertyData, token],
  );

  const addBed = useCallback(
    async (unitId: string, label: string) => {
      if (!token) return;
      try {
        await api.createBed(token, {
          unitId: unitId,
          label: label,
        });
        await fetchPropertyData();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [fetchPropertyData, token],
  );

  const addTenant = useCallback(
    async (unitId: string, tenantPayload: Omit<PgTenant, "id">) => {
      if (!token) return;
      try {
        await api.createTenant(token, {
          unitId,
          name: tenantPayload.name,
          phone: tenantPayload.phone,
          rentAmount: tenantPayload.rentAmount,
          bedId: tenantPayload.bedId,
        });
        await fetchPropertyData();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [fetchPropertyData, token],
  );

  const addUtility = useCallback(
    async (utilityPayload: Omit<PgUtility, "id">) => {
      if (!token) return;
      try {
        if (utilityPayload.electricAmount > 0) {
          await api.createUtility(token, {
            propertyId,
            type: "ELECTRICITY",
            amount: utilityPayload.electricAmount,
            billingMonth: utilityPayload.month,
            splitMethod:
              utilityPayload.splitMode === "per_tenant"
                ? "PER_TENANT"
                : utilityPayload.splitMode === "per_unit"
                  ? "PER_UNIT"
                  : "MANUAL",
          });
        }
        if (utilityPayload.waterAmount > 0) {
          await api.createUtility(token, {
            propertyId,
            type: "WATER",
            amount: utilityPayload.waterAmount,
            billingMonth: utilityPayload.month,
            splitMethod:
              utilityPayload.splitMode === "per_tenant"
                ? "PER_TENANT"
                : utilityPayload.splitMode === "per_unit"
                  ? "PER_UNIT"
                  : "MANUAL",
          });
        }
        await fetchPropertyData();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [propertyId, fetchPropertyData, token],
  );

  const removeTenant = useCallback(
    async (unitId: string, tenantId: string) => {
      if (!token) return;
      try {
        await api.removeTenant(token, tenantId);
        await fetchPropertyData();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [fetchPropertyData, token],
  );

  // Derived stats
  const stats = pgData
    ? {
        totalUnits: pgData.units.length,
        totalBeds: pgData.units.reduce((s, u) => s + u.beds.length, 0),
        occupiedBeds: pgData.units.reduce(
          (s, u) => s + u.beds.filter((b) => b.tenantId).length,
          0,
        ),
        totalTenants: pgData.units.reduce((s, u) => s + u.tenants.length, 0),
        rentRoll: pgData.units.reduce(
          (s, u) => s + u.tenants.reduce((ts, t) => ts + t.rentAmount, 0),
          0,
        ),
      }
    : {
        totalUnits: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        totalTenants: 0,
        rentRoll: 0,
      };

  return {
    pgData,
    stats,
    isLoading,
    error,
    fetchPropertyData,
    addUnit,
    addBed,
    addTenant,
    removeTenant,
    addUtility,
  };
};
