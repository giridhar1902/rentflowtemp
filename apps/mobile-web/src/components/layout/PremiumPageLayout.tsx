import React from "react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../context/AuthContext";
import { DomvioLogo } from "./AppLayout";

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
      className={cn("min-h-screen pb-24", className)}
      style={{
        background: "#EEF1F8",
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <header
        className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid rgba(27,43,94,0.08)",
          boxShadow: "0 1px 8px rgba(27,43,94,0.05)",
        }}
      >
        <DomvioLogo size="md" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#F5A623" }}
            >
              {greeting}
            </p>
            <h1
              className="text-sm font-bold leading-none"
              style={{ color: "#1B2B5E" }}
            >
              {userName}
            </h1>
          </div>
          <div
            className="size-10 rounded-full overflow-hidden border-2 shrink-0"
            style={{ borderColor: "#F5A623" }}
          >
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.email || "user"}&backgroundColor=EEF1F8`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="px-5 py-5 space-y-5">{children}</main>
    </div>
  );
};
