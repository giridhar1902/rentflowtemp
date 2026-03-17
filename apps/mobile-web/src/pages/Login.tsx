import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultRouteForRole } from "../lib/routes";

// Domvio keyhole icon (inline, no import dependency)
const DomvioMark = () => (
  <svg width="48" height="48" viewBox="0 0 56 56" fill="none" aria-hidden>
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPhone, verifyPhoneOTP, error: authConfigError } = useAuth();

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async (overridePhone?: string) => {
    const rawPhone = overridePhone ?? phone;
    if (!rawPhone) return;
    const formattedPhone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91${rawPhone}`;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPhone(formattedPhone);
      if (
        formattedPhone === "+910000000000" ||
        formattedPhone === "+911111111111"
      ) {
        const profile = await verifyPhoneOTP(formattedPhone, "123456");
        navigate(defaultRouteForRole(profile.role), { replace: true });
      } else {
        setStep("OTP");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const profile = await verifyPhoneOTP(formattedPhone, otp);
      navigate(defaultRouteForRole(profile.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-12 w-full"
      style={{
        background: "#EEF1F8",
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-7 motion-page-enter">
        {/* ── Hero ── */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* App icon tile */}
          <div
            className="flex items-center justify-center rounded-[20px]"
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(145deg, #2D4A9E, #1B2B5E)",
              boxShadow: "0 8px 24px rgba(27,43,94,0.25)",
            }}
          >
            <DomvioMark />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: "#1B2B5E",
                }}
              >
                dom<span style={{ color: "#F5A623" }}>vio</span>
              </span>
            </div>
            <p className="text-sm" style={{ color: "#5A6A8A" }}>
              Your home, managed.
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(27,43,94,0.08)",
            boxShadow: "0 4px 24px rgba(27,43,94,0.10)",
          }}
        >
          {/* Gold accent spine */}
          <div
            className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl"
            style={{ background: "#F5A623" }}
          />

          <div className="px-7 py-8 pl-9">
            {/* Step heading */}
            <div className="mb-6">
              <h1
                className="text-[22px] font-bold tracking-tight"
                style={{ color: "#1B2B5E" }}
              >
                {step === "PHONE" ? "Sign in" : "Verify OTP"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "#5A6A8A" }}>
                {step === "PHONE"
                  ? "Enter your phone number to continue."
                  : `Code sent to +91 ${phone}`}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {step === "PHONE" ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold"
                    style={{ color: "#1B2B5E" }}
                  >
                    Phone Number
                  </label>
                  <div
                    className="flex rounded-[14px] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[rgba(245,166,35,0.3)]"
                    style={{
                      border: "1.5px solid rgba(27,43,94,0.12)",
                      background: "#F8F9FA",
                    }}
                  >
                    <div
                      className="px-4 flex items-center text-sm font-bold border-r"
                      style={{
                        color: "#1B2B5E",
                        borderColor: "rgba(27,43,94,0.1)",
                        background: "#EEF1F8",
                      }}
                    >
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      className="w-full px-4 py-3.5 text-sm font-medium bg-transparent outline-none"
                      style={{ color: "#1B2B5E" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-semibold"
                      style={{ color: "#1B2B5E" }}
                    >
                      6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("PHONE");
                        setOtp("");
                        setError(null);
                      }}
                      className="text-xs font-bold hover:underline"
                      style={{ color: "#F5A623" }}
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full rounded-[14px] px-4 py-3.5 text-center text-[22px] font-bold tracking-[0.4em] outline-none transition-all focus:ring-2 focus:ring-[rgba(245,166,35,0.3)]"
                    style={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      color: "#1B2B5E",
                      background: "#F8F9FA",
                      border: "1.5px solid rgba(27,43,94,0.12)",
                    }}
                  />
                </div>
              )}

              {/* Error */}
              {(authConfigError || error) && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{
                    background: "#FEE2E2",
                    color: "#B91C1C",
                    border: "1px solid rgba(220,38,38,0.2)",
                  }}
                >
                  {error ?? authConfigError}
                </div>
              )}

              {/* Primary CTA */}
              <button
                type="button"
                onClick={
                  step === "PHONE" ? () => handleSendOTP() : handleVerifyOTP
                }
                disabled={
                  (step === "PHONE" ? phone.length < 10 : otp.length < 6) ||
                  isLoading
                }
                className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #F5A623, #E8920F)",
                  boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
                }}
              >
                {isLoading
                  ? step === "PHONE"
                    ? "Sending…"
                    : "Verifying…"
                  : step === "PHONE"
                    ? "Send OTP"
                    : "Verify & Sign In"}
                <span className="material-symbols-outlined text-[18px]">
                  {step === "PHONE" ? "sms" : "check_circle"}
                </span>
              </button>

              {/* Register link */}
              {step === "PHONE" && (
                <p className="text-center text-sm" style={{ color: "#5A6A8A" }}>
                  New to Domvio?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-bold hover:underline"
                    style={{ color: "#1B2B5E" }}
                  >
                    Create account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Demo bypass (collapsible) ── */}
        {step === "PHONE" && (
          <details
            className="group rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(27,43,94,0.08)",
              background: "#FFFFFF",
            }}
          >
            <summary
              className="px-5 py-4 text-xs font-bold uppercase tracking-widest cursor-pointer list-none flex items-center justify-between"
              style={{ color: "#8A9AB8" }}
            >
              Investor Demo
              <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSendOTP("+910000000000")}
                className="w-full rounded-xl py-3 text-sm font-bold transition-colors"
                style={{
                  background: "#EEF1F8",
                  color: "#1B2B5E",
                  border: "1px solid rgba(27,43,94,0.1)",
                }}
              >
                Login as Demo Landlord
              </button>
              <button
                type="button"
                onClick={() => handleSendOTP("+911111111111")}
                className="w-full rounded-xl py-3 text-sm font-bold transition-colors"
                style={{
                  background: "#EEF1F8",
                  color: "#1B2B5E",
                  border: "1px solid rgba(27,43,94,0.1)",
                }}
              >
                Login as Demo Tenant
              </button>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default Login;
