import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout";
import { Button, InstitutionCard, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      setMessage("Password updated successfully. You can now log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update password",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      className="flex min-h-screen items-center justify-center"
      contentClassName="w-full !px-4 !py-8"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 motion-page-enter">
        <InstitutionCard className="section-stack">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Set New Password
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Enter your new password to complete account recovery.
            </p>
          </div>

          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          {message && (
            <p className="text-sm font-medium text-success">{message}</p>
          )}

          <Button
            type="button"
            onClick={handleUpdate}
            disabled={!password || !confirmPassword}
            loading={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? "Updating..." : "Update password"}
          </Button>
        </InstitutionCard>
      </div>
    </PageLayout>
  );
};

export default ResetPassword;
