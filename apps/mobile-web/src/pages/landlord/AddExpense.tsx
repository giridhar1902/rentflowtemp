import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Maintenance");

  return (
    <div className="min-h-screen font-sans pb-[120px] text-[#1B2B5E] ">
      <header className="sticky top-0 z-20 border-b bg-white px-5 pb-4 pt-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border text-slate-500 hover:text-[#1B2B5E] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">Add Expense</h1>
          <div className="flex h-7 items-center rounded-full bg-white border px-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Draft
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        {/* Amount Input */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#F5A623]/40 bg-[#F5A623]/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#F5A623] to-[#F5A623]"></div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-[#F5A623] mb-3 pl-1">
            Expense Amount
          </label>
          <div className="flex items-center gap-3 pl-1 border-b pb-2">
            <span className="text-[32px] font-black text-slate-400 font-numeric tracking-tighter">
              ₹
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-[36px] font-black text-[#1B2B5E] font-numeric tracking-tighter outline-none placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Property Selector */}
        <div className="rounded-[20px] border bg-white p-5 shadow-sm ">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
            Property
          </label>
          <div className="relative">
            <select className="w-full appearance-none rounded-[16px] border bg-white py-3.5 pl-4 pr-10 text-[14px] font-bold text-[#1B2B5E] outline-none focus:border-[#F5A623] shadow-sm transition-colors">
              <option>Sunset Heights Apartment 4B</option>
              <option>Riverside Villa Unit 12</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500">
              expand_more
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="rounded-[20px] border bg-white p-5 shadow-sm ">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-4">
            Category
          </label>
          <div className="flex flex-wrap gap-2.5">
            {["Maintenance", "Utilities", "Tax", "Insurance", "Repair"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-wider border transition-colors shadow-sm ${
                    category === cat
                      ? "bg-gradient-to-r from-[#F5A623] to-[#F5A623] text-white border-transparent shadow-[0_4px_15px_rgba(245,166,35,0.3)]"
                      : "bg-white text-slate-500 hover:border-[#F5A623]/50 hover:text-[#1B2B5E]"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Upload Receipt */}
        <div className="rounded-[20px] border border-dashed bg-white p-8 text-center cursor-pointer hover:border-[#F5A623]/50  transition-all shadow-sm group">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border bg-white text-[#F5A623] group-hover:bg-[#F5A623]/10 transition-colors mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[24px]">
              photo_camera
            </span>
          </div>
          <p className="text-[15px] font-bold text-[#1B2B5E] mb-1">
            Upload Receipt
          </p>
          <p className="text-[12px] text-slate-500">
            Snap a photo or browse files
          </p>
        </div>
      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 px-5">
        <button className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-4 text-[14px] font-black uppercase tracking-[0.1em] text-white shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined text-[20px]">save</span>
          Save Expense
        </button>
      </div>
    </div>
  );
};

export default AddExpense;
