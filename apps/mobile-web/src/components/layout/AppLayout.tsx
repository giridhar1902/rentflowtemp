import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import FloatingDock from "../FloatingDock";
import { useAuth } from "../../context/AuthContext";

// ── Domvio Logo (inline SVG, reusable) ──────────────────────────────────────
export const DomvioIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden>
    <path
      d="M10 4 H28 C42 4 52 14 52 28 C52 42 42 52 28 52 H10 Z"
      fill="#1B2B5E"
    />
    <rect
      x="10"
      y="4"
      width="6"
      height="48"
      rx="3"
      fill="#F5A623"
      opacity="0.9"
    />
    <circle cx="32" cy="24" r="7" fill="#F5A623" />
    <path d="M28.5 30 L28.5 39 Q32 42 35.5 39 L35.5 30 Z" fill="#F5A623" />
    <circle cx="32" cy="24" r="3.5" fill="#1B2B5E" />
  </svg>
);

export const DomvioLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const conf = {
    sm: { icon: 20, text: "15px", gap: "8px" },
    md: { icon: 28, text: "20px", gap: "10px" },
    lg: { icon: 40, text: "28px", gap: "14px" },
  }[size];
  return (
    <div className="flex items-center" style={{ gap: conf.gap }}>
      <DomvioIcon size={conf.icon} />
      <span
        style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: conf.text,
          letterSpacing: "-0.01em",
          color: "#1B2B5E",
          lineHeight: 1,
        }}
      >
        dom<span style={{ color: "#F5A623" }}>vio</span>
      </span>
    </div>
  );
};

// ── AppLayout ─────────────────────────────────────────────────────────────────
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
  showLogo?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  rightAction,
  showBackButton = false,
  bottomNavRole,
  className,
  headerTransparent = false,
  fixedHeight = false,
  showLogo = false,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const role =
    bottomNavRole ||
    (profile?.role?.toLowerCase() as "landlord" | "tenant" | "admin") ||
    null;

  const showHeader =
    title || showBackButton || rightAction !== undefined || showLogo;

  return (
    <div
      className={cn(
        "flex flex-col",
        fixedHeight ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]",
      )}
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: "#1B2B5E",
        background: "var(--color-background)",
        paddingTop: "var(--layout-safe-area-top)",
        paddingBottom: "var(--layout-safe-area-bottom)",
        paddingLeft: "var(--layout-safe-area-left)",
        paddingRight: "var(--layout-safe-area-right)",
      }}
    >
      {/* ── Header ── */}
      {showHeader && (
        <header
          className={cn(
            "sticky top-[var(--layout-safe-area-top)] z-40 transition-colors",
            headerTransparent
              ? "bg-transparent"
              : "bg-white border-b shadow-sm",
          )}
          style={{ borderColor: "rgba(27,43,94,0.08)" }}
        >
          <div className="flex items-center justify-between px-4 min-h-[60px]">
            {/* Left: back + title/logo */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="size-9 flex items-center justify-center rounded-full border transition-colors shrink-0"
                  style={{
                    borderColor: "rgba(27,43,94,0.12)",
                    background: "#F8F9FA",
                    color: "#1B2B5E",
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                </button>
              )}

              {showLogo && !title && <DomvioLogo size="md" />}

              {(title || subtitle) && (
                <div className="flex flex-col justify-center min-w-0">
                  {subtitle && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-0"
                      style={{ color: "#F5A623" }}
                    >
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h1
                      className="text-[18px] font-bold tracking-tight truncate leading-tight"
                      style={{ color: "#1B2B5E" }}
                    >
                      {title}
                    </h1>
                  )}
                </div>
              )}
            </div>

            {/* Right: custom action or default notification + avatar */}
            <div className="flex items-center gap-2 shrink-0">
              {rightAction !== undefined ? (
                rightAction
              ) : (
                <>
                  <button
                    onClick={() => navigate("/activity")}
                    className="relative size-9 flex items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: "rgba(27,43,94,0.12)",
                      background: "#F8F9FA",
                      color: "#1B2B5E",
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      notifications
                    </span>
                    <span
                      className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-white"
                      style={{ background: "#DC2626" }}
                    />
                  </button>

                  <button
                    onClick={() => navigate("/profile")}
                    className="size-9 rounded-full flex items-center justify-center overflow-hidden border-2 transition-transform hover:scale-105"
                    style={{ borderColor: "#F5A623" }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.email || "user"}&backgroundColor=EEF1F8`}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Main Content ── */}
      <main className={cn("flex-1", className, role ? "pb-[120px]" : "")}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      {role && <FloatingDock role={role as "landlord" | "tenant"} />}
    </div>
  );
};
