import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppRole } from "../lib/api";
import { defaultRouteForRole } from "../lib/routes";
import Splash from "../pages/Splash";

type ProtectedRouteProps = {
  allowedRoles?: AppRole[];
  children: React.ReactElement;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isLoading, session, profile } = useAuth();

  if (isLoading) {
    return <Splash />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Splash />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile.role)) {
    return <Navigate to={defaultRouteForRole(profile.role)} replace />;
  }

  return children;
};

type PublicOnlyRouteProps = {
  children: React.ReactElement;
};

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
}) => {
  const { isLoading, session, profile } = useAuth();

  if (isLoading) {
    return <Splash />;
  }

  if (session && profile) {
    return <Navigate to={defaultRouteForRole(profile.role)} replace />;
  }

  if (session && !profile) {
    return <Splash />;
  }

  return children;
};
