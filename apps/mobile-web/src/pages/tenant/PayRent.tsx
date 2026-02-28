import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  KpiValue,
  TextField,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import { api, type PaymentRecord, type RentChargeRecord } from "../../lib/api";

const amountToNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const toCurrency = (value: string | number | null | undefined) =>
  formatINR(amountToNumber(value), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
    if (!activeCharge) {
      return null;
    }
    return (
      payments.find(
        (payment) =>
          payment.chargeId === activeCharge.id &&
          payment.status === "REQUIRES_REVIEW",
      ) ?? null
    );
  }, [activeCharge, payments]);

  const pendingOnlinePayment = useMemo(() => {
    if (!activeCharge) {
      return null;
    }
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

  const navRole = profile?.role === "LANDLORD" ? "landlord" : "tenant";

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
    if (!session || !activeCharge) {
      return;
    }

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
    if (!session || !activeCharge) {
      return;
    }

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
            Pay Rent
          </h1>
          <Badge tone="neutral">Ledger</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {error && (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        )}

        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading billing details...
            </p>
          </InstitutionCard>
        ) : (
          <>
            <InstitutionCard accentSpine elevation="raised">
              <KpiValue
                label="Current Balance"
                value={
                  <span className="font-numeric">
                    {toCurrency(activeCharge?.balanceAmount ?? 0)}
                  </span>
                }
              />

              {activeCharge && paymentStatus === "due" && (
                <div className="mt-3">
                  <Badge tone="accent">
                    Due {new Date(activeCharge.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
              )}

              {paymentStatus === "pending" && pendingCashPayment && (
                <div className="mt-3">
                  <Badge tone="warning">
                    Cash submission pending landlord approval
                  </Badge>
                </div>
              )}

              {paymentStatus === "pending" &&
                !pendingCashPayment &&
                pendingOnlinePayment && (
                  <div className="mt-3">
                    <Badge tone="warning">
                      Online payment is pending confirmation
                    </Badge>
                  </div>
                )}
            </InstitutionCard>

            <InstitutionCard>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Monthly Breakdown
              </h2>

              {activeCharge ? (
                <div className="section-stack">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Base Rent</p>
                    <p className="font-numeric text-sm font-semibold text-text-primary">
                      {toCurrency(activeCharge.baseRentAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Maintenance</p>
                    <p className="font-numeric text-sm font-semibold text-text-primary">
                      {toCurrency(activeCharge.maintenanceAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Utility</p>
                    <p className="font-numeric text-sm font-semibold text-text-primary">
                      {toCurrency(activeCharge.utilityAmount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                    <p className="text-sm font-semibold text-primary">
                      Total Due
                    </p>
                    <p className="font-numeric text-sm font-semibold text-primary">
                      {toCurrency(activeCharge.balanceAmount)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  No outstanding charges. Your ledger is clear.
                </p>
              )}
            </InstitutionCard>

            <section className="section-stack">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Payment History
              </h2>

              {historyPayments.length === 0 ? (
                <InstitutionCard>
                  <p className="text-sm text-text-secondary">
                    No payments recorded yet.
                  </p>
                </InstitutionCard>
              ) : (
                historyPayments.slice(0, 6).map((payment) => {
                  const isPending = payment.status === "REQUIRES_REVIEW";
                  const isSuccess = payment.status === "SUCCEEDED";
                  const tone = isPending
                    ? "warning"
                    : isSuccess
                      ? "success"
                      : "danger";

                  return (
                    <InstitutionCard key={payment.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {payment.provider === "cash"
                              ? "Cash Payment"
                              : "Rent Payment"}
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                            {payment.status.replaceAll("_", " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-numeric text-sm font-semibold text-text-primary">
                            {toCurrency(payment.amount)}
                          </p>
                          <div className="mt-1">
                            <Badge tone={tone}>{payment.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </InstitutionCard>
                  );
                })
              )}
            </section>

            {paymentStatus !== "paid" && activeCharge && (
              <div className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-[430px] flex-col gap-2 border-t border-border-subtle bg-background px-4 pb-[calc(var(--layout-safe-area-bottom)+1rem)] pt-3">
                <Button
                  type="button"
                  size="lg"
                  loading={isLaunchingOnline}
                  disabled={paymentStatus === "pending"}
                  onClick={() => void handleOnlinePayment()}
                >
                  Pay Online (UPI/Card)
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  disabled={paymentStatus === "pending"}
                  onClick={openCashModal}
                  leadingIcon={
                    <span className="material-symbols-outlined text-[18px]">
                      payments
                    </span>
                  }
                >
                  Record Cash Payment
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {showCashModal && activeCharge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay-scrim)] p-4 sm:items-center">
          <div className="motion-modal-enter w-full max-w-[400px] rounded-[var(--radius-modal)] border border-border-subtle bg-surface p-5 shadow-overlay">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">
                Record Cash Payment
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCashModal(false)}
              >
                Close
              </Button>
            </div>

            <InstitutionCard className="mb-4 bg-surface-subtle">
              <p className="text-xs text-text-secondary">
                Your landlord will review this cash submission before the charge
                balance is updated.
              </p>
            </InstitutionCard>

            <div className="section-stack mb-4">
              <TextField
                label="Amount Paid"
                type="number"
                step="0.01"
                min="0.01"
                value={cashAmount}
                onChange={(event) => setCashAmount(event.target.value)}
              />

              <TextField
                label="Date Handed Over"
                type="date"
                value={cashDate}
                onChange={(event) => setCashDate(event.target.value)}
              />

              <TextField
                label="Reference (Optional)"
                value={cashReference}
                onChange={(event) => setCashReference(event.target.value)}
                placeholder="Receipt ID or note"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              size="lg"
              loading={isSubmittingCash}
              onClick={() => void handleCashSubmit()}
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      )}

      <BottomNav role={navRole} />
    </PageLayout>
  );
};

export default PayRent;
