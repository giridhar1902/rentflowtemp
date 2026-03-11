import React from "react";
import { useNavigate } from "react-router-dom";

const DepositEmi: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 border border-white/50 text-text-secondary hover:text-primary hover:bg-white/80 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>

          <h1 className="text-[17px] font-black tracking-tight text-text-primary uppercase tracking-widest">
            Security Deposit EMI
          </h1>

          <div className="w-9" />
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        <div className="relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-[20px] shadow-sm border border-white/50 p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-[32px] text-primary">
              account_balance
            </span>
          </div>
          <h2 className="text-[24px] font-black text-text-primary mb-2 tracking-tight">
            Move in cash-free
          </h2>
          <p className="text-[13px] font-bold text-text-secondary leading-relaxed max-w-[250px] mx-auto mb-6">
            Convert your heavy security deposit into easy monthly installments.
            Keep your savings intact.
          </p>

          <div className="bg-white/50 rounded-[20px] p-4 text-left border border-white/50 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                  Deposit Required
                </p>
                <p className="text-[24px] font-black text-text-primary">
                  ₹1,20,000
                </p>
              </div>
              <span className="material-symbols-outlined text-[32px] text-text-secondary opacity-50">
                lock
              </span>
            </div>

            <div className="w-full bg-white/60 rounded-[16px] p-3 border border-white/50 mt-2 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-text-primary">
                  Pay upfront:
                </span>
                <span className="text-[12px] font-bold text-text-secondary line-through opacity-80">
                  ₹1,20,000
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-primary">
                  Pay with EMI:
                </span>
                <span className="text-[16px] font-black text-primary">
                  ₹10,500 / mo
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[24px] bg-white/40 backdrop-blur-[20px] shadow-sm p-6 border border-white/50">
          <h3 className="mb-5 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
            How it works
          </h3>
          <div className="flex flex-col gap-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/60">
            <div className="flex gap-4 relative">
              <div className="size-8 rounded-full bg-gradient-to-br from-[#FF9A3D] to-[#FF7A00] text-white flex items-center justify-center font-bold font-numeric z-10 shrink-0 shadow-[0_4px_10px_rgba(255,122,0,0.3)]">
                1
              </div>
              <div>
                <h4 className="text-[14px] font-black text-text-primary mb-1">
                  Apply in 2 minutes
                </h4>
                <p className="text-[12px] text-text-secondary font-bold">
                  Complete KYC and get instant approval based on your profile.
                </p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="size-8 rounded-full bg-white/60 border-2 border-primary text-primary flex items-center justify-center font-bold font-numeric z-10 shrink-0 shadow-sm">
                2
              </div>
              <div>
                <h4 className="text-[14px] font-black text-text-primary mb-1">
                  We pay the landlord
                </h4>
                <p className="text-[12px] text-text-secondary font-bold">
                  The full deposit amount is transferred directly to your
                  landlord.
                </p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="size-8 rounded-full bg-white/40 border-2 border-text-secondary/30 text-text-secondary/60 flex items-center justify-center font-bold font-numeric z-10 shrink-0 shadow-inner">
                3
              </div>
              <div>
                <h4 className="text-[14px] font-black text-text-primary mb-1">
                  Repay easily
                </h4>
                <p className="text-[12px] text-text-secondary font-bold">
                  Pay us back in easy EMIs along with your monthly rent.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/40 backdrop-blur-[30px] border-t border-white/40 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex flex-col z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(255,122,0,0.3)] hover:opacity-90 active:scale-[0.98] transition-all">
          Check Eligibility
        </button>
      </div>
    </div>
  );
};

export default DepositEmi;
