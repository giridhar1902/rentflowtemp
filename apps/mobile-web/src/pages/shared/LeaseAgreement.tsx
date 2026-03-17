import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { formatINRWhole } from "../../lib/currency";
import { api, type DocumentRecord, type LeaseRecord } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const detectDocumentType = (
  file: File,
):
  | "LEASE"
  | "PROPERTY_DEED"
  | "RENT_RECEIPT"
  | "MAINTENANCE_PHOTO"
  | "OTHER" => {
  if (file.type === "application/pdf") {
    return "LEASE";
  }
  if (file.type.startsWith("image/")) {
    return "OTHER";
  }
  return "OTHER";
};

const toLeaseRelevantDocuments = (
  documents: DocumentRecord[],
  leaseId: string,
) =>
  documents.filter(
    (document) =>
      document.leaseId === leaseId ||
      (document.leaseId == null && document.type === "LEASE"),
  );

const LeaseAgreement: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchLeases = async () => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.listLeases(session.access_token);
        setLeases(data);
      } catch (leaseError) {
        setError(
          leaseError instanceof Error
            ? leaseError.message
            : "Unable to load lease information",
        );
      } finally {
        setLoading(false);
      }
    };
    void fetchLeases();
  }, [session]);

  const activeLease = useMemo(
    () =>
      leases.find((lease) => lease.status === "ACTIVE") ?? leases[0] ?? null,
    [leases],
  );

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session || !activeLease) {
        setDocuments([]);
        return;
      }
      try {
        const docs = await api.listDocuments(session.access_token, {
          propertyId: activeLease.propertyId,
          limit: 50,
        });
        setDocuments(toLeaseRelevantDocuments(docs, activeLease.id));
      } catch (documentError) {
        setError(
          documentError instanceof Error
            ? documentError.message
            : "Unable to load documents",
        );
      }
    };
    void fetchDocuments();
  }, [activeLease, session]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session || !activeLease) return;

    setUploading(true);
    setError(null);

    try {
      const uploadSession = await api.createDocumentUpload(
        session.access_token,
        {
          type: detectDocumentType(file),
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          propertyId: activeLease.propertyId,
          leaseId: activeLease.id,
        },
      );

      await api.uploadDocumentToSignedUrl(
        uploadSession.uploadUrl,
        file,
        file.type || "application/octet-stream",
      );

      const docs = await api.listDocuments(session.access_token, {
        propertyId: activeLease.propertyId,
        limit: 50,
      });
      setDocuments(toLeaseRelevantDocuments(docs, activeLease.id));
      event.target.value = "";
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload document",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    if (!session) return;
    try {
      const signed = await api.getDocumentDownloadUrl(
        session.access_token,
        documentId,
      );
      window.open(signed.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to generate download URL",
      );
    }
  };

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border text-text-secondary hover:text-primary  transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>

          <h1 className="text-[17px] font-black tracking-tight text-text-primary">
            Lease Agreement
          </h1>

          <button
            onClick={() => navigate("/chat")}
            className="flex h-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-4 text-[12px] font-bold text-primary hover:bg-primary/20 transition-colors shadow-sm"
          >
            Chat
          </button>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="size-8 rounded-full border-2 border-t-primary animate-spin"></div>
          </div>
        ) : error ? (
          <div className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 shadow-sm">
            <p className="text-[13px] font-bold text-danger">{error}</p>
          </div>
        ) : !activeLease ? (
          <div className="rounded-[24px] border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 shadow-inner">
              <span className="material-symbols-outlined text-[32px] text-primary">
                description
              </span>
            </div>
            <p className="text-[15px] font-black text-text-primary mb-1">
              No Active Lease
            </p>
            <p className="text-[13px] font-bold text-text-secondary">
              You don't have an active lease agreement assigned yet.
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-[24px] border border-primary/30 bg-primary/5 shadow-sm  flex flex-col group">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[100px] text-primary">
                  description
                </span>
              </div>

              <div className="p-5 flex flex-col gap-6 relative z-10">
                {/* Header Status & ID */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-[#10B981] animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
                      {activeLease.status} Lease
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-80">
                    ID: {activeLease.id.split("-")[0]}
                  </span>
                </div>

                {/* Financials KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[20px] bg-white  p-4 border shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      Monthly Rent
                    </p>
                    <p className="font-numeric text-[20px] font-black tracking-tight text-text-primary">
                      {formatINRWhole(activeLease.monthlyRent)}
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-white  p-4 border shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      Deposit
                    </p>
                    <p className="font-numeric text-[20px] font-black tracking-tight text-text-primary">
                      {formatINRWhole(activeLease.securityDeposit)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-4 border-t pt-5">
                  <div>
                    <p className="text-[14px] font-black text-text-primary mb-0.5">
                      {activeLease.property?.name}
                    </p>
                    <p className="text-[12px] font-bold text-text-secondary">
                      {activeLease.property?.addressLine1},{" "}
                      {activeLease.property?.city},{" "}
                      {activeLease.property?.state}{" "}
                      {activeLease.property?.postalCode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary opacity-80 tracking-widest mb-1">
                        Unit
                      </p>
                      <p className="text-[13px] font-bold text-text-primary">
                        {activeLease.unit?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary opacity-80 tracking-widest mb-1">
                        Due Day
                      </p>
                      <p className="text-[13px] font-bold text-text-primary">
                        {activeLease.dueDay}th of month
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-bold text-text-secondary opacity-80 tracking-widest mb-1">
                        Lease Term
                      </p>
                      <p className="text-[13px] font-bold text-text-primary">
                        {new Date(activeLease.startDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}{" "}
                        -{" "}
                        {new Date(activeLease.endDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                  Lease Documents
                </h2>

                <label className="cursor-pointer">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-primary/20 transition-colors shadow-sm ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      upload
                    </span>
                    {uploading ? "Uploading..." : "Upload"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => void handleUpload(event)}
                  />
                </label>
              </div>

              {documents.length === 0 ? (
                <div className="rounded-[24px] border bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white border shadow-inner">
                    <span className="material-symbols-outlined text-[24px] text-text-secondary">
                      folder_open
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-text-secondary">
                    No documents uploaded yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-[24px] border bg-white overflow-hidden shadow-sm">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 border-b px-4 py-4 last:border-b-0  active:bg-white transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white border shadow-inner text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {document.fileName.endsWith(".pdf")
                              ? "picture_as_pdf"
                              : "description"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-text-primary group-hover:text-primary transition-colors mb-0.5">
                            {document.fileName}
                          </p>
                          <p className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                            <span>
                              {(document.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                            <span className="size-1 rounded-full bg-text-secondary/50"></span>
                            <span className="uppercase tracking-wider">
                              {new Date(
                                document.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => void handleDownload(document.id)}
                        className="flex size-8 items-center justify-center rounded-full bg-white border shadow-sm text-text-secondary hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all active:scale-[0.98] shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav
          role={profile?.role === "LANDLORD" ? "landlord" : "tenant"}
        />
      </div>
    </div>
  );
};

export default LeaseAgreement;
