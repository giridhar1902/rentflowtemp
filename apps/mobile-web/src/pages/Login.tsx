import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultRouteForRole } from "../lib/routes";

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

    // Ensure +91 is added if not present (assuming Indian numbers based on prompt)
    const formattedPhone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91${rawPhone}`;

    setIsLoading(true);
    setError(null);
    try {
      await signInWithPhone(formattedPhone);

      // Auto-verify the demo bypass strings
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
        err instanceof Error
          ? err.message
          : "Invalid OTP code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 font-sans w-full">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 motion-page-enter">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            RENTFLOW
          </p>
          <h1 className="mt-2 text-[32px] font-bold tracking-tight text-[#1e293b] mb-2">
            Welcome back
          </h1>
          <p className="text-[15px] text-slate-600">
            {step === "PHONE"
              ? "Sign in with your phone to continue."
              : "Enter the 6-digit code sent to your phone."}
          </p>
        </div>

        <div className="relative mt-2 overflow-hidden rounded-[24px] border border-white/40 bg-white/[0.35] backdrop-blur-[20px] p-[26px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {/* Accent Spine */}
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-gradient-to-b from-[#FF9A3D] to-[#FF7A00]"></div>

          <div className="flex flex-col gap-5 pl-1.5">
            {step === "PHONE" ? (
              <div>
                <label className="mb-2.5 block text-[14px] font-bold text-[#1e293b] tracking-wide">
                  Phone Number
                </label>
                <div className="flex rounded-[14px] bg-white/50 border border-white/40 overflow-hidden focus-within:ring-2 focus-within:ring-[#FF9A3D]/40 focus-within:border-white/60 focus-within:bg-white/70 shadow-sm transition-all">
                  <div className="px-4 py-3.5 border-r border-white/40 text-[15px] font-bold text-slate-500 bg-white/30 truncate flex items-center justify-center">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="w-full px-4 py-3.5 text-[15px] font-medium tracking-wide text-[#1e293b] placeholder-slate-400 bg-transparent outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-[14px] font-bold text-[#1e293b] tracking-wide">
                    6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setOtp("");
                      setError(null);
                    }}
                    className="text-[13px] font-medium text-[#FF7A00] hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-[14px] bg-white/50 px-4 py-3.5 text-center text-[20px] font-mono tracking-[0.5em] text-[#1e293b] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF9A3D]/40 border border-white/40 focus:border-white/60 focus:bg-white/70 shadow-sm transition-all"
                />
              </div>
            )}

            {(authConfigError || error) && (
              <p className="text-[14px] font-medium text-[#F07167] mt-1 bg-[#F07167]/10 p-2.5 rounded-lg border border-[#F07167]/20">
                {error ?? authConfigError}
              </p>
            )}

            {step === "PHONE" ? (
              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={phone.length < 10 || isLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,0.3)] transition-all hover:shadow-[0_12px_25px_rgba(255,122,0,0.4)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
                <span className="material-symbols-outlined text-[20px]">
                  sms
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={otp.length < 6 || isLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,0.3)] transition-all hover:shadow-[0_12px_25px_rgba(255,122,0,0.4)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {isLoading ? "Verifying..." : "Verify & Log In"}
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
              </button>
            )}

            {/* DEMO LOGIN BUTTON */}
            {step === "PHONE" && (
              <div className="mt-4 pt-4 border-t border-white/30 flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center mb-1">
                  Investor Demo Auth Bypass
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendOTP("+910000000000")}
                    className="w-full rounded-xl bg-white/40 py-3 text-[14px] font-bold text-[#1e293b] hover:bg-white/60 transition-colors border border-white/50 shadow-sm"
                  >
                    Login as Demo Landlord
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendOTP("+911111111111")}
                    className="w-full rounded-xl bg-white/40 py-3 text-[14px] font-bold text-[#1e293b] hover:bg-white/60 transition-colors border border-white/50 shadow-sm"
                  >
                    Login as Demo Tenant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
