import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout";
import { Button, PremiumCard, TextField } from "../components/ui";
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

  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between px-6 py-12 font-sans w-full relative">
        <div className="flex w-full max-w-sm flex-col items-center mt-10">
          {/* Logo Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex size-[72px] items-center justify-center rounded-[24px] bg-[#FF9A3D]/10 border border-[#FF9A3D]/20 text-[#FF7A00] shadow-[0_8px_16px_rgba(255,122,0,0.15)] mb-5">
              <span className="material-symbols-outlined text-[36px]">
                domain
              </span>
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#1e293b]">
              Rent Mate
            </h1>
            <p className="mt-1 text-[15px] font-medium text-slate-500">
              Premium Rental Management
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="w-full space-y-4">
            {/* Landlord Card */}
            <button
              type="button"
              onClick={() => setRole("LANDLORD")}
              className={`group flex w-full items-center justify-between rounded-[24px] p-5 text-left transition-all ${
                role === "LANDLORD"
                  ? "bg-white/60 backdrop-blur-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-2 border-[#FF7A00]"
                  : "bg-white/30 backdrop-blur-[20px] border-2 border-white/40 hover:border-white/60 hover:bg-white/40"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#FF9A3D]/10 text-[#FF7A00]">
                  <span className="material-symbols-outlined text-[24px]">
                    real_estate_agent
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">Landlord</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600 max-w-[220px]">
                    Manage properties, automate rent, and track financials
                    easily.
                  </p>
                </div>
              </div>
              <span
                className={`material-symbols-outlined transition-colors ${
                  role === "LANDLORD" ? "text-[#FF7A00]" : "text-slate-400"
                }`}
              >
                chevron_right
              </span>
            </button>

            {/* Tenant Card */}
            <button
              type="button"
              onClick={() => setRole("TENANT")}
              className={`group flex w-full items-center justify-between rounded-[24px] p-5 text-left transition-all ${
                role === "TENANT"
                  ? "bg-white/60 backdrop-blur-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-2 border-[#FF7A00]"
                  : "bg-white/30 backdrop-blur-[20px] border-2 border-white/40 hover:border-white/60 hover:bg-white/40"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#FF9A3D]/10 text-[#FF7A00]">
                  <span className="material-symbols-outlined text-[24px]">
                    home
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">Tenant</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600 max-w-[220px]">
                    Pay rent via UPI, sign digital leases, and request
                    maintenance.
                  </p>
                </div>
              </div>
              <span
                className={`material-symbols-outlined transition-colors ${
                  role === "TENANT" ? "text-[#FF7A00]" : "text-slate-400"
                }`}
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full max-w-sm mt-10 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-[20px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-[18px] text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,0.3)] hover:shadow-[0_12px_25px_rgba(255,122,0,0.4)] transition-all active:scale-[0.98] hover:-translate-y-[1px]"
          >
            Create Account
          </button>

          <p className="mt-6 text-[15px] font-medium text-slate-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-bold text-[#FF7A00] hover:underline"
            >
              Log In
            </button>
          </p>

          <button className="mt-12 flex items-center gap-2 text-[13px] font-bold text-slate-400 uppercase tracking-wide hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">
              headset_mic
            </span>
            Contact Support
          </button>

          <div className="w-32 h-1.5 bg-white/50 rounded-full mt-8 opacity-60"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      className="min-h-screen"
      contentClassName="mx-auto flex w-full max-w-lg flex-col gap-5 !px-4 !py-6"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
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

      <PremiumCard className="section-stack p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-l-4 border-[#FF7A00] bg-white/40">
          <div className="flex size-10 items-center justify-center rounded-[12px] bg-[#FF9A3D]/10 text-[#FF7A00]">
            <span className="material-symbols-outlined text-[20px]">
              {role === "LANDLORD" ? "real_estate_agent" : "home"}
            </span>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {role === "LANDLORD" ? "Landlord Account" : "Tenant Account"}
            </h2>
            <p className="text-xs text-slate-500">
              Selected role for registration
            </p>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="section-stack p-6">
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
      </PremiumCard>

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
