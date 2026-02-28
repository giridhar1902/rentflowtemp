import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout";
import { Button, InstitutionCard, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { sendResetPasswordEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await sendResetPasswordEmail(email.trim());
      setMessage("Password reset link sent. Check your email inbox.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send reset link",
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
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Back to login
        </button>

        <InstitutionCard
          accentSpine
          elevation="raised"
          className="section-stack"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Enter your account email and we will send a password reset link.
            </p>
          </div>

          <TextField
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          {message && (
            <p className="text-sm font-medium text-success">{message}</p>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!email}
            loading={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </InstitutionCard>
      </div>
    </PageLayout>
  );
};

export default ForgotPassword;
