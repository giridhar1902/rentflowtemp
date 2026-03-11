import React, { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/cn";
import { formatINR } from "../../lib/currency";
import {
  type BillingSummaryResponse,
  type PaymentRecord,
  type PropertyRecord,
} from "../../lib/api";
import { getRevealDelay } from "../../theme/motion";

const money = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const reducedMotion = useReducedMotion();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!session) return;
      setError(null);
      try {
        // Mock data for seamless UI preview
        const mockSummary: BillingSummaryResponse = {
          totals: { billed: 45000, collected: 42000, overdue: 3000 },
          counts: { activeLeases: 4, openCharges: 2 },
          monthly: [
            { month: "2025-09", billed: 38000, collected: 38000 },
            { month: "2025-10", billed: 38000, collected: 38000 },
            { month: "2025-11", billed: 40000, collected: 40000 },
            { month: "2025-12", billed: 40000, collected: 39500 },
            { month: "2026-01", billed: 40000, collected: 39500 },
            { month: "2026-02", billed: 45000, collected: 42000 },
          ],
        } as any;
        const mockProperties: PropertyRecord[] = [
          {
            units: [{ id: "u1" }, { id: "u2" }],
            leases: [
              { status: "ACTIVE", unitId: "u1" },
              { status: "ACTIVE", unitId: "u2" },
            ],
          } as any,
          {
            units: [{ id: "u3" }, { id: "u4" }, { id: "u5" }],
            leases: [
              { status: "ACTIVE", unitId: "u3" },
              { status: "ACTIVE", unitId: "u5" },
            ],
          } as any,
        ];
        const mockPending: PaymentRecord[] = [
          {
            amount: 1200,
            charge: {
              lease: {
                tenant: { firstName: "Sarah", lastName: "Connor" },
                unit: { name: "Apt 4B" },
                property: { name: "Sunset Views" },
              },
            },
          } as any,
        ];

        setSummary(mockSummary);
        setProperties(mockProperties);
        setPendingReviews(mockPending);
      } catch (dashboardError) {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load dashboard",
        );
      }
    };

    void loadDashboard();
  }, [session]);

  const chartData = useMemo(
    () =>
      (summary?.monthly ?? []).map((row) => ({
        name: row.month.slice(5),
        income: Number(row.collected),
        expense: Number(row.billed) - Number(row.collected),
      })),
    [summary],
  );

  const occupiedRate = useMemo(() => {
    if (properties.length === 0) return 0;
    const totals = properties.reduce(
      (acc, property) => {
        const totalUnits = property.units?.length ?? 0;
        const occupiedUnits = Math.min(
          new Set(
            (property.leases ?? [])
              .filter((lease) => lease.status === "ACTIVE")
              .map((lease) => lease.unitId),
          ).size,
          totalUnits,
        );
        return {
          occupied: acc.occupied + occupiedUnits,
          total: acc.total + totalUnits,
        };
      },
      { occupied: 0, total: 0 },
    );
    if (totals.total === 0) return 0;
    return Math.round((totals.occupied / totals.total) * 100);
  }, [properties]);

  const firstPendingReview = pendingReviews[0];
  const pendingTenantName = firstPendingReview
    ? `${firstPendingReview.charge?.lease?.tenant?.firstName ?? ""} ${
        firstPendingReview.charge?.lease?.tenant?.lastName ?? ""
      }`.trim() ||
      firstPendingReview.charge?.lease?.tenant?.email ||
      "Tenant"
    : "";

  const revealStyle = (index: number): CSSProperties | undefined =>
    reducedMotion ? undefined : { animationDelay: getRevealDelay(index) };

  const revealClass = (baseClass: string) =>
    cn(baseClass, !reducedMotion && "motion-number-reveal");

  return (
    <AppLayout
      title="Command Center"
      subtitle="DASHBOARD"
      bottomNavRole="landlord"
      showFab
      className="px-5 pt-6 flex flex-col gap-5 motion-page-enter"
    >
      {error && (
        <div className="rounded-[12px] border border-[#EF4444]/20 bg-[#EF4444]/10 p-4 mb-2">
          <p className="text-[13px] font-medium text-[#EF4444]">{error}</p>
        </div>
      )}

      {/* Top Metric Cards */}
      <section className="flex gap-4">
        <div className="flex-1 overflow-hidden rounded-[24px] border border-white/40 bg-white/40 p-4 relative group hover:border-white/60 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[20px]">
          <div className="absolute -right-4 -top-4 size-24 bg-[#FF9A3D]/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Collected
            </p>
            <h2
              className={revealClass(
                "text-[26px] font-black tracking-tighter text-[#1e293b] font-numeric",
              )}
              style={revealStyle(0)}
            >
              {money(summary?.totals.collected ?? 0)}
            </h2>
          </div>
          <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 self-start bg-[#EF4444]/15 text-[#EF4444] px-2 py-1 rounded-md border border-[#EF4444]/20 shadow-sm">
            <span className="material-symbols-outlined text-[12px]">
              warning
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Overdue {money(summary?.totals.overdue ?? 0)}
            </p>
          </div>
        </div>

        <div
          className="flex-1 overflow-hidden rounded-[24px] border border-white/40 bg-white/40 p-4 relative cursor-pointer hover:border-white/60 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[20px]"
          onClick={() => navigate("/landlord/properties")}
        >
          <div className="absolute -right-4 -bottom-4 size-24 bg-[#10B981]/20 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Properties
              </p>
              <span className="material-symbols-outlined text-slate-500 text-lg">
                apartment
              </span>
            </div>
            <h2
              className={revealClass(
                "text-[26px] font-black tracking-tighter text-[#1e293b] font-numeric",
              )}
              style={revealStyle(1)}
            >
              {properties.length}
            </h2>
          </div>
          <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 self-start bg-[#10B981]/15 text-[#10B981] px-2 py-1 rounded-md border border-[#10B981]/20 shadow-sm">
            <span className="material-symbols-outlined text-[12px]">
              check_circle
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider">
              {occupiedRate}% Occupied
            </p>
          </div>
        </div>
      </section>

      {/* Financial Chart Card */}
      <div className="rounded-[24px] border border-white/40 bg-white/40 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-[20px] relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FF9A3D]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
            Billed vs Collected
          </h2>
          <div className="text-[10px] font-bold text-[#FF7A00] bg-[#FF9A3D]/15 px-2.5 py-1 rounded-full border border-[#FF7A00]/20 uppercase tracking-widest shadow-sm">
            Monthly
          </div>
        </div>

        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-0.5">
            Total Billed
          </p>
          <div
            className={revealClass(
              "font-numeric text-[32px] font-black text-[#1e293b] tracking-tighter",
            )}
            style={revealStyle(2)}
          >
            {money(summary?.totals.billed ?? 0)}
          </div>
        </div>

        <div className="relative z-10 h-48 w-full -mx-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="dashboard-income"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#FF9A3D" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <Tooltip
                cursor={{
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.6)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  color: "#1e293b",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
                itemStyle={{ color: "#1e293b", fontWeight: "bold" }}
                labelStyle={{
                  color: "#475569",
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
                formatter={(value: number) => money(value)}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#FF7A00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dashboard-income)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Reviews Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between pl-1">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
            Pending Cash Reviews
          </h2>
          <button
            onClick={() => navigate("/landlord/payments")}
            className="text-[11px] font-bold text-[#FF7A00] tracking-wide uppercase hover:text-[#ea580c]"
          >
            View All
          </button>
        </div>

        {firstPendingReview ? (
          <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[#FF9A3D]/40 bg-[#FF9A3D]/10 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-white/60 border border-[#FF9A3D]/30 flex items-center justify-center shrink-0 text-[#FF7A00] shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  payments
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#1e293b]">
                  {pendingTenantName}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                  {firstPendingReview.charge?.lease?.unit?.name} •{" "}
                  {firstPendingReview.charge?.lease?.property?.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <p
                className={revealClass(
                  "font-numeric text-[17px] font-black text-[#1e293b] tracking-tight",
                )}
                style={revealStyle(3)}
              >
                {money(firstPendingReview.amount)}
              </p>
              <button
                onClick={() => navigate("/landlord/payments")}
                className="bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] text-white font-bold text-[11px] uppercase tracking-wider py-1.5 px-3.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                Review
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-md p-4 shadow-sm">
            <p className="text-[13px] font-medium text-slate-500">
              No cash approvals are pending right now.
            </p>
          </div>
        )}
      </section>

      {/* Secondary Actions */}
      <div
        className="flex items-center justify-between gap-3 rounded-[24px] border border-white/40 bg-white/40 p-4 cursor-pointer hover:border-white/60 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-[20px] group mt-2"
        onClick={() => navigate("/landlord/maintenance")}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-[14px] bg-white/60 text-slate-500 border border-white/50 shadow-sm transition-colors group-hover:bg-[#FF9A3D]/15 group-hover:text-[#FF7A00] group-hover:border-[#FF9A3D]/30">
            <span className="material-symbols-outlined text-[20px]">build</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#1e293b]">
              Maintenance Requests
            </p>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              Track issues across your portfolio
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400 group-hover:text-[#FF7A00] transition-all -translate-x-1 group-hover:translate-x-0 border border-transparent group-hover:border-[#FF9A3D]/30 rounded-full p-1 bg-transparent group-hover:bg-[#FF9A3D]/10">
          arrow_forward
        </span>
      </div>

      {/* FAB - Add Expense */}
      <div className="fixed bottom-[calc(var(--layout-safe-area-bottom)+6.5rem)] right-6 z-30">
        <button
          onClick={() => navigate("/landlord/add-expense")}
          className="flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] text-white shadow-[0_8px_25px_rgba(255,122,0,0.35)] hover:scale-105 active:scale-95 transition-all outline outline-transparent"
          aria-label="Add expense"
        >
          <span className="material-symbols-outlined text-[28px] font-medium">
            add
          </span>
        </button>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
