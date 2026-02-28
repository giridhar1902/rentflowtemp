import React from "react";
import { PageLayout } from "../components/layout";
import { InstitutionCard } from "../components/ui";

const Splash: React.FC = () => {
  return (
    <PageLayout
      className="flex min-h-screen items-center justify-center"
      contentClassName="w-full !px-4 !py-10"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5 motion-page-enter">
        <InstitutionCard
          accentSpine
          elevation="raised"
          className="items-center text-center"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-[var(--radius-control)] bg-primary text-[var(--color-accent-contrast)] shadow-raised">
            <span className="material-symbols-outlined text-[34px]">
              domain
            </span>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              PropTech
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-text-secondary">
              Asset Management Infrastructure
            </p>
          </div>
        </InstitutionCard>

        <InstitutionCard className="!p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">
              Initializing secure session...
            </p>
            <p className="font-numeric text-xs font-semibold text-primary">
              100%
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-surface-subtle">
            <div className="h-full w-full rounded-[var(--radius-pill)] bg-primary" />
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-text-secondary">
            Bank-level encryption
          </p>
        </InstitutionCard>
      </div>
    </PageLayout>
  );
};

export default Splash;
