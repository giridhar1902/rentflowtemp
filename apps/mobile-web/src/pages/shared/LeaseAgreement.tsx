import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
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
      if (!session) {
        return;
      }
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
    if (!file || !session || !activeLease) {
      return;
    }

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
    if (!session) {
      return;
    }

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
            Lease Agreement
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/chat")}
          >
            Chat
          </Button>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {loading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading lease details...
            </p>
          </InstitutionCard>
        ) : error ? (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        ) : !activeLease ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              No lease assigned yet.
            </p>
          </InstitutionCard>
        ) : (
          <>
            <InstitutionCard accentSpine elevation="raised">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Badge tone="success">{activeLease.status} Lease</Badge>
                <p className="text-xs text-text-secondary">
                  ID: {activeLease.id}
                </p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <KpiValue
                  label="Monthly Rent"
                  value={
                    <span className="font-numeric">
                      {formatINRWhole(activeLease.monthlyRent)}
                    </span>
                  }
                  valueClassName="text-[1.5rem]"
                />
                <KpiValue
                  label="Security Deposit"
                  value={
                    <span className="font-numeric">
                      {formatINRWhole(activeLease.securityDeposit)}
                    </span>
                  }
                  valueClassName="text-[1.5rem]"
                />
              </div>

              <div className="section-stack border-t border-border-subtle pt-4">
                <p className="text-sm font-semibold text-text-primary">
                  {activeLease.property?.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {activeLease.property?.addressLine1},{" "}
                  {activeLease.property?.city}, {activeLease.property?.state}{" "}
                  {activeLease.property?.postalCode}
                </p>
                <p className="text-sm text-text-secondary">
                  Unit:{" "}
                  <span className="font-medium text-text-primary">
                    {activeLease.unit?.name}
                  </span>
                </p>
                <p className="text-sm text-text-secondary">
                  Lease Term:{" "}
                  <span className="font-medium text-text-primary">
                    {new Date(activeLease.startDate).toLocaleDateString()} -{" "}
                    {new Date(activeLease.endDate).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-sm text-text-secondary">
                  Due Day:{" "}
                  <span className="font-medium text-text-primary">
                    {activeLease.dueDay}
                  </span>
                </p>
              </div>
            </InstitutionCard>

            <InstitutionCard>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-text-primary">
                  Lease Documents
                </h2>
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-primary">
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
                <p className="text-sm text-text-secondary">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="section-stack">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {document.fileName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {(document.sizeBytes / 1024).toFixed(1)} KB •{" "}
                          {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDownload(document.id)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </InstitutionCard>
          </>
        )}
      </main>

      <BottomNav role={profile?.role === "LANDLORD" ? "landlord" : "tenant"} />
    </PageLayout>
  );
};

export default LeaseAgreement;
