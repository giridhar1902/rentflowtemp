import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import { type BillingSummaryResponse } from "../../lib/api";

const money = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatRangeDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const FinancialReports: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Mock data to match the dashboard's preview
        const mockSummary: BillingSummaryResponse = {
          totals: {
            billed: 45000,
            collected: 42000,
            overdue: 3000,
            outstanding: 3000,
            pendingReview: 1200,
          },
          counts: { activeLeases: 4, openCharges: 2, overdueCharges: 1 },
          monthly: [
            { month: "2025-09", billed: 38000, collected: 38000 },
            { month: "2025-10", billed: 38000, collected: 38000 },
            { month: "2025-11", billed: 40000, collected: 40000 },
            { month: "2025-12", billed: 40000, collected: 39500 },
            { month: "2026-01", billed: 40000, collected: 39500 },
            { month: "2026-02", billed: 45000, collected: 42000 },
          ],
          range: {
            from: "2025-09-01T00:00:00.000Z",
            to: "2026-02-28T23:59:59.999Z",
          },
        } as any;
        setSummary(mockSummary);
      } finally {
        setIsLoading(false);
      }
    };
    void loadSummary();
  }, [session]);

  const barData = useMemo(
    () =>
      (summary?.monthly ?? []).map((row) => ({
        name: row.month.slice(5),
        billed: Number(row.billed),
        collected: Number(row.collected),
      })),
    [summary],
  );

  const pieData = useMemo(
    () => [
      {
        name: "Collected",
        value: Number(summary?.totals.collected ?? 0),
        color: "#10B981", // Emerald 500
      },
      {
        name: "Outstanding",
        value: Number(summary?.totals.outstanding ?? 0),
        color: "#F59E0B", // Amber 500
      },
      {
        name: "Overdue",
        value: Number(summary?.totals.overdue ?? 0),
        color: "#EF4444", // Red 500
      },
      {
        name: "Pending",
        value: Number(summary?.totals.pendingReview ?? 0),
        color: "#C59B47", // Gold
      },
    ],
    [summary],
  );

  const totalActivity = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <AppLayout
      title="Financial Analytics"
      showBackButton={true}
      bottomNavRole="landlord"
      rightAction={
        <div className="flex h-7 items-center rounded-full bg-[#F5A623]/10 px-3 border border-[#F5A623]/20 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">
            6 Months
          </span>
        </div>
      }
      className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter"
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="size-8 rounded-full border-2 border-[#333333] border-t-[#C59B47] animate-spin"></div>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            {/* Primary Net Collected Card */}
            <div className="relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#F5A623] to-[#F5A623]"></div>
              <div className="pl-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                      Net Collected
                    </p>
                    <h2 className="text-[32px] font-black tracking-tighter text-[#1B2B5E] font-numeric">
                      {money(summary?.totals.collected)}
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-1 font-medium">
                      {formatRangeDate(summary?.range.from)} -{" "}
                      {formatRangeDate(summary?.range.to)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#10B981]/15 px-2.5 py-1 rounded-md border border-[#10B981]/20 text-[#10B981] shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">
                      check_circle
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Settled
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[20px] border bg-white shadow-sm p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-500 mb-1">
                  Total Billed
                </p>
                <p className="text-[20px] font-bold text-[#1B2B5E] font-numeric tracking-tight">
                  {money(summary?.totals.billed)}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {summary?.counts.openCharges ?? 0} open charges
                </p>
              </div>

              <div className="rounded-[20px] border bg-white shadow-sm p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#F59E0B]/20 rounded-full blur-2xl"></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#F59E0B] mb-1 relative z-10">
                  Outstanding
                </p>
                <p className="text-[20px] font-bold text-[#1B2B5E] font-numeric tracking-tight relative z-10">
                  {money(summary?.totals.outstanding)}
                </p>
                <p className="mt-2 text-[11px] text-slate-500 relative z-10">
                  Overdue: {summary?.counts.overdueCharges ?? 0}
                </p>
              </div>
            </div>
          </section>

          {/* Ledger Mix Pie Chart */}
          <div className="rounded-[24px] border bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[14px] font-bold tracking-wide text-[#1B2B5E]">
                Ledger Mix
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-white shadow-sm border px-2 py-1 rounded-md">
                Allocation
              </span>
            </div>

            <div className="relative mb-8 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={68}
                    outerRadius={90}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Volume
                </p>
                <p className="font-numeric text-[22px] font-black tracking-tight text-[#1B2B5E] mt-0.5">
                  {money(totalActivity)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex flex-col gap-1 rounded-[16px] bg-white p-3 border shadow-sm backdrop-blur-[10px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {entry.name}
                    </span>
                  </div>
                  <p className="text-[14px] font-bold text-[#1B2B5E] pl-4.5 font-numeric">
                    {money(entry.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Billed vs Collected Bar Chart */}
          <div className="rounded-[24px] border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[14px] font-bold tracking-wide text-[#1B2B5E]">
                Collection Trend
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-white border shadow-sm px-2 py-1 rounded-md">
                Monthly
              </span>
            </div>

            <div className="h-56 w-full mt-2 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.4)" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.6)",
                      backgroundColor: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(12px)",
                      color: "#1B2B5E",
                      fontWeight: "bold",
                      fontSize: "13px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#1B2B5E", fontWeight: "bold" }}
                    formatter={(val: number) => money(val)}
                    labelStyle={{
                      color: "#475569",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "4px",
                    }}
                  />
                  <Bar
                    dataKey="billed"
                    name="Billed"
                    fill="#cbd5e1"
                    radius={[8, 8, 0, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="collected"
                    name="Collected"
                    fill="#F5A623"
                    radius={[8, 8, 0, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default FinancialReports;
