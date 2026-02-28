import React from "react";
import { cn } from "../../lib/cn";

type AppLayoutProps = {
  children: React.ReactNode;
  className?: string;
  frameClassName?: string;
};

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  frameClassName,
}) => (
  <div
    className={cn(
      "app-shell flex min-h-screen justify-center bg-background",
      className,
    )}
  >
    <div
      className={cn(
        "app-frame relative min-h-screen w-full overflow-x-hidden",
        frameClassName,
      )}
    >
      {children}
    </div>
  </div>
);

export default AppLayout;
