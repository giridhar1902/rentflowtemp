import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type PropertyRecord } from "../../lib/api";

const TenantPropertyDetails: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { session } = useAuth();

  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperty = async () => {
      if (!session || !propertyId) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [propertyRecord, propertyDocs] = await Promise.all([
          api.getProperty(session.access_token, propertyId),
          api.listDocuments(session.access_token, {
            propertyId,
            type: "OTHER",
            limit: 20,
          }),
        ]);

        setProperty(propertyRecord);

        const imageDocs = propertyDocs.filter((doc) =>
          doc.mimeType.toLowerCase().startsWith("image/"),
        );
        const urls = await Promise.all(
          imageDocs.slice(0, 5).map(async (imageDoc) => {
            try {
              const signed = await api.getDocumentDownloadUrl(
                session.access_token,
                imageDoc.id,
              );
              return signed.downloadUrl;
            } catch {
              return null;
            }
          }),
        );
        setImageUrls(urls.filter((url): url is string => Boolean(url)));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load property details",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProperty();
  }, [propertyId, session]);

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
          <span className="w-16" aria-hidden />
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">Loading property...</p>
          </InstitutionCard>
        ) : error ? (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        ) : !property ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">Property not found.</p>
          </InstitutionCard>
        ) : (
          <>
            <InstitutionCard accentSpine elevation="raised" className="p-0">
              {imageUrls.length > 0 ? (
                <img
                  src={imageUrls[0]}
                  alt={`${property.name} cover`}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 w-full items-center justify-center bg-surface-subtle">
                  <span className="material-symbols-outlined text-5xl text-text-secondary/70">
                    apartment
                  </span>
                </div>
              )}

              <div className="section-stack p-[var(--space-card-padding)]">
                <h2 className="text-xl font-semibold text-text-primary">
                  {property.name}
                </h2>
                <p className="text-sm text-text-secondary">
                  {property.addressLine1}, {property.city}, {property.state}{" "}
                  {property.postalCode}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">{property.propertyType}</Badge>
                  <Badge tone="neutral">{property.ownership}</Badge>
                </div>
              </div>
            </InstitutionCard>

            <InstitutionCard>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Property Overview
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p className="text-text-secondary">
                  Floors:{" "}
                  <span className="font-medium text-text-primary">
                    {property.floors ?? "-"}
                  </span>
                </p>
                <p className="text-text-secondary">
                  Units:{" "}
                  <span className="font-medium text-text-primary">
                    {property.totalUnits ?? property.units.length}
                  </span>
                </p>
                <p className="text-text-secondary">
                  Bedrooms:{" "}
                  <span className="font-medium text-text-primary">
                    {property.units[0]?.bedrooms ?? 0}
                  </span>
                </p>
                <p className="text-text-secondary">
                  Bathrooms:{" "}
                  <span className="font-medium text-text-primary">
                    {property.units[0]?.bathrooms ?? 0}
                  </span>
                </p>
                <p className="col-span-2 text-text-secondary">
                  Monthly Rent:{" "}
                  <span className="font-numeric font-semibold text-primary">
                    {formatINRWhole(property.units[0]?.monthlyRent)}
                  </span>
                </p>
              </div>
            </InstitutionCard>

            <InstitutionCard>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Amenities & Features
              </h3>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} tone="neutral">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  No amenities shared yet.
                </p>
              )}
            </InstitutionCard>

            {imageUrls.length > 1 && (
              <InstitutionCard>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Photos
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {imageUrls.slice(1).map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${property.name} photo`}
                      className="h-28 w-full rounded-[var(--radius-control)] border border-border-subtle object-cover"
                    />
                  ))}
                </div>
              </InstitutionCard>
            )}
          </>
        )}
      </main>

      <BottomNav role="tenant" />
    </PageLayout>
  );
};

export default TenantPropertyDetails;
