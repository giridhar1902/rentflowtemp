import React, { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/cn";
import { formatINR } from "../../lib/currency";
import {
  api,
  type BillingSummaryResponse,
  type PaymentRecord,
  type PropertyRecord,
  type NriIncomeSummaryResponse,
} from "../../lib/api";
import { getRevealDelay } from "../../theme/motion";

const money = (
  value: string | number | null | undefined,
  currency?: string,
) => {
  if (value == null) return;
  if (!currency || currency === "INR") {
    return formatINR(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const reducedMotion = useReducedMotion();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [nriSummary, setNriSummary] = useState<NriIncomeSummaryResponse | null>(
    null,
  );
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showForeign, setShowForeign] = useState(false);
  const isNRI = profile?.isNRI === true;

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

        if (isNRI) {
          try {
            // In real app, we fetch from API. We might intercept 402 Upgrade required via apiFetch
            const nriRes = await api.getNriIncomeSummary(session.access_token);
            setNriSummary(nriRes);
          } catch (e: any) {
            if (e.message !== "UPGRADE_REQUIRED") {
              console.error("NRI Summary fetch error", e);
            }
          }
        }
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

  const displayCurrency =
    showForeign && nriSummary ? nriSummary.foreignCurrency : "INR";

  // Calculate dynamic displayed values based on selected currency toggle
  const displayCollected =
    showForeign && nriSummary
      ? nriSummary.totalForeignCurrency
      : (summary?.totals.collected ?? 0);

  const displayBilled =
    showForeign && nriSummary && nriSummary.monthlyBreakdown?.length > 0
      ? nriSummary.monthlyBreakdown.reduce((sum, m) => sum + m.amountForeign, 0)
      : (summary?.totals.billed ?? 0);

  // Re-map the chart using alternative currency numbers if toggled
  const activeChartData = useMemo(() => {
    if (showForeign && nriSummary) {
      return nriSummary.monthlyBreakdown.map((row) => ({
        name: row.month.split(" ")[0], // e.g. "Sep"
        income: Number(row.amountForeign),
        expense: 0, // Simplified for NRI breakdown that just returns income
      }));
    }
    return chartData;
  }, [showForeign, nriSummary, chartData]);

  return (
    <AppLayout
      showLogo={true}
      bottomNavRole="landlord"
      showFab
      className="px-5 pt-6 flex flex-col gap-5 motion-page-enter"
    >
      {error && (
        <div className="rounded-[12px] border border-[#EF4444]/20 bg-[#EF4444]/10 p-4 mb-2">
          <p className="text-[13px] font-medium text-[#EF4444]">{error}</p>
        </div>
      )}

      {isNRI && nriSummary && (
        <div className="flex items-center justify-between rounded-[12px] border border-primary/20 bg-primary/5 p-3 mb-2 shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Live Exchange Rate
            </p>
            <p className="text-[13px] font-medium">
              1 INR = {nriSummary.exchangeRate.toFixed(4)}{" "}
              {nriSummary.foreignCurrency}
            </p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setShowForeign(false)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                !showForeign
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500",
              )}
            >
              INR
            </button>
            <button
              onClick={() => setShowForeign(true)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                showForeign
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500",
              )}
            >
              {nriSummary.foreignCurrency}
            </button>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <section className="flex gap-3">
        {/* Collected */}
        <div
          className="flex-1 rounded-2xl p-4 flex flex-col gap-3"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(27,43,94,0.08)",
            boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
            borderLeft: "3px solid #F5A623",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "#8A9AB8" }}
          >
            Collected
          </p>
          <h2
            className={revealClass(
              "text-[28px] font-extrabold tracking-tight font-numeric",
            )}
            style={{ ...revealStyle(0), color: "#1B2B5E" }}
          >
            {money(displayCollected, displayCurrency)}
          </h2>
          {!showForeign && (
            <div className="flex">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background: "#FEE2E2",
                  color: "#B91C1C",
                  border: "1px solid rgba(220,38,38,0.15)",
                }}
              >
                <span className="material-symbols-outlined text-[11px]">
                  warning
                </span>
                Overdue {money(summary?.totals.overdue ?? 0, "INR")}
              </div>
            </div>
          )}
        </div>

        {/* Properties */}
        <div
          className="flex-1 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(27,43,94,0.08)",
            boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
            borderLeft: "3px solid #1B2B5E",
          }}
          onClick={() => navigate("/landlord/properties")}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#8A9AB8" }}
            >
              Properties
            </p>
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ color: "#8A9AB8" }}
            >
              apartment
            </span>
          </div>
          <h2
            className={revealClass(
              "text-[28px] font-extrabold tracking-tight font-numeric",
            )}
            style={{ ...revealStyle(1), color: "#1B2B5E" }}
          >
            {properties.length}
          </h2>
          <div className="flex">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: "#DCFCE7",
                color: "#15803D",
                border: "1px solid rgba(22,163,74,0.15)",
              }}
            >
              <span className="material-symbols-outlined text-[11px]">
                check_circle
              </span>
              {occupiedRate}% Occupied
            </div>
          </div>
        </div>
      </section>

      {/* Financial Chart Card */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(27,43,94,0.08)",
          boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
        }}
      >
        <div className="relative z-10 flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
            Billed vs Collected
          </h2>
          <div className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/15 px-2.5 py-1 rounded-full border border-[#F5A623]/20 uppercase tracking-widest shadow-sm">
            Monthly
          </div>
        </div>

        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-0.5">
            Total Billed
          </p>
          <div
            className={revealClass(
              "font-numeric text-[32px] font-black text-[#1B2B5E] tracking-tighter",
            )}
            style={revealStyle(2)}
          >
            {money(displayBilled, displayCurrency)}
          </div>
        </div>

        <div style={{ height: 192, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activeChartData}
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
                  <stop offset="0%" stopColor="#F5A623" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
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
                  color: "#1B2B5E",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
                itemStyle={{ color: "#1B2B5E", fontWeight: "bold" }}
                labelStyle={{
                  color: "#475569",
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
                formatter={(value: number) => money(value, displayCurrency)}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#F5A623"
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
            className="text-[11px] font-bold text-[#F5A623] tracking-wide uppercase hover:text-[#ea580c]"
          >
            View All
          </button>
        </div>

        {firstPendingReview ? (
          <div
            className="flex items-center justify-between gap-4 rounded-2xl p-4"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(245,166,35,0.25)",
              borderLeft: "3px solid #F5A623",
              boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}
              >
                <span className="material-symbols-outlined text-[20px]">
                  payments
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#1B2B5E]">
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
                  "font-numeric text-[17px] font-black text-[#1B2B5E] tracking-tight",
                )}
                style={revealStyle(3)}
              >
                {money(firstPendingReview.amount, "INR")}
              </p>
              <button
                onClick={() => navigate("/landlord/payments")}
                className="text-white font-bold text-[11px] uppercase tracking-wider py-1.5 px-3.5 rounded-lg transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #F5A623, #E8920F)",
                  boxShadow: "0 2px 8px rgba(245,166,35,0.3)",
                }}
              >
                Review
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-[rgba(27,43,94,0.08)] bg-white p-4 shadow-sm">
            <p className="text-[13px] font-medium text-slate-500">
              No cash approvals are pending right now.
            </p>
          </div>
        )}
      </section>

      {/* Secondary Actions */}
      <div
        className="flex items-center justify-between gap-3 rounded-2xl p-4 cursor-pointer transition-all group"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(27,43,94,0.08)",
          boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
        }}
        onClick={() => navigate("/landlord/maintenance")}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex size-11 items-center justify-center rounded-xl transition-colors"
            style={{
              background: "#F8F9FA",
              border: "1px solid rgba(27,43,94,0.09)",
              color: "#5A6A8A",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">build</span>
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "#1B2B5E" }}>
              Maintenance Requests
            </p>
            <p
              className="text-[12px] font-medium mt-0.5"
              style={{ color: "#8A9AB8" }}
            >
              Track issues across your portfolio
            </p>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: "#CBD5E1" }}
        >
          arrow_forward_ios
        </span>
      </div>

      {/* FAB - Add Expense */}
      <div className="fixed bottom-[calc(var(--layout-safe-area-bottom)+6.5rem)] right-6 z-30">
        <button
          onClick={() => navigate("/landlord/add-expense")}
          className="flex size-14 items-center justify-center rounded-full text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #F5A623, #E8920F)",
            boxShadow: "0 8px 24px rgba(245,166,35,0.4)",
          }}
          aria-label="Add expense"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
