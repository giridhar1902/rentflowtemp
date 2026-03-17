import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { AppRole } from "../lib/api";
import { defaultRouteForRole } from "../lib/routes";

const SIGNUP_RATE_LIMIT_COOLDOWN_MS = 60_000;
const pendingInviteCodeKey = "pending-tenant-invite-code";

const DomvioMark = () => (
  <svg width="40" height="40" viewBox="0 0 56 56" fill="none" aria-hidden>
    <path
      d="M10 4 H28 C42 4 52 14 52 28 C52 42 42 52 28 52 H10 Z"
      fill="#1B2B5E"
    />
    <rect
      x="10"
      y="4"
      width="6"
      height="48"
      rx="3"
      fill="#F5A623"
      opacity="0.9"
    />
    <circle cx="32" cy="24" r="7" fill="#F5A623" />
    <path d="M28.5 30 L28.5 39 Q32 42 35.5 39 L35.5 30 Z" fill="#F5A623" />
    <circle cx="32" cy="24" r="3.5" fill="#1B2B5E" />
  </svg>
);

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
        "Signup email limit reached. Wait a bit, check spam, then try again.",
      isRateLimit: true,
    };
  }
  return { userMessage: message, isRateLimit: false };
};

const pageStyle: React.CSSProperties = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  background: "#EEF1F8",
  minHeight: "100vh",
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
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
    if (!cooldownUntil) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && now >= cooldownUntil) setCooldownUntil(null);
  }, [cooldownUntil, now]);

  const cooldownSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;
  const isCooldownActive = cooldownSeconds > 0;

  const handleContinue = async () => {
    if (isCooldownActive) {
      setError(`Wait ${cooldownSeconds}s before retrying.`);
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
          inviteCode.trim()
            ? window.sessionStorage.setItem(
                pendingInviteCodeKey,
                inviteCode.trim().toUpperCase(),
              )
            : window.sessionStorage.removeItem(pendingInviteCodeKey);
        } catch {
          /* no-op */
        }
      }
      const result = await signUp(email.trim(), password, role);
      if (result.needsEmailConfirmation) {
        setMessage(
          role === "TENANT" && inviteCode.trim()
            ? "Check your email to confirm, then log in to accept your invite."
            : "Check your email to confirm your account, then log in.",
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
    } catch (err) {
      const normalized = normalizeSignupError(err);
      setError(normalized.userMessage);
      if (normalized.isRateLimit)
        setCooldownUntil(Date.now() + SIGNUP_RATE_LIMIT_COOLDOWN_MS);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 1: Role selection ── */
  if (step === 1) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-between px-5 py-12 w-full"
        style={pageStyle}
      >
        <div className="flex w-full max-w-[390px] flex-col items-center gap-8 mt-4 motion-page-enter">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-[20px]"
              style={{
                width: 64,
                height: 64,
                background: "linear-gradient(145deg, #2D4A9E, #1B2B5E)",
                boxShadow: "0 8px 24px rgba(27,43,94,0.25)",
              }}
            >
              <DomvioMark />
            </div>
            <div className="text-center">
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: "-0.02em",
                  color: "#1B2B5E",
                }}
              >
                dom<span style={{ color: "#F5A623" }}>vio</span>
              </div>
              <p className="text-sm" style={{ color: "#5A6A8A" }}>
                Your home, managed.
              </p>
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-xl font-bold mb-1" style={{ color: "#1B2B5E" }}>
              Create your account
            </h2>
            <p className="text-sm mb-5" style={{ color: "#5A6A8A" }}>
              Choose how you'll use Domvio.
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Landlord card */}
              {(["LANDLORD", "TENANT"] as AppRole[]).map((r) => {
                const isSelected = role === r;
                const isLandlord = r === "LANDLORD";
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all"
                    style={{
                      background: "#FFFFFF",
                      border: isSelected
                        ? "2px solid #F5A623"
                        : "1.5px solid rgba(27,43,94,0.08)",
                      boxShadow: isSelected
                        ? "0 4px 20px rgba(245,166,35,0.18)"
                        : "0 2px 8px rgba(27,43,94,0.05)",
                    }}
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl shrink-0"
                      style={{
                        background: isSelected
                          ? "rgba(245,166,35,0.12)"
                          : "#F8F9FA",
                        color: isSelected ? "#F5A623" : "#8A9AB8",
                      }}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {isLandlord ? "real_estate_agent" : "home"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base font-bold"
                        style={{ color: "#1B2B5E" }}
                      >
                        {isLandlord ? "Landlord" : "Tenant"}
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#5A6A8A" }}
                      >
                        {isLandlord
                          ? "Manage properties, collect rent, track payments."
                          : "Pay rent via UPI, sign leases, raise requests."}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: isSelected ? "#F5A623" : "#CBD5E1" }}
                    >
                      {isSelected ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-[390px] flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-[14px] py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #F5A623, #E8920F)",
              boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
            }}
          >
            Continue
          </button>
          <p className="text-sm" style={{ color: "#5A6A8A" }}>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-bold hover:underline"
              style={{ color: "#1B2B5E" }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── Step 2: Account details ── */
  return (
    <div
      className="flex min-h-screen flex-col px-5 py-6 w-full"
      style={pageStyle}
    >
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-5 motion-page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="size-10 flex items-center justify-center rounded-full border transition-colors"
            style={{
              border: "1.5px solid rgba(27,43,94,0.12)",
              background: "#FFFFFF",
              color: "#1B2B5E",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1B2B5E" }}>
              Account details
            </h1>
            <p className="text-xs" style={{ color: "#5A6A8A" }}>
              Registering as {role === "LANDLORD" ? "a Landlord" : "a Tenant"}
            </p>
          </div>
        </div>

        {/* Role pill */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(27,43,94,0.08)",
            borderLeft: "3px solid #F5A623",
          }}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ color: "#F5A623" }}
          >
            {role === "LANDLORD" ? "real_estate_agent" : "home"}
          </span>
          <span className="text-sm font-bold" style={{ color: "#1B2B5E" }}>
            {role === "LANDLORD" ? "Landlord Account" : "Tenant Account"}
          </span>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl px-6 py-6 flex flex-col gap-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(27,43,94,0.08)",
            boxShadow: "0 2px 12px rgba(27,43,94,0.06)",
          }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
          />

          {role === "TENANT" && (
            <TextField
              label="Invite Code (optional)"
              value={inviteCode}
              placeholder="A7C9D2"
              hint="Enter the code your landlord shared."
              onChange={(e) =>
                setInviteCode(e.target.value.toUpperCase().replace(/\s+/g, ""))
              }
            />
          )}

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: "#FEE2E2",
                color: "#B91C1C",
                border: "1px solid rgba(220,38,38,0.2)",
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: "#DCFCE7",
                color: "#15803D",
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              {message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleContinue}
            loading={submitting}
            disabled={
              isCooldownActive || !email || !password || !confirmPassword
            }
            size="lg"
            className="w-full"
          >
            {submitting
              ? "Creating account…"
              : isCooldownActive
                ? `Retry in ${cooldownSeconds}s`
                : "Create Account"}
          </Button>
        </div>

        <p className="text-center text-sm" style={{ color: "#5A6A8A" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold hover:underline"
            style={{ color: "#1B2B5E" }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
