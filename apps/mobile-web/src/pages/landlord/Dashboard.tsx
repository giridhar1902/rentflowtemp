import React, { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/cn";
import { formatINR } from "../../lib/currency";
import {
  api,
  type BillingSummaryResponse,
  type PaymentRecord,
  type PropertyRecord,
} from "../../lib/api";
import { getRevealDelay } from "../../theme/motion";

const money = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const reducedMotion = useReducedMotion();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PaymentRecord[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!session) {
        return;
      }
      setError(null);
      try {
        const [nextSummary, nextProperties, nextPending, unreadNotifications] =
          await Promise.all([
            api.getBillingSummary(session.access_token),
            api.listProperties(session.access_token),
            api.listPendingPaymentReviews(session.access_token),
            api.listNotifications(session.access_token, {
              unreadOnly: true,
              limit: 100,
            }),
          ]);
        setSummary(nextSummary);
        setProperties(nextProperties);
        setPendingReviews(nextPending);
        setUnreadNotificationCount(unreadNotifications.length);
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
    if (properties.length === 0) {
      return 0;
    }
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
    if (totals.total === 0) {
      return 0;
    }
    return Math.round((totals.occupied / totals.total) * 100);
  }, [properties]);

  const firstPendingReview = pendingReviews[0];
  const pendingTenantName =
    `${firstPendingReview?.charge?.lease?.tenant?.firstName ?? ""} ${
      firstPendingReview?.charge?.lease?.tenant?.lastName ?? ""
    }`.trim() ||
    firstPendingReview?.charge?.lease?.tenant?.email ||
    "Tenant";

  const revealStyle = (index: number): CSSProperties | undefined =>
    reducedMotion ? undefined : { animationDelay: getRevealDelay(index) };

  const revealClass = (baseClass: string) =>
    cn(baseClass, !reducedMotion && "motion-number-reveal");

  const userInitial = (
    profile?.firstName?.[0] ??
    profile?.email?.[0] ??
    "L"
  ).toUpperCase();

  return (
    <>
      <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
        <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface font-semibold text-text-primary shadow-base">
                {userInitial}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Welcome Back
                </p>
                <h1 className="text-[1.125rem] font-semibold text-text-primary">
                  {profile?.firstName ?? "Landlord"}
                </h1>
              </div>
            </div>

            <button
              type="button"
              className="motion-press relative flex size-10 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface text-text-secondary shadow-base"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-[var(--radius-pill)] bg-danger px-1 py-[1px] text-center font-numeric text-[10px] font-semibold text-white">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </header>

        <main className="section-stack px-4 pb-8 pt-4">
          <section className="section-stack">
            <InstitutionCard accentSpine elevation="raised">
              <div className="flex items-start justify-between gap-3">
                <KpiValue
                  label="Collected"
                  value={
                    <span
                      className={revealClass("font-numeric")}
                      style={revealStyle(0)}
                    >
                      {money(summary?.totals.collected ?? 0)}
                    </span>
                  }
                  meta={`Overdue ${money(summary?.totals.overdue ?? 0)}`}
                />
                <Badge tone="accent">
                  Open {summary?.counts.openCharges ?? 0}
                </Badge>
              </div>
            </InstitutionCard>

            <InstitutionCard
              interactive
              onClick={() => navigate("/landlord/properties")}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/landlord/properties");
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <KpiValue
                  label="Properties"
                  value={
                    <span
                      className={revealClass("font-numeric")}
                      style={revealStyle(1)}
                    >
                      {properties.length}
                    </span>
                  }
                  meta={`${occupiedRate}% Occupied`}
                />
                <span className="material-symbols-outlined text-primary">
                  apartment
                </span>
              </div>
            </InstitutionCard>
          </section>

          <InstitutionCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Billed vs Collected
              </h2>
              <Badge tone="neutral">Monthly</Badge>
            </div>

            <div className="mb-4">
              <KpiValue
                label="Total Billed"
                value={
                  <span
                    className={revealClass("font-numeric")}
                    style={revealStyle(2)}
                  >
                    {money(summary?.totals.billed ?? 0)}
                  </span>
                }
              />
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="dashboard-income"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="8%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="92%"
                        stopColor="var(--color-accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <Tooltip
                    cursor={{ stroke: "var(--color-border-subtle)" }}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border-subtle)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                    formatter={(value: number) => money(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-accent)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashboard-income)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-text-secondary)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </InstitutionCard>

          <section className="section-stack">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Pending Cash Reviews
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/landlord/payments")}
              >
                View All
              </Button>
            </div>

            {firstPendingReview ? (
              <InstitutionCard accentSpine>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {pendingTenantName}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-secondary">
                      {firstPendingReview.charge?.lease?.unit?.name} •{" "}
                      {firstPendingReview.charge?.lease?.property?.name}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p
                      className={revealClass(
                        "font-numeric text-base font-semibold text-text-primary",
                      )}
                      style={revealStyle(3)}
                    >
                      {money(firstPendingReview.amount)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate("/landlord/payments")}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </InstitutionCard>
            ) : (
              <InstitutionCard>
                <p className="text-sm text-text-secondary">
                  No cash approvals are pending right now.
                </p>
              </InstitutionCard>
            )}
          </section>

          <InstitutionCard
            interactive
            onClick={() => navigate("/landlord/maintenance")}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/landlord/maintenance");
              }
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-surface-subtle text-primary">
                  <span className="material-symbols-outlined">build</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Maintenance Requests
                  </p>
                  <p className="text-xs text-text-secondary">
                    Track issues across your portfolio
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary">
                chevron_right
              </span>
            </div>
          </InstitutionCard>
        </main>
      </PageLayout>

      <div className="fixed bottom-[calc(var(--layout-safe-area-bottom)+5.25rem)] right-5 z-30">
        <button
          type="button"
          onClick={() => navigate("/landlord/add-expense")}
          className="motion-press flex size-12 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-primary text-[var(--color-accent-contrast)] shadow-floating"
          aria-label="Add expense"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>

      <BottomNav role="landlord" />
    </>
  );
};

export default Dashboard;
