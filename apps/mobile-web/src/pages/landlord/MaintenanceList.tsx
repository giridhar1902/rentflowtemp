import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type MaintenanceRequestRecord,
  type MaintenanceStatus,
} from "../../lib/api";

const statusLabel = (status: string) => status.replaceAll("_", " ");

const statusColors = (status: MaintenanceStatus) => {
  switch (status) {
    case "SUBMITTED":
      return {
        bg: "bg-[#F59E0B]/15",
        text: "text-[#F59E0B]",
        border: "border-[#F59E0B]/20",
      };
    case "REVIEWING":
    case "SCHEDULED":
    case "IN_PROGRESS":
      return {
        bg: "bg-[#3B82F6]/15",
        text: "text-[#3B82F6]",
        border: "border-[#3B82F6]/20",
      };
    case "COMPLETED":
      return {
        bg: "bg-[#10B981]/15",
        text: "text-[#10B981]",
        border: "border-[#10B981]/20",
      };
    case "CANCELED":
    default:
      return {
        bg: "bg-white/60",
        text: "text-slate-500",
        border: "border-white/50",
      };
  }
};

const priorityColors = (priority: string) => {
  if (priority === "EMERGENCY")
    return {
      bg: "bg-[#EF4444]/15",
      text: "text-[#EF4444]",
      border: "border-[#EF4444]/20",
    };
  if (priority === "HIGH")
    return {
      bg: "bg-[#F59E0B]/15",
      text: "text-[#F59E0B]",
      border: "border-[#F59E0B]/20",
    };
  if (priority === "MEDIUM")
    return {
      bg: "bg-[#3B82F6]/15",
      text: "text-[#3B82F6]",
      border: "border-[#3B82F6]/20",
    };
  return {
    bg: "bg-white/60",
    text: "text-slate-500",
    border: "border-white/50",
  };
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
  if (!(error instanceof Error)) return "Unable to update maintenance status";
  const raw = error.message?.trim();
  if (!raw) return "Unable to update maintenance status";
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof parsed.error?.message === "string" && parsed.error.message)
      return parsed.error.message;
    if (typeof parsed.message === "string" && parsed.message)
      return parsed.message;
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
    if (!session) return;
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
        if (!disposed) setError(extractApiErrorMessage(loadError));
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void loadRequests();
    const interval = setInterval(() => void loadRequests(), 10000);
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
    if (!session || current === next) return;
    setUpdatingRequestId(requestId);
    setError(null);
    try {
      const payload: { status: MaintenanceStatus; scheduledAt?: string } = {
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
    <AppLayout
      title="Maintenance"
      subtitle="TICKETS"
      bottomNavRole="landlord"
      showFab
      className="px-5 pt-6 flex flex-col gap-6 motion-page-enter"
    >
      {/* KPI Sections */}
      <section className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-white/40 bg-white/40 p-4 group backdrop-blur-[20px] shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444]"></div>
          <div className="pl-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#EF4444] mb-1">
              Urgent
            </p>
            <p className="text-[28px] font-black text-[#1e293b] font-numeric tracking-tight">
              {urgentCount}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500 leading-tight">
              High or Emergency
            </p>
          </div>
        </div>
        <div className="rounded-[20px] border border-white/40 bg-white/40 p-4 text-right backdrop-blur-[20px] shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FF7A00] mb-1">
            Pending
          </p>
          <p className="text-[28px] font-black text-[#1e293b] font-numeric tracking-tight">
            {pendingCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500 leading-tight max-w-[120px] ml-auto">
            In Progress Requests
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-[12px] border border-[#EF4444]/20 bg-[#EF4444]/10 p-4 mb-2">
          <p className="text-[13px] font-medium text-[#EF4444]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="size-8 rounded-full border-2 border-white/50 border-t-[#FF7A00] animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[20px] border border-white/40 bg-white/40 p-6 text-center backdrop-blur-[20px] shadow-sm">
          <p className="text-[13px] text-slate-500 font-medium">
            No maintenance requests right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const statusCfg = statusColors(request.status);
            const priorityCfg = priorityColors(request.priority);

            return (
              <div
                key={request.id}
                className="rounded-[24px] border border-white/40 bg-white/40 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[20px] transition-all hover:border-[#FF9A3D]/40 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 pr-2">
                    <h2 className="line-clamp-1 text-[15px] font-bold text-[#1e293b] mb-1 group-hover:text-[#FF7A00] transition-colors">
                      {request.title}
                    </h2>
                    <p className="truncate text-[12px] font-medium text-slate-500">
                      {request.property?.name} •{" "}
                      {request.unit?.name ?? "Unit not linked"}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text} px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm`}
                  >
                    {statusLabel(request.status)}
                  </div>
                </div>

                <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {request.details}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`border ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text} px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider shadow-sm`}
                  >
                    {request.priority}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {new Date(request.submittedAt).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>

                <div className="border-t border-white/40 pt-4 mt-1 relative">
                  <div className="relative">
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
                      className={`w-full appearance-none rounded-[16px] border border-white/50 bg-white/60 py-3 pl-4 pr-10 text-[13px] font-bold text-[#1e293b] outline-none shadow-sm transition-colors 
                           ${updatingRequestId === request.id || request.status === "COMPLETED" || request.status === "CANCELED" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#FF9A3D]"}
                         `}
                    >
                      {(
                        statusOptionsByCurrent[request.status] ?? [
                          request.status,
                        ]
                      ).map((status) => (
                        <option key={status} value={status}>
                          Move to {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] transition-colors ${updatingRequestId === request.id || request.status === "COMPLETED" || request.status === "CANCELED" ? "text-slate-400" : "text-slate-500 group-hover:text-[#FF7A00]"}`}
                    >
                      {updatingRequestId === request.id
                        ? "sync"
                        : "expand_more"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default MaintenanceList;
