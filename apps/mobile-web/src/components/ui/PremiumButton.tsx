import React from "react";
import { cn } from "../../lib/cn";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "action";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = "primary",
  icon,
  children,
  className,
  ...props
}) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #F5A623, #E8920F)",
      color: "#FFFFFF",
      boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
      border: "none",
    },
    secondary: {
      background: "#FFFFFF",
      color: "#1B2B5E",
      border: "1.5px solid rgba(27,43,94,0.14)",
      boxShadow: "0 1px 4px rgba(27,43,94,0.06)",
    },
    action: {
      background: "#F8F9FA",
      color: "#1B2B5E",
      border: "1px solid rgba(27,43,94,0.09)",
      boxShadow: "0 1px 4px rgba(27,43,94,0.04)",
      flexDirection: "column",
      gap: "12px",
      borderRadius: "20px",
      padding: "24px",
    },
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 rounded-[14px] py-3.5 px-5 font-bold text-base transition-all active:scale-[0.97]",
        className,
      )}
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        ...styles[variant],
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
