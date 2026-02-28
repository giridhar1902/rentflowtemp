import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";

type Role = "landlord" | "tenant";

type NavItem = {
  icon: string;
  label: string;
  path: string;
  isActive: (pathname: string) => boolean;
};

type FloatingDockProps = {
  role: Role;
};

const buildLandlordItems = (): NavItem[] => [
  {
    icon: "dashboard",
    label: "Home",
    path: "/landlord/dashboard",
    isActive: (pathname) => pathname === "/landlord/dashboard",
  },
  {
    icon: "domain",
    label: "Properties",
    path: "/landlord/properties",
    isActive: (pathname) =>
      pathname === "/landlord/properties" ||
      pathname.startsWith("/landlord/property/"),
  },
  {
    icon: "payments",
    label: "Finance",
    path: "/landlord/finance",
    isActive: (pathname) =>
      pathname === "/landlord/finance" || pathname === "/landlord/payments",
  },
  {
    icon: "chat_bubble",
    label: "Chat",
    path: "/chat",
    isActive: (pathname) => pathname === "/chat",
  },
  {
    icon: "person",
    label: "Profile",
    path: "/profile",
    isActive: (pathname) =>
      pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];

const buildTenantItems = (): NavItem[] => [
  {
    icon: "home",
    label: "Home",
    path: "/tenant/home",
    isActive: (pathname) =>
      pathname === "/tenant/home" || pathname.startsWith("/tenant/property/"),
  },
  {
    icon: "receipt_long",
    label: "History",
    path: "/tenant/pay",
    isActive: (pathname) => pathname === "/tenant/pay",
  },
  {
    icon: "description",
    label: "Documents",
    path: "/lease",
    isActive: (pathname) => pathname === "/lease",
  },
  {
    icon: "person",
    label: "Profile",
    path: "/profile",
    isActive: (pathname) =>
      pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];

const FloatingDock: React.FC<FloatingDockProps> = ({ role }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = role === "landlord" ? buildLandlordItems() : buildTenantItems();

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(var(--layout-safe-area-bottom)+0.75rem)]"
    >
      <div className="pointer-events-auto w-full max-w-[calc(var(--layout-app-frame-max-width)-1.5rem)] rounded-[var(--radius-pill)] border border-border-subtle bg-surface/95 px-2.5 py-2 shadow-floating supports-[backdrop-filter]:backdrop-blur-[8px]">
        <ul className="m-0 flex list-none items-center justify-between gap-1 p-0">
          {items.map((item) => {
            const active = item.isActive(pathname);
            return (
              <li key={item.label} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "motion-press relative flex w-full select-none flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] px-2 py-1.5",
                    "transition-colors duration-[var(--motion-standard)] ease-[var(--motion-easing)]",
                    active
                      ? "-translate-y-[1px] text-primary"
                      : "text-text-secondary",
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[21px]"
                    style={{
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    }}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span className="truncate text-[10px] font-semibold">
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-1 h-[2px] w-7 origin-center rounded-full bg-brass",
                      "transition-transform duration-[var(--motion-standard)] ease-[var(--motion-easing)]",
                      active
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default FloatingDock;
