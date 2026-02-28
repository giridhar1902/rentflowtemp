import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { PageLayout } from "../../components/layout";
import { Badge, Button, InstitutionCard, KpiValue } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type MaintenanceRequestRecord,
  type MaintenanceStatus,
} from "../../lib/api";

const statusLabel = (status: string) => status.replaceAll("_", " ");

const statusTone = (status: MaintenanceStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "warning" as const;
    case "REVIEWING":
      return "info" as const;
    case "SCHEDULED":
      return "accent" as const;
    case "IN_PROGRESS":
      return "accent" as const;
    case "COMPLETED":
      return "success" as const;
    case "CANCELED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
};

const priorityTone = (priority: string) => {
  if (priority === "EMERGENCY") {
    return "danger" as const;
  }
  if (priority === "HIGH") {
    return "warning" as const;
  }
  if (priority === "MEDIUM") {
    return "accent" as const;
  }
  return "neutral" as const;
};

const statusOptionsByCurrent: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  SUBMITTED: ["SUBMITTED", "REVIEWING", "COMPLETED", "CANCELED"],
  REVIEWING: ["REVIEWING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"],
  SCHEDULED: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"],
  IN_PROGRESS: ["IN_PROGRESS", "COMPLETED", "CANCELED"],
  COMPLETED: ["COMPLETED"],
  CANCELED: ["CANCELED"],
};

const extractApiErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Unable to update maintenance status";
  }

  const raw = error.message?.trim();
  if (!raw) {
    return "Unable to update maintenance status";
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

const MaintenanceList: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [requests, setRequests] = useState<MaintenanceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let disposed = false;

    const loadRequests = async () => {
      try {
        const data = await api.listMaintenanceRequests(session.access_token, {
          limit: 100,
        });
        if (!disposed) {
          setRequests(data);
          setError(null);
        }
      } catch (loadError) {
        if (!disposed) {
          setError(extractApiErrorMessage(loadError));
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void loadRequests();

    const interval = setInterval(() => {
      void loadRequests();
    }, 10000);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [session]);

  const urgentCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          (request.priority === "HIGH" || request.priority === "EMERGENCY") &&
          request.status !== "COMPLETED" &&
          request.status !== "CANCELED",
      ).length,
    [requests],
  );

  const pendingCount = useMemo(
    () =>
      requests.filter((request) =>
        ["SUBMITTED", "REVIEWING", "SCHEDULED", "IN_PROGRESS"].includes(
          request.status,
        ),
      ).length,
    [requests],
  );

  const handleStatusChange = async (
    requestId: string,
    current: MaintenanceStatus,
    next: MaintenanceStatus,
  ) => {
    if (!session || current === next) {
      return;
    }

    setUpdatingRequestId(requestId);
    setError(null);

    try {
      const payload: {
        status: MaintenanceStatus;
        scheduledAt?: string;
      } = {
        status: next,
      };

      if (next === "SCHEDULED") {
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        payload.scheduledAt = scheduledAt.toISOString();
      }

      const updated = await api.updateMaintenanceRequestStatus(
        session.access_token,
        requestId,
        payload,
      );

      setRequests((previous) =>
        previous.map((request) =>
          request.id === updated.id ? updated : request,
        ),
      );
    } catch (updateError) {
      setError(extractApiErrorMessage(updateError));
    } finally {
      setUpdatingRequestId(null);
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
            Dashboard
          </Button>
          <h1 className="text-base font-semibold text-text-primary">
            Maintenance
          </h1>
          <Badge tone="neutral">Refresh 10s</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InstitutionCard>
            <KpiValue
              label="Urgent"
              value={<span className="font-numeric">{urgentCount}</span>}
              valueClassName="text-[1.6rem] text-danger"
              meta="High or emergency requests"
            />
          </InstitutionCard>
          <InstitutionCard>
            <KpiValue
              label="Pending"
              value={<span className="font-numeric">{pendingCount}</span>}
              valueClassName="text-[1.6rem]"
              meta="Submitted, reviewing, scheduled, in progress"
            />
          </InstitutionCard>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading maintenance requests...
            </p>
          </InstitutionCard>
        ) : requests.length === 0 ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              No maintenance requests available.
            </p>
          </InstitutionCard>
        ) : (
          requests.map((request) => (
            <InstitutionCard key={request.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-text-primary">
                    {request.title}
                  </h2>
                  <p className="mt-1 text-xs text-text-secondary">
                    {request.property?.name} •{" "}
                    {request.unit?.name ?? "Unit not linked"}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {request.category} •{" "}
                    {new Date(request.submittedAt).toLocaleString()}
                  </p>
                </div>
                <Badge tone={statusTone(request.status)}>
                  {statusLabel(request.status)}
                </Badge>
              </div>

              <p className="mt-3 text-sm text-text-secondary">
                {request.details}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
                <Badge tone={priorityTone(request.priority)}>
                  Priority: {request.priority}
                </Badge>

                <select
                  value={request.status}
                  disabled={
                    updatingRequestId === request.id ||
                    request.status === "COMPLETED" ||
                    request.status === "CANCELED"
                  }
                  onChange={(event) =>
                    void handleStatusChange(
                      request.id,
                      request.status,
                      event.target.value as MaintenanceStatus,
                    )
                  }
                  className="h-10 min-w-[10rem] rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 text-xs font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(
                    statusOptionsByCurrent[request.status] ?? [request.status]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </InstitutionCard>
          ))
        )}
      </main>

      <BottomNav role="landlord" />
    </PageLayout>
  );
};

export default MaintenanceList;
