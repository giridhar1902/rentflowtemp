import React from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  ThemeModeToggle,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const toUiRole = (role?: string) =>
  role === "LANDLORD" ? "landlord" : "tenant";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    profile?.email ||
    "User";
  const roleLabel = profile?.role ?? "TENANT";

  return (
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
        <h1 className="text-center text-base font-semibold text-text-primary">
          Profile & Settings
        </h1>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        <InstitutionCard accentSpine elevation="raised">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface-subtle text-2xl font-semibold text-text-primary">
              {(
                profile?.firstName?.[0] ??
                profile?.email?.[0] ??
                "U"
              ).toUpperCase()}
            </div>

            <div className="text-center">
              <p className="text-xl font-semibold text-text-primary">
                {fullName}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge tone="accent">{roleLabel}</Badge>
                <span className="text-sm text-text-secondary">
                  {profile?.email ?? ""}
                </span>
              </div>
            </div>
          </div>
        </InstitutionCard>

        <section className="section-stack">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Account
          </h2>

          <InstitutionCard interactive className="cursor-pointer p-0">
            <button
              type="button"
              onClick={() => navigate("/profile/account")}
              className="flex w-full items-center gap-3 border-b border-border-subtle px-4 py-4 text-left"
            >
              <div className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-surface-subtle text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  person
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Account Information
                </p>
                <p className="text-xs text-text-secondary">
                  Personal details, profile, contact data
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary">
                chevron_right
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile/payments")}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <div className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-surface-subtle text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  payments
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Payment Methods
                </p>
                <p className="text-xs text-text-secondary">
                  Payment setup and history views
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary">
                chevron_right
              </span>
            </button>
          </InstitutionCard>
        </section>

        <section className="section-stack">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Appearance
          </h2>

          <InstitutionCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Theme Mode
                </p>
                <p className="text-xs text-text-secondary">
                  Choose system, light, or dark mode.
                </p>
              </div>
              <ThemeModeToggle />
            </div>
          </InstitutionCard>
        </section>

        <Button
          type="button"
          variant="danger"
          className="w-full"
          size="lg"
          leadingIcon={
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
          }
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
        >
          Logout
        </Button>
      </main>

      <BottomNav role={toUiRole(profile?.role)} />
    </PageLayout>
  );
};

export default Profile;
