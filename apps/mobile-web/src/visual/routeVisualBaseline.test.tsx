import React from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "../theme/theme";

const nativeConsoleError = console.error;
const nativeConsoleWarn = console.warn;

const landlordProfile = {
  id: "user-landlord-1",
  authUserId: "auth-landlord-1",
  email: "landlord@example.com",
  role: "LANDLORD" as const,
  firstName: "Morgan",
  lastName: "Lee",
  landlordProfile: {
    id: "lp-1",
    companyName: "Atlas Realty",
  },
};

const tenantProfile = {
  id: "user-tenant-1",
  authUserId: "auth-tenant-1",
  email: "tenant@example.com",
  role: "TENANT" as const,
  firstName: "Avery",
  lastName: "Quinn",
  tenantProfile: {
    id: "tp-1",
    emergencyContactName: "Jamie Quinn",
    emergencyContactPhone: "+1-555-0101",
  },
};

const lease = {
  id: "lease-1",
  propertyId: "property-1",
  unitId: "unit-1",
  landlordId: "user-landlord-1",
  tenantId: "user-tenant-1",
  status: "ACTIVE",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  monthlyRent: "2200",
  securityDeposit: "2200",
  dueDay: 5,
  property: {
    id: "property-1",
    name: "Riverstone Residences",
    city: "Austin",
    state: "TX",
    addressLine1: "1100 Market Street",
    postalCode: "78701",
  },
  unit: {
    id: "unit-1",
    name: "Unit 4B",
    monthlyRent: "2200",
    bedrooms: 2,
    bathrooms: 2,
    occupancy: 4,
  },
  landlord: {
    id: "user-landlord-1",
    firstName: "Morgan",
    lastName: "Lee",
    email: "landlord@example.com",
  },
  tenant: {
    id: "user-tenant-1",
    firstName: "Avery",
    lastName: "Quinn",
    email: "tenant@example.com",
  },
};

const property = {
  id: "property-1",
  ownerId: "user-landlord-1",
  name: "Riverstone Residences",
  propertyType: "Apartment",
  floors: 8,
  totalUnits: 24,
  amenities: ["Parking", "Gym", "24/7 Security"],
  status: "ACTIVE",
  ownership: "SELF_OWNED",
  addressLine1: "1100 Market Street",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  country: "US",
  units: [
    {
      id: "unit-1",
      propertyId: "property-1",
      name: "Unit 4B",
      bedrooms: 2,
      bathrooms: 2,
      occupancy: 4,
      furnishing: "Semi-Furnished",
      status: "ACTIVE",
      monthlyRent: "2200",
      securityDeposit: "2200",
      maintenanceFee: "120",
    },
  ],
  leases: [lease],
};

const invitation = {
  id: "inv-1",
  propertyId: "property-1",
  unitId: "unit-1",
  inviteeEmail: "tenant@example.com",
  code: "INVITE123",
  status: "PENDING",
  expiresAt: "2026-04-01T00:00:00.000Z",
  inviteeRegistered: true,
  property: {
    id: "property-1",
    name: "Riverstone Residences",
  },
  unit: {
    id: "unit-1",
    name: "Unit 4B",
  },
};

const charge = {
  id: "charge-1",
  leaseId: "lease-1",
  periodStart: "2026-02-01",
  periodEnd: "2026-02-28",
  dueDate: "2026-03-05",
  baseRentAmount: "2200",
  maintenanceAmount: "120",
  utilityAmount: "80",
  lateFeeAmount: "0",
  totalAmount: "2400",
  balanceAmount: "2400",
  status: "OPEN",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  lease,
  payments: [],
};

const payment = {
  id: "payment-1",
  chargeId: "charge-1",
  amount: "600",
  currency: "USD",
  status: "REQUIRES_REVIEW",
  provider: "cash",
  reference: "CASH-1",
  createdAt: "2026-02-12T12:00:00.000Z",
  updatedAt: "2026-02-12T12:00:00.000Z",
  charge: {
    id: "charge-1",
    dueDate: "2026-03-05",
    totalAmount: "2400",
    balanceAmount: "1800",
    status: "OPEN",
    lease,
  },
};

const maintenanceRequest = {
  id: "maint-1",
  propertyId: "property-1",
  unitId: "unit-1",
  leaseId: "lease-1",
  requesterId: "user-tenant-1",
  title: "Kitchen sink leak",
  category: "Plumbing",
  details: "Water dripping under sink cabinet.",
  priority: "MEDIUM",
  emergency: false,
  status: "SUBMITTED",
  submittedAt: "2026-02-14T09:00:00.000Z",
  property: { id: "property-1", name: "Riverstone Residences" },
  unit: { id: "unit-1", name: "Unit 4B" },
};

const paymentMethod = {
  id: "pm-1",
  type: "CARD" as const,
  provider: "Visa",
  providerRef: "tok_test_123",
  last4: "4242",
  brand: "Visa",
  isDefault: true,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const chatThread = {
  id: "thread-1",
  leaseId: "lease-1",
  participants: [
    {
      userId: "user-tenant-1",
      role: "TENANT",
      user: {
        id: "user-tenant-1",
        firstName: "Avery",
        lastName: "Quinn",
        email: "tenant@example.com",
      },
    },
    {
      userId: "user-landlord-1",
      role: "LANDLORD",
      user: {
        id: "user-landlord-1",
        firstName: "Morgan",
        lastName: "Lee",
        email: "landlord@example.com",
      },
    },
  ],
};

const chatMessages = [
  {
    id: "msg-1",
    threadId: "thread-1",
    senderId: "user-tenant-1",
    content: "Hello, I sent the payment receipt.",
    messageType: "TEXT",
    createdAt: "2026-02-15T10:00:00.000Z",
  },
];

const billingSummary = {
  range: {
    from: "2025-09-01",
    to: "2026-02-28",
  },
  totals: {
    billed: "14400",
    collected: "12000",
    outstanding: "2400",
    overdue: "800",
    pendingReview: "600",
  },
  counts: {
    openCharges: 1,
    overdueCharges: 1,
    pendingCashApprovals: 1,
  },
  monthly: [
    {
      month: "2026-01",
      billed: "2400",
      collected: "2200",
    },
    {
      month: "2026-02",
      billed: "2400",
      collected: "1800",
    },
  ],
};

const authState = {
  isConfigured: true,
  isLoading: false,
  session: null as any,
  profile: null as any,
  error: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  updatePassword: vi.fn(),
  refreshProfile: vi.fn(),
  setOnboardingRole: vi.fn(),
};

const mockApi = {
  getMe: vi.fn(async () => landlordProfile),
  updateMe: vi.fn(async () => landlordProfile),
  setOnboardingRole: vi.fn(async () => landlordProfile),
  listProperties: vi.fn(async () => [property]),
  getProperty: vi.fn(async () => property),
  createProperty: vi.fn(async () => property),
  createUnit: vi.fn(async () => property.units[0]),
  createInvitation: vi.fn(async () => invitation),
  listInvitations: vi.fn(async () => [invitation]),
  listMyInvitations: vi.fn(async () => [invitation]),
  listLeases: vi.fn(async () => [lease]),
  getLease: vi.fn(async () => lease),
  acceptInvitation: vi.fn(async () => invitation),
  listCharges: vi.fn(async () => [charge]),
  getCharge: vi.fn(async () => charge),
  createOnlinePaymentSession: vi.fn(async () => ({
    paymentSessionId: "session_1",
    checkoutMode: "sandbox",
  })),
  generateMonthlyCharges: vi.fn(async () => ({
    month: "2026-02",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    eligibleLeaseCount: 1,
    createdCount: 1,
    existingCount: 0,
    charges: [charge],
  })),
  submitCashPayment: vi.fn(async () => payment),
  listPayments: vi.fn(async () => [payment]),
  listPendingPaymentReviews: vi.fn(async () => [payment]),
  reviewPayment: vi.fn(async () => payment),
  listPaymentMethods: vi.fn(async () => [paymentMethod]),
  createPaymentMethod: vi.fn(async () => paymentMethod),
  setDefaultPaymentMethod: vi.fn(async () => paymentMethod),
  getBillingSummary: vi.fn(async () => billingSummary),
  listMaintenanceRequests: vi.fn(async () => [maintenanceRequest]),
  getMaintenanceRequest: vi.fn(async () => maintenanceRequest),
  createMaintenanceRequest: vi.fn(async () => maintenanceRequest),
  updateMaintenanceRequestStatus: vi.fn(async () => maintenanceRequest),
  listMaintenanceComments: vi.fn(async () => []),
  addMaintenanceComment: vi.fn(async () => ({
    id: "comment-1",
    requestId: "maint-1",
    authorId: "user-tenant-1",
    comment: "Acknowledged",
    createdAt: "2026-02-15T11:00:00.000Z",
  })),
  listChatThreads: vi.fn(async () => [chatThread]),
  ensureLeaseThread: vi.fn(async () => chatThread),
  getChatThread: vi.fn(async () => chatThread),
  listChatMessages: vi.fn(async () => chatMessages),
  sendChatMessage: vi.fn(async () => ({
    ...chatMessages[0],
    id: "msg-2",
    content: "Noted.",
  })),
  listDocuments: vi.fn(async () => []),
  createDocumentUpload: vi.fn(async () => ({
    uploadUrl: "https://example.com/upload",
    documentId: "doc-1",
    expiresAt: "2026-03-10T00:00:00.000Z",
  })),
  uploadDocumentToSignedUrl: vi.fn(async () => ({
    uploaded: true,
    documentId: "doc-1",
    sizeBytes: 1024,
  })),
  getDocumentDownloadUrl: vi.fn(async () => ({
    downloadUrl: "https://example.com/file.pdf",
    expiresAt: "2026-03-10T00:00:00.000Z",
  })),
  listNotifications: vi.fn(async () => []),
  markNotificationRead: vi.fn(async () => ({
    id: "notif-1",
    type: "INFO",
    title: "Test",
    body: "Test",
    readAt: "2026-02-15T10:00:00.000Z",
    createdAt: "2026-02-15T09:00:00.000Z",
  })),
  markAllNotificationsRead: vi.fn(async () => ({ updatedCount: 0 })),
  listPushDevices: vi.fn(async () => []),
  registerPushDevice: vi.fn(async () => ({
    id: "device-1",
    platform: "web",
    token: "token",
    createdAt: "2026-02-15T09:00:00.000Z",
  })),
  removePushDevice: vi.fn(async () => ({ removed: true })),
};

vi.mock("../context/AuthContext", async () => {
  const ReactModule = await import("react");
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
    useAuth: () => authState,
  };
});

vi.mock("../lib/api", async (importOriginal) => {
  const original = (await importOriginal()) as object;
  return {
    ...original,
    api: mockApi,
  };
});

vi.mock("../components/NativeBridge", () => ({
  default: () => null,
}));

import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";

const setPreferredScheme = (mode: "light" | "dark") => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-color-scheme") ? mode === "dark" : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

const setAuthRouteState = (role: "LANDLORD" | "TENANT" | null) => {
  if (role === "LANDLORD") {
    authState.session = { access_token: "token-landlord" };
    authState.profile = landlordProfile;
  } else if (role === "TENANT") {
    authState.session = { access_token: "token-tenant" };
    authState.profile = tenantProfile;
  } else {
    authState.session = null;
    authState.profile = null;
  }

  authState.signIn.mockResolvedValue(
    role === "TENANT" ? tenantProfile : landlordProfile,
  );
  authState.signUp.mockResolvedValue({
    needsEmailConfirmation: false,
    profile: role === "TENANT" ? tenantProfile : landlordProfile,
  });
  authState.signOut.mockResolvedValue(undefined);
  authState.sendResetPasswordEmail.mockResolvedValue(undefined);
  authState.updatePassword.mockResolvedValue(undefined);
  authState.refreshProfile.mockResolvedValue(
    role === "TENANT" ? tenantProfile : landlordProfile,
  );
  authState.setOnboardingRole.mockResolvedValue(
    role === "TENANT" ? tenantProfile : landlordProfile,
  );
};

const renderRoute = async ({
  hash,
  mode,
  role,
}: {
  hash: string;
  mode: "light" | "dark";
  role: "LANDLORD" | "TENANT" | null;
}) => {
  setPreferredScheme(mode);
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  window.location.hash = hash;
  setAuthRouteState(role);

  const view = render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );

  await act(async () => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 1650);
    });
  });

  await waitFor(
    () => {
      expect(view.container.textContent).not.toContain(
        "Initializing Secure Session",
      );
    },
    { timeout: 10000 },
  );

  await waitFor(
    () => {
      expect(view.container.textContent).not.toContain("Loading view...");
    },
    { timeout: 10000 },
  );

  await act(async () => {
    await Promise.resolve();
  });

  return view;
};

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    value: vi.fn(),
  });

  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });

  vi.spyOn(console, "error").mockImplementation((...args) => {
    const firstArg = args[0];
    if (
      typeof firstArg === "string" &&
      firstArg.includes(
        "The width(0) and height(0) of chart should be greater than 0",
      )
    ) {
      return;
    }
    nativeConsoleError(...args);
  });

  vi.spyOn(console, "warn").mockImplementation((...args) => {
    const firstArg = args[0];
    if (
      typeof firstArg === "string" &&
      firstArg.includes(
        "The width(0) and height(0) of chart should be greater than 0",
      )
    ) {
      return;
    }
    nativeConsoleWarn(...args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  window.location.hash = "#/";
});

const scenarios: Array<{
  name: string;
  hash: string;
  role: "LANDLORD" | "TENANT" | null;
}> = [
  { name: "public-login", hash: "#/login", role: null },
  { name: "public-register", hash: "#/register", role: null },
  { name: "public-forgot-password", hash: "#/forgot-password", role: null },
  {
    name: "landlord-dashboard",
    hash: "#/landlord/dashboard",
    role: "LANDLORD",
  },
  { name: "landlord-finance", hash: "#/landlord/finance", role: "LANDLORD" },
  {
    name: "landlord-add-property",
    hash: "#/landlord/add-property",
    role: "LANDLORD",
  },
  {
    name: "landlord-maintenance",
    hash: "#/landlord/maintenance",
    role: "LANDLORD",
  },
  { name: "landlord-payments", hash: "#/landlord/payments", role: "LANDLORD" },
  { name: "tenant-home", hash: "#/tenant/home", role: "TENANT" },
  { name: "tenant-pay", hash: "#/tenant/pay", role: "TENANT" },
  { name: "tenant-request", hash: "#/tenant/request", role: "TENANT" },
  {
    name: "tenant-property",
    hash: "#/tenant/property/property-1",
    role: "TENANT",
  },
  { name: "shared-chat", hash: "#/chat", role: "TENANT" },
  { name: "shared-profile", hash: "#/profile", role: "TENANT" },
  { name: "shared-account", hash: "#/profile/account", role: "TENANT" },
  {
    name: "shared-payment-methods",
    hash: "#/profile/payments",
    role: "TENANT",
  },
  { name: "shared-lease", hash: "#/lease", role: "TENANT" },
];

describe("Route Visual Baseline", () => {
  it.each(scenarios)(
    "captures $name in light and dark",
    async ({ name, hash, role }) => {
      const lightView = await renderRoute({ hash, role, mode: "light" });
      expect(lightView.container.firstElementChild).toMatchSnapshot(
        `${name}-light`,
      );

      cleanup();

      const darkView = await renderRoute({ hash, role, mode: "dark" });
      expect(darkView.container.firstElementChild).toMatchSnapshot(
        `${name}-dark`,
      );
    },
    20000,
  );
});
