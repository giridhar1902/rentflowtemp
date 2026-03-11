# RentMate — Week 2 Build Prompt for Antigravity

## Goal

Wire the rent reminder → UPI payment → receipt flow end-to-end so that:

1. A NestJS cron job automatically identifies rent due in the next 3 days
2. A WhatsApp reminder is sent to the tenant with a UPI payment link
3. The tenant pays via Razorpay (UPI/card/netbanking)
4. Razorpay fires a webhook → NestJS marks the Payment as PAID
5. A PDF receipt is auto-generated and sent to both landlord and tenant via WhatsApp
6. The landlord dashboard shows real-time payment status (PENDING / PAID / OVERDUE)

---

## Existing Stack (do not change these)

- **Monorepo:** Turborepo + pnpm
- **Frontend:** `apps/mobile-web` — React 19 + Vite + Tailwind CSS
- **Backend:** `apps/api` — NestJS + Prisma ORM + PostgreSQL + Supabase
- **Auth:** Supabase JWT validated by global `AppAuthGuard`
- **Existing models:** User, Property, Unit, Bed, Tenant, Lease, Payment (all from Week 1)
- **Payment.status enum:** PENDING | PAID | OVERDUE
- **Payment.method enum:** CASH | UPI | BANK_TRANSFER

---

## External Services to Integrate

### 1. Razorpay (Payment Links + Webhooks)

- Sign up at razorpay.com → Dashboard → API Keys → generate Key ID + Key Secret
- Use the **Payment Links API** (not the checkout SDK — no custom UI needed)
- Docs: https://razorpay.com/docs/api/payment-links/

### 2. Interakt (WhatsApp Business API)

- Sign up at interakt.ai → get API Key + approved message templates
- Use the **Send Message API** to trigger WhatsApp messages
- Docs: https://developers.interakt.ai/

### 3. pdf-lib (PDF generation — no external service)

- Already available in the JS ecosystem: `npm install pdf-lib`
- Used to generate receipt PDFs server-side in NestJS

---

## New Environment Variables

Add to `apps/api/.env.example`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
INTERAKT_API_KEY=your_interakt_api_key
INTERAKT_SENDER_PHONE=91XXXXXXXXXX
APP_BASE_URL=https://your-app-domain.com
```

---

## Task 1 — Prisma Schema: Extend Payment Model

Open `apps/api/prisma/schema.prisma`.

Add the following fields to the existing `Payment` model only if they don't already exist:

```prisma
model Payment {
  // --- existing fields, do not modify ---
  id          String        @id @default(uuid())
  amount      Float
  method      PaymentMethod @default(CASH)
  status      PaymentStatus @default(PENDING)
  paidAt      DateTime?
  dueDate     DateTime
  notes       String?
  createdAt   DateTime      @default(now())
  leaseId     String
  lease       Lease         @relation(fields: [leaseId], references: [id])

  // --- ADD THESE NEW FIELDS ---
  razorpayPaymentLinkId  String?   // Razorpay Payment Link ID (plink_xxx)
  razorpayPaymentLinkUrl String?   // Short URL sent to tenant
  razorpayPaymentId      String?   // Razorpay Payment ID on success (pay_xxx)
  receiptPdfUrl          String?   // Supabase Storage URL of generated receipt PDF
  reminderSentAt         DateTime? // Timestamp when WhatsApp reminder was sent
}
```

After updating, run:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

---

## Task 2 — NestJS: Payments Module

Create a new NestJS module at `apps/api/src/payments/`.

### 2a. PaymentsService — Core Logic

#### Method: `generateMonthlyPayments()`

Called by the cron job (Task 3). For every active Lease in the database:

1. Check if a Payment record already exists for the current month (match by `leaseId` + `dueDate` month/year)
2. If not, create a new Payment record with:
   - `amount`: from `lease.rentAmount`
   - `status`: PENDING
   - `dueDate`: 1st of the current month (or the lease's custom due day if stored)
   - `method`: UPI (default — can be overridden to CASH manually)

#### Method: `sendRentReminder(paymentId: string)`

1. Fetch Payment with its Lease → Tenant → User (phone number) and Property name
2. Call Razorpay API to create a Payment Link:

```typescript
// Razorpay Payment Link creation
POST https://api.razorpay.com/v1/payment_links
{
  amount: payment.amount * 100, // Razorpay uses paise
  currency: "INR",
  description: `Rent for ${property.name} — ${month} ${year}`,
  customer: {
    name: tenant.name,
    contact: `+91${tenant.phone}`
  },
  notify: { sms: false, email: false }, // We handle notification via WhatsApp
  reminder_enable: false,               // We handle reminders ourselves
  callback_url: `${APP_BASE_URL}/payment-success`,
  callback_method: "get"
}
```

3. Save `razorpayPaymentLinkId` and `razorpayPaymentLinkUrl` to the Payment record
4. Call Interakt API to send WhatsApp message to tenant (see Task 4 for template)
5. Update `reminderSentAt` to now()
6. Return the updated Payment record

#### Method: `markAsPaidCash(paymentId: string, landlordId: string)`

1. Verify the Payment belongs to a Lease owned by the landlordId
2. Update Payment:
   - `status`: PAID
   - `method`: CASH
   - `paidAt`: now()
3. Trigger receipt generation (Task 5)
4. Return updated Payment

#### Method: `handleRazorpayWebhook(payload, signature)`

1. Verify webhook signature using `RAZORPAY_WEBHOOK_SECRET`:

```typescript
import * as crypto from "crypto";

const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest("hex");

if (expectedSignature !== signature) throw new UnauthorizedException();
```

2. Handle event `payment_link.paid`:
   - Extract `razorpayPaymentLinkId` from payload
   - Find Payment by `razorpayPaymentLinkId`
   - Update Payment:
     - `status`: PAID
     - `method`: UPI
     - `paidAt`: now()
     - `razorpayPaymentId`: from payload
3. Trigger receipt generation (Task 5)
4. Return `{ status: 'ok' }`

### 2b. PaymentsController — Endpoints

```
POST   /v1/payments/reminders/send-all     → trigger reminders for all due payments (cron-callable, protected)
POST   /v1/payments/:id/remind             → send reminder for a specific payment
POST   /v1/payments/:id/mark-cash-paid     → landlord marks payment as cash paid
POST   /v1/payments/webhook/razorpay       → Razorpay webhook (NO auth guard — verified by signature)
GET    /v1/payments/lease/:leaseId         → list all payments for a lease
```

**Important:** The `/v1/payments/webhook/razorpay` endpoint must be excluded from the global `AppAuthGuard`. Use `@Public()` decorator or equivalent pattern already used in the codebase.

---

## Task 3 — NestJS Cron Job: Daily Reminder Trigger

Install the NestJS scheduler package if not already present:

```bash
cd apps/api
pnpm add @nestjs/schedule
```

In `AppModule`, import `ScheduleModule.forRoot()`.

Create a `RentReminderScheduler` service:

```typescript
@Cron('0 9 * * *') // Every day at 9:00 AM IST
async sendDailyReminders() {
  // Find all PENDING payments where dueDate is within the next 3 days
  const upcomingPayments = await this.prisma.payment.findMany({
    where: {
      status: 'PENDING',
      reminderSentAt: null, // Don't double-send
      dueDate: {
        lte: addDays(new Date(), 3),
        gte: new Date()
      }
    },
    include: { lease: { include: { tenant: true, property: true } } }
  });

  for (const payment of upcomingPayments) {
    await this.paymentsService.sendRentReminder(payment.id);
  }
}

@Cron('0 10 * * *') // Every day at 10:00 AM IST — mark overdue
async markOverduePayments() {
  await this.prisma.payment.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: new Date() }
    },
    data: { status: 'OVERDUE' }
  });
}
```

---

## Task 4 — Interakt WhatsApp Integration

Create a `WhatsappService` at `apps/api/src/shared/whatsapp.service.ts`.

### Method: `sendRentReminder(phone, tenantName, propertyName, amount, dueDate, paymentLink)`

Call the Interakt Send Message API:

```typescript
POST https://api.interakt.ai/v1/public/message/
Headers: {
  Authorization: `Basic ${Buffer.from(process.env.INTERAKT_API_KEY).toString('base64')}`,
  Content-Type: 'application/json'
}
Body: {
  countryCode: "+91",
  phoneNumber: phone,
  callbackData: "rent_reminder",
  type: "Template",
  template: {
    name: "rent_reminder_v1",  // Must match your approved template name in Interakt
    languageCode: "en",
    bodyValues: [tenantName, propertyName, amount.toString(), dueDate, paymentLink]
  }
}
```

**WhatsApp Template to register in Interakt:**

```
Template name: rent_reminder_v1
Category: UTILITY
Language: English

Body:
Hi {{1}}, your rent of ₹{{2}} for {{3}} is due on {{4}}.

Pay securely here: {{5}}

This is an automated reminder from your landlord via RentMate.
```

### Method: `sendReceiptConfirmation(phone, tenantName, propertyName, amount, paidDate, receiptUrl)`

```
Template name: rent_receipt_v1
Category: UTILITY

Body:
Hi {{1}}, your rent payment of ₹{{2}} for {{3}} has been received on {{4}}.

Download your receipt: {{5}}

Thank you! — RentMate
```

---

## Task 5 — PDF Receipt Generation

Install pdf-lib if not present:

```bash
cd apps/api
pnpm add pdf-lib
```

Create `ReceiptService` at `apps/api/src/shared/receipt.service.ts`.

### Method: `generateReceipt(paymentId: string): Promise<Buffer>`

Generate a clean PDF receipt with the following layout:

```
┌─────────────────────────────────────────┐
│  RENTMATE                    RECEIPT    │
│  ─────────────────────────────────────  │
│  Receipt No:    REC-2026-XXXXX          │
│  Date:          1 March 2026            │
│                                         │
│  FROM (Landlord):                       │
│  [Landlord Name]                        │
│  [Property Address]                     │
│                                         │
│  TO (Tenant):                           │
│  [Tenant Name]                          │
│  [Tenant Phone]                         │
│                                         │
│  ─────────────────────────────────────  │
│  Description          Amount            │
│  Rent — March 2026    ₹18,000           │
│  ─────────────────────────────────────  │
│  TOTAL PAID           ₹18,000           │
│  Payment Method:      UPI               │
│  ─────────────────────────────────────  │
│  This is a computer-generated receipt.  │
└─────────────────────────────────────────┘
```

### Method: `uploadReceiptToSupabase(pdfBuffer: Buffer, paymentId: string): Promise<string>`

1. Upload the PDF buffer to Supabase Storage bucket `receipts`
2. Make the file public
3. Return the public URL
4. Save the URL to `payment.receiptPdfUrl`

### Full receipt flow (called from PaymentsService after PAID status):

```typescript
async generateAndSendReceipt(paymentId: string) {
  const pdfBuffer = await this.receiptService.generateReceipt(paymentId);
  const receiptUrl = await this.receiptService.uploadReceiptToSupabase(pdfBuffer, paymentId);

  // Send to tenant
  await this.whatsappService.sendReceiptConfirmation(
    tenant.phone, tenant.name, property.name,
    payment.amount, payment.paidAt, receiptUrl
  );
  // Send to landlord
  await this.whatsappService.sendReceiptConfirmation(
    landlord.phone, 'You', property.name,
    payment.amount, payment.paidAt, receiptUrl
  );
}
```

---

## Task 6 — Frontend: Payment Status Dashboard

Update the landlord dashboard in `apps/mobile-web` to show payment status.

### 6a. Per-property payment summary card

Each property card should show:

- Total expected rent this month (sum of all active lease rentAmounts)
- Total collected (sum of PAID payments this month)
- Outstanding (PENDING + OVERDUE count)
- A coloured pill per tenant: 🟢 PAID / 🟡 PENDING / 🔴 OVERDUE

### 6b. Per-tenant action buttons

For each tenant in a property, show:

- **"Send Reminder"** button → calls `POST /v1/payments/:id/remind`
  - Disabled + shows "Reminder Sent" if `reminderSentAt` is not null
  - Shows a loading spinner while in progress
- **"Mark as Cash Paid"** button → calls `POST /v1/payments/:id/mark-cash-paid`
  - Only visible if status is PENDING or OVERDUE
  - Shows a confirmation dialog: "Mark ₹[amount] from [tenant name] as received in cash?"
  - On confirm, updates the pill to 🟢 PAID immediately (optimistic update)
- **"View Receipt"** link → opens `payment.receiptPdfUrl` in a new tab
  - Only visible if status is PAID and receiptPdfUrl is not null

### 6c. New API calls to add to `api.ts`

```typescript
sendReminder(paymentId: string): Promise<void>
markCashPaid(paymentId: string): Promise<Payment>
getPaymentsForLease(leaseId: string): Promise<Payment[]>
```

---

## Task 7 — Supabase Storage Setup

Create a storage bucket for receipts:

1. Go to Supabase Dashboard → Storage → New Bucket
2. Name: `receipts`
3. Public: YES (so receipt URLs work without auth)
4. Add this to the NestJS ReceiptService using the Supabase client:

```typescript
const { data, error } = await this.supabase.storage
  .from("receipts")
  .upload(`${paymentId}.pdf`, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
```

---

## Definition of Done ✅

Verify ALL of the following before marking complete:

**Cron & Reminders**

- [ ] Running `POST /v1/payments/reminders/send-all` successfully creates Payment records for all active leases
- [ ] A tenant with a payment due in 3 days receives a WhatsApp message with a working Razorpay payment link
- [ ] The payment link opens correctly on mobile and accepts UPI payment in Razorpay test mode

**Webhook & Status Update**

- [ ] Simulating a Razorpay webhook event (`payment_link.paid`) updates the Payment status to PAID in the database
- [ ] Webhook rejects requests with an invalid signature (returns 401)

**Cash Payment**

- [ ] Clicking "Mark as Cash Paid" on the dashboard updates the payment to PAID immediately
- [ ] A receipt PDF is generated and the URL is saved to the Payment record

**Receipt**

- [ ] A PDF receipt is generated with correct landlord name, tenant name, property, amount, and date
- [ ] The receipt PDF is accessible via a public Supabase Storage URL
- [ ] Both landlord and tenant receive the receipt URL via WhatsApp

**Dashboard**

- [ ] Payment status pills (PAID/PENDING/OVERDUE) are visible per tenant
- [ ] "Send Reminder" button is disabled after reminder is sent
- [ ] "Mark as Cash Paid" shows a confirmation dialog before acting
- [ ] "View Receipt" link appears after payment is confirmed

**Reliability**

- [ ] Double-sending is prevented (reminder not sent if `reminderSentAt` is already set)
- [ ] Monthly payments are not duplicated (check before creating new Payment record)
- [ ] All new endpoints return proper error responses (400/401/404/500) with descriptive messages
- [ ] `pnpm typecheck` passes with zero errors

---

## Important Constraints

- Do NOT modify the existing `AppAuthGuard` — use `@Public()` or equivalent for the webhook endpoint
- Do NOT change the existing Prisma models — only ADD fields to Payment as specified
- Do NOT use Razorpay's frontend checkout SDK — use Payment Links API only (server-side)
- The WhatsApp template names (`rent_reminder_v1`, `rent_receipt_v1`) must exactly match what is registered in Interakt
- All Razorpay API calls must use HTTP Basic Auth: `Buffer.from(KEY_ID:KEY_SECRET).toString('base64')`
- Test everything in Razorpay TEST mode first — do not use live keys during development
- If Interakt is not yet set up, stub the `WhatsappService.sendRentReminder()` method with a `console.log` and a TODO comment — do not block the rest of the implementation on it
