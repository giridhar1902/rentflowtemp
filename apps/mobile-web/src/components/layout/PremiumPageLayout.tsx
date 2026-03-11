import React from "react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../BottomNav";

interface PremiumPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  greeting?: string;
  showNav?: boolean;
  className?: string;
}

export const PremiumPageLayout: React.FC<PremiumPageLayoutProps> = ({
  children,
  title,
  greeting = "NAMASTE,",
  showNav = true,
  className,
}) => {
  const { profile } = useAuth();
  const userName = title ?? profile?.firstName ?? profile?.email ?? "User";

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-[#EFE9FC] via-[#DFE9F9] to-[#D5EDFB] pb-24 font-sans text-slate-800",
        className,
      )}
    >
      <header className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
            {/* Avatar Placeholder */}
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-0.5">
              {greeting}
            </p>
            <h1 className="text-xl font-bold text-[#1F2937] leading-none line-clamp-1 break-all">
              {userName}
            </h1>
          </div>
        </div>
        <button className="relative flex size-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-700 hover:bg-slate-50 transition-colors shrink-0">
          <span className="material-symbols-outlined text-xl">
            notifications
          </span>
          <span className="absolute right-3 top-2.5 size-2 rounded-full bg-red-500 border border-white"></span>
        </button>
      </header>

      <main className="px-6 space-y-7">{children}</main>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav
            role={
              (profile?.role?.toLowerCase() as "landlord" | "tenant") ??
              "tenant"
            }
          />
        </div>
      )}
    </div>
  );
};
