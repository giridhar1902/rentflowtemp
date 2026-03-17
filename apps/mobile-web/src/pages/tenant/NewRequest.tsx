import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SelectField, TextField, TextareaField } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type LeaseRecord,
  type MaintenancePriority,
  type MaintenanceRequestRecord,
} from "../../lib/api";
import { AppLayout } from "../../components/layout/AppLayout";

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
    <AppLayout
      title="New Request"
      showBackButton
      bottomNavRole="tenant"
      className="px-5 pt-6 pb-28 flex flex-col gap-6 motion-page-enter"
    >
      {activeLease && (
        <div className="rounded-[24px] bg-white p-5 shadow-sm border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            Submitting for
          </p>
          <p className="text-[15px] font-black text-text-primary">
            {activeLease.property?.name} • {activeLease.unit?.name}
          </p>
          <p className="mt-1 text-[12px] font-bold text-text-secondary">
            Tenant: {profile?.firstName ?? profile?.email ?? "Current user"}
          </p>
        </div>
      )}

      {!activeLease && (
        <div className="rounded-[12px] border border-warning/20 bg-warning/10 p-4">
          <p className="text-[13px] font-bold text-warning">
            No lease is linked to your account yet. Invite acceptance is
            required before creating maintenance requests.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-[12px] border border-danger/20 bg-danger/10 p-4">
          <p className="text-[13px] font-bold text-danger">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-[12px] border border-success/20 bg-success/10 p-4">
          <p className="text-[13px] font-bold text-success drop-shadow-sm">
            {successMessage}
          </p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-sm border">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
              Title
            </label>
            <input
              type="text"
              className="w-full rounded-[16px] bg-white border px-4 py-3 text-[15px] font-black text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Leaking Kitchen Sink"
            />
            <p className="text-[10px] text-text-secondary opacity-80 font-bold pl-1">
              Minimum 3 characters.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                Category
              </p>
              <div className="text-[9px] font-bold uppercase tracking-wider text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20">
                Required
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1 -mx-1">
              {categories.map((item) => {
                const active = item === category;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`shrink-0 rounded-[16px] px-4 py-2.5 text-[13px] font-bold transition-all shadow-sm ${active ? "bg-gradient-to-r from-[#F5A623] to-[#F5A623] text-white shadow-[0_4px_15px_rgba(245,166,35,0.3)]" : "bg-white text-text-secondary border hover:border-primary/50 hover:text-primary active:scale-[0.98]"}`}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
              Details
            </label>
            <textarea
              className="w-full rounded-[16px] bg-white border px-4 py-3 text-[14px] font-bold text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all min-h-[140px] resize-none"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Describe the issue in detail..."
            />
            <p className="text-[10px] text-text-secondary opacity-80 font-bold pl-1">
              Minimum 10 characters.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                Priority
              </label>
              <select
                className="w-full rounded-[16px] bg-white border px-4 py-3.5 text-[14px] font-black text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary  shadow-sm transition-all appearance-none"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as MaintenancePriority)
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <div className="rounded-[16px] border bg-white  p-4 shadow-sm relative overflow-hidden flex flex-col justify-center">
              {emergency && (
                <div className="absolute inset-0 bg-danger/10 -z-10 animate-pulse"></div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-danger">
                    Emergency
                  </p>
                  <p className="mt-0.5 text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                    Immediate risk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergency((value) => !value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border shadow-inner ${emergency ? "bg-danger border-danger" : "bg-white/60"}`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${emergency ? "translate-x-[22px]" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 pl-1 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
            Recent Requests
          </h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-[6px] border border-primary/20 uppercase tracking-widest">
            Last {recentRequests.length}
          </span>
        </div>

        {recentRequests.length === 0 ? (
          <div className="rounded-[24px] bg-white p-8 text-center shadow-sm border">
            <span className="material-symbols-outlined text-[32px] text-text-secondary opacity-50 mb-2">
              library_books
            </span>
            <p className="text-[13px] font-bold text-text-secondary">
              No maintenance requests submitted yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[24px] bg-white shadow-sm p-5 border hover:border-primary/40  transition-colors"
              >
                <p className="text-[14px] font-black text-text-primary mb-3">
                  {request.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-[6px] border border-success/20 uppercase tracking-widest">
                    {statusLabel(request.status)}
                  </span>
                  <span className="text-[9px] font-bold text-text-secondary bg-white px-2.5 py-1 rounded-[6px] border uppercase tracking-widest">
                    {request.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default NewRequest;
