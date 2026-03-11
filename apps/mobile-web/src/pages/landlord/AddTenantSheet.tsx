import React, { useState } from "react";
import { cn } from "../../lib/cn";
import type { PgTenant, PgUnit } from "../../lib/pgTypes";

interface Props {
  open: boolean;
  unit: PgUnit;
  onSave: (tenant: PgTenant) => void;
  onClose: () => void;
}

const AddTenantSheet: React.FC<Props> = ({ open, unit, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bedId, setBedId] = useState<string>("");
  const [rentAmount, setRentAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vacantBeds = unit.beds.filter((b) => !b.tenantId);

  const reset = () => {
    setName("");
    setPhone("");
    setBedId("");
    setRentAmount("");
    setErrors({});
  };

  // auto-calculate equal split based on existing tenants + 1
  const equalSplitHint =
    unit.rentMode === "equal_split" && unit.tenants.length > 0
      ? `Equal split with ${unit.tenants.length + 1} tenants`
      : null;

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Tenant name is required";
    const rent = parseFloat(rentAmount);
    if (isNaN(rent) || rent < 0) e.rent = "Enter a valid rent amount";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const tenant: PgTenant = {
      id: `tenant-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      rentAmount: rent,
      unitId: unit.id,
      bedId: bedId || undefined,
    };
    onSave(tenant);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-[20px] rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] px-6 pt-5 pb-10 flex flex-col gap-5">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-black text-[#1e293b]">
              Add Tenant
            </h2>
            <p className="text-[12px] text-slate-500">To {unit.name}</p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="size-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pb-2">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className={cn(
                "w-full rounded-[14px] bg-slate-50 border px-4 py-3 text-[14px] text-[#1e293b] outline-none focus:ring-2 focus:ring-[#FF9A3D]/40",
                errors.name ? "border-red-300" : "border-slate-200",
              )}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              type="tel"
              className="w-full rounded-[14px] bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-[#1e293b] outline-none focus:ring-2 focus:ring-[#FF9A3D]/40"
            />
          </div>

          {/* Bed Assignment */}
          {unit.beds.length > 0 && (
            <div>
              <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Bed Assignment
              </label>
              {vacantBeds.length === 0 ? (
                <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3">
                  All beds are occupied in this unit.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setBedId("")}
                    className={cn(
                      "px-4 py-2 rounded-[12px] border text-[13px] font-semibold transition-all",
                      !bedId
                        ? "border-[#FF9A3D] bg-[#FF9A3D]/10 text-[#FF7A00]"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    No bed
                  </button>
                  {vacantBeds.map((bed) => (
                    <button
                      key={bed.id}
                      onClick={() => setBedId(bed.id)}
                      className={cn(
                        "px-4 py-2 rounded-[12px] border text-[13px] font-semibold transition-all",
                        bedId === bed.id
                          ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      {bed.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rent Amount */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Rent Amount (₹/month) *
            </label>
            {equalSplitHint && (
              <p className="text-[11px] text-slate-500 mb-1.5">
                {equalSplitHint}
              </p>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-500">
                ₹
              </span>
              <input
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="0"
                type="number"
                className={cn(
                  "w-full rounded-[14px] bg-slate-50 border pl-8 pr-4 py-3 text-[14px] text-[#1e293b] outline-none focus:ring-2 focus:ring-[#FF9A3D]/40",
                  errors.rent ? "border-red-300" : "border-slate-200",
                )}
              />
            </div>
            {errors.rent && (
              <p className="text-[11px] text-red-500 mt-1">{errors.rent}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-[20px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-4 text-[16px] font-black text-white shadow-[0_8px_20px_rgba(255,122,0,0.3)] active:scale-[0.98] transition-all"
        >
          Add Tenant
        </button>
      </div>
    </div>
  );
};

export default AddTenantSheet;
