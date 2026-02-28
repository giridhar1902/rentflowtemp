import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type InvitationRecord, type LeaseRecord } from "../../lib/api";

const TenantHome: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    InvitationRecord[]
  >([]);
  const [acceptingCode, setAcceptingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeases = async () => {
      if (!session) {
        return;
      }
      setError(null);
      try {
        const [leaseData, invitationData] = await Promise.all([
          api.listLeases(session.access_token),
          api.listMyInvitations(session.access_token),
        ]);
        setLeases(leaseData);
        setPendingInvitations(invitationData);
      } catch (leaseError) {
        setError(
          leaseError instanceof Error
            ? leaseError.message
            : "Unable to load tenant lease data",
        );
      }
    };

    void loadLeases();
  }, [session]);

  const handleAcceptInvitation = async (code: string) => {
    if (!session) {
      return;
    }

    setAcceptingCode(code);
    setError(null);
    try {
      await api.acceptInvitation(session.access_token, code);
      const [leaseData, invitationData] = await Promise.all([
        api.listLeases(session.access_token),
        api.listMyInvitations(session.access_token),
      ]);
      setLeases(leaseData);
      setPendingInvitations(invitationData);
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept invitation",
      );
    } finally {
      setAcceptingCode(null);
    }
  };

  const activeLease = useMemo(
    () =>
      leases.find((lease) => lease.status === "ACTIVE") ?? leases[0] ?? null,
    [leases],
  );
  const activePropertyId =
    activeLease?.property?.id ?? activeLease?.propertyId ?? null;

  return (
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface font-semibold text-text-primary">
              {(
                profile?.firstName?.[0] ??
                profile?.email?.[0] ??
                "T"
              ).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Welcome home,
              </p>
              <h1 className="text-base font-semibold text-text-primary">
                {profile?.firstName ?? profile?.email ?? "Tenant"}
              </h1>
            </div>
          </div>
          <Badge tone="neutral">Tenant</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {error && (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        )}

        <InstitutionCard accentSpine elevation="raised">
          <KpiValue
            label="Next Rent Due"
            value={
              <span className="font-numeric">
                {formatINRWhole(activeLease?.monthlyRent)}
              </span>
            }
            meta={`Due day: ${activeLease?.dueDay ?? 1} of each month`}
          />
        </InstitutionCard>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            onClick={() => navigate("/tenant/pay")}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                payments
              </span>
            }
          >
            Pay Rent
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => navigate("/tenant/request")}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                construction
              </span>
            }
          >
            Request
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/register/invite")}
        >
          Have an invite code? Add it here
        </Button>

        <section className="section-stack">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Active Lease
          </h2>

          {!activeLease ? (
            <InstitutionCard>
              <p className="text-sm text-text-secondary">
                You do not have an active lease yet. Ask your landlord for an
                invite code.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/register/invite")}
                >
                  Enter Invite Code
                </Button>
              </div>
            </InstitutionCard>
          ) : (
            <InstitutionCard>
              <button
                type="button"
                onClick={() =>
                  activePropertyId &&
                  navigate(`/tenant/property/${activePropertyId}`)
                }
                disabled={!activePropertyId}
                className="text-left text-sm font-semibold text-text-primary disabled:cursor-default"
              >
                {activeLease.property?.name}
              </button>

              <p className="mt-1 text-sm text-text-secondary">
                {activeLease.property?.addressLine1},{" "}
                {activeLease.property?.city}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Start Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {new Date(activeLease.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    End Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {new Date(activeLease.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </InstitutionCard>
          )}
        </section>

        {pendingInvitations.length > 0 && (
          <section className="section-stack">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Pending Invitations
            </h2>

            {pendingInvitations.map((invitation) => (
              <InstitutionCard key={invitation.id} accentSpine>
                <p className="text-sm font-semibold text-text-primary">
                  {invitation.property?.name ?? "Property Invitation"}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {invitation.unit?.name ?? "Unit"} • Expires{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-numeric text-xs font-semibold tracking-[0.08em] text-primary">
                    {invitation.code}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    loading={acceptingCode === invitation.code}
                    onClick={() => void handleAcceptInvitation(invitation.code)}
                  >
                    Accept
                  </Button>
                </div>
              </InstitutionCard>
            ))}
          </section>
        )}
      </main>

      <BottomNav role="tenant" />
    </PageLayout>
  );
};

export default TenantHome;
