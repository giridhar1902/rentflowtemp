import React, { useState } from "react";
import { cn } from "../../lib/cn";
import {
  generateBeds,
  type PgUnit,
  type ElectricBillingType,
  type WaterBillingMode,
  type RentMode,
} from "../../lib/pgTypes";

interface Props {
  open: boolean;
  propertyId: string;
  onSave: (unit: PgUnit) => void;
  onClose: () => void;
}

const AddUnitSheet: React.FC<Props> = ({ open, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [bedCount, setBedCount] = useState("1");
  const [meterNumber, setMeterNumber] = useState("");
  const [electricType, setElectricType] =
    useState<ElectricBillingType>("manual");
  const [waterMode, setWaterMode] = useState<WaterBillingMode>("per_tenant");
  const [rentMode, setRentMode] = useState<RentMode>("equal_split");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setFloor("");
    setBedCount("1");
    setMeterNumber("");
    setElectricType("manual");
    setWaterMode("per_tenant");
    setRentMode("equal_split");
    setErrors({});
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Unit name is required";
    const beds = parseInt(bedCount, 10);
    if (isNaN(beds) || beds < 1) e.beds = "At least 1 bed required";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const unit: PgUnit = {
      id: `unit-${Date.now()}`,
      name: name.trim(),
      floor: floor.trim() || undefined,
      meterNumber: meterNumber.trim() || undefined,
      rentMode,
      electricBillingType: electricType,
      waterBillingMode: waterMode,
      beds: generateBeds(beds),
      tenants: [],
    };
    onSave(unit);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white/95  rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black text-[#1B2B5E]">Add Unit</h2>
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

        <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pb-2">
          {/* Unit Name */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Unit Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Room 101, Flat 2A"
              className={cn(
                "w-full rounded-[14px] bg-slate-50 border px-4 py-3 text-[14px] text-[#1B2B5E] outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all",
                errors.name ? "border-red-300" : "border-slate-200",
              )}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Floor */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Floor Number
            </label>
            <input
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 1, Ground, Terrace"
              className="w-full rounded-[14px] bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-[#1B2B5E] outline-none focus:ring-2 focus:ring-[#F5A623]/40"
            />
          </div>

          {/* Number of Beds */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Number of Beds *
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setBedCount(String(Math.max(1, parseInt(bedCount) - 1)))
                }
                className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xl hover:bg-slate-200 transition-colors"
              >
                −
              </button>
              <span className="text-[22px] font-black text-[#1B2B5E] w-8 text-center">
                {bedCount}
              </span>
              <button
                onClick={() =>
                  setBedCount(String(Math.min(8, parseInt(bedCount) + 1)))
                }
                className="size-10 rounded-full bg-[#F5A623]/15 flex items-center justify-center text-[#F5A623] font-bold text-xl hover:bg-[#F5A623]/25 transition-colors"
              >
                +
              </button>
              <span className="text-[12px] text-slate-400 ml-2">
                Auto-generates Bed A, B, C…
              </span>
            </div>
            {errors.beds && (
              <p className="text-[11px] text-red-500 mt-1">{errors.beds}</p>
            )}
          </div>

          {/* Meter Number */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Electric Meter Number (RR No.)
            </label>
            <input
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              placeholder="e.g. RR123456"
              className="w-full rounded-[14px] bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-[#1B2B5E] outline-none focus:ring-2 focus:ring-[#F5A623]/40"
            />
          </div>

          {/* Electricity Billing */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Electricity Billing
            </label>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["per_unit_meter", "Per unit meter", "meter"],
                  ["building_shared", "Building meter shared", "apartment"],
                  ["manual", "Manual entry", "edit"],
                ] as const
              ).map(([val, label, icon]) => (
                <button
                  key={val}
                  onClick={() => setElectricType(val as ElectricBillingType)}
                  className={cn(
                    "flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-all",
                    electricType === val
                      ? "border-[#F5A623] bg-[#F5A623]/10"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px]",
                      electricType === val
                        ? "text-[#F5A623]"
                        : "text-slate-400",
                    )}
                  >
                    {icon}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-semibold",
                      electricType === val
                        ? "text-[#F5A623]"
                        : "text-slate-600",
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Water Billing */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Water Billing
            </label>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["per_tenant", "Per tenant headcount", "water_drop"],
                  ["flat_monthly", "Flat monthly fee", "calendar_month"],
                  ["manual", "Manual entry", "edit"],
                ] as const
              ).map(([val, label, icon]) => (
                <button
                  key={val}
                  onClick={() => setWaterMode(val as WaterBillingMode)}
                  className={cn(
                    "flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-all",
                    waterMode === val
                      ? "border-[#3B82F6] bg-[#3B82F6]/10"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px]",
                      waterMode === val ? "text-[#3B82F6]" : "text-slate-400",
                    )}
                  >
                    {icon}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-semibold",
                      waterMode === val ? "text-[#3B82F6]" : "text-slate-600",
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rent Mode */}
          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Rent Configuration
            </label>
            <div className="flex gap-2">
              {(
                [
                  ["equal_split", "Equal Split"],
                  ["manual", "Manual per Tenant"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRentMode(val as RentMode)}
                  className={cn(
                    "flex-1 rounded-[14px] border py-3 text-[13px] font-bold transition-all",
                    rentMode === val
                      ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-[20px] bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-4 text-[16px] font-black text-white shadow-[0_8px_20px_rgba(245,166,35,0.3)] hover:shadow-[0_12px_25px_rgba(245,166,35,0.4)] active:scale-[0.98] transition-all"
        >
          Add Unit
        </button>
      </div>
    </div>
  );
};

export default AddUnitSheet;
