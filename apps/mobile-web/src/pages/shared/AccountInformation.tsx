import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const AccountInformation: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setPhone(profile?.phone ?? "");
    setCompanyName(profile?.landlordProfile?.companyName ?? "");
    setEmergencyContactName(profile?.tenantProfile?.emergencyContactName ?? "");
    setEmergencyContactPhone(
      profile?.tenantProfile?.emergencyContactPhone ?? "",
    );
  }, [profile]);

  const handleSave = async () => {
    if (!session) {
      setError("Session expired. Please login again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateMe(session.access_token, {
        firstName,
        lastName,
        phone,
        companyName: profile?.role === "LANDLORD" ? companyName : undefined,
        emergencyContactName:
          profile?.role === "TENANT" ? emergencyContactName : undefined,
        emergencyContactPhone:
          profile?.role === "TENANT" ? emergencyContactPhone : undefined,
      });
      await refreshProfile();
      setMessage("Profile updated successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update profile",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    readOnly = false,
  }: any) => (
    <div className="flex flex-col gap-1.5 mb-4 last:mb-0">
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-[16px] border py-3 px-4 text-[14px] font-bold outline-none transition-all ${
          readOnly
            ? "border-[rgba(27,43,94,0.08)] bg-white text-text-secondary opacity-70 cursor-not-allowed shadow-none"
            : "border-[rgba(27,43,94,0.1)] bg-white text-text-primary focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner placeholder:text-text-secondary/50"
        }`}
      />
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-[120px] text-text-primary selection:bg-primary/30">
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
            Account Information
          </h1>
          <div className="w-9" /> {/* spacer for centering */}
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        <div className="rounded-[24px] border bg-white shadow-sm p-6">
          <InputField
            label="First Name"
            value={firstName}
            onChange={(e: any) => setFirstName(e.target.value)}
          />
          <InputField
            label="Last Name"
            value={lastName}
            onChange={(e: any) => setLastName(e.target.value)}
          />
          <InputField
            label="Email Address"
            type="email"
            value={profile?.email ?? ""}
            readOnly
          />
          <InputField
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e: any) => setPhone(e.target.value)}
          />

          {profile?.role === "LANDLORD" && (
            <InputField
              label="Company Name"
              value={companyName}
              onChange={(e: any) => setCompanyName(e.target.value)}
            />
          )}

          {profile?.role === "TENANT" && (
            <>
              <div className="my-6 border-t"></div>
              <h2 className="text-[15px] font-black text-text-primary mb-4 drop-shadow-sm">
                Emergency Contact
              </h2>
              <InputField
                label="Contact Name"
                value={emergencyContactName}
                onChange={(e: any) => setEmergencyContactName(e.target.value)}
              />
              <InputField
                label="Contact Phone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e: any) => setEmergencyContactPhone(e.target.value)}
              />
            </>
          )}
        </div>

        {(error || message) && (
          <div
            className={`rounded-[16px] border p-4 shadow-sm ${error ? "border-danger/20 bg-danger/10" : "border-success/20 bg-success/10"}`}
          >
            <p
              className={`text-[13px] font-bold text-center ${error ? "text-danger" : "text-success"}`}
            >
              {error ?? message}
            </p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white backdrop-blur-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)] pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 px-5">
        <button
          disabled={submitting}
          onClick={() => void handleSave()}
          className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-bold text-white bg-gradient-to-r from-[#F5A623] to-[#F5A623] shadow-[0_8px_30px_rgba(245,166,35,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? (
            <div className="size-5 rounded-full border-2 border-[rgba(27,43,94,0.06)] border-t-white animate-spin"></div>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountInformation;
