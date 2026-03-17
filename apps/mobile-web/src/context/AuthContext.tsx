import { Session, type AuthChangeEvent } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api, type AppRole, type MeResponse } from "../lib/api";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type SignUpResult = {
  needsEmailConfirmation: boolean;
  profile?: MeResponse | null;
};

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  token: string | null;
  profile: MeResponse | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<MeResponse>;
  signUp: (
    email: string,
    password: string,
    role: AppRole,
  ) => Promise<SignUpResult>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<MeResponse>;
  registerWithPhone: (
    phone: string,
    otp: string,
    role: AppRole,
  ) => Promise<MeResponse>;
  signOut: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<MeResponse | null>;
  setOnboardingRole: (role: AppRole) => Promise<MeResponse>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const onboardingRoleKey = "onboarding-role";

const persistOnboardingRole = (role: AppRole) => {
  try {
    window.sessionStorage.setItem(onboardingRoleKey, role);
  } catch {
    // no-op
  }
};

const consumeOnboardingRole = (): AppRole | null => {
  try {
    const value = window.sessionStorage.getItem(onboardingRoleKey);
    window.sessionStorage.removeItem(onboardingRoleKey);
    if (value === "LANDLORD" || value === "TENANT") {
      return value;
    }
  } catch {
    // no-op
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (nextSession: Session) => {
    const accessToken = nextSession.access_token;
    const me = await api.getMe(accessToken);
    setProfile(me);
    return me;
  };

  const maybeApplyPendingRole = async (nextSession: Session) => {
    const pendingRole = consumeOnboardingRole();
    if (!pendingRole) {
      return null;
    }

    const updated = await api.setOnboardingRole(
      nextSession.access_token,
      pendingRole,
    );
    await supabase?.auth.refreshSession();
    setProfile(updated);
    return updated;
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let disposed = false;

    const syncSession = async (nextSession: Session | null) => {
      if (nextSession) {
        setIsLoading(true);
      }
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const roleApplied = await maybeApplyPendingRole(nextSession);
        if (!roleApplied) {
          await loadProfile(nextSession);
        }
        setError(null);
      } catch (syncError) {
        const message =
          syncError instanceof Error
            ? syncError.message
            : "Session sync failed";
        setError(message);
        // Keep auth state consistent for the router: profile load failure should
        // not leave a truthy session with missing profile data.
        setSession(null);
        setProfile(null);
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => syncSession(data.session))
      .catch((getSessionError) => {
        const message =
          getSessionError instanceof Error
            ? getSessionError.message
            : "Unable to initialize session";
        setError(message);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, nextSession: Session | null) => {
        await syncSession(nextSession);
      },
    );

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase || email.endsWith("@demo.com")) {
      const role = email.toLowerCase().includes("landlord")
        ? "LANDLORD"
        : "TENANT";
      const fakeSession = {
        access_token: "fake-token",
        user: { id: `fake-${role.toLowerCase()}-id` },
      } as any;
      const fakeProfile = {
        id: `fake-${role.toLowerCase()}-id`,
        email,
        role,
        firstName: "Demo User",
      } as any;
      setSession(fakeSession);
      setProfile(fakeProfile);
      return fakeProfile;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );
    if (signInError) {
      throw signInError;
    }
    if (!data.session) {
      throw new Error("Sign-in succeeded but session was not created");
    }

    const me = await loadProfile(data.session);
    setSession(data.session);
    return me;
  };

  const signInWithPhone = async (phone: string) => {
    if (
      !isSupabaseConfigured ||
      !supabase ||
      phone === "+910000000000" ||
      phone === "+911111111111"
    ) {
      // Just simulate success for the investor demo bypass
      return;
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    if (otpError) {
      throw otpError;
    }
  };

  const verifyPhoneOTP = async (phone: string, token: string) => {
    // Demo bypass — sign in with real Supabase email+password account
    if (phone === "+910000000000" || phone === "+911111111111") {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Supabase is not configured");
      }
      const email =
        phone === "+910000000000"
          ? "demo-landlord@domvio.app"
          : "demo-tenant@domvio.app";
      const { data, error: demoError } = await supabase.auth.signInWithPassword(
        {
          email,
          password: "Demo@12345",
        },
      );
      if (demoError) {
        throw new Error(
          "Demo account not set up yet. Run: cd apps/api && npx tsx prisma/seed-demo.ts",
        );
      }
      if (!data.session) throw new Error("Demo sign-in failed");
      const me = await loadProfile(data.session);
      setSession(data.session);
      return me;
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (verifyError) {
      throw verifyError;
    }
    if (!data.session) {
      throw new Error("Verification succeeded but no session was returned.");
    }

    const me = await loadProfile(data.session);
    setSession(data.session);
    return me;
  };

  const signUp = async (email: string, password: string, role: AppRole) => {
    if (!supabase) {
      throw new Error("Supabase is not configured");
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/#/login`,
      },
    });
    if (signUpError) {
      throw signUpError;
    }

    persistOnboardingRole(role);
    if (!data.session) {
      return { needsEmailConfirmation: true, profile: null };
    }

    const updatedProfile = await api.setOnboardingRole(
      data.session.access_token,
      role,
    );
    await supabase.auth.refreshSession();
    setSession(data.session);
    setProfile(updatedProfile);
    return { needsEmailConfirmation: false, profile: updatedProfile };
  };

  const registerWithPhone = async (
    phone: string,
    otp: string,
    role: AppRole,
  ): Promise<MeResponse> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured");
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (verifyError) throw verifyError;
    if (!data.session) {
      throw new Error("Verification succeeded but no session was returned.");
    }

    const updated = await api.setOnboardingRole(
      data.session.access_token,
      role,
    );
    await supabase.auth.refreshSession();
    setSession(data.session);
    setProfile(updated);
    return updated;
  };

  const signOut = async () => {
    if (!supabase) {
      setSession(null);
      setProfile(null);
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw signOutError;
    }
    setSession(null);
    setProfile(null);
  };

  const sendResetPasswordEmail = async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured");
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/#/reset-password`,
      },
    );
    if (resetError) {
      throw resetError;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured");
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      throw updateError;
    }
  };

  const refreshProfile = async () => {
    if (!session) {
      setProfile(null);
      return null;
    }
    const me = await loadProfile(session);
    setProfile(me);
    return me;
  };

  const setOnboardingRole = async (role: AppRole) => {
    if (!session) {
      throw new Error("No active session");
    }
    const updated = await api.setOnboardingRole(session.access_token, role);
    setProfile(updated);
    return updated;
  };

  const value: AuthContextValue = {
    isConfigured: isSupabaseConfigured,
    isLoading,
    session,
    token: session?.access_token || null,
    profile,
    error,
    signIn,
    signUp,
    signInWithPhone,
    verifyPhoneOTP,
    registerWithPhone,
    signOut,
    sendResetPasswordEmail,
    updatePassword,
    refreshProfile,
    setOnboardingRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
