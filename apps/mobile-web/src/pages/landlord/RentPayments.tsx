import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import {
  api,
  type BillingSummaryResponse,
  type PaymentRecord,
  type RentChargeRecord,
} from "../../lib/api";

const amountToNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const asCurrency = (value: string | number | null | undefined) =>
  formatINR(amountToNumber(value), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const RentPayments: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [charges, setCharges] = useState<RentChargeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewInFlight, setReviewInFlight] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextSummary, nextPending, nextCharges] = await Promise.all([
        api.getBillingSummary(session.access_token),
        api.listPendingPaymentReviews(session.access_token),
        api.listCharges(session.access_token),
      ]);

      setSummary(nextSummary);
      setPendingPayments(nextPending);
      setCharges(nextCharges);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load billing data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const urgentCharges = useMemo(
    () =>
      charges
        .filter((charge) => amountToNumber(charge.balanceAmount) > 0)
        .sort(
          (left, right) =>
            new Date(left.dueDate).getTime() -
            new Date(right.dueDate).getTime(),
        )
        .slice(0, 8),
    [charges],
  );

  const handleReview = async (
    paymentId: string,
    action: "APPROVE" | "REJECT",
  ) => {
    if (!session) {
      return;
    }

    setReviewInFlight(paymentId);
    setError(null);

    try {
      await api.reviewPayment(session.access_token, paymentId, { action });
      await loadBilling();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Payment review failed",
      );
    } finally {
      setReviewInFlight(null);
    }
  };

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
            Rent Payments
          </h1>
          <Badge tone="neutral">Ledger</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading rent payment ledger...
            </p>
          </InstitutionCard>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InstitutionCard accentSpine>
                <KpiValue
                  label="Collected"
                  value={
                    <span className="font-numeric">
                      {asCurrency(summary?.totals.collected ?? 0)}
                    </span>
                  }
                  valueClassName="text-[1.6rem]"
                  meta="Settled in selected range"
                />
              </InstitutionCard>

              <InstitutionCard>
                <KpiValue
                  label="Outstanding"
                  value={
                    <span className="font-numeric">
                      {asCurrency(summary?.totals.outstanding ?? 0)}
                    </span>
                  }
                  valueClassName="text-[1.6rem]"
                  meta={`${summary?.counts.overdueCharges ?? 0} overdue`}
                />
              </InstitutionCard>
            </section>

            {pendingPayments.length > 0 && (
              <section className="section-stack">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Approvals Needed
                  </h2>
                  <Badge tone="warning" className="font-numeric">
                    {pendingPayments.length}
                  </Badge>
                </div>

                {pendingPayments.map((approval) => {
                  const tenantName =
                    `${approval.charge?.lease?.tenant?.firstName ?? ""} ${
                      approval.charge?.lease?.tenant?.lastName ?? ""
                    }`.trim() ||
                    approval.charge?.lease?.tenant?.email ||
                    "Tenant";

                  return (
                    <InstitutionCard
                      key={approval.id}
                      accentSpine
                      elevation="raised"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {tenantName}
                          </p>
                          <p className="mt-1 truncate text-xs text-text-secondary">
                            {approval.charge?.lease?.property?.name} •{" "}
                            {approval.charge?.lease?.unit?.name}
                          </p>
                        </div>
                        <Badge tone="accent">Cash Payment</Badge>
                      </div>

                      <div className="mb-4 rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                          Amount Submitted
                        </p>
                        <p className="mt-1 font-numeric text-lg font-semibold text-text-primary">
                          {asCurrency(approval.amount)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          loading={reviewInFlight === approval.id}
                          disabled={
                            reviewInFlight !== null &&
                            reviewInFlight !== approval.id
                          }
                          onClick={() =>
                            void handleReview(approval.id, "APPROVE")
                          }
                          leadingIcon={
                            <span className="material-symbols-outlined text-[18px]">
                              check
                            </span>
                          }
                        >
                          Verify & Accept
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          loading={reviewInFlight === approval.id}
                          disabled={
                            reviewInFlight !== null &&
                            reviewInFlight !== approval.id
                          }
                          onClick={() =>
                            void handleReview(approval.id, "REJECT")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </InstitutionCard>
                  );
                })}
              </section>
            )}

            <section className="section-stack">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Outstanding Charges
                </h2>
                <Badge tone="neutral" className="font-numeric">
                  {urgentCharges.length}
                </Badge>
              </div>

              {urgentCharges.length === 0 ? (
                <InstitutionCard>
                  <p className="text-sm text-text-secondary">
                    No outstanding rent charges right now.
                  </p>
                </InstitutionCard>
              ) : (
                urgentCharges.map((charge) => {
                  const tenantName =
                    `${charge.lease.tenant?.firstName ?? ""} ${
                      charge.lease.tenant?.lastName ?? ""
                    }`.trim() ||
                    charge.lease.tenant?.email ||
                    "Tenant";
                  const dueDate = new Date(charge.dueDate);
                  const isOverdue = dueDate.getTime() < Date.now();
                  const daysLate = Math.max(
                    0,
                    Math.floor(
                      (Date.now() - dueDate.getTime()) / (24 * 60 * 60 * 1000),
                    ),
                  );

                  return (
                    <InstitutionCard key={charge.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface-subtle font-semibold text-text-secondary">
                            {(tenantName[0] ?? "T").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text-primary">
                              {tenantName}
                            </p>
                            <p className="mt-1 truncate text-xs text-text-secondary">
                              {charge.lease.unit?.name} •{" "}
                              {charge.lease.property?.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <p className="font-numeric text-base font-semibold text-text-primary">
                            {asCurrency(charge.balanceAmount)}
                          </p>
                          <Badge tone={isOverdue ? "danger" : "neutral"}>
                            {isOverdue
                              ? `${daysLate} days overdue`
                              : "Upcoming"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          leadingIcon={
                            <span className="material-symbols-outlined text-[18px]">
                              send
                            </span>
                          }
                        >
                          Send Reminder
                        </Button>
                        <Button
                          type="button"
                          variant="subtle"
                          className="px-3"
                          leadingIcon={
                            <span className="material-symbols-outlined text-[18px]">
                              call
                            </span>
                          }
                        >
                          Call
                        </Button>
                      </div>
                    </InstitutionCard>
                  );
                })
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav role="landlord" />
    </PageLayout>
  );
};

export default RentPayments;
