# RentMate — Week 3 Build Prompt: WhatsApp Bot

## Goal

Build a two-way WhatsApp command bot that allows landlords and tenants to interact
with RentMate entirely inside WhatsApp — without opening the app.

The bot lives on the existing Interakt WhatsApp Business number already wired in Week 2.
This is NOT a new service — it is a new input layer on top of existing NestJS services.

---

## Existing Infrastructure (do not change)

- **WhatsappService** at `apps/api/src/shared/whatsapp.service.ts` — already built
- **PaymentsService** — sendRentReminder, markAsPaidCash, handleRazorpayWebhook
- **Interakt** — already configured with API key
- **Supabase Auth** — phone-based landlord/tenant identity
- **Prisma models** — User, Landlord, Tenant, Property, Lease, Payment all exist

---

## New Environment Variables

Add to `apps/api/.env.example`:

```
WHATSAPP_BOT_VERIFY_TOKEN=your_interakt_webhook_verify_token
```

---

## Task 1 — Interakt Webhook: Receive Incoming Messages

### 1a. New NestJS endpoint

Create a new controller at `apps/api/src/whatsapp-bot/whatsapp-bot.controller.ts`:

```
GET  /v1/whatsapp/webhook   → Webhook verification (Interakt handshake)
POST /v1/whatsapp/webhook   → Receive incoming WhatsApp messages
```

Both endpoints must be decorated with `@Public()` — no auth guard.

### 1b. Webhook verification (GET)

Interakt sends a GET request with a `hub.verify_token` query param to verify the endpoint.
Respond with `hub.challenge` if the token matches `WHATSAPP_BOT_VERIFY_TOKEN`.

### 1c. Incoming message handler (POST)

Interakt sends a POST with this structure:

```json
{
  "type": "whatsapp",
  "data": {
    "message": {
      "from": "919876543210",
      "text": { "body": "status" }
    }
  }
}
```

Extract:

- `from` → the sender's phone number (strip leading country code to get 10-digit Indian number)
- `text.body` → the command text (lowercase, trimmed)

Pass both to `WhatsappBotService.handleIncoming(phone, message)`.

---

## Task 2 — WhatsappBotService: Command Parser

Create `apps/api/src/whatsapp-bot/whatsapp-bot.service.ts`.

### 2a. Identity Resolution

Before parsing any command:

1. Look up the phone number in Prisma `User` table
2. Determine if they are a LANDLORD or TENANT
3. If not found → reply: "Hi! You're not registered on RentMate yet. Ask your landlord to add you, or sign up at [APP_URL]"
4. Attach the user context to all subsequent service calls

### 2b. Command Matching

Use regex pattern matching. Commands are case-insensitive.
If no command matches → send the help menu (see 2c).

### LANDLORD COMMANDS

---

#### "status"

Pattern: `/^status$/i`

Fetch:

- All properties belonging to this landlord
- Current month's Payment records across all leases

Response format:

```
📊 *RentMate Summary — [Month Year]*

🏠 [Property Name 1]
✅ Collected: ₹[amount]
⏳ Pending: [count] tenants (₹[amount])
🔴 Overdue: [count] tenants (₹[amount])

🏠 [Property Name 2]
...

💰 *Total Collected: ₹[total]*
📌 *Total Outstanding: ₹[total]*
```

---

#### "remind [name]" or "remind all"

Patterns:

- `/^remind all$/i`
- `/^remind (.+)$/i`

For "remind all":

1. Find all PENDING payments this month for this landlord
2. Call `PaymentsService.sendRentReminder(paymentId)` for each
3. Response: "✅ Reminders sent to [n] tenants. Total pending: ₹[amount]"

For "remind [name]":

1. Fuzzy match tenant name across landlord's properties (case insensitive, partial match)
2. If found → send reminder → respond: "✅ Reminder sent to [Full Name] for ₹[amount] due [date]"
3. If not found → "❌ Tenant '[name]' not found. Reply _tenants_ to see your tenant list."

---

#### "paid [name] [amount?]"

Pattern: `/^paid (.+?)(\s+[\d,]+)?$/i`

1. Fuzzy match tenant name
2. If amount provided, use it. If not, use the lease's rentAmount.
3. Call `PaymentsService.markAsPaidCash(paymentId, landlordId)`
4. Response: "✅ ₹[amount] recorded as CASH from [Tenant Name]. Receipt sent to their WhatsApp."

---

#### "overdue"

Pattern: `/^overdue$/i`

Fetch all OVERDUE payments for this landlord's properties.

Response:

```
🔴 *Overdue Payments*

1. Rahul Sharma — ₹18,000 (15 days late) — Sunshine PG
2. Priya Verma — ₹12,000 (8 days late) — Lotus Gardens

Reply *remind all* to send reminders to all overdue tenants.
```

If none: "✅ No overdue payments. All tenants are up to date!"

---

#### "report"

Pattern: `/^report$/i`

1. Generate the monthly PDF summary (reuse ReceiptService)
2. Upload to Supabase Storage
3. Send PDF via WhatsApp to the landlord
4. Response: "📄 Your monthly report for [Month] is ready. Sending now..."

---

#### "tenants"

Pattern: `/^tenants$/i`

List all active tenants across all properties:

```
👥 *Your Tenants*

🏠 Sunshine PG
• Rahul Sharma — Room 2A — ₹18,000/mo — ✅ PAID
• Priya Verma — Room 3B — ₹12,000/mo — 🔴 OVERDUE

🏠 Lotus Gardens
• Arjun Kumar — Bed A — ₹8,000/mo — ⏳ PENDING
```

---

#### "maintenance"

Pattern: `/^maintenance$/i`

List all open maintenance requests:

```
🔧 *Open Maintenance Requests*

1. Kitchen sink leaking — Rahul Sharma — Sunshine PG — 3 days ago
2. AC not working — Priya Verma — Lotus Gardens — 1 day ago

Reply *done [number]* to mark a request as resolved.
```

---

#### "done [number]"

Pattern: `/^done (\d+)$/i`

Mark the nth maintenance request (from the last "maintenance" list) as resolved.
Store the last maintenance list in a short-lived cache (Redis or in-memory Map with 10min TTL).
Response: "✅ Maintenance request #[n] marked as resolved. Tenant notified."

---

#### "add [phone]"

Pattern: `/^add (\d{10})$/i`

Initiate a conversational tenant-add flow:

1. Bot: "Adding new tenant with number [phone]. What's their name?"
2. Landlord replies with name
3. Bot: "Which property? Reply with number:\n1. Sunshine PG\n2. Lotus Gardens"
4. Landlord replies with number
5. Bot: "What's the monthly rent amount? (₹)"
6. Landlord replies with amount
7. Bot creates tenant via `POST /v1/properties/:id/tenants`
8. Bot: "✅ [Name] added as tenant at [Property]. They'll receive a welcome WhatsApp shortly."

Store conversation state in an in-memory Map keyed by landlord phone number.
State expires after 5 minutes of inactivity.

---

### TENANT COMMANDS

---

#### "pay"

Pattern: `/^pay$/i`

1. Find tenant's current month PENDING payment
2. If Razorpay link already exists → resend it
3. If not → generate new Razorpay Payment Link → send it
4. Response: "💳 Your rent of ₹[amount] for [Month] is due on [date].\n\nPay here: [link]\n\nThis link expires in 24 hours."

---

#### "receipt"

Pattern: `/^receipt$/i`

1. Find tenant's most recent PAID payment
2. Send the receiptPdfUrl via WhatsApp
3. Response: "🧾 Here's your receipt for [Month] — ₹[amount] paid on [date]."
4. If no receipt yet: "No receipts found yet. Pay your rent via the link to get a receipt."

---

#### "balance"

Pattern: `/^balance$/i`

Response:

```
💰 *Your Rent Summary*

Current month: ₹[amount] — [STATUS]
Due date: [date]
Last payment: ₹[amount] on [date]

Reply *pay* to get your payment link.
```

---

#### "request [issue description]"

Pattern: `/^request (.+)$/i`

1. Create a MaintenanceRequest in Prisma with the description
2. Notify landlord via WhatsApp: "🔧 New maintenance request from [Tenant Name]: '[description]'"
3. Response to tenant: "✅ Your request has been logged: '[description]'\n\nYour landlord has been notified and will respond soon."

---

### 2c. Help Menu (fallback for unrecognised commands)

**For landlords:**

```
🏠 *RentMate Commands*

*status* — Monthly payment summary
*tenants* — List all tenants
*overdue* — See overdue payments
*remind [name]* — Send reminder to tenant
*remind all* — Remind all pending tenants
*paid [name]* — Record cash payment
*maintenance* — View open requests
*report* — Get monthly PDF report
*add [phone]* — Add a new tenant

Need help? Visit [APP_URL]
```

**For tenants:**

```
🏠 *RentMate — Tenant Commands*

*pay* — Get your payment link
*receipt* — Download your latest receipt
*balance* — See your rent status
*request [issue]* — Report a maintenance issue

Need help? Contact your landlord.
```

---

## Task 3 — Conversation State Manager

Create `apps/api/src/whatsapp-bot/conversation-state.service.ts`.

Simple in-memory Map for multi-step flows (tenant add, etc.):

```typescript
interface ConversationState {
  step: string;
  data: Record<string, any>;
  expiresAt: Date;
}

@Injectable()
export class ConversationStateService {
  private states = new Map<string, ConversationState>();

  set(phone: string, step: string, data: Record<string, any>): void;
  get(phone: string): ConversationState | null;
  clear(phone: string): void;
  // Cleanup expired states every 5 minutes via setInterval
}
```

---

## Task 4 — WhatsApp Message Sender: Bot Response Format

Add a new method to `WhatsappService`:

```typescript
async sendBotReply(phone: string, message: string): Promise<void>
```

Use Interakt's "Send Text Message" API (not a template — bot replies are free-form text):

```typescript
POST https://api.interakt.ai/v1/public/message/
{
  countryCode: "+91",
  phoneNumber: phone,
  type: "Text",
  data: { message: message }
}
```

**Important:** Template messages are required for outbound (landlord-initiated) messages.
But REPLIES within a 24-hour window of a user message can be free-form text.
The bot always replies within this window, so no template approval needed for bot responses.

---

## Task 5 — NRI Mode: Foundation Layer

This is Phase 1 of NRI Mode — the data layer that Week 4 will build on.

### 5a. Extend User model in Prisma

Add to the `User` model (only if fields don't exist):

```prisma
model User {
  // existing fields...

  // NRI fields
  isNRI          Boolean  @default(false)
  country        String?  // "UAE", "UK", "USA", "Singapore", "Canada", "Australia"
  timezone       String?  // IANA timezone e.g. "Asia/Dubai", "Europe/London"
  currency       String?  // "AED", "GBP", "USD", "SGD", "CAD", "AUD"
  nroAccountFlag Boolean  @default(false)
  poaHolderPhone String?  // Phone of Power of Attorney holder
}
```

### 5b. New API endpoint: PATCH /v1/users/me/nri-settings

```typescript
// Request body
{
  isNRI: true,
  country: "UAE",
  timezone: "Asia/Dubai",
  currency: "AED",
  nroAccountFlag: true
}

// Response: updated User object
```

### 5c. Timezone-aware cron jobs

Update `RentReminderScheduler` to fire reminders at 9am in the LANDLORD's timezone, not IST:

```typescript
// Instead of a fixed cron, check each landlord's timezone
// and send reminders when it's 9am in their local time
async sendTimezoneAwareReminders() {
  const landlords = await this.prisma.user.findMany({
    where: { role: 'LANDLORD' }
  });

  for (const landlord of landlords) {
    const tz = landlord.timezone || 'Asia/Kolkata';
    const localHour = new Date().toLocaleString('en-US', {
      timeZone: tz, hour: 'numeric', hour12: false
    });

    if (parseInt(localHour) === 9) {
      // Send reminders for this landlord's properties
      await this.sendRemindersForLandlord(landlord.id);
    }
  }
}
```

### 5d. Currency conversion utility

Create `apps/api/src/shared/currency.service.ts`:

```typescript
@Injectable()
export class CurrencyService {
  // Use free exchangerate-api.com API
  // Cache rates for 1 hour in memory
  async convert(amountINR: number, toCurrency: string): Promise<number>;
  async getRate(toCurrency: string): Promise<number>;
}
```

Free API: `https://open.er-api.com/v6/latest/INR` — no key required, 1500 requests/month free.

---

## Definition of Done ✅

**WhatsApp Bot**

- [ ] Sending "status" to the bot returns a correct payment summary for the landlord
- [ ] Sending "remind all" triggers WhatsApp reminders to all PENDING tenants
- [ ] Sending "paid Rahul" marks Rahul's payment as CASH PAID and sends receipt
- [ ] Sending "overdue" lists all overdue tenants correctly
- [ ] Sending "pay" as a tenant returns a valid Razorpay payment link
- [ ] Sending "request tap leaking" creates a MaintenanceRequest and notifies landlord
- [ ] Unrecognised commands return the help menu
- [ ] Tenant commands don't work for landlord phone numbers and vice versa
- [ ] Multi-step "add [phone]" flow completes successfully and creates a tenant
- [ ] Conversation state expires correctly after 5 minutes of inactivity

**NRI Foundation**

- [ ] `PATCH /v1/users/me/nri-settings` saves NRI fields correctly
- [ ] CurrencyService correctly converts ₹18,000 to AED/GBP/USD using live rates
- [ ] Timezone-aware cron correctly identifies 9am in "Asia/Dubai" vs "Asia/Kolkata"

**General**

- [ ] All bot endpoints are `@Public()` — no auth guard
- [ ] Bot correctly identifies landlord vs tenant by phone number
- [ ] Unknown phone numbers get the registration prompt
- [ ] `pnpm typecheck` passes with zero errors
- [ ] No console errors during normal bot usage

---

## Important Constraints

- Do NOT use Redis — use in-memory Map for conversation state (Redis is overkill for MVP)
- Do NOT modify existing WhatsappService methods — only ADD the new `sendBotReply` method
- Do NOT change existing cron jobs — ADD the new timezone-aware one alongside them
- Free-form text replies (within 24hr window) do NOT need Interakt template approval
- Fuzzy name matching: use simple `.toLowerCase().includes()` — no need for a fuzzy library
- The bot must respond within 3 seconds — all DB queries must be fast (add indexes if needed)
- If any service call fails, the bot must ALWAYS send a reply — never leave the user hanging
  - On error: "⚠️ Something went wrong. Please try again or open the RentMate app."
