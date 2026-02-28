import { describe, expect, it } from "vitest";
import { defaultRouteForRole } from "./routes";

describe("defaultRouteForRole", () => {
  it("routes landlord and admin to landlord dashboard", () => {
    expect(defaultRouteForRole("LANDLORD")).toBe("/landlord/dashboard");
    expect(defaultRouteForRole("ADMIN")).toBe("/landlord/dashboard");
  });

  it("routes tenant to tenant home", () => {
    expect(defaultRouteForRole("TENANT")).toBe("/tenant/home");
  });

  it("falls back to login when role is unavailable", () => {
    expect(defaultRouteForRole(null)).toBe("/login");
    expect(defaultRouteForRole(undefined)).toBe("/login");
  });
});
