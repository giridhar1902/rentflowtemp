import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultRouteForRole } from "../lib/routes";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, error: authConfigError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (
    overrideEmail?: string,
    overridePassword?: string,
  ) => {
    const finalEmail = overrideEmail ?? email;
    const finalPassword = overridePassword ?? password;

    if (!finalEmail || !finalPassword) return;

    setIsLoading(true);
    setError(null);
    try {
      const profile = await signIn(finalEmail.trim(), finalPassword);
      navigate(defaultRouteForRole(profile.role), { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to login. Please try again.",
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
            Sign in with your account to continue.
          </p>
        </div>

        <div className="relative mt-2 overflow-hidden rounded-[24px] border border-white/40 bg-white/[0.35] backdrop-blur-[20px] p-[26px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {/* Accent Spine */}
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-gradient-to-b from-[#FF9A3D] to-[#FF7A00]"></div>

          <div className="flex flex-col gap-5 pl-1.5">
            <div>
              <label className="mb-2.5 block text-[14px] font-bold text-[#1e293b] tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="landlord@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[14px] bg-white/50 px-4 py-3.5 text-[15px] text-[#1e293b] placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#FF9A3D]/40 transition-all border border-white/40 focus:border-white/60 focus:bg-white/70 shadow-sm"
              />
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-[14px] font-bold text-[#1e293b] tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[13px] font-medium text-[#FF7A00] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[14px] bg-white/50 px-4 py-3.5 text-[15px] font-mono tracking-widest text-[#1e293b] placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#FF9A3D]/40 border border-white/40 focus:border-white/60 focus:bg-white/70 shadow-sm transition-all"
              />
            </div>

            {(authConfigError || error) && (
              <p className="text-[15px] font-medium text-[#F07167] mt-1">
                {error ?? authConfigError}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={!email || !password || isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,0.3)] transition-all hover:shadow-[0_12px_25px_rgba(255,122,0,0.4)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isLoading ? "Logging in..." : "Log In"}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>

            {/* DEMO LOGIN BUTTONS */}
            <div className="mt-4 pt-4 border-t border-white/30 flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center mb-1">
                Development Access
              </p>
              <button
                type="button"
                onClick={() => handleLogin("landlord@demo.com", "demo123")}
                className="w-full rounded-xl bg-white/40 py-3 text-[14px] font-bold text-[#1e293b] hover:bg-white/60 transition-colors border border-white/50 shadow-sm"
              >
                Login as Landlord
              </button>
              <button
                type="button"
                onClick={() => handleLogin("tenant@demo.com", "demo123")}
                className="w-full rounded-xl bg-white/40 py-3 text-[14px] font-bold text-[#1e293b] hover:bg-white/60 transition-colors border border-white/50 shadow-sm"
              >
                Login as Tenant
              </button>
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-[15px] text-slate-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-bold text-[#FF7A00] hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
