import Anthropic from "@anthropic-ai/sdk";

export const DOMVIO_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_payment_status",
    description:
      "Get rent payment status for landlord tenants. Use when landlord asks if someone paid, who paid, payment status.",
    input_schema: {
      type: "object" as const,
      properties: {
        tenant_name: {
          type: "string",
          description: "Tenant name to filter (optional)",
        },
        property_name: {
          type: "string",
          description: "Property name to filter (optional)",
        },
        month: {
          type: "string",
          description:
            'Month in format "March 2026" (optional, defaults to current)',
        },
        status_filter: {
          type: "string",
          enum: ["PAID", "PENDING", "OVERDUE"],
          description: "Filter by status (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "send_reminder",
    description:
      "Send WhatsApp rent reminder to one or all pending tenants. ALWAYS requires confirmation before executing.",
    input_schema: {
      type: "object" as const,
      properties: {
        tenant_name: {
          type: "string",
          description: "Specific tenant name (optional if target=all)",
        },
        target: {
          type: "string",
          enum: ["one", "all"],
          description: "Send to one tenant or all pending",
        },
        property_name: {
          type: "string",
          description: "Filter by property (optional)",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "record_cash_payment",
    description:
      "Mark a tenant rent as received in cash. ALWAYS requires confirmation before executing.",
    input_schema: {
      type: "object" as const,
      properties: {
        tenant_name: {
          type: "string",
          description: "Tenant name (required)",
        },
        amount: {
          type: "number",
          description: "Amount received (optional, defaults to lease amount)",
        },
      },
      required: ["tenant_name"],
    },
  },
  {
    name: "get_monthly_summary",
    description:
      "Get total rent collected, pending count, overdue count for the month.",
    input_schema: {
      type: "object" as const,
      properties: {
        month: {
          type: "string",
          description: 'Month in format "March 2026" (optional)',
        },
        property_name: {
          type: "string",
          description: "Filter by property (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_overdue_list",
    description: "Get list of all overdue tenants with amounts and days late.",
    input_schema: {
      type: "object" as const,
      properties: {
        property_name: {
          type: "string",
          description: "Filter by property (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_tenant_details",
    description:
      "Get full details for a specific tenant including lease, payment history.",
    input_schema: {
      type: "object" as const,
      properties: {
        tenant_name: {
          type: "string",
          description: "Tenant name to look up (required)",
        },
      },
      required: ["tenant_name"],
    },
  },
  {
    name: "list_tenants",
    description: "List all active tenants with their current payment status.",
    input_schema: {
      type: "object" as const,
      properties: {
        property_name: {
          type: "string",
          description: "Filter by property (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "list_maintenance",
    description: "List open maintenance requests.",
    input_schema: {
      type: "object" as const,
      properties: {
        property_name: {
          type: "string",
          description: "Filter by property (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_monthly_report",
    description: "Generate and send monthly PDF report to landlord.",
    input_schema: {
      type: "object" as const,
      properties: {
        month: {
          type: "string",
          description: 'Month in format "March 2026" (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: "list_properties",
    description: "List all properties belonging to this landlord.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Tools that require user confirmation before execution
export const CONFIRMATION_REQUIRED_TOOLS = [
  "send_reminder",
  "record_cash_payment",
];
