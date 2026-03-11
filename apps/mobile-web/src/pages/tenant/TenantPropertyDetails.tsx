import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatINRWhole } from "../../lib/currency";
import { api, type PropertyRecord } from "../../lib/api";
import { AppLayout } from "../../components/layout/AppLayout";

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
    <AppLayout
      title="Property Details"
      showBackButton
      bottomNavRole="tenant"
      className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter"
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="size-8 rounded-full border-2 border-white/50 border-t-primary animate-spin"></div>
        </div>
      ) : error ? (
        <div className="rounded-[12px] border border-danger/20 bg-danger/10 p-4">
          <p className="text-[13px] font-bold text-danger">{error}</p>
        </div>
      ) : !property ? (
        <div className="rounded-[24px] bg-white/40 backdrop-blur-[20px] p-8 text-center shadow-sm border border-white/50">
          <span className="material-symbols-outlined text-[32px] text-text-secondary opacity-50 mb-2">
            apartment
          </span>
          <p className="text-[13px] font-bold text-text-secondary">
            Property not found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-[20px] shadow-sm border border-primary/30">
            {imageUrls.length > 0 ? (
              <img
                src={imageUrls[0]}
                alt={`${property.name} cover`}
                className="h-56 w-full object-cover"
              />
            ) : (
              <div className="flex h-56 w-full items-center justify-center bg-white/50">
                <span className="material-symbols-outlined text-[64px] text-text-secondary opacity-30">
                  apartment
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 p-6 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-md mt-[-40px] relative">
              <h2 className="text-[28px] font-black text-text-primary tracking-tight drop-shadow-sm">
                {property.name}
              </h2>
              <p className="text-[13px] font-bold text-text-secondary leading-relaxed">
                {property.addressLine1}, {property.city}, {property.state}{" "}
                {property.postalCode}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="text-[9px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider border border-primary/20 shadow-sm">
                  {property.propertyType}
                </div>
                <div className="text-[9px] font-bold text-text-secondary bg-white/60 px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/50 shadow-sm">
                  {property.ownership}
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-[24px] bg-white/40 backdrop-blur-[20px] shadow-sm p-6 border border-white/50">
            <h3 className="mb-4 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
              Property Overview
            </h3>
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-80 font-bold">
                  Floors
                </p>
                <p className="text-[16px] font-black text-text-primary">
                  {property.floors ?? "-"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-80 font-bold">
                  Units
                </p>
                <p className="text-[16px] font-black text-text-primary">
                  {property.totalUnits ?? property.units.length}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-80 font-bold">
                  Bedrooms
                </p>
                <p className="text-[16px] font-black text-text-primary">
                  {property.units[0]?.bedrooms ?? 0}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-80 font-bold">
                  Bathrooms
                </p>
                <p className="text-[16px] font-black text-text-primary">
                  {property.units[0]?.bathrooms ?? 0}
                </p>
              </div>

              <div className="col-span-2 flex items-center justify-between border-t border-white/50 pt-4 mt-2">
                <p className="text-[12px] uppercase tracking-widest text-text-secondary font-black">
                  Monthly Rent
                </p>
                <p className="font-numeric text-[20px] font-black text-primary drop-shadow-[0_2px_4px_rgba(255,122,0,0.2)]">
                  {formatINRWhole(property.units[0]?.monthlyRent)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-white/40 backdrop-blur-[20px] shadow-sm p-6 border border-white/50">
            <h3 className="mb-4 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
              Amenities & Features
            </h3>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="text-[11px] font-bold text-text-primary bg-white/60 px-4 py-2 rounded-full shadow-sm border border-white/50 hover:border-primary/50 transition-colors cursor-default"
                  >
                    {amenity}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] bg-white/50 p-4 text-center border border-white/50">
                <p className="text-[12px] font-bold text-text-secondary">
                  No amenities shared yet.
                </p>
              </div>
            )}
          </section>

          {imageUrls.length > 1 && (
            <section className="mb-4">
              <h3 className="mb-3 pl-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                Photos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {imageUrls.slice(1).map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-[20px] border border-white/50 shadow-sm group"
                  >
                    <img
                      src={url}
                      alt={`${property.name} photo`}
                      className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default TenantPropertyDetails;
