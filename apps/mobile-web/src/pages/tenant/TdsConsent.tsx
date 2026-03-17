import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type PaymentRecord } from "../../lib/api";

const toCurrency = (value: string | number | null | undefined) =>
  formatINRWhole(Number(value ?? 0));

const TdsConsent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tdsAccepted, setTdsAccepted] = useState(false);

  useEffect(() => {
    const loadPayment = async () => {
      if (!session || !id) return;
      setIsLoading(true);
      try {
        const allPayments = await api.listPayments(session.access_token);
        const targetPayment = allPayments.find((p) => p.id === id);

        if (!targetPayment) {
          setError("Payment not found or you don't have access to it.");
        } else if (
          targetPayment.status === "SUCCEEDED" ||
          targetPayment.status === "FAILED"
        ) {
          setError(
            `This payment has already been processed (${targetPayment.status}).`,
          );
        } else if (!targetPayment.charge?.lease?.hasTdsObligation) {
          // If no TDS obligation, redirect straight to Razorpay or fallback
          if (targetPayment.razorpayPaymentLinkUrl) {
            window.location.href = targetPayment.razorpayPaymentLinkUrl;
          } else {
            navigate("/tenant/pay");
          }
        } else {
          setPayment(targetPayment);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payment details",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPayment();
  }, [session, id, navigate]);

  const handleProceed = () => {
    if (!payment || !tdsAccepted) return;

    // Fallback typing: Razorpay link is injected dynamically into the payment record.
    const razorpayLink = (payment as any).razorpayPaymentLinkUrl;
    if (razorpayLink) {
      window.location.href = razorpayLink;
    } else {
      setError(
        "Payment link not available. Please try paying from the dashboard.",
      );
    }
  };

  return (
    <AppLayout
      title="TDS Consent"
      showBackButton
      className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter"
    >
      {error && (
        <div className="rounded-[12px] border border-danger/20 bg-danger/10 p-4">
          <p className="text-[13px] font-bold text-danger">{error}</p>
          <button
            className="mt-3 text-[12px] font-bold text-primary underline"
            onClick={() => navigate("/tenant/pay")}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {isLoading && !error && (
        <div className="flex items-center justify-center p-12">
          <div className="size-8 rounded-full border-2 border-t-primary animate-spin"></div>
        </div>
      )}

      {!isLoading && !error && payment && payment.charge && (
        <div className="flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-[24px] bg-white shadow-sm border group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>
            <div className="p-6">
              <h2 className="text-[24px] font-black text-text-primary tracking-tight leading-none drop-shadow-sm mb-2">
                Rent Payment
              </h2>
              <p className="text-[13px] font-bold text-text-secondary">
                For {payment.charge.lease?.property?.name || "Property"}
              </p>
            </div>
          </section>

          <div className="bg-warning/10 border border-warning/20 rounded-[20px] p-5">
            <div className="flex gap-3 items-start mb-4">
              <span className="material-symbols-outlined text-warning text-[24px]">
                warning
              </span>
              <div>
                <h4 className="text-[15px] font-black text-warning mb-1">
                  TDS Obligation Notice
                </h4>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  Your landlord is an NRI. As per Indian tax law, you must
                  deduct {(payment.charge.lease!.tdsRate || 0.312) * 100}% TDS
                  from this rent payment.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5 bg-white rounded-[12px] p-4 border shadow-sm">
              <div className="flex justify-between text-[12px] font-bold text-text-secondary">
                <span className="uppercase tracking-wide">Rent Amount:</span>
                <span className="text-text-primary text-[13px]">
                  {toCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between text-[12px] font-bold text-text-secondary">
                <span className="uppercase tracking-wide">TDS to Deduct:</span>
                <span className="text-danger text-[13px]">
                  {toCurrency(
                    Number(payment.amount) *
                      (payment.charge.lease!.tdsRate || 0.312),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[12px] font-black text-text-secondary pt-2 mt-2 border-t border-black/10">
                <span className="uppercase tracking-wide">
                  Amount to pay now:
                </span>
                <span className="text-primary text-[15px]">
                  {toCurrency(
                    Number(payment.amount) *
                      (1 - (payment.charge.lease!.tdsRate || 0.312)),
                  )}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-[8px] hover:bg-white transition-colors">
              <div
                className={`size-6 rounded-[6px] border flex items-center justify-center transition-colors shadow-sm ${tdsAccepted ? "bg-primary border-primary" : "bg-white/80 border-black/20 group-hover:border-primary/50"}`}
              >
                {tdsAccepted && (
                  <span className="material-symbols-outlined text-[16px] text-white">
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
              <span className="text-[13px] font-black text-text-primary select-none mt-0.5">
                I understand my TDS obligation
              </span>
            </label>
          </div>

          <div className="mt-4">
            <button
              disabled={!tdsAccepted}
              onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-4 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              Proceed to Payment
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TdsConsent;
