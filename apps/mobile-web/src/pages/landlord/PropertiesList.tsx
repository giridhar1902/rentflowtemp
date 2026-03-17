import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { PremiumButton } from "../../components/ui/PremiumButton";
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
    <AppLayout
      title="Properties"
      subtitle="PORTFOLIO"
      bottomNavRole="landlord"
      showFab
    >
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {filterOptions.map((status) => {
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              className={`shrink-0 rounded-full px-5 py-2.5 text-[13px] font-bold transition-all shadow-sm ${active ? "bg-gradient-to-r from-[#F5A623] to-[#F5A623] text-white border border-transparent shadow-[0_4px_15px_rgba(245,166,35,0.3)]" : "bg-white text-slate-500 border hover:border-[#F5A623]/50 hover:text-[#1B2B5E] "}`}
              onClick={() => setFilter(status)}
            >
              {status}{" "}
              {status === "All" && !isLoading
                ? `(${filteredProperties.length})`
                : ""}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 text-[13px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
          {error}
        </p>
      )}

      <PremiumCard
        className="flex items-center justify-between gap-3 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow relative overflow-hidden group !p-4 mb-4 "
        onClick={() => navigate("/landlord/add-property")}
      >
        <div className="absolute -right-4 -bottom-4 size-24 bg-gradient-to-tl from-[#F5A623]/20 to-[#F5A623]/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex flex-col relative z-10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Portfolio
          </p>
          <h2 className="text-xl font-black text-[#1B2B5E] tracking-tight">
            Add Property
          </h2>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            Register a new income asset
          </p>
        </div>
        <PremiumButton
          variant="secondary"
          onClick={() => navigate("/landlord/add-property")}
          className="relative z-10 !px-4 !py-2 !h-10 !rounded-full shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[18px] mr-1">
            add
          </span>
          <span className="text-xs font-bold">New</span>
        </PremiumButton>
      </PremiumCard>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <PremiumCard>
            <p className="text-[13px] font-medium text-slate-500 animate-pulse">
              Loading properties...
            </p>
          </PremiumCard>
        ) : filteredProperties.length === 0 ? (
          <PremiumCard>
            <p className="text-[13px] font-medium text-slate-500">
              No properties found.
            </p>
          </PremiumCard>
        ) : (
          filteredProperties.map((property) => {
            const unit = property.units[0];
            const rent = parseAmount(unit?.monthlyRent);
            const status = toStatusLabel(property);
            const isOccupied = status === "Occupied";

            return (
              <PremiumCard
                key={property.id}
                variant="solid"
                className="cursor-pointer !p-0 overflow-hidden hover:shadow-lg transition-all border-none relative group"
                onClick={() => navigate(`/landlord/property/${property.id}`)}
              >
                <div className="flex h-36">
                  <div className="relative w-[36%] shrink-0">
                    {propertyImageUrls[property.id] ? (
                      <img
                        src={propertyImageUrls[property.id]}
                        alt={`${property.name} cover`}
                        className="h-full w-full object-cover relative z-10"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 relative z-10">
                        <span className="material-symbols-outlined text-4xl text-slate-300">
                          apartment
                        </span>
                      </div>
                    )}

                    {/* Status Badge overlay */}
                    <div className="absolute top-2 left-2 z-20">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm  ${isOccupied ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/20" : "bg-white/80 text-slate-500 shadow-sm"}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-4 flex-1 min-w-0 bg-gradient-to-l from-white/60 to-white/40 backdrop-blur-[10px]">
                    <div>
                      <h2 className="text-[15px] font-black text-[#1B2B5E] truncate">
                        {property.name}
                      </h2>
                      <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">
                        {property.addressLine1}, {property.city}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-2">
                      {/* Amenities miniaturized */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-slate-500 bg-white px-1.5 py-0.5 rounded-md border shadow-sm backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[12px]">
                            bed
                          </span>
                          <span className="text-[10px] font-bold">
                            {unit?.bedrooms ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-slate-500 bg-white px-1.5 py-0.5 rounded-md border shadow-sm backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[12px]">
                            bathtub
                          </span>
                          <span className="text-[10px] font-bold">
                            {unit?.bathrooms ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-slate-500 bg-white px-1.5 py-0.5 rounded-md border shadow-sm backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[12px]">
                            door_front
                          </span>
                          <span className="text-[10px] font-bold">
                            {property.units.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-right">
                      <p className="font-numeric text-lg font-black text-[#1B2B5E] leading-none">
                        {formatINRWhole(rent)}
                        <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                          /mo
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default PropertiesList;
