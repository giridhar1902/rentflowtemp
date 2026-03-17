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
    isActive: (p) => p === "/landlord/dashboard",
  },
  {
    icon: "domain",
    label: "Properties",
    path: "/landlord/properties",
    isActive: (p) =>
      p === "/landlord/properties" || p.startsWith("/landlord/property/"),
  },
  {
    icon: "payments",
    label: "Payments",
    path: "/landlord/payments",
    isActive: (p) => p === "/landlord/payments" || p === "/landlord/finance",
  },
  {
    icon: "build",
    label: "Maintenance",
    path: "/landlord/maintenance",
    isActive: (p) => p === "/landlord/maintenance",
  },
];

const buildTenantItems = (): NavItem[] => [
  {
    icon: "home",
    label: "Home",
    path: "/tenant/home",
    isActive: (p) => p === "/tenant/home" || p.startsWith("/tenant/property/"),
  },
  {
    icon: "receipt_long",
    label: "History",
    path: "/tenant/pay",
    isActive: (p) => p === "/tenant/pay",
  },
  {
    icon: "description",
    label: "Documents",
    path: "/lease",
    isActive: (p) => p === "/lease",
  },
  {
    icon: "person",
    label: "Profile",
    path: "/profile",
    isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
  },
];

const FloatingDock: React.FC<{ role: Role }> = ({ role }) => {
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
            "relative flex w-full select-none flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors",
            active ? "text-[#1B2B5E]" : "text-[#5A6A8A]",
          )}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            aria-hidden
          >
            {item.icon}
          </span>
          <span
            className={cn(
              "truncate text-[10px] font-bold",
              active ? "text-[#1B2B5E]" : "text-[#8A9AB8]",
            )}
          >
            {item.label}
          </span>
          {/* Gold active indicator */}
          <span
            aria-hidden
            className="absolute -bottom-0.5 h-[3px] w-6 rounded-full transition-all duration-200 origin-center"
            style={{
              background: "#F5A623",
              transform: active ? "scaleX(1)" : "scaleX(0)",
              opacity: active ? 1 : 0,
            }}
          />
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Action sheet backdrop */}
      {actionSheetOpen && role === "landlord" && (
        <div
          className="fixed inset-0 z-[2000]"
          style={{
            background: "rgba(27,43,94,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setActionSheetOpen(false)}
        />
      )}

      {/* Action sheet panel */}
      {actionSheetOpen && role === "landlord" && (
        <div
          className="fixed z-[2001] rounded-t-[28px] p-6 w-[100%] max-w-[420px] inset-x-0 mx-auto motion-modal-enter flex flex-col items-center"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 -8px 32px rgba(27,43,94,0.14)",
            bottom: 0,
            paddingBottom: "calc(110px + var(--layout-safe-area-bottom, 0px))",
          }}
        >
          <div
            className="w-10 h-1 rounded-full mb-5"
            style={{ background: "rgba(27,43,94,0.15)" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#F5A623" }}
          >
            Quick Actions
          </p>
          <div className="grid grid-cols-4 gap-3 w-full max-w-[340px]">
            {LANDLORD_QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action.path)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="flex size-14 items-center justify-center rounded-2xl border transition-colors"
                  style={{
                    background: "#F8F9FA",
                    borderColor: "rgba(27,43,94,0.1)",
                    color: "#1B2B5E",
                  }}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {action.icon}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold text-center leading-tight"
                  style={{ color: "#5A6A8A" }}
                >
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dock + FAB wrapper */}
      <div
        className={cn(
          "fixed z-[1000] w-[92%] max-w-[420px] left-1/2 -translate-x-1/2 transition-transform duration-500",
          actionSheetOpen && role === "landlord"
            ? "translate-y-[150%]"
            : "translate-y-0",
        )}
        style={{
          bottom:
            "calc(14px + var(--layout-safe-area-bottom, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <nav
          aria-label="Primary"
          className="w-full h-[68px] flex flex-col justify-center px-2.5 rounded-[36px]"
          style={{
            background: "#FFFFFF",
            boxShadow:
              "0 4px 24px rgba(27,43,94,0.12), 0 1px 4px rgba(27,43,94,0.06)",
            border: "1px solid rgba(27,43,94,0.08)",
          }}
        >
          <ul className="m-0 flex list-none items-center justify-between gap-1 p-0">
            {role === "landlord" ? (
              <>
                {items.slice(0, 2).map(renderNavItem)}
                {/* FAB spacer */}
                <li className="relative w-[72px] flex items-center justify-center shrink-0" />
                {items.slice(2).map(renderNavItem)}
              </>
            ) : (
              items.map(renderNavItem)
            )}
          </ul>
        </nav>

        {/* Landlord FAB */}
        {role === "landlord" && (
          <div className="absolute top-[-26px] left-1/2 -translate-x-1/2 z-[10]">
            <button
              type="button"
              onClick={() => setActionSheetOpen((p) => !p)}
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white transition-all duration-300 active:scale-95"
              style={{
                background: "linear-gradient(145deg, #F5A623, #E8920F)",
                boxShadow: "0 8px 24px rgba(245,166,35,0.45)",
                transform: actionSheetOpen ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <span className="material-symbols-outlined text-[26px]">add</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingDock;
