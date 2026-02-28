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
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import { api, type BillingSummaryResponse } from "../../lib/api";

const money = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatRangeDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleDateString();
};

const FinancialReports: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const nextSummary = await api.getBillingSummary(session.access_token);
        setSummary(nextSummary);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load financial reports",
        );
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
        color: "var(--color-success)",
      },
      {
        name: "Outstanding",
        value: Number(summary?.totals.outstanding ?? 0),
        color: "var(--color-warning)",
      },
      {
        name: "Overdue",
        value: Number(summary?.totals.overdue ?? 0),
        color: "var(--color-danger)",
      },
      {
        name: "Pending Review",
        value: Number(summary?.totals.pendingReview ?? 0),
        color: "var(--color-accent)",
      },
    ],
    [summary],
  );

  const totalActivity = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                arrow_back_ios_new
              </span>
            }
          >
            Back
          </Button>

          <h1 className="text-base font-semibold text-text-primary">
            Financial Reports
          </h1>

          <Badge tone="accent">Last 6 Months</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading financial aggregates...
            </p>
          </InstitutionCard>
        ) : (
          <>
            <section className="section-stack">
              <InstitutionCard accentSpine elevation="raised">
                <div className="flex items-start justify-between gap-4">
                  <KpiValue
                    label="Net Collected"
                    value={
                      <span className="font-numeric">
                        {money(summary?.totals.collected)}
                      </span>
                    }
                    meta={`Range: ${formatRangeDate(summary?.range.from)} to ${formatRangeDate(summary?.range.to)}`}
                  />
                  <Badge tone="success">Settled</Badge>
                </div>
              </InstitutionCard>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InstitutionCard>
                  <KpiValue
                    label="Billed"
                    value={
                      <span className="font-numeric">
                        {money(summary?.totals.billed)}
                      </span>
                    }
                    meta={`Open charges: ${summary?.counts.openCharges ?? 0}`}
                    valueClassName="text-[1.5rem]"
                  />
                </InstitutionCard>

                <InstitutionCard>
                  <KpiValue
                    label="Outstanding"
                    value={
                      <span className="font-numeric">
                        {money(summary?.totals.outstanding)}
                      </span>
                    }
                    meta={`Overdue charges: ${summary?.counts.overdueCharges ?? 0}`}
                    valueClassName="text-[1.5rem]"
                  />
                </InstitutionCard>
              </div>
            </section>

            <InstitutionCard>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Ledger Mix
                </h2>
                <Badge tone="neutral">Allocation</Badge>
              </div>

              <div className="relative mb-6 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={62}
                      outerRadius={82}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`mix-cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Total
                  </p>
                  <p className="font-numeric text-xl font-semibold text-text-primary">
                    {money(totalActivity)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pieData.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-[var(--radius-pill)]"
                        style={{ backgroundColor: entry.color }}
                      />
                      <p className="text-xs font-medium text-text-secondary">
                        {entry.name}
                      </p>
                    </div>
                    <p className="font-numeric text-xs font-semibold text-text-primary">
                      {money(entry.value)}
                    </p>
                  </div>
                ))}
              </div>
            </InstitutionCard>

            <InstitutionCard>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Billed vs Collected
                </h2>
                <Badge tone="neutral">Monthly</Badge>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <Bar
                      dataKey="billed"
                      fill="var(--color-accent)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="collected"
                      fill="var(--color-success)"
                      radius={[6, 6, 0, 0]}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-text-secondary)",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border-subtle)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                      }}
                      formatter={(value: number) => money(value)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </InstitutionCard>
          </>
        )}
      </main>

      <BottomNav role="landlord" />
    </PageLayout>
  );
};

export default FinancialReports;
