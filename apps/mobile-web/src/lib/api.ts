export type AppRole = "LANDLORD" | "TENANT" | "ADMIN";

export type MeResponse = {
  id: string;
  authUserId: string;
  email?: string | null;
  role: AppRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
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

const apiFetch = async <T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${assertBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      body || `API request failed (${response.status}) for ${path}`,
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
  removePushDevice: (token: string, deviceId: string) =>
    apiFetch<{ removed: boolean }>(
      `/notifications/push-devices/${deviceId}`,
      token,
      {
        method: "DELETE",
      },
    ),
};
