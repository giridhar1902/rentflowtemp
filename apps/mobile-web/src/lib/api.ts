export type AppRole = "LANDLORD" | "TENANT" | "ADMIN";

export type MeResponse = {
  id: string;
  authUserId: string;
  email?: string | null;
  role: AppRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isNRI?: boolean;
  landlordProfile?: {
    id: string;
    companyName?: string | null;
  } | null;
  tenantProfile?: {
    id: string;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  } | null;
};

export type PropertyRecord = {
  id: string;
  ownerId: string;
  name: string;
  propertyType: string;
  floors?: number | null;
  totalUnits?: number | null;
  amenities?: string[];
  status: string;
  ownership: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  units: UnitRecord[];
  leases?: LeaseRecord[];
  _count?: {
    units: number;
    leases: number;
    invitations?: number;
  };
};

export type UnitRecord = {
  id: string;
  propertyId: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  occupancy: number;
  furnishing?: string | null;
  status: string;
  monthlyRent: string | number;
  securityDeposit?: string | number | null;
  maintenanceFee?: string | number | null;
};

export type LeaseRecord = {
  id: string;
  propertyId: string;
  unitId: string;
  landlordId: string;
  tenantId: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyRent: string | number;
  securityDeposit?: string | number | null;
  dueDay: number;
  property?: {
    id: string;
    name: string;
    city: string;
    state: string;
    addressLine1: string;
    postalCode: string;
  };
  unit?: {
    id: string;
    name: string;
    monthlyRent: string | number;
    bedrooms: number;
    bathrooms: number;
    occupancy: number;
  };
  landlord?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  tenant?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type InvitationRecord = {
  id: string;
  propertyId?: string | null;
  unitId?: string | null;
  leaseId?: string | null;
  inviteeEmail: string;
  inviteeRegistered?: boolean;
  code: string;
  status: string;
  expiresAt: string;
  acceptedAt?: string | null;
  property?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  unit?: {
    id: string;
    name: string;
    monthlyRent?: string | number;
  };
  lease?: LeaseRecord;
};

export type PaymentMethodRecord = {
  id: string;
  userId?: string;
  type: "CARD" | "BANK_TRANSFER" | "CASH" | "OTHER";
  provider?: string | null;
  providerRef?: string | null;
  last4?: string | null;
  brand?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentEventRecord = {
  id: string;
  paymentId: string;
  eventType: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
};

export type ChargeLeaseSnapshot = {
  id: string;
  dueDay: number;
  landlordId: string;
  tenantId: string;
  hasTdsObligation?: boolean;
  tdsRate?: number;
  property?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    addressLine1?: string;
  };
  unit?: {
    id: string;
    name: string;
    monthlyRent?: string | number;
  };
  landlord?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  tenant?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
};

export type PaymentRecord = {
  id: string;
  chargeId?: string | null;
  payerId?: string | null;
  methodId?: string | null;
  amount: string | number;
  currency: string;
  status: string;
  provider?: string | null;
  providerPaymentId?: string | null;
  reference?: string | null;
  razorpayPaymentLinkId?: string | null;
  razorpayPaymentLinkUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  charge?: {
    id: string;
    dueDate: string;
    totalAmount: string | number;
    balanceAmount: string | number;
    status: string;
    lease?: ChargeLeaseSnapshot;
  } | null;
  payer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  method?: PaymentMethodRecord | null;
  events?: PaymentEventRecord[];
};

export type RentChargeRecord = {
  id: string;
  leaseId: string;
  createdById?: string | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  baseRentAmount: string | number;
  maintenanceAmount: string | number;
  utilityAmount: string | number;
  lateFeeAmount: string | number;
  totalAmount: string | number;
  balanceAmount: string | number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lease: ChargeLeaseSnapshot;
  payments: PaymentRecord[];
};

export type OfflineRentPaymentStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type OfflineRentPaymentRecord = {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  amount: string | number;
  rentMonth: string;
  paymentDate: string;
  paymentMode: string;
  proofUrl?: string | null;
  status: OfflineRentPaymentStatus;
  createdAt: string;
  updatedAt: string;
  property?: {
    name: string;
  };
  unit?: {
    name: string;
  };
  tenant?: {
    firstName: string | null;
    lastName: string | null;
    email?: string | null;
  };
};

export type BillingSummaryResponse = {
  range: {
    from: string;
    to: string;
  };
  totals: {
    billed: string;
    collected: string;
    outstanding: string;
    overdue: string;
    pendingReview: string;
  };
  counts: {
    openCharges: number;
    overdueCharges: number;
    pendingCashApprovals: number;
  };
  monthly: Array<{
    month: string;
    billed: string;
    collected: string;
  }>;
};

export type ExpenseCategory =
  | "MAINTENANCE"
  | "TAX"
  | "UTILITIES"
  | "INSURANCE"
  | "OTHER";

export type ExpenseRecord = {
  id: string;
  propertyId: string;
  leaseId?: string | null;
  createdById?: string | null;
  category: ExpenseCategory;
  amount: string | number;
  description?: string | null;
  incurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export type MaintenanceCommentRecord = {
  id: string;
  requestId: string;
  authorId: string;
  comment: string;
  createdAt: string;
  author?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: AppRole;
  };
};

export type MaintenanceRequestRecord = {
  id: string;
  propertyId: string;
  unitId?: string | null;
  leaseId?: string | null;
  requesterId: string;
  title: string;
  category: string;
  details: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  emergency: boolean;
  submittedAt: string;
  scheduledAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    ownerId?: string;
    name: string;
    city?: string;
    state?: string;
  };
  unit?: {
    id: string;
    name: string;
  } | null;
  lease?: {
    id: string;
    tenantId?: string;
    landlordId?: string;
    status?: string;
    tenant?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };
    landlord?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };
  } | null;
  requester?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: AppRole;
  };
  comments?: MaintenanceCommentRecord[];
  documents?: DocumentRecord[];
};

export type ChatThreadParticipantRecord = {
  id: string;
  threadId: string;
  userId: string;
  joinedAt: string;
  user?: {
    id: string;
    role?: AppRole;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  senderId: string;
  messageType: "TEXT" | "FILE" | "SYSTEM";
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  sender?: {
    id: string;
    role?: AppRole;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
};

export type ChatThreadRecord = {
  id: string;
  propertyId?: string | null;
  leaseId?: string | null;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatThreadParticipantRecord[];
  messages: ChatMessageRecord[];
  lease?: {
    id: string;
    property?: {
      id: string;
      name: string;
      city?: string;
      state?: string;
    };
    unit?: {
      id: string;
      name: string;
    };
    landlord?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };
    tenant?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };
  } | null;
};

export type DocumentRecord = {
  id: string;
  uploadedById: string;
  propertyId?: string | null;
  leaseId?: string | null;
  maintenanceRequestId?: string | null;
  type:
    | "LEASE"
    | "PROPERTY_DEED"
    | "RENT_RECEIPT"
    | "MAINTENANCE_PHOTO"
    | "OTHER";
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: AppRole;
  };
  property?: {
    id: string;
    name: string;
  } | null;
  lease?: {
    id: string;
    property?: {
      id: string;
      name: string;
    };
    unit?: {
      id: string;
      name: string;
    };
  } | null;
  maintenanceRequest?: {
    id: string;
    title?: string;
  } | null;
};

export type DocumentUploadSessionResponse = {
  document: DocumentRecord;
  uploadUrl: string;
  expiresAt: string;
  maxBytes: number;
};

export type DocumentDownloadSessionResponse = {
  documentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  expiresAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  type:
    | "PAYMENT_DUE"
    | "PAYMENT_RECEIVED"
    | "MAINTENANCE_UPDATE"
    | "CHAT_MESSAGE"
    | "LEASE_UPDATE"
    | "SYSTEM";
  channel: "IN_APP" | "PUSH" | "EMAIL" | "SMS";
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type PushDeviceRecord = {
  id: string;
  userId: string;
  platform: "ANDROID" | "IOS" | "WEB";
  token: string;
  deviceName?: string | null;
  appVersion?: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

type BillingReviewAction = "APPROVE" | "REJECT";

export type OnlinePaymentSessionResponse = {
  paymentId: string;
  chargeId: string;
  amount: string;
  currency: string;
  provider: "cashfree";
  orderId: string;
  cfOrderId: string;
  orderStatus: string;
  paymentSessionId: string;
  checkoutMode: "sandbox" | "production";
};

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

const assertBaseUrl = () => {
  if (!baseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  return baseUrl;
};

const withQuery = (
  path: string,
  query: Record<string, string | number | boolean | undefined | null>,
) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
};

export type NriIncomeSummaryResponse = {
  totalINR: number;
  totalForeignCurrency: number;
  exchangeRate: number;
  foreignCurrency: string;
  monthlyBreakdown: {
    month: string;
    amountINR: number;
    amountForeign: number;
  }[];
  propertySummary: {
    propertyName: string;
    amountINR: number;
    amountForeign: number;
    healthScore: number;
    healthStatus: string;
  }[];
};

export type NriTdsSummaryResponse = {
  financialYear: string;
  quarters: {
    quarter: string;
    totalRent: number;
    totalTdsDeducted: number;
    netReceived: number;
    form27QDueDate: string;
    form27QFiled: boolean;
    tenants: {
      name: string;
      pan: string;
      rentPaid: number;
      tdsDeducted: number;
      tdsDepositConfirmed: boolean;
    }[];
  }[];
  annualSummary: {
    totalRentINR: number;
    totalTdsINR: number;
    netReceivedINR: number;
    totalRentForeign: number;
    foreignCurrency: string;
  };
};

const getMockDataForPath = (path: string, method?: string): any => {
  if (path.includes("/users/me")) {
    return {
      id: "fake-id",
      authUserId: "auth-fake-id",
      email: "demo@demo.com",
      role: "LANDLORD", // Fallback, context sets it via cache anyway if possible
      firstName: "Demo",
      lastName: "User",
    };
  }

  // If this is a POST request, returning an array breaks properties like response.id
  if (method === "POST" || method === "PATCH") {
    if (path.includes("/documents")) {
      return {
        uploadUrl: "fake-upload-url",
        document: { id: "fake-doc-id", storagePath: "fake" },
      };
    }
    return { id: "fake-generated-id" };
  }

  if (path.includes("/properties")) return [];
  if (path.includes("/leases")) {
    return [
      {
        id: "mock-lease-1",
        propertyId: "mock-property",
        unitId: "mock-unit",
        landlordId: "mock-landlord",
        tenantId: "mock-tenant",
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 300 * 24 * 3600_000).toISOString(),
        monthlyRent: 24500,
        dueDay: 5,
        property: {
          id: "mock-property",
          name: "Prestige Falcon City",
          city: "Bangalore",
          state: "Karnataka",
          addressLine1: "Kanakapura Road",
          postalCode: "560062",
        },
        unit: {
          id: "mock-unit",
          name: "B-402",
          monthlyRent: 24500,
          bedrooms: 2,
          bathrooms: 2,
          occupancy: 1,
        },
      },
    ];
  }
  if (path.includes("/billing/charges")) return [];
  if (path.includes("/billing/payments")) return [];
  if (path.includes("/payments/tenant")) return [];
  if (path.includes("/payments/pending")) return [];
  if (path.includes("/billing/payment-methods")) return [];
  if (path.includes("/billing/payment-methods")) return [];
  if (path.includes("/billing/reports/summary")) {
    return {
      range: { from: new Date().toISOString(), to: new Date().toISOString() },
      totals: {
        billed: "0",
        collected: "0",
        outstanding: "0",
        overdue: "0",
        pendingReview: "0",
      },
      counts: { openCharges: 0, overdueCharges: 0, pendingCashApprovals: 0 },
      monthly: [],
    };
  }
  if (path.includes("/maintenance")) return [];
  if (path.includes("/communication")) return [];
  if (path.includes("/documents")) return [];

  // Fallback for list endpoints (ending in 's') vs object endpoints
  if (path.split("?")[0].endsWith("s")) return [];
  return {};
};

let mockProperties: any[] = [];

const apiFetch = async <T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> => {
  if (token === "fake-token") {
    // Intercept development mock requests to avoid "failed to fetch"
    return new Promise((resolve) => {
      setTimeout(() => {
        // Special case for properties to make the demo feel alive
        if (path === "/properties" && init?.method === "POST") {
          const body = init.body ? JSON.parse(init.body as string) : {};
          const newProperty = {
            id: `prop-${Date.now()}`,
            ownerId: "fake-id",
            name: body.name || "Newly Created Property",
            propertyType: body.propertyType || "Apartment",
            status: "ACTIVE",
            ownership: body.ownership || "SELF_OWNED",
            addressLine1: body.addressLine1 || "Address",
            city: body.city || "City",
            state: body.state || "State",
            postalCode: body.postalCode || "000000",
            country: "US",
            units: [],
            _count: { units: body.totalUnits || 0, leases: 0 },
          };
          mockProperties.unshift(newProperty);
          resolve(newProperty as unknown as T);
          return;
        }

        if (
          path === "/properties" &&
          (!init?.method || init?.method === "GET")
        ) {
          resolve(mockProperties as unknown as T);
          return;
        }

        // Single property GET — return matching mock or a safe stub with units: []
        if (
          /^\/properties\/[^/]+$/.test(path) &&
          (!init?.method || init?.method === "GET")
        ) {
          const propertyId = path.split("/").pop();
          const found = mockProperties.find((p) => p.id === propertyId);
          resolve(
            (found ?? {
              id: propertyId,
              ownerId: "fake-id",
              name: "Property",
              propertyType: "Apartment",
              status: "ACTIVE",
              ownership: "SELF_OWNED",
              addressLine1: "",
              city: "",
              state: "",
              postalCode: "",
              country: "IN",
              units: [],
              leases: [],
              _count: { units: 0, leases: 0 },
            }) as unknown as T,
          );
          return;
        }

        if (path.includes("/payments/submit") && init?.method === "POST") {
          const body = init.body ? JSON.parse(init.body as string) : {};
          resolve({
            id: `mock-payment-${Date.now()}`,
            tenantId: "mock-tenant",
            propertyId: body.propertyId || "mock-property",
            unitId: body.unitId || "mock-unit",
            amount: body.amount || 24500,
            rentMonth: body.rentMonth || "November 2023",
            paymentDate: body.paymentDate || new Date().toISOString(),
            paymentMode: body.paymentMode || "CASH",
            status: "PENDING_APPROVAL",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as unknown as T);
          return;
        }

        resolve(getMockDataForPath(path, init?.method) as unknown as T);
      }, 300); // simulate tiny network delay
    });
  }
  const response = await fetch(`${assertBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let parsedBody: any = null;
    try {
      parsedBody = JSON.parse(text);
    } catch (e) {}

    if (response.status === 402 && parsedBody?.error === "UPGRADE_REQUIRED") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("upgrade-required", { detail: parsedBody }),
        );
      }
      throw new Error("UPGRADE_REQUIRED");
    }

    throw new Error(
      text || `API request failed (${response.status}) for ${path}`,
    );
  }

  return (await response.json()) as T;
};

export const api = {
  getMe: (token: string) => apiFetch<MeResponse>("/users/me", token),
  updateMe: (
    token: string,
    payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      companyName?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    },
  ) =>
    apiFetch<MeResponse>("/users/me", token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  setOnboardingRole: (token: string, role: AppRole) =>
    apiFetch<MeResponse>("/users/me/role", token, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  listProperties: (token: string) =>
    apiFetch<PropertyRecord[]>("/properties", token),
  getProperty: (token: string, propertyId: string) =>
    apiFetch<PropertyRecord>(`/properties/${propertyId}`, token),
  createProperty: (
    token: string,
    payload: {
      name: string;
      propertyType: string;
      floors?: number;
      totalUnits?: number;
      amenities?: string[];
      ownership?: string;
      status?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    },
  ) =>
    apiFetch<PropertyRecord>("/properties", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createUnit: (
    token: string,
    propertyId: string,
    payload: {
      name: string;
      bedrooms: number;
      bathrooms: number;
      occupancy: number;
      furnishing?: string;
      monthlyRent: number;
      securityDeposit?: number;
      maintenanceFee?: number;
    },
  ) =>
    apiFetch<UnitRecord>(`/properties/${propertyId}/units`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createInvitation: (
    token: string,
    propertyId: string,
    payload: {
      inviteeEmail: string;
      unitId?: string;
      expiresInDays?: number;
    },
  ) =>
    apiFetch<InvitationRecord>(`/properties/${propertyId}/invitations`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listInvitations: (token: string, propertyId: string) =>
    apiFetch<InvitationRecord[]>(
      `/properties/${propertyId}/invitations`,
      token,
    ),
  listMyInvitations: (token: string) =>
    apiFetch<InvitationRecord[]>("/leases/invitations/mine", token),

  listLeases: (token: string) => apiFetch<LeaseRecord[]>("/leases", token),
  getLease: (token: string, leaseId: string) =>
    apiFetch<LeaseRecord>(`/leases/${leaseId}`, token),
  acceptInvitation: (token: string, code: string) =>
    apiFetch<InvitationRecord>("/leases/invitations/accept", token, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  listCharges: (
    token: string,
    query?: {
      status?: string;
      leaseId?: string;
      propertyId?: string;
    },
  ) =>
    apiFetch<RentChargeRecord[]>(
      withQuery("/billing/charges", {
        status: query?.status,
        leaseId: query?.leaseId,
        propertyId: query?.propertyId,
      }),
      token,
    ),
  getCharge: (token: string, chargeId: string) =>
    apiFetch<RentChargeRecord>(`/billing/charges/${chargeId}`, token),
  createOnlinePaymentSession: (
    token: string,
    chargeId: string,
    payload?: {
      amount?: number;
      reference?: string;
    },
  ) =>
    apiFetch<OnlinePaymentSessionResponse>(
      `/billing/charges/${chargeId}/online-session`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      },
    ),
  generateMonthlyCharges: (
    token: string,
    payload: {
      month?: string;
      leaseId?: string;
      propertyId?: string;
    },
  ) =>
    apiFetch<{
      month: string;
      periodStart: string;
      periodEnd: string;
      eligibleLeaseCount: number;
      createdCount: number;
      existingCount: number;
      charges: RentChargeRecord[];
    }>("/billing/charges/generate-monthly", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitCashPayment: (
    token: string,
    chargeId: string,
    payload: {
      amount: number;
      paidAt?: string;
      reference?: string;
      note?: string;
    },
  ) =>
    apiFetch<PaymentRecord>(
      `/billing/charges/${chargeId}/cash-payments`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  listPayments: (
    token: string,
    query?: {
      status?: string;
      chargeId?: string;
    },
  ) =>
    apiFetch<PaymentRecord[]>(
      withQuery("/billing/payments", {
        status: query?.status,
        chargeId: query?.chargeId,
      }),
      token,
    ),
  listPendingPaymentReviews: (token: string) =>
    apiFetch<PaymentRecord[]>("/billing/payments/pending-review", token),
  reviewPayment: (
    token: string,
    paymentId: string,
    payload: {
      action: BillingReviewAction;
      note?: string;
      paidAt?: string;
    },
  ) =>
    apiFetch<PaymentRecord>(`/billing/payments/${paymentId}/review`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listPaymentMethods: (token: string) =>
    apiFetch<PaymentMethodRecord[]>("/billing/payment-methods", token),
  createPaymentMethod: (
    token: string,
    payload: {
      type: "CARD" | "BANK_TRANSFER" | "CASH" | "OTHER";
      provider?: string;
      providerRef?: string;
      last4?: string;
      brand?: string;
      isDefault?: boolean;
    },
  ) =>
    apiFetch<PaymentMethodRecord>("/billing/payment-methods", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setDefaultPaymentMethod: (token: string, methodId: string) =>
    apiFetch<PaymentMethodRecord>(
      `/billing/payment-methods/${methodId}/default`,
      token,
      {
        method: "POST",
      },
    ),
  getBillingSummary: (
    token: string,
    query?: {
      from?: string;
      to?: string;
      propertyId?: string;
    },
  ) =>
    apiFetch<BillingSummaryResponse>(
      withQuery("/billing/reports/summary", {
        from: query?.from,
        to: query?.to,
        propertyId: query?.propertyId,
      }),
      token,
    ),

  listMaintenanceRequests: (
    token: string,
    query?: {
      propertyId?: string;
      unitId?: string;
      leaseId?: string;
      requesterId?: string;
      status?: MaintenanceStatus;
      priority?: MaintenancePriority;
      limit?: number;
    },
  ) =>
    apiFetch<MaintenanceRequestRecord[]>(
      withQuery("/maintenance/requests", {
        propertyId: query?.propertyId,
        unitId: query?.unitId,
        leaseId: query?.leaseId,
        requesterId: query?.requesterId,
        status: query?.status,
        priority: query?.priority,
        limit: query?.limit,
      }),
      token,
    ),
  getMaintenanceRequest: (token: string, requestId: string) =>
    apiFetch<MaintenanceRequestRecord>(
      `/maintenance/requests/${requestId}`,
      token,
    ),
  createMaintenanceRequest: (
    token: string,
    payload: {
      propertyId: string;
      unitId?: string;
      leaseId?: string;
      title: string;
      category: string;
      details: string;
      priority?: MaintenancePriority;
      emergency?: boolean;
    },
  ) =>
    apiFetch<MaintenanceRequestRecord>("/maintenance/requests", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateMaintenanceRequestStatus: (
    token: string,
    requestId: string,
    payload: {
      status: MaintenanceStatus;
      scheduledAt?: string;
      note?: string;
    },
  ) =>
    apiFetch<MaintenanceRequestRecord>(
      `/maintenance/requests/${requestId}/status`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  listMaintenanceComments: (token: string, requestId: string) =>
    apiFetch<MaintenanceCommentRecord[]>(
      `/maintenance/requests/${requestId}/comments`,
      token,
    ),
  addMaintenanceComment: (
    token: string,
    requestId: string,
    payload: { comment: string },
  ) =>
    apiFetch<MaintenanceCommentRecord>(
      `/maintenance/requests/${requestId}/comments`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  listChatThreads: (token: string) =>
    apiFetch<ChatThreadRecord[]>("/chat/threads", token),
  ensureLeaseThread: (token: string, leaseId: string) =>
    apiFetch<ChatThreadRecord>(`/chat/threads/lease/${leaseId}/ensure`, token, {
      method: "POST",
    }),
  getChatThread: (token: string, threadId: string) =>
    apiFetch<ChatThreadRecord>(`/chat/threads/${threadId}`, token),
  listChatMessages: (
    token: string,
    threadId: string,
    query?: {
      since?: string;
      limit?: number;
    },
  ) =>
    apiFetch<ChatMessageRecord[]>(
      withQuery(`/chat/threads/${threadId}/messages`, {
        since: query?.since,
        limit: query?.limit,
      }),
      token,
    ),
  sendChatMessage: (
    token: string,
    threadId: string,
    payload: {
      content: string;
      messageType?: "TEXT" | "FILE" | "SYSTEM";
      metadata?: Record<string, unknown>;
    },
  ) =>
    apiFetch<ChatMessageRecord>(`/chat/threads/${threadId}/messages`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listDocuments: (
    token: string,
    query?: {
      propertyId?: string;
      leaseId?: string;
      maintenanceRequestId?: string;
      type?: DocumentRecord["type"];
      limit?: number;
    },
  ) =>
    apiFetch<DocumentRecord[]>(
      withQuery("/documents", {
        propertyId: query?.propertyId,
        leaseId: query?.leaseId,
        maintenanceRequestId: query?.maintenanceRequestId,
        type: query?.type,
        limit: query?.limit,
      }),
      token,
    ),
  createDocumentUpload: (
    token: string,
    payload: {
      type: DocumentRecord["type"];
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      propertyId?: string;
      leaseId?: string;
      maintenanceRequestId?: string;
    },
  ) =>
    apiFetch<DocumentUploadSessionResponse>("/documents/uploads/sign", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadDocumentToSignedUrl: async (
    uploadUrl: string,
    payload: Blob,
    mimeType: string,
  ) => {
    if (uploadUrl === "fake-upload-url") {
      // Simulate successful upload for demo
      return new Promise<{
        uploaded: boolean;
        documentId: string;
        sizeBytes: number;
      }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              uploaded: true,
              documentId: "fake-doc-id",
              sizeBytes: payload.size,
            }),
          300,
        ),
      );
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
      },
      body: payload,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        body || `Document upload failed (${response.status}) for ${uploadUrl}`,
      );
    }

    return (await response.json()) as {
      uploaded: boolean;
      documentId: string;
      sizeBytes: number;
    };
  },
  getDocumentDownloadUrl: (token: string, documentId: string) =>
    apiFetch<DocumentDownloadSessionResponse>(
      `/documents/${documentId}/download-url`,
      token,
    ),

  listNotifications: (
    token: string,
    query?: {
      unreadOnly?: boolean;
      limit?: number;
    },
  ) =>
    apiFetch<NotificationRecord[]>(
      withQuery("/notifications", {
        unreadOnly: query?.unreadOnly,
        limit: query?.limit,
      }),
      token,
    ),
  markNotificationRead: (token: string, notificationId: string) =>
    apiFetch<NotificationRecord>(
      `/notifications/${notificationId}/read`,
      token,
      {
        method: "PATCH",
      },
    ),
  markAllNotificationsRead: (token: string) =>
    apiFetch<{ updatedCount: number }>("/notifications/read-all", token, {
      method: "POST",
    }),
  listPushDevices: (token: string) =>
    apiFetch<PushDeviceRecord[]>("/notifications/push-devices", token),
  registerPushDevice: (
    token: string,
    payload: {
      platform: PushDeviceRecord["platform"];
      token: string;
      deviceName?: string;
      appVersion?: string;
    },
  ) =>
    apiFetch<PushDeviceRecord>("/notifications/push-devices", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitOfflinePayment: (
    token: string,
    payload: {
      propertyId: string;
      unitId: string;
      amount: number;
      rentMonth: string;
      paymentDate: string;
      paymentMode: string;
      proofUrl?: string;
      status: "PENDING_APPROVAL";
    },
  ) =>
    apiFetch<OfflineRentPaymentRecord>("/payments/submit", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listPendingOfflinePayments: (token: string) =>
    apiFetch<OfflineRentPaymentRecord[]>("/payments/pending", token),

  listTenantOfflinePayments: (token: string) =>
    apiFetch<OfflineRentPaymentRecord[]>("/payments/tenant", token),

  reviewOfflinePayment: (
    token: string,
    paymentId: string,
    payload: { action: OfflineRentPaymentStatus },
  ) =>
    apiFetch<{ message: string; payment: OfflineRentPaymentRecord }>(
      `/payments/${paymentId}/review`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  removePushDevice: (token: string, deviceId: string) =>
    apiFetch<{ removed: boolean }>(
      `/notifications/push-devices/${deviceId}`,
      token,
      {
        method: "DELETE",
      },
    ),
  checkUnitEmailConflicts: (token: string, unitId: string, email: string) =>
    apiFetch<{ conflict: boolean }>(
      withQuery(`/leases/check-email-conflicts/${unitId}`, { email }),
      token,
    ),

  getNriIncomeSummary: (token: string) =>
    apiFetch<NriIncomeSummaryResponse>("/nri/income-summary", token),
  getNriTdsSummary: (token: string, year?: string) =>
    apiFetch<NriTdsSummaryResponse>(
      withQuery("/nri/tds-summary", { year }),
      token,
    ),

  listExpenses: (
    token: string,
    query?: {
      propertyId?: string;
      category?: ExpenseCategory;
      from?: string;
      to?: string;
      limit?: number;
    },
  ) =>
    apiFetch<ExpenseRecord[]>(
      withQuery("/billing/expenses", {
        propertyId: query?.propertyId,
        category: query?.category,
        from: query?.from,
        to: query?.to,
        limit: query?.limit,
      }),
      token,
    ),
  createExpense: (
    token: string,
    payload: {
      propertyId: string;
      leaseId?: string;
      category: ExpenseCategory;
      amount: number;
      description?: string;
      incurredAt: string;
    },
  ) =>
    apiFetch<ExpenseRecord>("/billing/expenses", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listUnits: (token: string, propertyId: string) =>
    apiFetch<any[]>(`/properties/${propertyId}/units`, token),

  createPgUnit: (
    token: string,
    payload: {
      propertyId: string;
      name: string;
      floor?: string;
      meterNumber?: string;
    },
  ) =>
    apiFetch<any>("/units", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listBeds: (token: string, unitId: string) =>
    apiFetch<any[]>(`/units/${unitId}/beds`, token),

  createBed: (token: string, payload: { unitId: string; label: string }) =>
    apiFetch<any>("/beds", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listTenants: (token: string, unitId: string) =>
    apiFetch<any[]>(`/units/${unitId}/tenants`, token),

  createTenant: (
    token: string,
    payload: {
      unitId: string;
      name: string;
      phone?: string;
      rentAmount?: number;
      bedId?: string;
    },
  ) =>
    apiFetch<any>("/tenants", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  removeTenant: (token: string, tenantId: string) =>
    apiFetch<any>(`/tenants/${tenantId}`, token, {
      method: "DELETE",
    }),

  listUtilities: (token: string, propertyId: string) =>
    apiFetch<any[]>(`/properties/${propertyId}/utilities`, token),

  createUtility: (
    token: string,
    payload: {
      propertyId: string;
      unitId?: string;
      type: string;
      amount: number;
      billingMonth: string;
      splitMethod: string;
    },
  ) =>
    apiFetch<any>("/utilities", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  addTenantAtProperty: (
    token: string,
    propertyId: string,
    payload: {
      name: string;
      phone: string;
      email?: string;
      rentAmount: number;
      depositAmount: number;
      startDate: string;
      unitLabel: string;
      bedLabel?: string;
    },
  ) =>
    apiFetch<any>(`/properties/${propertyId}/tenants`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ─── WEEK 2: RENT REMINDERS & RAZORPAY ────────────────────────────────

  triggerAllReminders: (token: string) =>
    apiFetch<any>("/payments/reminders/send-all", token, {
      method: "POST",
    }),

  sendReminder: (token: string, paymentId: string) =>
    apiFetch<any>(`/payments/${paymentId}/remind`, token, {
      method: "POST",
    }),

  markCashPaid: (token: string, paymentId: string) =>
    apiFetch<any>(`/payments/${paymentId}/mark-cash-paid`, token, {
      method: "POST",
    }),

  getPaymentsForLease: (token: string, leaseId: string) =>
    apiFetch<any[]>(`/payments/lease/${leaseId}`, token),
};
