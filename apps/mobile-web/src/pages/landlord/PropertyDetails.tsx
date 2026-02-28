import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import {
  api,
  type InvitationRecord,
  type LeaseRecord,
  type PropertyRecord,
} from "../../lib/api";

const parseAmount = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const PropertyDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session || !id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [propertyData, invitationData, propertyDocs] = await Promise.all([
        api.getProperty(session.access_token, id),
        api.listInvitations(session.access_token, id),
        api.listDocuments(session.access_token, {
          propertyId: id,
          type: "OTHER",
          limit: 20,
        }),
      ]);

      setProperty(propertyData);
      setInvitations(invitationData);

      const firstImage = propertyDocs.find((doc) =>
        doc.mimeType.toLowerCase().startsWith("image/"),
      );
      if (firstImage) {
        const signed = await api.getDocumentDownloadUrl(
          session.access_token,
          firstImage.id,
        );
        setCoverImageUrl(signed.downloadUrl);
      } else {
        setCoverImageUrl(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load property",
      );
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    if (!property) {
      return { units: 0, occupied: 0, revenue: 0 };
    }

    const occupiedUnitIds = new Set(
      (property.leases ?? [])
        .filter((lease) => lease.status === "ACTIVE")
        .map((lease) => lease.unitId),
    );

    const revenue = property.units.reduce(
      (sum, unit) => sum + parseAmount(unit.monthlyRent),
      0,
    );

    return {
      units: property.units.length,
      occupied: occupiedUnitIds.size,
      revenue,
    };
  }, [property]);

  const handleInvite = async (unitId: string) => {
    if (!session || !property) {
      return;
    }

    const email = window.prompt("Enter tenant email address");
    if (!email) {
      return;
    }

    try {
      await api.createInvitation(session.access_token, property.id, {
        inviteeEmail: email.trim().toLowerCase(),
        unitId,
      });
      await fetchData();
    } catch (inviteError) {
      alert(
        inviteError instanceof Error
          ? inviteError.message
          : "Failed to generate invite",
      );
    }
  };

  const unitLeaseMap = useMemo(() => {
    const map = new Map<string, LeaseRecord>();
    for (const lease of property?.leases ?? []) {
      if (lease.status === "ACTIVE") {
        map.set(lease.unitId, lease);
      }
    }
    return map;
  }, [property?.leases]);

  return (
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                arrow_back_ios_new
              </span>
            }
          >
            Back
          </Button>
          <h1 className="text-base font-semibold text-text-primary">
            Property Details
          </h1>
          <Badge tone="neutral">Asset</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {loading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">Loading property...</p>
          </InstitutionCard>
        ) : error || !property ? (
          <InstitutionCard>
            <p className="text-sm font-medium text-danger">
              {error ?? "Property not found"}
            </p>
          </InstitutionCard>
        ) : (
          <>
            <InstitutionCard accentSpine elevation="raised">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={`${property.name} cover`}
                  className="mb-4 h-52 w-full rounded-[var(--radius-control)] object-cover"
                />
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {property.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {property.addressLine1}, {property.city}, {property.state}{" "}
                    {property.postalCode}
                  </p>
                </div>
                <Badge tone="neutral">{property.propertyType}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="accent">{property.status}</Badge>
                <Badge tone="neutral">Floors: {property.floors ?? "-"}</Badge>
                <Badge tone="neutral">
                  Units: {property.totalUnits ?? property.units.length}
                </Badge>
              </div>

              {property.amenities && property.amenities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} tone="neutral">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </InstitutionCard>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InstitutionCard>
                <KpiValue
                  label="Units"
                  value={<span className="font-numeric">{stats.units}</span>}
                  valueClassName="text-[1.5rem]"
                />
              </InstitutionCard>
              <InstitutionCard>
                <KpiValue
                  label="Occupied"
                  value={<span className="font-numeric">{stats.occupied}</span>}
                  valueClassName="text-[1.5rem]"
                />
              </InstitutionCard>
              <InstitutionCard>
                <KpiValue
                  label="Rent Roll"
                  value={
                    <span className="font-numeric">
                      {formatINRWhole(stats.revenue)}
                    </span>
                  }
                  valueClassName="text-[1.5rem]"
                />
              </InstitutionCard>
            </section>

            <section className="section-stack">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Units & Lease Status
              </h3>

              {property.units.map((unit) => {
                const activeLease = unitLeaseMap.get(unit.id);
                const tenantName = activeLease?.tenant
                  ? `${activeLease.tenant.firstName ?? ""} ${activeLease.tenant.lastName ?? ""}`.trim() ||
                    activeLease.tenant.email
                  : null;

                return (
                  <InstitutionCard key={unit.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {unit.name}
                        </p>
                        <p className="mt-1 font-numeric text-sm text-text-secondary">
                          {formatINRWhole(unit.monthlyRent)}/mo
                        </p>
                      </div>
                      <Badge tone={activeLease ? "success" : "neutral"}>
                        {activeLease ? "Occupied" : "Vacant"}
                      </Badge>
                    </div>

                    {activeLease ? (
                      <p className="mt-2 text-sm text-text-secondary">
                        Tenant:{" "}
                        <span className="font-medium text-text-primary">
                          {tenantName}
                        </span>
                      </p>
                    ) : (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => void handleInvite(unit.id)}
                          leadingIcon={
                            <span className="material-symbols-outlined text-[18px]">
                              mail
                            </span>
                          }
                        >
                          Invite Tenant
                        </Button>
                      </div>
                    )}
                  </InstitutionCard>
                );
              })}
            </section>

            <section className="section-stack">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Active Invite Codes
              </h3>

              {invitations.length === 0 ? (
                <InstitutionCard>
                  <p className="text-sm text-text-secondary">
                    No invitations generated yet.
                  </p>
                </InstitutionCard>
              ) : (
                invitations.map((invite) => (
                  <InstitutionCard key={invite.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {invite.inviteeEmail}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Status: {invite.status} • Expires:{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            invite.inviteeRegistered
                              ? "text-success"
                              : "text-warning"
                          }`}
                        >
                          {invite.inviteeRegistered
                            ? "Tenant account found (in-app invite sent)"
                            : "No tenant account found yet (share invite code manually)"}
                        </p>
                      </div>
                      <p className="font-numeric text-base font-semibold tracking-[0.08em] text-primary">
                        {invite.code}
                      </p>
                    </div>
                  </InstitutionCard>
                ))
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav role="landlord" />
    </PageLayout>
  );
};

export default PropertyDetails;
