import React from "react";
import { cn } from "../../lib/cn";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "glass" | "gradient" | "solid";
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  variant = "glass",
  className,
  ...props
}) => {
  let variantClass = "";
  if (variant === "glass") {
    variantClass =
      "bg-white/[0.35] backdrop-blur-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-white/40";
  } else if (variant === "gradient") {
    variantClass =
      "bg-gradient-to-br from-[#D9F0FE] to-[#E3FDFD] overflow-hidden border-white/40";
  } else if (variant === "solid") {
    variantClass = "bg-white/80 border-white/40 shadow-sm";
  }

  return (
    <div
      className={cn("rounded-[24px] p-6 border", variantClass, className)}
      {...props}
    >
      {children}
    </div>
  );
};
