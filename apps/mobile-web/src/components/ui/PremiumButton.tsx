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
  let variantClass = "";
  if (variant === "primary") {
    variantClass =
      "w-full bg-gradient-to-r from-[#FBA43C] to-[#F25A03] py-4 text-white shadow-[0_8px_20px_-6px_rgba(242,90,3,0.6)] hover:opacity-95";
  } else if (variant === "secondary") {
    variantClass =
      "bg-white/80 border border-slate-200 text-slate-700 py-3 shadow-sm hover:bg-white backdrop-blur-sm";
  } else if (variant === "action") {
    variantClass =
      "flex-col gap-3 rounded-[2rem] bg-[#F8F9FE]/80 p-6 shadow-sm border border-white/60 hover:bg-white backdrop-blur-sm text-sm text-[#374151]";
  }

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 rounded-full font-bold text-base transition-opacity",
        variantClass,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
