import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import { Button, InstitutionCard, TextField } from "../../components/ui";
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
            Account Information
          </h1>
          <span className="w-16" aria-hidden />
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        <InstitutionCard>
          <div className="section-stack">
            <TextField
              label="First Name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />

            <TextField
              label="Last Name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />

            <TextField
              label="Email Address"
              type="email"
              value={profile?.email ?? ""}
              readOnly
              className="bg-surface-subtle text-text-secondary"
            />

            <TextField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            {profile?.role === "LANDLORD" && (
              <TextField
                label="Company Name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            )}

            {profile?.role === "TENANT" && (
              <>
                <TextField
                  label="Emergency Contact Name"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                />

                <TextField
                  label="Emergency Contact Phone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                />
              </>
            )}
          </div>
        </InstitutionCard>

        {(error || message) && (
          <InstitutionCard>
            <p
              className={`text-sm font-medium ${error ? "text-danger" : "text-success"}`}
            >
              {error ?? message}
            </p>
          </InstitutionCard>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-[430px] border-t border-border-subtle bg-background px-4 pb-[calc(var(--layout-safe-area-bottom)+1rem)] pt-3">
        <Button
          type="button"
          className="w-full"
          size="lg"
          loading={submitting}
          onClick={() => void handleSave()}
        >
          Save Changes
        </Button>
      </div>
    </PageLayout>
  );
};

export default AccountInformation;
