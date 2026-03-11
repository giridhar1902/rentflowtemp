import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import {
  api,
  type LeaseRecord,
  type RentChargeRecord,
  type OfflineRentPaymentRecord,
} from "../../lib/api";
import { cn } from "../../lib/cn";
import { RecordOfflineRent } from "./RecordOfflineRent";

// ── Countdown helper ────────────────────────────────────────────────────
const getCountdown = (targetDate: Date) => {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins };
};

// ── TenantHome Page ─────────────────────────────────────────────────────
const TenantHome: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [charges, setCharges] = useState<RentChargeRecord[]>([]);
  const [offlinePayments, setOfflinePayments] = useState<
    OfflineRentPaymentRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Tick every minute for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        const [leaseData, chargeData, offlineData] = await Promise.all([
          api.listLeases(session.access_token),
          api.listCharges(session.access_token, { status: "ISSUED" }),
          api.listTenantOfflinePayments(session.access_token),
        ]);
        setLeases(Array.isArray(leaseData) ? leaseData : []);
        setCharges(Array.isArray(chargeData) ? chargeData : []);
        setOfflinePayments(Array.isArray(offlineData) ? offlineData : []);
      } catch {
        // Silently fallback to empty in demo mode
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [session]);

  const activeLease = useMemo(
    () => leases.find((l) => l.status === "ACTIVE") ?? leases[0] ?? null,
    [leases],
  );

  const nextCharge = useMemo(() => {
    const issued = (charges ?? []).filter(
      (c) => c.status === "ISSUED" || c.status === "OVERDUE",
    );
    return (
      issued.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )[0] ?? null
    );
  }, [charges]);

  const dueDate = nextCharge
    ? new Date(nextCharge.dueDate)
    : new Date(Date.now() + 4 * 24 * 3600_000);
  const countdown = getCountdown(dueDate);
  const dueAmount = nextCharge
    ? Number(nextCharge.totalAmount)
    : activeLease
      ? Number(activeLease.monthlyRent)
      : 24500;
  const isOverdue = nextCharge?.status === "OVERDUE";

  const leaseEnd = activeLease?.endDate ? new Date(activeLease.endDate) : null;
  const leaseStart = activeLease?.startDate
    ? new Date(activeLease.startDate)
    : null;
  const leaseProgress =
    leaseStart && leaseEnd
      ? Math.min(
          1,
          (Date.now() - leaseStart.getTime()) /
            (leaseEnd.getTime() - leaseStart.getTime()),
        )
      : 0.66;
  const leaseMonthsLeft = leaseEnd
    ? Math.max(
        0,
        Math.round((leaseEnd.getTime() - Date.now()) / (30 * 24 * 3600_000)),
      )
    : 8;
  const leaseEndStr = leaseEnd
    ? leaseEnd.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "15th Dec 2024";

  const userName =
    profile?.firstName ?? profile?.email?.split("@")[0] ?? "Tenant";

  return (
    <AppLayout
      title={userName}
      subtitle="WELCOME BACK"
      bottomNavRole="tenant"
      className="px-5 pt-5 pb-6 flex flex-col gap-5 motion-page-enter"
    >
      {/* ── Rent Due Card ── */}
      <section className="relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00]" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              {isOverdue ? "Overdue Payment" : "Upcoming Payment"}
            </p>
            <h2 className="text-[32px] font-black text-[#1e293b] tracking-tight">
              {loading ? "…" : formatINRWhole(dueAmount)}
            </h2>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 border",
              isOverdue
                ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                : "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]",
            )}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isOverdue ? "warning" : "hourglass_empty"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {isOverdue ? "Overdue" : `Due in ${countdown.days}d`}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-5 flex items-center justify-center gap-3">
          {[
            { val: countdown.days, label: "Days" },
            { val: countdown.hours, label: "Hrs" },
            { val: countdown.mins, label: "Min" },
          ].map(({ val, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center size-[68px] rounded-full bg-white/60 shadow-sm border border-white/60"
            >
              <span className="text-[22px] font-black text-[#1e293b] leading-none font-numeric">
                {String(val).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        <button
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all"
          onClick={() => navigate("/tenant/pay")}
        >
          <span className="material-symbols-outlined text-[20px]">
            payments
          </span>
          Pay Rent via UPI
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 opacity-70">
          <span className="material-symbols-outlined text-[14px] text-slate-500">
            verified_user
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Secure Payment via Cashfree
          </span>
        </div>
      </section>

      {/* ── Offline Rent Pending ── */}
      {offlinePayments.filter((p) => p.status === "PENDING_APPROVAL").length >
        0 && (
        <section className="rounded-[22px] bg-white/40 backdrop-blur-[20px] p-5 border border-white/50 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">
              pending_actions
            </span>
            <h3 className="text-[13px] font-extrabold text-[#1e293b]">
              Pending Offline Payments
            </h3>
          </div>
          {offlinePayments
            .filter((p) => p.status === "PENDING_APPROVAL")
            .map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-white/60 rounded-[16px] px-4 py-3 border border-white/60"
              >
                <div>
                  <p className="text-[13px] font-bold text-[#1e293b]">
                    ₹{payment.amount} – {payment.rentMonth}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                    {payment.paymentMode} •{" "}
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#F59E0B]">
                  Pending Approval
                </span>
              </div>
            ))}
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section className="grid grid-cols-2 gap-3">
        {[
          {
            icon: "receipt_long",
            label: "Record Cash Rent",
            onClick: () => setShowOfflineModal(true),
          },
          {
            icon: "build",
            label: "Raise Request",
            onClick: () => navigate("/tenant/request"),
          },
        ].map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 rounded-[22px] bg-white/40 backdrop-blur-[20px] p-5 border border-white/50 hover:bg-white/60 active:scale-[0.97] transition-all shadow-sm"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white/60 border border-white/60 shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-slate-500">
                {icon}
              </span>
            </div>
            <span className="text-[13px] font-bold text-[#1e293b]">
              {label}
            </span>
          </button>
        ))}
      </section>

      {/* ── Services ── */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          {
            icon: "currency_rupee",
            label: "Cash Advance",
            path: "/tenant/rent-advance",
          },
          {
            icon: "account_balance",
            label: "Deposit EMI",
            path: "/tenant/deposit-emi",
          },
          {
            icon: "storefront",
            label: "Marketplace",
            path: "/tenant/marketplace",
          },
        ].map(({ icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-center gap-2 rounded-[18px] bg-white/40 backdrop-blur-[20px] p-4 border border-white/50 hover:bg-white/60 active:scale-[0.97] transition-all shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/60 shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-slate-500">
                {icon}
              </span>
            </div>
            <span className="text-[10px] font-bold text-center text-[#1e293b] leading-tight">
              {label}
            </span>
          </button>
        ))}
      </section>

      {/* ── Lease Overview ── */}
      <section className="rounded-[22px] bg-white/40 backdrop-blur-[20px] p-5 border border-white/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-black text-[#1e293b]">
            Lease Overview
          </h3>
          <span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#10B981]">
            {activeLease?.status ?? "Active"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/50 border border-white/40 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.4)]"
            style={{ width: `${Math.round(leaseProgress * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between border-b border-white/40 pb-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
              Expiry Date
            </p>
            <p className="text-[13px] font-black text-[#1e293b]">
              {leaseEndStr}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
              Remaining
            </p>
            <p className="text-[13px] font-black text-[#FF7A00]">
              {leaseMonthsLeft} Months
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#10B981]">
              verified
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Verified Lease
            </span>
          </div>
          <button
            onClick={() => navigate("/lease")}
            className="text-[11px] font-bold uppercase tracking-widest text-[#FF7A00] hover:underline"
          >
            View Details
          </button>
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 pl-1">
          Recent Activity
        </h3>
        <div className="rounded-[22px] bg-white/40 backdrop-blur-[20px] overflow-hidden border border-white/50 shadow-sm">
          {charges.slice(0, 3).map((charge, i) => (
            <div
              key={charge.id}
              className={cn(
                "flex items-center justify-between p-4 hover:bg-white/60 transition-colors",
                i < Math.min(charges.length - 1, 2)
                  ? "border-b border-white/30"
                  : "",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    charge.status === "PAID"
                      ? "bg-[#10B981]/10 text-[#10B981]"
                      : "bg-[#FF9A3D]/10 text-[#FF7A00]",
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {charge.status === "PAID" ? "check_circle" : "receipt_long"}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e293b]">
                    {charge.status === "PAID" ? "Rent Paid" : "Rent Due"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                    {new Date(charge.periodStart).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-[13px] font-bold",
                  charge.status === "PAID"
                    ? "text-[#10B981]"
                    : "text-[#FF7A00]",
                )}
              >
                {charge.status === "PAID" ? "- " : ""}
                {formatINRWhole(Number(charge.totalAmount))}
              </span>
            </div>
          ))}
          {charges.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[13px] text-slate-400">No charges yet</p>
            </div>
          )}
        </div>
      </section>

      {showOfflineModal && activeLease && (
        <RecordOfflineRent
          propertyId={activeLease.propertyId}
          unitId={activeLease.unitId}
          propertyName={activeLease.property?.name ?? "Property"}
          unitName={activeLease.unit?.name ?? "Unit"}
          onClose={() => setShowOfflineModal(false)}
          onSuccess={(record) => {
            setOfflinePayments((prev) => [record, ...prev]);
            setShowOfflineModal(false);
          }}
        />
      )}
    </AppLayout>
  );
};

export default TenantHome;
