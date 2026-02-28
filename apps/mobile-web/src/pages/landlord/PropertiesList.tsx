import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type PropertyRecord } from "../../lib/api";

const parseAmount = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const toStatusLabel = (property: PropertyRecord) => {
  const occupied = property.leases?.some((lease) => lease.status === "ACTIVE");
  return occupied ? "Occupied" : "Vacant";
};

const filterOptions = ["All", "Occupied", "Vacant"] as const;
type PropertyFilter = (typeof filterOptions)[number];

const PropertiesList: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [propertyImageUrls, setPropertyImageUrls] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PropertyFilter>("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!session) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await api.listProperties(session.access_token);
        setProperties(data);

        const imageEntries = await Promise.all(
          data.map(async (property) => {
            try {
              const docs = await api.listDocuments(session.access_token, {
                propertyId: property.id,
                type: "OTHER",
                limit: 20,
              });
              const firstImage = docs.find((doc) =>
                doc.mimeType.toLowerCase().startsWith("image/"),
              );
              if (!firstImage) {
                return [property.id, ""] as const;
              }
              const signed = await api.getDocumentDownloadUrl(
                session.access_token,
                firstImage.id,
              );
              return [property.id, signed.downloadUrl] as const;
            } catch {
              return [property.id, ""] as const;
            }
          }),
        );

        setPropertyImageUrls(
          Object.fromEntries(
            imageEntries.filter((entry) => Boolean(entry[1])),
          ) as Record<string, string>,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load properties",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProperties();
  }, [session]);

  const filteredProperties = useMemo(
    () =>
      properties.filter((property) => {
        if (filter === "All") {
          return true;
        }
        return toStatusLabel(property) === filter;
      }),
    [properties, filter],
  );

  return (
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-text-primary">
            Properties
          </h1>
          {!isLoading && (
            <Badge tone="neutral" className="font-numeric">
              {filteredProperties.length}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterOptions.map((status) => (
            <Button
              key={status}
              type="button"
              variant={filter === status ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter(status)}
              className="shrink-0"
            >
              {status}
            </Button>
          ))}
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        <InstitutionCard
          interactive
          className="cursor-pointer"
          onClick={() => navigate("/landlord/add-property")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/landlord/add-property");
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <KpiValue
              label="Portfolio"
              value={<span className="font-numeric">Add Property</span>}
              valueClassName="text-[1.375rem]"
              meta="Register a new income asset"
            />
            <Button
              type="button"
              size="sm"
              leadingIcon={
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
              }
            >
              New
            </Button>
          </div>
        </InstitutionCard>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">Loading properties...</p>
          </InstitutionCard>
        ) : filteredProperties.length === 0 ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">No properties found.</p>
          </InstitutionCard>
        ) : (
          filteredProperties.map((property) => {
            const unit = property.units[0];
            const rent = parseAmount(unit?.monthlyRent);
            const status = toStatusLabel(property);

            return (
              <InstitutionCard
                key={property.id}
                interactive
                className="cursor-pointer p-0"
                onClick={() => navigate(`/landlord/property/${property.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/landlord/property/${property.id}`);
                  }
                }}
              >
                <div className="flex min-h-36 gap-0 overflow-hidden rounded-[inherit]">
                  <div className="relative flex w-[34%] items-center justify-center bg-surface-subtle">
                    {propertyImageUrls[property.id] ? (
                      <img
                        src={propertyImageUrls[property.id]}
                        alt={`${property.name} cover`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-text-secondary opacity-70">
                        apartment
                      </span>
                    )}
                    <div className="absolute left-2 top-2">
                      <Badge
                        tone={status === "Occupied" ? "success" : "neutral"}
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                    <div>
                      <h2 className="line-clamp-1 text-base font-semibold text-text-primary">
                        {property.name}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-xs text-text-secondary">
                        {property.addressLine1}, {property.city}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-center gap-3 text-text-secondary">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">
                            bed
                          </span>
                          {unit?.bedrooms ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">
                            bathtub
                          </span>
                          {unit?.bathrooms ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">
                            door_front
                          </span>
                          {property.units.length}
                        </span>
                      </div>

                      <p className="font-numeric text-lg font-semibold text-primary">
                        {formatINRWhole(rent)}
                        <span className="ml-1 text-[11px] font-medium text-text-secondary">
                          /mo
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </InstitutionCard>
            );
          })
        )}
      </main>

      <BottomNav role={profile?.role === "LANDLORD" ? "landlord" : "tenant"} />
    </PageLayout>
  );
};

export default PropertiesList;
