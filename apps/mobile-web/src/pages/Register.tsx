import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout";
import { Button, InstitutionCard, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { AppRole } from "../lib/api";
import { defaultRouteForRole } from "../lib/routes";

const SIGNUP_RATE_LIMIT_COOLDOWN_MS = 60_000;
const pendingInviteCodeKey = "pending-tenant-invite-code";

const normalizeSignupError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unable to create account";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("email rate limit exceeded") ||
    (normalized.includes("rate limit") && normalized.includes("email"))
  ) {
    return {
      userMessage:
        "Signup email limit reached for now. Wait a bit, check spam/promotions for earlier email, then try again.",
      isRateLimit: true,
    };
  }

  return {
    userMessage: message,
    isRateLimit: false,
  };
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [role, setRole] = useState<AppRole>("LANDLORD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!cooldownUntil) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && now >= cooldownUntil) {
      setCooldownUntil(null);
    }
  }, [cooldownUntil, now]);

  const cooldownSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;
  const isCooldownActive = cooldownSeconds > 0;

  const handleContinue = async () => {
    if (isCooldownActive) {
      setError(`Please wait ${cooldownSeconds}s before trying again.`);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (role === "TENANT") {
        try {
          if (inviteCode.trim()) {
            window.sessionStorage.setItem(
              pendingInviteCodeKey,
              inviteCode.trim().toUpperCase(),
            );
          } else {
            window.sessionStorage.removeItem(pendingInviteCodeKey);
          }
        } catch {
          // no-op
        }
      }

      const result = await signUp(email.trim(), password, role);
      if (result.needsEmailConfirmation) {
        setMessage(
          role === "TENANT" && inviteCode.trim()
            ? "Check email to confirm account, then log in and accept saved invite code."
            : "Check your email to confirm your account, then log in to continue.",
        );
        return;
      }

      if (role === "TENANT") {
        const query = inviteCode.trim()
          ? `?code=${encodeURIComponent(inviteCode.trim().toUpperCase())}`
          : "";
        navigate(`/register/invite${query}`, { replace: true });
        return;
      }

      navigate(defaultRouteForRole(result.profile?.role ?? role), {
        replace: true,
      });
    } catch (registerError) {
      const normalized = normalizeSignupError(registerError);
      setError(normalized.userMessage);
      if (normalized.isRateLimit) {
        setCooldownUntil(Date.now() + SIGNUP_RATE_LIMIT_COOLDOWN_MS);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      className="min-h-screen"
      contentClassName="mx-auto flex w-full max-w-lg flex-col gap-5 !px-4 !py-6"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="motion-press flex size-10 items-center justify-center rounded-[var(--radius-pill)] border border-border-subtle bg-surface text-text-secondary shadow-base"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back_ios
          </span>
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          Create Account
        </h1>
        <span className="size-10" aria-hidden />
      </div>

      <InstitutionCard accentSpine elevation="raised" className="section-stack">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Choose your role
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Select how you will use the platform for onboarding.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setRole("LANDLORD")}
            className={`motion-press flex items-start justify-between rounded-[var(--radius-card)] border p-4 text-left ${
              role === "LANDLORD"
                ? "border-primary bg-surface shadow-raised"
                : "border-border-subtle bg-surface-subtle"
            }`}
          >
            <span>
              <span className="block text-sm font-semibold text-text-primary">
                I am a Landlord
              </span>
              <span className="mt-1 block text-xs text-text-secondary">
                Manage properties, units, leases, and tenant invites.
              </span>
            </span>
            <span className="material-symbols-outlined text-primary">
              {role === "LANDLORD"
                ? "radio_button_checked"
                : "radio_button_unchecked"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("TENANT")}
            className={`motion-press flex items-start justify-between rounded-[var(--radius-card)] border p-4 text-left ${
              role === "TENANT"
                ? "border-primary bg-surface shadow-raised"
                : "border-border-subtle bg-surface-subtle"
            }`}
          >
            <span>
              <span className="block text-sm font-semibold text-text-primary">
                I am a Tenant
              </span>
              <span className="mt-1 block text-xs text-text-secondary">
                Join via invite code and manage lease/rent operations.
              </span>
            </span>
            <span className="material-symbols-outlined text-primary">
              {role === "TENANT"
                ? "radio_button_checked"
                : "radio_button_unchecked"}
            </span>
          </button>
        </div>
      </InstitutionCard>

      <InstitutionCard className="section-stack">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
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

        {role === "TENANT" && (
          <TextField
            label="Invite Code (Optional)"
            value={inviteCode}
            placeholder="A7C9D2"
            className="font-numeric text-center tracking-[0.2em] uppercase"
            hint="If your landlord shared a code, enter it now. You can also add it after login."
            onChange={(event) =>
              setInviteCode(
                event.target.value.toUpperCase().replace(/\s+/g, ""),
              )
            }
          />
        )}

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        {message && (
          <p className="text-sm font-medium text-success">{message}</p>
        )}

        <Button
          type="button"
          onClick={handleContinue}
          loading={submitting}
          disabled={isCooldownActive || !email || !password || !confirmPassword}
          size="lg"
          className="w-full"
        >
          {submitting
            ? "Creating account..."
            : isCooldownActive
              ? `Try again in ${cooldownSeconds}s`
              : "Continue"}
        </Button>
      </InstitutionCard>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="ml-1 font-semibold text-primary hover:underline"
        >
          Log in
        </button>
      </p>
    </PageLayout>
  );
};

export default Register;
