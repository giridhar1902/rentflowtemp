import React, { useState } from "react";
import { cn } from "../../lib/cn";
import { api, type OfflineRentPaymentRecord } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type PaymentMode = "UPI" | "CASH" | "BANK" | "OTHER";

type RecordOfflineRentProps = {
  propertyId: string;
  unitId: string;
  propertyName: string;
  unitName: string;
  onClose: () => void;
  onSuccess: (record: OfflineRentPaymentRecord) => void;
};

export const RecordOfflineRent = ({
  propertyId,
  unitId,
  propertyName,
  unitName,
  onClose,
  onSuccess,
}) => {
  const { profile, token } = useAuth();

  const [amount, setAmount] = useState("");
  const [rentMonth, setRentMonth] = useState("November 2023");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mode, setMode] = useState<PaymentMode>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const record = await api.submitOfflinePayment(token, {
        propertyId,
        unitId,
        amount: numAmount,
        rentMonth,
        paymentDate,
        paymentMode: mode,
        status: "PENDING_APPROVAL",
      });

      onSuccess(record);
    } catch (err: any) {
      setError(err.message || "Failed to submit offline payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentModes: { id: PaymentMode; icon: string; label: string }[] = [
    { id: "UPI", icon: "qr_code_scanner", label: "UPI" },
    { id: "CASH", icon: "payments", label: "CASH" },
    { id: "BANK", icon: "account_balance", label: "BANK" },
    { id: "OTHER", icon: "more_horiz", label: "OTHER" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40  motion-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[9999] max-h-[90vh] overflow-y-auto",
          "bg-[#F9FAFB] rounded-t-[32px] px-5 py-6 flex flex-col motion-slide-up",
          "shadow-[0_-20px_40px_rgba(0,0,0,0.15)] max-w-md mx-auto",
        )}
        style={{ paddingBottom: "120px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
            Record Offline Rent
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tenant Info Card */}
        <div className="flex items-center gap-4 bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 mb-8">
          <div className="relative">
            <div className="size-14 rounded-full overflow-hidden bg-slate-100">
              <img
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.firstName || "Tenant"}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-[#10B981] border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-[17px] font-bold text-slate-900 truncate">
                {profile?.firstName} {profile?.lastName}
              </h3>
              <span
                className="material-symbols-outlined text-[16px] text-blue-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <p className="text-[13px] text-slate-500 truncate">
              Unit {unitName} • {propertyName}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            Amount Received
          </label>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm focus-within:ring-2 focus-within:ring-[#F5A623]/30 focus-within:border-[#F5A623] transition-all">
            <span className="text-[24px] font-semibold text-slate-400 mr-2">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="flex-1 bg-transparent text-[28px] font-bold text-slate-900 outline-none w-full placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Rent Month */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              Rent Month
            </label>
            <div className="relative flex items-center bg-white border border-slate-200 rounded-[16px] px-4 py-3 shadow-sm focus-within:ring-2 ring-[#F5A623]/30">
              <select
                value={rentMonth}
                onChange={(e) => setRentMonth(e.target.value)}
                className="w-full bg-transparent text-[14px] font-semibold text-slate-900 outline-none appearance-none pr-6"
              >
                <option value="November 2023">November 2023</option>
                <option value="December 2023">December 2023</option>
                <option value="January 2024">January 2024</option>
                <option value="February 2024">February 2024</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 text-[18px] text-slate-400 pointer-events-none">
                calendar_month
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              Payment Date
            </label>
            <div className="relative flex items-center bg-white border border-slate-200 rounded-[16px] px-4 py-3 shadow-sm">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-transparent text-[14px] font-semibold text-slate-900 outline-none appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="mb-8">
          <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
            Payment Mode
          </label>
          <div className="grid grid-cols-4 gap-2">
            {paymentModes.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMode(pm.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] border-2 transition-all",
                  mode === pm.id
                    ? "bg-blue-50/50 border-blue-500"
                    : "bg-white border-transparent shadow-sm hover:border-slate-200",
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[24px]",
                    mode === pm.id ? "text-blue-600" : "text-slate-500",
                  )}
                >
                  {pm.icon}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold tracking-wide",
                    mode === pm.id ? "text-blue-600" : "text-slate-500",
                  )}
                >
                  {pm.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Proof of Payment (Mock) */}
        <div className="mb-8">
          <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            Proof of Payment
          </label>
          <div className="h-20 rounded-[20px] border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[24px] text-slate-400">
              add_photo_alternate
            </span>
            <span className="text-[12px] font-semibold text-slate-500">
              Upload receipt
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-center text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-white rounded-[20px] py-4 px-6 flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-[rgba(27,43,94,0.06)] border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">
                receipt_long
              </span>
              <span className="text-[15px] font-bold tracking-wide">
                RECORD & SEND FOR APPROVAL
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
