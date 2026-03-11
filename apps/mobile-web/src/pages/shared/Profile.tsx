import React from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { ThemeModeToggle } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const toUiRole = (role?: string) =>
  role === "LANDLORD" ? "landlord" : "tenant";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    profile?.email ||
    "User";
  const roleLabel = profile?.role ?? "TENANT";

  return (
    <AppLayout
      title="Profile & Settings"
      bottomNavRole={toUiRole(profile?.role)}
      className="px-5 pt-6 flex flex-col gap-6 motion-page-enter"
    >
      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-[24px] border border-primary/30 bg-white/40 backdrop-blur-[20px] p-6 shadow-sm flex flex-col items-center gap-4 group">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] opacity-80"></div>

        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-primary bg-white text-[32px] font-black text-primary shadow-[0_4px_15px_rgba(255,122,0,0.2)] group-hover:scale-105 transition-transform duration-300">
          {(
            profile?.firstName?.[0] ??
            profile?.email?.[0] ??
            "U"
          ).toUpperCase()}
        </div>

        <div className="text-center">
          <p className="text-[20px] font-black text-text-primary mb-1 drop-shadow-sm">
            {fullName}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest">
              {roleLabel}
            </span>
            <span className="text-[13px] font-bold text-text-secondary">
              {profile?.email ?? ""}
            </span>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary pl-1">
          Account
        </h2>

        <div className="rounded-[24px] border border-white/50 bg-white/40 backdrop-blur-[20px] overflow-hidden shadow-sm">
          <div className="flex flex-col">
            <button
              onClick={() => navigate("/profile/account")}
              className="flex w-full items-center gap-4 border-b border-white/40 p-4 text-left hover:bg-white/60 active:bg-white/70 transition-all group"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                  person
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black text-text-primary group-hover:text-primary transition-colors">
                  Account Information
                </p>
                <p className="text-[12px] font-bold text-text-secondary">
                  Personal details, contact data
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>

            <button
              onClick={() => navigate("/profile/payments")}
              className="flex w-full items-center gap-4 border-b border-white/40 p-4 text-left hover:bg-white/60 active:bg-white/70 transition-all group"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                  payments
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black text-text-primary group-hover:text-primary transition-colors">
                  Payment Methods
                </p>
                <p className="text-[12px] font-bold text-text-secondary">
                  Payment setup and history views
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>

            <button
              onClick={() => navigate("/vault")}
              className="flex w-full items-center gap-4 border-b border-white/40 p-4 text-left hover:bg-white/60 active:bg-white/70 transition-all group"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                  folder_special
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black text-text-primary group-hover:text-primary transition-colors">
                  Document Vault
                </p>
                <p className="text-[12px] font-bold text-text-secondary">
                  Secure storage for leases and files
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>

            <button
              onClick={() => navigate("/activity")}
              className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/60 active:bg-white/70 transition-all group"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                  notifications
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black text-text-primary group-hover:text-primary transition-colors">
                  Activity Center
                </p>
                <p className="text-[12px] font-bold text-text-secondary">
                  Recent notifications and updates
                </p>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Appearance Settings */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary pl-1">
          Appearance
        </h2>

        <div className="rounded-[24px] border border-white/50 bg-white/40 backdrop-blur-[20px] p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-black text-text-primary mb-0.5">
              Theme Mode
            </p>
            <p className="text-[12px] font-bold text-text-secondary">
              Choose system, light, or dark mode.
            </p>
          </div>
          <div className="shrink-0 bg-white/60 p-1 rounded-[16px] border border-white/50 shadow-inner">
            <ThemeModeToggle />
          </div>
        </div>
      </section>

      {/* Logout Button */}
      <button
        onClick={async () => {
          await signOut();
          navigate("/login", { replace: true });
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-danger/30 bg-danger/10 py-4 text-[14px] font-black uppercase tracking-[0.1em] text-danger hover:bg-danger/20 transition-colors shadow-sm active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Logout
      </button>
    </AppLayout>
  );
};

export default Profile;
