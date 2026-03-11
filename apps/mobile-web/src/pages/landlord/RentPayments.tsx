import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import {
  api,
  type BillingSummaryResponse,
  type OfflineRentPaymentRecord,
  type OfflineRentPaymentStatus,
  type RentChargeRecord,
} from "../../lib/api";

const amountToNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const asCurrency = (value: string | number | null | undefined) =>
  formatINR(amountToNumber(value), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const RentPayments: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [pendingPayments, setPendingPayments] = useState<
    OfflineRentPaymentRecord[]
  >([]);
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
        api.listPendingOfflinePayments(session.access_token),
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
    action: OfflineRentPaymentStatus,
  ) => {
    if (!session) return;

    setReviewInFlight(paymentId);
    setError(null);

    try {
      await api.reviewOfflinePayment(session.access_token, paymentId, {
        action,
      });
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
    <div className="min-h-screen font-sans pb-[100px] text-[#1e293b] selection:bg-[#FF9A3D]/30">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/40 backdrop-blur-[20px] px-5 pb-4 pt-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 border border-white/50 text-slate-500 hover:text-[#1e293b] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">
            Rent Payments
          </h1>
          <div className="flex h-7 items-center rounded-full bg-white/60 px-3 border border-white/50 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Ledger
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        {error && (
          <div className="rounded-[12px] border border-[#EF4444]/20 bg-[#EF4444]/10 p-4 mb-2">
            <p className="text-[13px] font-medium text-[#EF4444]">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="size-8 rounded-full border-2 border-[#333333] border-t-[#C59B47] animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Top Summaries */}
            <section className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm p-4 group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#10B981]"></div>
                <div className="pl-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#10B981] mb-1">
                    Collected
                  </p>
                  <p className="text-[22px] font-black text-[#1e293b] font-numeric tracking-tight">
                    {asCurrency(summary?.totals.collected ?? 0)}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                    Settled range
                  </p>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm p-4 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#EF4444] mb-1">
                  Outstanding
                </p>
                <p className="text-[22px] font-black text-[#1e293b] font-numeric tracking-tight">
                  {asCurrency(summary?.totals.outstanding ?? 0)}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                  {summary?.counts.overdueCharges ?? 0} overdue
                </p>
              </div>
            </section>

            {/* Approvals Needed Section */}
            {pendingPayments.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                    Approvals Needed
                  </h2>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C59B47]/20 text-[10px] font-bold text-[#C59B47]">
                    {pendingPayments.length}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {pendingPayments.map((approval) => {
                    const tenantName =
                      `${approval.tenant?.firstName ?? ""} ${approval.tenant?.lastName ?? ""}`.trim() ||
                      approval.tenant?.email ||
                      "Tenant";

                    return (
                      <div
                        key={approval.id}
                        className="rounded-[24px] border border-[#FF9A3D]/40 bg-[#FF9A3D]/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[20px] relative overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF9A3D]/50 to-transparent"></div>

                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-[#1e293b]">
                              {tenantName}
                            </p>
                            <p className="mt-1 truncate text-[12px] font-medium text-slate-500">
                              {approval.property?.name} • {approval.unit?.name}
                            </p>
                          </div>
                          <div className="bg-[#FF9A3D]/15 text-[#FF7A00] border border-[#FF9A3D]/30 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm">
                            {approval.paymentMode} Payment
                          </div>
                        </div>

                        <div className="mb-5 rounded-[16px] border border-white/50 bg-white/60 shadow-sm px-4 py-3 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                            Amount Submitted
                          </p>
                          <p className="font-numeric text-[20px] font-black text-[#1e293b]">
                            {asCurrency(approval.amount)}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            disabled={reviewInFlight !== null}
                            onClick={() =>
                              void handleReview(approval.id, "REJECTED")
                            }
                            className="flex-1 rounded-[14px] bg-white/40 border border-white/60 py-2.5 text-[12px] font-bold text-slate-500 hover:bg-white/80 hover:text-[#1e293b] transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Reject
                          </button>
                          <button
                            disabled={reviewInFlight !== null}
                            onClick={() =>
                              void handleReview(approval.id, "APPROVED")
                            }
                            className="flex-[2] rounded-[16px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-2.5 text-[12px] font-bold text-white shadow-[0_4px_15px_rgba(255,122,0,0.3)] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {reviewInFlight === approval.id ? (
                              <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">
                                  check
                                </span>
                                Verify & Accept
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-500">
                  Outstanding Charges
                </h2>
                <div className="flex px-2 py-0.5 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-sm text-[10px] font-bold text-[#1e293b]">
                  {urgentCharges.length} items
                </div>
              </div>

              {urgentCharges.length === 0 ? (
                <div className="rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-[20px] p-6 text-center shadow-sm">
                  <p className="text-[13px] text-slate-500 font-medium">
                    No outstanding rent charges right now.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {urgentCharges.map((charge) => {
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
                        (Date.now() - dueDate.getTime()) /
                          (24 * 60 * 60 * 1000),
                      ),
                    );

                    return (
                      <div
                        key={charge.id}
                        className="rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm p-4 flex flex-col gap-4 group"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/50 bg-white/60 shadow-sm text-[15px] font-bold text-slate-500">
                              {(tenantName[0] ?? "T").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-bold text-[#1e293b]">
                                {tenantName}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                                {charge.lease.unit?.name} •{" "}
                                {charge.lease.property?.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="font-numeric text-[16px] font-black text-[#1e293b] tracking-tight">
                              {asCurrency(charge.balanceAmount)}
                            </p>
                            {isOverdue ? (
                              <div className="bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                {daysLate} days overdue
                              </div>
                            ) : (
                              <div className="bg-white/60 text-slate-500 border border-white/50 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                Upcoming
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button className="flex-1 flex items-center justify-center gap-2 rounded-[12px] bg-white/60 border border-white/50 shadow-sm py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-white/80 hover:text-[#1e293b] transition-colors">
                            <span className="material-symbols-outlined text-[16px]">
                              send
                            </span>
                            Send Reminder
                          </button>
                          <button className="flex size-[34px] items-center justify-center rounded-[12px] border border-white/50 bg-white/40 shadow-sm text-slate-500 hover:bg-white/60 hover:text-[#1e293b] transition-colors">
                            <span className="material-symbols-outlined text-[18px]">
                              call
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav role="landlord" />
      </div>
    </div>
  );
};

export default RentPayments;
