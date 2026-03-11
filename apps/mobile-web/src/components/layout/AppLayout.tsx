import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import FloatingDock from "../FloatingDock";
import { useAuth } from "../../context/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  bottomNavRole?: "landlord" | "tenant" | "admin" | null;
  className?: string;
  showFab?: boolean;
  headerTransparent?: boolean;
  fixedHeight?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  rightAction,
  showBackButton = false,
  bottomNavRole,
  className,
  showFab,
  headerTransparent = false,
  fixedHeight = false,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const role =
    bottomNavRole ||
    (profile?.role?.toLowerCase() as "landlord" | "tenant" | "admin") ||
    null;

  return (
    <div
      className={cn(
        "flex flex-col text-[#1e293b] font-sans selection:bg-[#FF9A3D]/30",
        fixedHeight ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]",
      )}
      style={{
        paddingTop: "var(--layout-safe-area-top)",
        paddingBottom: "var(--layout-safe-area-bottom)",
        paddingLeft: "var(--layout-safe-area-left)",
        paddingRight: "var(--layout-safe-area-right)",
      }}
    >
      {/* Header */}
      {(title || showBackButton || rightAction !== undefined) && (
        <header
          className={cn(
            "sticky top-[var(--layout-safe-area-top)] z-40 transition-colors",
            headerTransparent
              ? "bg-transparent"
              : "bg-white/40 backdrop-blur-[20px] border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 min-h-[64px]">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="size-9 flex items-center justify-center rounded-full bg-white/60 text-slate-700 shadow-sm border border-white/50 hover:bg-white transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                </button>
              )}
              {(title || subtitle) && (
                <div className="flex flex-col justify-center min-w-0">
                  {subtitle && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] mb-0">
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h1 className="text-[18px] font-black text-[#1e293b] tracking-tight truncate leading-tight">
                      {title}
                    </h1>
                  )}
                </div>
              )}
            </div>

            {/* Right: custom action OR notification + avatar */}
            <div className="flex items-center gap-2 shrink-0">
              {rightAction !== undefined ? (
                rightAction
              ) : (
                <>
                  {/* Notification bell */}
                  <button
                    onClick={() => navigate("/activity")}
                    className="relative size-9 flex items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-sm hover:bg-white/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-600">
                      notifications
                    </span>
                    {/* Unread dot */}
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#EF4444] border border-white" />
                  </button>

                  {/* Profile avatar */}
                  <button
                    onClick={() => navigate("/profile")}
                    className="size-9 rounded-full bg-white/60 border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.05)] flex items-center justify-center p-0.5 overflow-hidden hover:scale-105 transition-transform"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.email || "user"}&backgroundColor=f8fafc`}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full mix-blend-multiply opacity-90"
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn("flex-1", className, role ? "pb-[120px]" : "")}>
        {children}
      </main>

      {/* Bottom Nav */}
      {role && <FloatingDock role={role as "landlord" | "tenant"} />}
    </div>
  );
};
