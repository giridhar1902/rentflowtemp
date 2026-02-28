import { AppRole } from "./api";

export const defaultRouteForRole = (role?: AppRole | null) => {
  if (role === "LANDLORD" || role === "ADMIN") {
    return "/landlord/dashboard";
  }
  if (role === "TENANT") {
    return "/tenant/home";
  }
  return "/login";
};
