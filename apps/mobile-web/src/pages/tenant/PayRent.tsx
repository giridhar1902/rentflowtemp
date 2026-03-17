import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "../../components/ui";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type PaymentRecord, type RentChargeRecord } from "../../lib/api";
import { FEATURES } from "../../lib/feature-flags";

const amountToNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const toCurrency = (value: string | number | null | undefined) =>
  formatINRWhole(amountToNumber(value));

const isoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const loadCashfreeFactory = async () => {
  if (window.Cashfree) {
    return window.Cashfree;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cashfree-sdk="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Cashfree SDK")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Cashfree SDK script"));
    document.head.appendChild(script);
  });

  if (!window.Cashfree) {
    throw new Error("Cashfree SDK did not initialize correctly");
  }

  return window.Cashfree;
};

const PayRent: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [charges, setCharges] = useState<RentChargeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cashDate, setCashDate] = useState(isoDateOnly(new Date()));
  const [cashReference, setCashReference] = useState("");
  const [isSubmittingCash, setIsSubmittingCash] = useState(false);
  const [isLaunchingOnline, setIsLaunchingOnline] = useState(false);
  const [tdsAccepted, setTdsAccepted] = useState(false);

  const loadBilling = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextCharges, nextPayments] = await Promise.all([
        api.listCharges(session.access_token),
        api.listPayments(session.access_token),
      ]);
      setCharges(nextCharges);
      setPayments(nextPayments);
    } catch (billingError) {
      setError(
        billingError instanceof Error
          ? billingError.message
          : "Unable to load billing data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const activeCharge = useMemo(() => {
    const outstanding = charges
      .filter((charge) => amountToNumber(charge.balanceAmount) > 0)
      .sort(
        (left, right) =>
          new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
      );
    return outstanding[0] ?? null;
  }, [charges]);

  const pendingCashPayment = useMemo(() => {
    if (!activeCharge) return null;
    return (
      payments.find(
        (payment) =>
          payment.chargeId === activeCharge.id &&
          payment.status === "REQUIRES_REVIEW",
      ) ?? null
    );
  }, [activeCharge, payments]);

  const pendingOnlinePayment = useMemo(() => {
    if (!activeCharge) return null;
    return (
      payments.find(
        (payment) =>
          payment.chargeId === activeCharge.id &&
          payment.provider === "cashfree" &&
          payment.status === "PENDING",
      ) ?? null
    );
  }, [activeCharge, payments]);

  const paymentStatus: "due" | "pending" | "paid" = !activeCharge
    ? "paid"
    : pendingCashPayment
      ? "pending"
      : pendingOnlinePayment
        ? "pending"
        : "due";

  const historyPayments = useMemo(
    () =>
      [...payments].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [payments],
  );

  const openCashModal = () => {
    setCashAmount(amountToNumber(activeCharge?.balanceAmount).toFixed(2));
    setCashDate(isoDateOnly(new Date()));
    setCashReference("");
    setShowCashModal(true);
  };

  const handleCashSubmit = async () => {
    if (!session || !activeCharge) return;

    const parsedAmount = Number(cashAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid cash payment amount.");
      return;
    }

    setIsSubmittingCash(true);
    setError(null);
    try {
      await api.submitCashPayment(session.access_token, activeCharge.id, {
        amount: parsedAmount,
        paidAt: new Date(`${cashDate}T12:00:00.000Z`).toISOString(),
        reference: cashReference || undefined,
      });
      setShowCashModal(false);
      await loadBilling();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Cash submission failed",
      );
    } finally {
      setIsSubmittingCash(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!session || !activeCharge) return;

    setIsLaunchingOnline(true);
    setError(null);
    try {
      const sessionPayload = await api.createOnlinePaymentSession(
        session.access_token,
        activeCharge.id,
        {
          amount: amountToNumber(activeCharge.balanceAmount),
        },
      );

      const CashfreeFactory = await loadCashfreeFactory();
      const checkout = CashfreeFactory({ mode: sessionPayload.checkoutMode });
      await checkout.checkout({
        paymentSessionId: sessionPayload.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (onlineError) {
      setError(
        onlineError instanceof Error
          ? onlineError.message
          : "Unable to launch online payment",
      );
      await loadBilling();
    } finally {
      setIsLaunchingOnline(false);
    }
  };

  return (
    <AppLayout
      title="Pay Rent"
      bottomNavRole="tenant"
      showBackButton
      className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter"
    >
      {error && (
        <div className="rounded-[12px] border border-danger/20 bg-danger/10 p-4">
          <p className="text-[13px] font-bold text-danger">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="size-8 rounded-full border-2 border-t-primary animate-spin"></div>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[24px] bg-white shadow-sm border group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>

            <div className="p-6">
              <div className="flex flex-col gap-1 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Current Balance
                </p>
                <h2 className="text-[40px] font-black text-text-primary tracking-tight leading-none drop-shadow-sm">
                  {toCurrency(activeCharge?.balanceAmount ?? 0)}
                </h2>
              </div>

              {activeCharge && paymentStatus === "due" && (
                <div className="flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1.5 border border-danger/20 w-max">
                  <span className="material-symbols-outlined text-[14px] text-danger">
                    event
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                    Due {new Date(activeCharge.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {paymentStatus === "pending" && pendingCashPayment && (
                <div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 border border-warning/20 w-max">
                  <span className="material-symbols-outlined text-[14px] text-warning">
                    pending_actions
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-warning">
                    Cash pending approval
                  </span>
                </div>
              )}

              {paymentStatus === "pending" &&
                !pendingCashPayment &&
                pendingOnlinePayment && (
                  <div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 border border-warning/20 w-max">
                    <span className="material-symbols-outlined text-[14px] text-warning">
                      sync
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warning">
                      Online payment processing
                    </span>
                  </div>
                )}
            </div>

            {activeCharge && (
              <div className="bg-white border-t p-5 flex flex-col gap-4">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Monthly Breakdown
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-text-secondary">
                      Base Rent
                    </p>
                    <p className="font-numeric text-[14px] font-black text-text-primary">
                      {toCurrency(activeCharge.baseRentAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-text-secondary">
                      Maintenance
                    </p>
                    <p className="font-numeric text-[14px] font-black text-text-primary">
                      {toCurrency(activeCharge.maintenanceAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-text-secondary">
                      Utility
                    </p>
                    <p className="font-numeric text-[14px] font-black text-text-primary">
                      {toCurrency(activeCharge.utilityAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-primary">
                      Total
                    </p>
                    <p className="font-numeric text-[16px] font-black text-primary">
                      {toCurrency(activeCharge.balanceAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
              Payment History
            </h2>

            {historyPayments.length === 0 ? (
              <div className="rounded-[24px] bg-white p-8 text-center shadow-sm border">
                <span className="material-symbols-outlined text-[32px] text-text-secondary opacity-50 mb-2">
                  history
                </span>
                <p className="text-[13px] font-bold text-text-secondary">
                  No payments recorded yet.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-white overflow-hidden shadow-sm border">
                {historyPayments.slice(0, 6).map((payment, i) => {
                  const isPending = payment.status === "REQUIRES_REVIEW";
                  const isSuccess = payment.status === "SUCCEEDED";

                  return (
                    <div
                      className={`flex items-center justify-between gap-3 p-4  transition-colors ${i !== Math.min(historyPayments.length, 6) - 1 ? "border-b" : ""}`}
                      key={payment.id}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`flex size-10 items-center justify-center rounded-full border shrink-0 ${isSuccess ? "bg-success/10 border-success/30 text-success" : isPending ? "bg-warning/10 border-warning/30 text-warning" : "bg-danger/10 border-danger/30 text-danger"}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {payment.provider === "cash"
                              ? "money"
                              : "credit_card"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-black text-text-primary truncate mb-0.5">
                            {payment.provider === "cash"
                              ? "Cash Payment"
                              : "Rent Payment"}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                            {payment.status.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`font-numeric text-[14px] font-black ${isSuccess ? "text-success" : isPending ? "text-warning" : "text-text-primary"}`}
                        >
                          - {toCurrency(payment.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {paymentStatus !== "paid" && activeCharge && (
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white backdrop-blur-[30px] border-t pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex flex-col gap-3 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              {FEATURES.NRI_MODE && activeCharge.lease?.hasTdsObligation && (
                <div className="bg-warning/10 border border-warning/20 rounded-[16px] p-4 mb-1">
                  <div className="flex gap-2 items-start mb-3">
                    <span className="material-symbols-outlined text-warning text-[18px]">
                      warning
                    </span>
                    <div>
                      <h4 className="text-[13px] font-bold text-warning mb-1">
                        TDS Obligation Notice
                      </h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Your landlord is an NRI. As per Indian tax law, you must
                        deduct {(activeCharge.lease.tdsRate || 0.312) * 100}%
                        TDS from this rent payment.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3 bg-white rounded-[8px] p-3 border">
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary">
                      <span className="uppercase tracking-wide">
                        Rent Amount:
                      </span>{" "}
                      <span className="text-text-primary text-[12px]">
                        {toCurrency(activeCharge.balanceAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary">
                      <span className="uppercase tracking-wide">
                        TDS to Deduct:
                      </span>{" "}
                      <span className="text-danger text-[12px]">
                        {toCurrency(
                          amountToNumber(activeCharge.balanceAmount) *
                            (activeCharge.lease.tdsRate || 0.312),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary pt-1.5 mt-1.5 border-t border-black/5">
                      <span className="uppercase tracking-wide">
                        Amount to pay now:
                      </span>{" "}
                      <span className="text-primary text-[13px]">
                        {toCurrency(
                          amountToNumber(activeCharge.balanceAmount) *
                            (1 - (activeCharge.lease.tdsRate || 0.312)),
                        )}
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      className={`size-5 rounded-[6px] border flex items-center justify-center transition-colors ${tdsAccepted ? "bg-primary border-primary" : "bg-white border-black/20 group-hover:border-primary/50"}`}
                    >
                      {tdsAccepted && (
                        <span className="material-symbols-outlined text-[14px] text-white">
                          check
                        </span>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={tdsAccepted}
                      onChange={(e) => setTdsAccepted(e.target.checked)}
                    />
                    <span className="text-[12px] font-bold text-text-primary select-none mt-0.5">
                      I understand my TDS obligation
                    </span>
                  </label>
                </div>
              )}

              <button
                disabled={
                  paymentStatus === "pending" ||
                  isLaunchingOnline ||
                  (FEATURES.NRI_MODE &&
                    activeCharge.lease?.hasTdsObligation &&
                    !tdsAccepted)
                }
                onClick={() => void handleOnlinePayment()}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-4 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
              >
                {isLaunchingOnline ? (
                  <div className="size-5 rounded-full border-2 border-[rgba(27,43,94,0.06)] border-t-white animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      account_balance
                    </span>
                    Pay Online (UPI/Card)
                  </>
                )}
              </button>

              <button
                disabled={
                  paymentStatus === "pending" ||
                  (FEATURES.NRI_MODE &&
                    activeCharge.lease?.hasTdsObligation &&
                    !tdsAccepted)
                }
                onClick={openCashModal}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-white border py-3.5 text-text-primary font-bold text-[14px]  active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-text-secondary">
                  payments
                </span>
                Record Cash Payment
              </button>
            </div>
          )}
        </>
      )}

      {showCashModal && activeCharge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40  p-4 sm:items-center motion-page-enter">
          <div className="motion-modal-enter w-full max-w-[400px] rounded-[24px] border bg-white/80 backdrop-blur-[30px] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623]"></div>

            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[18px] font-black text-text-primary">
                Record Cash Payment
              </h3>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-white border text-text-secondary hover:text-text-primary  transition-colors shadow-sm"
                onClick={() => setShowCashModal(false)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>

            <div className="rounded-[16px] bg-white border p-4 flex items-start gap-3 mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">
                info
              </span>
              <p className="text-[12px] font-bold text-text-secondary leading-relaxed">
                Your landlord will review this cash submission before the charge
                balance is updated.
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-[16px] bg-white border px-4 py-3 text-[15px] font-black text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all"
                  value={cashAmount}
                  onChange={(event) => setCashAmount(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                  Date Handed Over
                </label>
                <input
                  type="date"
                  className="w-full rounded-[16px] bg-white border px-4 py-3 text-[15px] font-black text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all"
                  value={cashDate}
                  onChange={(event) => setCashDate(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Receipt ID or note"
                  className="w-full rounded-[16px] bg-white border px-4 py-3 text-[14px] font-bold text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all"
                  value={cashReference}
                  onChange={(event) => setCashReference(event.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-3.5 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
              disabled={isSubmittingCash}
              onClick={() => void handleCashSubmit()}
            >
              {isSubmittingCash ? (
                <div className="size-5 rounded-full border-2 border-[rgba(27,43,94,0.06)] border-t-white animate-spin"></div>
              ) : (
                "Submit for Approval"
              )}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PayRent;
