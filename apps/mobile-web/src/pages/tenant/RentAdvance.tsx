import React from "react";
import { useNavigate } from "react-router-dom";

const RentAdvance: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border text-text-secondary hover:text-primary  transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>

          <h1 className="text-[17px] font-black tracking-tight text-text-primary uppercase tracking-widest">
            Rent Advance
          </h1>

          <div className="w-9" />
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        <div className="relative overflow-hidden rounded-[24px] bg-white shadow-sm border group">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>

          <div className="p-6">
            <div className="flex flex-col gap-1 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                Available Pre-approved Limit
              </p>
              <h2 className="text-[40px] font-black text-text-primary tracking-tight leading-none drop-shadow-sm">
                ₹1,50,000
              </h2>
            </div>

            <p className="text-[12px] font-bold text-text-secondary leading-relaxed mb-6">
              Get instant cash deposited to your bank account with flexible
              repayment terms. Powered by our NBFC partners.
            </p>

            <div className="flex items-center justify-between border-t border-border-subtle pt-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success text-[18px]">
                  verified
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                  No hard credit check
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success text-[18px]">
                  bolt
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                  Instant Disbursal
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[24px] bg-white shadow-sm p-6 border">
          <h3 className="mb-5 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
            Select Advance Amount
          </h3>
          <div className="flex flex-col gap-4">
            <div className="rounded-[16px] border border-primary bg-gradient-to-r from-[#F5A623]/10 to-[#F5A623]/10 p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="size-5 rounded-full border-4 border-primary bg-white shadow-sm"></div>
                <div>
                  <h4 className="text-[15px] font-black text-text-primary">
                    ₹50,000
                  </h4>
                  <p className="text-[11px] text-text-secondary font-bold mt-0.5">
                    ₹4,500/mo for 12 months
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                Best Value
              </span>
            </div>

            <div className="rounded-[16px] border bg-white p-4 flex items-center justify-between cursor-pointer hover:border-primary/50  transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="size-5 rounded-full border-2 border-text-secondary/30 bg-white shadow-inner"></div>
                <div>
                  <h4 className="text-[15px] font-black text-text-primary">
                    ₹25,000
                  </h4>
                  <p className="text-[11px] text-text-secondary font-bold mt-0.5">
                    ₹2,300/mo for 12 months
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border bg-white p-4 flex items-center justify-between cursor-pointer hover:border-primary/50  transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="size-5 rounded-full border-2 border-text-secondary/30 bg-white shadow-inner"></div>
                <div>
                  <h4 className="text-[15px] font-black text-text-primary">
                    Custom Amount
                  </h4>
                  <p className="text-[11px] text-text-secondary font-bold mt-0.5">
                    Choose up to ₹1.5L
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary">
                chevron_right
              </span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white backdrop-blur-[30px] border-t pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex flex-col z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5A623] to-[#F5A623] py-3.5 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all">
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default RentAdvance;
