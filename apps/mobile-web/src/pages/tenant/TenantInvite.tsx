import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PremiumPageLayout } from "../../components/layout/PremiumPageLayout";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { PremiumButton } from "../../components/ui/PremiumButton";
import { TextField } from "../../components/ui";
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
    <PremiumPageLayout title="Join Property" greeting="INVITE" showNav={false}>
      <div className="flex items-center gap-3 mb-6">
        <PremiumButton
          variant="secondary"
          onClick={() => navigate(-1)}
          className="!p-3 !rounded-full !size-12 shadow-sm bg-white  transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] translate-x-1 text-text-secondary group-hover:text-primary">
            arrow_back_ios
          </span>
        </PremiumButton>
      </div>

      <PremiumCard
        variant="glass"
        className="flex flex-col gap-6 relative overflow-hidden bg-white shadow-sm border"
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 size-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="mx-auto flex size-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#F5A623] to-[#F5A623] text-white shadow-[0_8px_30px_rgba(245,166,35,0.3)] ring-4 ring-white/50">
          <span className="material-symbols-outlined text-[40px]">
            domain_add
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-text-primary">
            Welcome Home
          </h2>
          <p className="mt-2 text-[13px] font-bold text-text-secondary max-w-[240px] mx-auto">
            Enter the unique invite code your landlord shared with you.
          </p>
          <div className="mt-4 py-2 px-4 rounded-[16px] bg-white inline-block border shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Signed in as{" "}
              <span className="text-primary font-black">
                {profile?.email ?? "tenant account"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-2 text-center flex flex-col items-center">
          <TextField
            label=""
            value={code}
            placeholder="A7C9D2"
            className="!font-numeric h-16 text-center text-3xl font-black tracking-[0.3em] uppercase bg-white border-2 focus:border-primary focus:ring-1 focus:ring-primary text-text-primary rounded-[20px] shadow-sm w-full transition-all "
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </div>

        {error && (
          <p className="text-[13px] font-bold text-danger bg-danger/10 p-3 rounded-[16px] border border-danger/20 text-center">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[13px] font-bold text-success bg-success/10 p-3 rounded-[16px] border border-success/20 text-center drop-shadow-sm">
            {success}
          </p>
        )}

        <PremiumButton
          disabled={code.trim().length < 4 || isSubmitting}
          onClick={() => void handleComplete()}
          className="mt-2 bg-gradient-to-r from-[#F5A623] to-[#F5A623] text-white shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {isSubmitting ? "Validating..." : "Accept Invite"}
        </PremiumButton>
      </PremiumCard>
    </PremiumPageLayout>
  );
};

export default TenantInvite;
