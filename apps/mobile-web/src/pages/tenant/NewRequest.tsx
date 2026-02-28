import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  SelectField,
  TextField,
  TextareaField,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type LeaseRecord,
  type MaintenancePriority,
  type MaintenanceRequestRecord,
} from "../../lib/api";

const categories = ["Plumbing", "Electrical", "HVAC", "Appliances", "Other"];

const statusLabel = (status: string) => status.replaceAll("_", " ");

const extractApiErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Unable to submit maintenance request";
  }

  const raw = error.message?.trim();
  if (!raw) {
    return "Unable to submit maintenance request";
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof parsed.error?.message === "string" && parsed.error.message) {
      return parsed.error.message;
    }
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    // Non-JSON error body
  }

  return raw;
};

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [recentRequests, setRecentRequests] = useState<
    MaintenanceRequestRecord[]
  >([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("MEDIUM");
  const [emergency, setEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!session) {
        return;
      }

      try {
        const [leaseData, requestsData] = await Promise.all([
          api.listLeases(session.access_token),
          api.listMaintenanceRequests(session.access_token, { limit: 5 }),
        ]);
        setLeases(leaseData);
        setRecentRequests(requestsData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load maintenance context",
        );
      }
    };

    void loadData();
  }, [session]);

  const activeLease = useMemo(
    () =>
      leases.find((lease) => lease.status === "ACTIVE") ?? leases[0] ?? null,
    [leases],
  );

  const validationMessage = !session
    ? "Session expired. Log in again."
    : !activeLease?.propertyId
      ? "No lease is linked to your account. Accept invite first."
      : title.trim().length < 3
        ? "Title must be at least 3 characters."
        : details.trim().length < 10
          ? "Details must be at least 10 characters."
          : null;

  const handleSubmit = async () => {
    if (!session) {
      setError("Session expired. Log in again.");
      return;
    }
    if (!activeLease?.propertyId) {
      setError("No lease is linked to your account. Accept invite first.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (details.trim().length < 10) {
      setError("Details must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const created = await api.createMaintenanceRequest(session.access_token, {
        propertyId: activeLease.propertyId,
        unitId: activeLease.unitId,
        leaseId: activeLease.id,
        title: title.trim(),
        category,
        details: details.trim(),
        priority,
        emergency,
      });

      setSuccessMessage(
        `Request submitted. Ticket #${created.id.slice(-6).toUpperCase()} is ${statusLabel(
          created.status,
        )}.`,
      );
      setTitle("");
      setDetails("");
      setPriority("MEDIUM");
      setEmergency(false);

      const refreshed = await api.listMaintenanceRequests(
        session.access_token,
        {
          limit: 5,
        },
      );
      setRecentRequests(refreshed);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
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
          >
            Cancel
          </Button>
          <h1 className="text-base font-semibold text-text-primary">
            New Request
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
        {activeLease && (
          <InstitutionCard>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Submitting for
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {activeLease.property?.name} • {activeLease.unit?.name}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Tenant: {profile?.firstName ?? profile?.email ?? "Current user"}
            </p>
          </InstitutionCard>
        )}

        {!activeLease && (
          <InstitutionCard>
            <p className="text-sm text-warning">
              No lease is linked to your account yet. Invite acceptance is
              required before creating maintenance requests.
            </p>
          </InstitutionCard>
        )}

        {error && (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        )}

        {successMessage && (
          <InstitutionCard>
            <p className="text-sm text-success">{successMessage}</p>
          </InstitutionCard>
        )}

        <InstitutionCard>
          <div className="section-stack">
            <TextField
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Leaking Kitchen Sink"
              hint="Minimum 3 characters."
            />

            <div className="section-stack">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  Category
                </p>
                <Badge tone="accent">Required</Badge>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((item) => {
                  const active = item === category;
                  return (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={active ? "primary" : "secondary"}
                      className="shrink-0"
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </Button>
                  );
                })}
              </div>
            </div>

            <TextareaField
              label="Details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Describe the issue in detail..."
              hint="Minimum 10 characters."
              className="min-h-[140px]"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label="Priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as MaintenancePriority)
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </SelectField>

              <div className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Emergency
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Immediate risk
                </p>
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={emergency ? "primary" : "secondary"}
                    onClick={() => setEmergency((value) => !value)}
                  >
                    {emergency ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </InstitutionCard>

        <InstitutionCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Recent Requests
            </h2>
            <Badge tone="neutral">Last {recentRequests.length}</Badge>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No maintenance requests submitted yet.
            </p>
          ) : (
            <div className="section-stack">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle px-3 py-2"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {request.title}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {statusLabel(request.status)} • {request.category}
                  </p>
                </div>
              ))}
            </div>
          )}
        </InstitutionCard>
      </main>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-[430px] flex-col border-t border-border-subtle bg-background px-4 pb-[calc(var(--layout-safe-area-bottom)+1rem)] pt-3">
        {validationMessage && (
          <p className="mb-2 text-xs text-text-secondary">
            {validationMessage}
          </p>
        )}
        <Button
          type="button"
          size="lg"
          loading={submitting}
          disabled={!session || !activeLease?.propertyId}
          onClick={() => void handleSubmit()}
          trailingIcon={
            <span className="material-symbols-outlined text-[18px]">send</span>
          }
        >
          Submit Request
        </Button>
      </div>
    </PageLayout>
  );
};

export default NewRequest;
