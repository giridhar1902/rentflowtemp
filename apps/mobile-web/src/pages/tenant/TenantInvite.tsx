import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import { Button, InstitutionCard, TextField } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const pendingInviteCodeKey = "pending-tenant-invite-code";

const TenantInvite: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, profile, refreshProfile } = useAuth();
  const initialCodeFromStorage = (() => {
    try {
      return window.sessionStorage.getItem(pendingInviteCodeKey) ?? "";
    } catch {
      return "";
    }
  })();
  const [code, setCode] = useState(
    (searchParams.get("code") ?? initialCodeFromStorage).toUpperCase().trim(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!session) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const accepted = await api.acceptInvitation(
        session.access_token,
        code.toUpperCase().trim(),
      );
      try {
        window.sessionStorage.removeItem(pendingInviteCodeKey);
      } catch {
        // no-op
      }
      await refreshProfile();
      setSuccess(
        `Invite accepted for ${accepted.property?.name ?? "your property"}.`,
      );
      setTimeout(() => navigate("/tenant/home"), 700);
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept invite code",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      className="min-h-screen"
      contentClassName="mx-auto flex w-full max-w-lg flex-col gap-5 !px-4 !py-6"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="motion-press flex size-10 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface text-text-secondary shadow-base"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back_ios
          </span>
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          Join Property
        </h1>
        <span className="size-10" aria-hidden />
      </div>

      <InstitutionCard accentSpine elevation="raised" className="section-stack">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[var(--radius-control)] bg-surface-subtle text-primary">
          <span className="material-symbols-outlined text-3xl">domain_add</span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Welcome Home
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Enter the invite code your landlord shared.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Signed in as {profile?.email ?? "tenant account"}
          </p>
        </div>

        <TextField
          label="Invite Code"
          value={code}
          placeholder="A7C9D2"
          className="font-numeric h-14 text-center text-lg tracking-[0.28em] uppercase"
          onChange={(event) => setCode(event.target.value.toUpperCase())}
        />

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        {success && (
          <p className="text-sm font-medium text-success">{success}</p>
        )}

        <Button
          type="button"
          onClick={handleComplete}
          disabled={code.trim().length < 4}
          loading={isSubmitting}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? "Validating..." : "Accept Invite"}
        </Button>
      </InstitutionCard>
    </PageLayout>
  );
};

export default TenantInvite;
