import React from "react";
import { cn } from "../../lib/cn";

type PageLayoutProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  withDockInset?: boolean;
};

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  contentClassName,
  withDockInset = false,
}) => (
  <section className={cn("app-shell min-h-screen bg-background", className)}>
    <div
      className={cn(
        "page-content",
        withDockInset && "pb-[calc(var(--layout-safe-area-bottom)+6rem)]",
        contentClassName,
      )}
    >
      {children}
    </div>
  </section>
);

export default PageLayout;
