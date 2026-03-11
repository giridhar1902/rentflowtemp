import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { cn } from "../../lib/cn";
import {
  api,
  type InvitationRecord,
  type PropertyRecord,
  type ExpenseRecord,
} from "../../lib/api";
import { usePgData } from "../../hooks/usePgData";
import type { PgUnit, PgTenant } from "../../lib/pgTypes";
import AddUnitSheet from "./AddUnitSheet";
import AddTenantSheet, { type UnifiedTenantPayload } from "./AddTenantSheet";

// ─── Utility Billing Card ───────────────────────────────────────────────
const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const UtilityBillingSection: React.FC<{
  totalTenants: number;
  totalUnits: number;
  onSave: (utility: {
    month: string;
    electricAmount: number;
    waterAmount: number;
    splitMode: "per_tenant" | "per_unit";
  }) => Promise<void>;
  latestUtility?: {
    month: string;
    electricAmount: number;
    waterAmount: number;
    splitMode: string;
  } | null;
}> = ({ totalTenants, totalUnits, onSave, latestUtility }) => {
  const [month, setMonth] = useState(currentMonthStr());
  const [electric, setElectric] = useState(
    latestUtility?.electricAmount?.toString() ?? "",
  );
  const [water, setWater] = useState(
    latestUtility?.waterAmount?.toString() ?? "",
  );
  const [split, setSplit] = useState<"per_tenant" | "per_unit">("per_tenant");
  const [saved, setSaved] = useState(false);

  const elec = parseFloat(electric) || 0;
  const wat = parseFloat(water) || 0;
  const divisor = split === "per_tenant" ? totalTenants || 1 : totalUnits || 1;
  const label =
    split === "per_tenant" ? `${totalTenants} tenants` : `${totalUnits} units`;
  const perShare = (elec + wat) / divisor;

  const handleSave = async () => {
    await onSave({
      month,
      electricAmount: elec,
      waterAmount: wat,
      splitMode: split,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Utility Billing
        </h3>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-[11px] font-bold text-[#FF7A00] bg-[#FF9A3D]/10 border border-[#FF9A3D]/20 rounded-full px-3 py-1 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Electricity */}
        <div className="rounded-[18px] border border-white/50 bg-white/50 backdrop-blur p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
              bolt
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Electricity
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              ₹
            </span>
            <input
              value={electric}
              onChange={(e) => setElectric(e.target.value)}
              placeholder="0"
              type="number"
              className="w-full bg-slate-50 rounded-[10px] border border-slate-200 pl-5 pr-2 py-2 text-[14px] font-bold text-[#1e293b] outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
            />
          </div>
        </div>

        {/* Water */}
        <div className="rounded-[18px] border border-white/50 bg-white/50 backdrop-blur p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#3B82F6]">
              water_drop
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Water
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              ₹
            </span>
            <input
              value={water}
              onChange={(e) => setWater(e.target.value)}
              placeholder="0"
              type="number"
              className="w-full bg-slate-50 rounded-[10px] border border-slate-200 pl-5 pr-2 py-2 text-[14px] font-bold text-[#1e293b] outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
            />
          </div>
        </div>
      </div>

      {/* Split mode */}
      <div className="flex gap-2">
        {(["per_tenant", "per_unit"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSplit(mode)}
            className={cn(
              "flex-1 rounded-[14px] border py-2.5 text-[12px] font-bold transition-all",
              split === mode
                ? "border-[#FF9A3D] bg-[#FF9A3D]/10 text-[#FF7A00]"
                : "border-slate-200 bg-slate-50 text-slate-500",
            )}
          >
            {mode === "per_tenant" ? "Split per Tenant" : "Split per Unit"}
          </button>
        ))}
      </div>

      {/* Summary */}
      {elec + wat > 0 && (
        <div className="rounded-[16px] bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Calculated Split
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-slate-500">Total utilities</p>
              <p className="text-[18px] font-black text-[#1e293b]">
                {formatINRWhole(elec + wat)}
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-300 text-[20px]">
              arrow_forward
            </span>
            <div className="text-right">
              <p className="text-[12px] text-slate-500">Per share ({label})</p>
              <p className="text-[18px] font-black text-[#10B981]">
                {formatINRWhole(perShare)}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className={cn(
          "w-full rounded-[16px] py-3 text-[14px] font-bold transition-all",
          saved
            ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
            : "bg-[#FF9A3D]/15 text-[#FF7A00] border border-[#FF9A3D]/30 hover:bg-[#FF9A3D]/25",
        )}
      >
        {saved ? "✓ Saved" : "Save Utility Bill"}
      </button>
    </div>
  );
};

// ─── Unit Card ──────────────────────────────────────────────────────────
const UnitCard: React.FC<{
  unit: PgUnit;
  onAddTenant: (unit: PgUnit) => void;
  onRemoveTenant: (unitId: string, tenantId: string) => void;
  onSendReminder: (paymentId: string) => void;
  onMarkCashPaid: (paymentId: string) => void;
}> = ({
  unit,
  onAddTenant,
  onRemoveTenant,
  onSendReminder,
  onMarkCashPaid,
}) => {
  const occupiedBeds = unit.beds.filter((b) => b.tenantId).length;
  const bedLabel = (tenantId?: string) => {
    const bed = unit.beds.find((b) => b.tenantId === tenantId);
    return bed ? ` · ${bed.label}` : "";
  };

  return (
    <div className="rounded-[22px] border border-white/50 bg-white/45 backdrop-blur-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Unit header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-black text-[#1e293b]">{unit.name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {unit.floor && (
                <span className="text-[10px] font-bold text-slate-500 bg-white/60 border border-white/50 px-2 py-0.5 rounded-full">
                  Floor {unit.floor}
                </span>
              )}
              {unit.meterNumber && (
                <span className="text-[10px] font-bold text-slate-500 bg-white/60 border border-white/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">
                    bolt
                  </span>
                  {unit.meterNumber}
                </span>
              )}
              <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-0.5 rounded-full">
                {occupiedBeds}/{unit.beds.length} beds
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Tenants
            </p>
            <p className="text-[20px] font-black text-[#1e293b]">
              {unit.tenants.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tenants */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {unit.tenants.length === 0 ? (
          <p className="text-[12px] text-slate-400 text-center py-2">
            No tenants yet
          </p>
        ) : (
          unit.tenants.map((tenant) => {
            const hasPayment = !!tenant.latestPaymentId;
            const isPaid =
              tenant.latestPaymentStatus === "SUCCEEDED" ||
              tenant.latestPaymentStatus === "PAID";
            const isOverdue = tenant.latestPaymentStatus === "OVERDUE";
            const isPending = tenant.latestPaymentStatus === "PENDING";

            return (
              <div
                key={tenant.id}
                className="flex flex-col gap-2 bg-white/50 rounded-[14px] px-3 py-2.5 border border-white/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-gradient-to-br from-[#FF9A3D]/20 to-[#FF7A00]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-[#FF7A00]">
                        person
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1e293b] leading-tight flex items-center gap-1.5">
                        {tenant.name}
                        {bedLabel(tenant.id)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tenant.phone && (
                          <p className="text-[10px] text-slate-400">
                            {tenant.phone}
                          </p>
                        )}
                        {hasPayment && (
                          <span
                            className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider",
                              isPaid
                                ? "bg-[#10B981]/15 text-[#10B981]"
                                : isOverdue
                                  ? "bg-red-500/15 text-red-500"
                                  : "bg-[#F59E0B]/15 text-[#F59E0B]",
                            )}
                          >
                            {isPaid
                              ? "🟢 PAID"
                              : isOverdue
                                ? "🔴 OVERDUE"
                                : "🟡 PENDING"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[13px] font-black text-[#10B981]">
                        {formatINRWhole(
                          tenant.latestPaymentAmount || tenant.rentAmount,
                        )}
                      </p>
                      {tenant.receiptPdfUrl && (
                        <a
                          href={tenant.receiptPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold text-[#FF7A00] underline"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveTenant(unit.id, tenant.id)}
                      className="size-6 flex items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        close
                      </span>
                    </button>
                  </div>
                </div>

                {hasPayment && !isPaid && (
                  <div className="flex items-center gap-2 mt-1 border-t border-white/50 pt-2">
                    <button
                      onClick={() => onSendReminder(tenant.latestPaymentId!)}
                      className="flex-1 rounded-[10px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <svg
                        className="size-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      {tenant.reminderSentAt ? "Reminded" : "Remind"}
                    </button>
                    <button
                      onClick={() => onMarkCashPaid(tenant.latestPaymentId!)}
                      className="flex-1 rounded-[10px] bg-white text-slate-600 border border-slate-200 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none"
                    >
                      <span className="material-symbols-outlined text-[13px] text-[#FF7A00]">
                        payments
                      </span>
                      Accept Cash
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        <button
          onClick={() => onAddTenant(unit)}
          className="flex items-center justify-center gap-2 w-full rounded-[14px] border border-dashed border-[#FF9A3D]/50 bg-[#FF9A3D]/5 py-2.5 text-[13px] font-bold text-[#FF7A00] hover:bg-[#FF9A3D]/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            person_add
          </span>
          Add Tenant
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────
const PropertyDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PG local state (for units and tenants temporarily)
  const {
    pgData,
    stats,
    addUnit,
    addTenant,
    removeTenant,
    isLoading: pgLoading,
    error: pgError,
    fetchPropertyData,
  } = usePgData(id ?? "");
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addTenantUnit, setAddTenantUnit] = useState<PgUnit | null>(null);

  // Utility Expenses from API
  const [utilityExpenses, setUtilityExpenses] = useState<
    {
      month: string;
      electricAmount: number;
      waterAmount: number;
      splitMode: string;
    }[]
  >([]);

  const fetchData = useCallback(async () => {
    if (!session || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [propertyData, invitationData, propertyDocs, expensesData] =
        await Promise.all([
          api.getProperty(session.access_token, id),
          api.listInvitations(session.access_token, id),
          api.listDocuments(session.access_token, {
            propertyId: id,
            type: "OTHER",
            limit: 20,
          }),
          api.listExpenses(session.access_token, {
            propertyId: id,
            category: "UTILITIES",
            limit: 50,
          }),
        ]);
      setProperty(propertyData);
      setInvitations(invitationData ?? []);

      const parsedUtilities = (expensesData ?? [])
        .map((exp) => {
          try {
            return JSON.parse(exp.description || "{}");
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      setUtilityExpenses(parsedUtilities);

      const firstImage = (propertyDocs ?? []).find((doc) =>
        doc.mimeType?.toLowerCase().startsWith("image/"),
      );
      if (firstImage) {
        const signed = await api.getDocumentDownloadUrl(
          session.access_token,
          firstImage.id,
        );
        setCoverImageUrl(signed.downloadUrl);
      } else {
        setCoverImageUrl(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load property",
      );
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAddUnit = (unit: PgUnit) => {
    addUnit(unit);
  };
  const handleAddTenant = (tenant: UnifiedTenantPayload) => {
    addTenant(tenant);
  };
  const handleRemoveTenant = (unitId: string, tenantId: string) => {
    removeTenant(unitId, tenantId);
  };

  const handleSendReminder = async (paymentId: string) => {
    if (!session) return;
    try {
      await api.sendReminder(session.access_token, paymentId);
      await fetchData(); // refresh payments mapping
      fetchPropertyData(); // update tenants inside pgData
    } catch (e) {
      console.error(e);
      alert("Failed to send reminder.");
    }
  };

  const handleMarkCashPaid = async (paymentId: string) => {
    if (!session) return;
    try {
      await api.markCashPaid(session.access_token, paymentId);
      await fetchData(); // refresh payments mapping
      fetchPropertyData();
    } catch (e) {
      console.error(e);
      alert("Failed to mark as cash paid.");
    }
  };

  const handleSaveUtility = async (utility: {
    month: string;
    electricAmount: number;
    waterAmount: number;
    splitMode: "per_tenant" | "per_unit";
  }) => {
    if (!session || !id) return;
    try {
      await api.createExpense(session.access_token, {
        propertyId: id,
        category: "UTILITIES",
        amount: utility.electricAmount + utility.waterAmount,
        incurredAt: `${utility.month}-01T12:00:00Z`,
        description: JSON.stringify(utility),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to save utility:", e);
    }
  };

  const latestUtility =
    utilityExpenses.sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;

  if (loading || pgLoading) {
    return (
      <AppLayout title="Property" showBackButton bottomNavRole="landlord">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full border-2 border-[#FF9A3D] border-t-transparent animate-spin" />
            <p className="text-[13px] text-slate-400">Loading property…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || pgError || !property || !pgData) {
    return (
      <AppLayout title="Property" showBackButton bottomNavRole="landlord">
        <div className="px-5 pt-6">
          <div className="rounded-[20px] border border-red-100 bg-red-50 p-5 text-center">
            <span className="material-symbols-outlined text-3xl text-red-300 mb-2 block">
              error
            </span>
            <p className="text-[14px] font-bold text-red-600">
              {error ?? pgError ?? "Property not found"}
            </p>
            <button
              onClick={fetchData}
              className="mt-3 text-[12px] font-bold text-[#FF7A00] underline"
            >
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout
        title={property.name}
        subtitle="PROPERTY"
        showBackButton
        bottomNavRole="landlord"
        className="px-5 pt-5 pb-6 flex flex-col gap-5"
      >
        {/* ── Cover + Info Card ── */}
        <div className="rounded-[24px] overflow-hidden border border-white/50 shadow-[0_6px_25px_rgba(0,0,0,0.08)] bg-white/40 backdrop-blur-[20px]">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={property.name}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="h-44 w-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-slate-200">
                apartment
              </span>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-[#1e293b] leading-tight">
                  {property.name}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                  {[property.addressLine1, property.city, property.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-[#FF7A00] bg-[#FF9A3D]/10 border border-[#FF9A3D]/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                {property.propertyType}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                {property.status}
              </span>
              {property.amenities?.map((a) => (
                <span
                  key={a}
                  className="text-[10px] font-semibold text-slate-500 bg-white/60 border border-white/50 px-2.5 py-1 rounded-md"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Units",
              value: stats.totalUnits,
              color: "text-[#1e293b]",
            },
            {
              label: "Beds",
              value: `${stats.occupiedBeds}/${stats.totalBeds}`,
              color: "text-[#3B82F6]",
            },
            {
              label: "Tenants",
              value: stats.totalTenants,
              color: "text-[#FF7A00]",
            },
            {
              label: "Rent Roll",
              value: formatINRWhole(stats.rentRoll),
              color: "text-[#10B981]",
              small: true,
            },
          ].map(({ label, value, color, small }) => (
            <div
              key={label}
              className="rounded-[18px] border border-white/50 bg-white/45 backdrop-blur p-3 flex flex-col items-center text-center"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {label}
              </p>
              <p
                className={cn(
                  "font-black",
                  small ? "text-[12px] leading-tight" : "text-[18px]",
                  color,
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Units Section ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Units &amp; Tenants
            </h3>
            <button
              onClick={() => setShowAddUnit(true)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#FF7A00] bg-[#FF9A3D]/10 border border-[#FF9A3D]/20 px-3 py-1.5 rounded-full hover:bg-[#FF9A3D]/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Unit
            </button>
          </div>

          {pgData.units.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/30 p-8 flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                door_open
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-600">
                  No units yet
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Add rooms or flats to start managing tenants, rent, and
                  utilities.
                </p>
              </div>
              <button
                onClick={() => setShowAddUnit(true)}
                className="flex items-center gap-2 rounded-[16px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] px-5 py-3 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(255,122,0,0.3)] active:scale-[0.97] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Add First Unit
              </button>
            </div>
          ) : (
            pgData.units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onAddTenant={(u) => setAddTenantUnit(u)}
                onRemoveTenant={handleRemoveTenant}
                onSendReminder={handleSendReminder}
                onMarkCashPaid={handleMarkCashPaid}
              />
            ))
          )}
        </div>

        {/* ── Utility Billing ── */}
        <div className="rounded-[22px] border border-white/50 bg-white/45 backdrop-blur-[20px] p-4">
          <UtilityBillingSection
            totalTenants={stats.totalTenants}
            totalUnits={stats.totalUnits}
            latestUtility={latestUtility as any}
            onSave={handleSaveUtility}
          />
        </div>

        {/* ── Invite Codes ── */}
        {(invitations ?? []).length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Active Invite Codes
            </h3>
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="rounded-[20px] border border-white/50 bg-white/45 backdrop-blur p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#1e293b]">
                      {invite.inviteeEmail}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Status: {invite.status} · Expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                    <p
                      className={cn(
                        "mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded inline-block",
                        invite.inviteeRegistered
                          ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                          : "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
                      )}
                    >
                      {invite.inviteeRegistered
                        ? "Tenant account found"
                        : "Awaiting registration"}
                    </p>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-[12px] border-2 border-slate-100 text-center shrink-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Code
                    </p>
                    <p className="font-numeric text-[18px] font-black tracking-[0.1em] text-[#3B82F6] leading-none">
                      {invite.code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>

      {/* ── Sheets ── */}
      <AddUnitSheet
        open={showAddUnit}
        propertyId={id ?? ""}
        onSave={handleAddUnit}
        onClose={() => setShowAddUnit(false)}
      />

      {addTenantUnit && (
        <AddTenantSheet
          open={!!addTenantUnit}
          unit={addTenantUnit}
          onSave={handleAddTenant}
          onClose={() => setAddTenantUnit(null)}
        />
      )}
    </>
  );
};

export default PropertyDetails;
