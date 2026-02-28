import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout";
import { Button, InstitutionCard, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { defaultRouteForRole } from "../lib/routes";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, error: authConfigError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await signIn(email.trim(), password);
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
    <PageLayout
      className="flex min-h-screen items-center justify-center"
      contentClassName="w-full !px-4 !py-8"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 motion-page-enter">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-secondary">
            RentFlow
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in with your account to continue.
          </p>
        </div>

        <InstitutionCard
          accentSpine
          elevation="raised"
          className="section-stack"
        >
          <TextField
            label="Email Address"
            placeholder="yourname@email.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">Password</p>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <TextField
              label={null}
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {(authConfigError || error) && (
            <p className="text-sm font-medium text-danger">
              {error ?? authConfigError}
            </p>
          )}

          <Button
            type="button"
            onClick={handleLogin}
            disabled={!email || !password}
            loading={isLoading}
            size="lg"
            trailingIcon={
              <span className="material-symbols-outlined">arrow_forward</span>
            }
            className="w-full"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </InstitutionCard>

        <p className="text-center text-sm text-text-secondary">
          Don't have an account?
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="ml-1 font-semibold text-primary hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </PageLayout>
  );
};

export default Login;
