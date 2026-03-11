import React, { useState } from "react";
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

const LANDLORD_QUICK_ACTIONS = [
  { icon: "domain_add", label: "Add Property", path: "/landlord/add-property" },
  { icon: "meeting_room", label: "Add Unit", path: "/landlord/properties" },
  { icon: "person_add", label: "Add Tenant", path: "/landlord/properties" },
  { icon: "receipt_long", label: "Utility Bill", path: "/landlord/properties" },
];

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
    label: "Payments",
    path: "/landlord/payments",
    isActive: (pathname) =>
      pathname === "/landlord/payments" || pathname === "/landlord/finance",
  },
  {
    icon: "build",
    label: "Maintenance",
    path: "/landlord/maintenance",
    isActive: (pathname) => pathname === "/landlord/maintenance",
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
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  const items = role === "landlord" ? buildLandlordItems() : buildTenantItems();

  const handleAction = (path: string) => {
    setActionSheetOpen(false);
    navigate(path);
  };

  const renderNavItem = (item: NavItem) => {
    const active = item.isActive(pathname);
    return (
      <li key={item.label} className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => {
            setActionSheetOpen(false);
            navigate(item.path);
          }}
          className={cn(
            "motion-press relative flex w-full select-none flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] px-2 py-1.5",
            "transition-colors duration-[var(--motion-standard)] ease-[var(--motion-easing)]",
            active ? "-translate-y-[1px] text-primary" : "text-text-secondary",
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
              active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
            )}
          />
        </button>
      </li>
    );
  };

  return (
    <>
      {actionSheetOpen && role === "landlord" && (
        <div
          className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-[4px]"
          onClick={() => setActionSheetOpen(false)}
        />
      )}

      {actionSheetOpen && role === "landlord" && (
        <div
          className="fixed z-[2001] bg-white/90 backdrop-blur-[20px] border border-white/60 rounded-t-[32px] p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] w-[100%] max-w-[420px] inset-x-0 mx-auto motion-modal-enter flex flex-col items-center"
          style={{
            bottom: "0",
            paddingBottom: "calc(100px + var(--layout-safe-area-bottom, 0px))",
          }}
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 mb-5"></div>
          <div className="grid grid-cols-4 gap-3 w-full max-w-[340px]">
            {LANDLORD_QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action.path)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 group-hover:text-[#ff8a00] group-hover:border-[#ff8a00]/30 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">
                    {action.icon}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight px-1">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button & Nav Wrapper */}
      <div
        className={cn(
          "fixed z-[1000] w-[92%] max-w-[420px] left-1/2 -translate-x-1/2 transition-transform duration-500",
          actionSheetOpen && role === "landlord"
            ? "translate-y-[150%]"
            : "translate-y-0",
        )}
        style={{
          bottom:
            "calc(16px + var(--layout-safe-area-bottom, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <nav
          aria-label="Primary"
          className="w-full h-[72px] flex flex-col justify-center bg-white/[0.35] backdrop-blur-[20px] rounded-[36px] border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-2.5"
        >
          <ul className="m-0 flex list-none items-center justify-between gap-1 p-0 relative">
            {role === "landlord" ? (
              <>
                {items.slice(0, 2).map(renderNavItem)}
                <li className="relative w-[72px] flex items-center justify-center shrink-0">
                  {/* Reserved space for the absolute action button positioned in the wrapper */}
                </li>
                {items.slice(2).map(renderNavItem)}
              </>
            ) : (
              items.map(renderNavItem)
            )}
          </ul>
        </nav>

        {role === "landlord" && (
          <div className="absolute top-[-28px] left-1/2 -translate-x-1/2 z-[10]">
            <button
              type="button"
              onClick={() => setActionSheetOpen((prev) => !prev)}
              className="w-[64px] h-[64px] rounded-full bg-[#ff8a00] flex items-center justify-center text-white shadow-[0_12px_30px_rgba(255,138,0,0.4)] transition-transform duration-300 active:scale-95"
              style={{
                transform: actionSheetOpen ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingDock;
