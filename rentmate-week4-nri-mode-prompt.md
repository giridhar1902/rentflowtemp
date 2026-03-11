# RentMate — Week 4 Build Prompt: NRI Mode

## Goal

Build a complete NRI Landlord experience that lets Indians abroad manage their
Indian rental properties with full visibility, compliance automation, and
timezone-aware communication — all from their phone, wherever they are.

This is RentMate's premium monetisation tier. Everything in this prompt sits
on top of the NRI foundation layer built in Week 3 (User.isNRI, timezone,
currency, CurrencyService).

---

## Existing Foundation (built in Week 3)

- `User.isNRI`, `User.country`, `User.timezone`, `User.currency`, `User.nroAccountFlag`, `User.poaHolderPhone`
- `CurrencyService.convert(amountINR, toCurrency)` — live exchange rates
- `PATCH /v1/users/me/nri-settings` — NRI profile setup endpoint
- Timezone-aware cron job base

---

## New Environment Variables

Add to `apps/api/.env.example`:

```
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/INR
TDS_RATE_NRI=0.312
```

---

## Task 1 — NRI Onboarding Flow (Frontend)

### 1a. NRI Detection on Signup

After phone OTP login, if the landlord's phone has a non-Indian country code
OR if they manually select "I'm an NRI" on the profile screen:

Show the NRI Setup screen with these fields:

- Country of residence (dropdown): UAE, UK, USA, Singapore, Canada, Australia, Other
- Preferred currency (auto-filled based on country, editable)
- Timezone (auto-filled based on country, editable)
- NRO account linked? (toggle — Yes/No)
- Local contact in India (optional — name + phone, for property photos)

On submit → call `PATCH /v1/users/me/nri-settings`.

### 1b. NRI Badge

On the landlord dashboard header, show a small flag emoji of their country
next to their name if `isNRI = true`.
Example: "Rajesh Kumar 🇦🇪"

---

## Task 2 — Dual Currency Dashboard

### 2a. All monetary values shown in ₹ + local currency

Every rupee amount across the entire app (for NRI landlords only) must show:

```
₹45,000  /  AED 1,940
```

Both on the same line, with the foreign currency in a lighter grey font.

Use `CurrencyService.convert()` for all conversions.
Cache the exchange rate in the frontend (localStorage with 1hr TTl — refetch after expiry).

### 2b. Monthly Income Card (NRI Dashboard)

Add a dedicated card at the top of the NRI dashboard:

```
┌─────────────────────────────────────────┐
│  💰 This Month's Rental Income          │
│                                         │
│  ₹1,35,000          AED 5,820          │
│  collected across 3 properties          │
│                                         │
│  📈 +₹15,000 vs last month             │
│  Exchange rate: 1 INR = 0.043 AED      │
│  Updated: 2 hours ago                   │
└─────────────────────────────────────────┘
```

### 2c. New API endpoint: GET /v1/nri/income-summary

```typescript
// Response
{
  totalINR: 135000,
  totalForeignCurrency: 5820,
  foreignCurrency: "AED",
  exchangeRate: 0.043,
  rateUpdatedAt: "2026-03-11T06:00:00Z",
  monthlyBreakdown: [
    { month: "Jan 2026", amountINR: 120000, amountForeign: 5160 },
    { month: "Feb 2026", amountINR: 135000, amountForeign: 5820 },
  ],
  propertySummary: [
    { propertyName: "Sunshine PG", amountINR: 85000, amountForeign: 3655 },
    { propertyName: "Lotus Gardens", amountINR: 50000, amountForeign: 2150 }
  ]
}
```

---

## Task 3 — TDS Compliance Automation

This is the most technically important NRI feature. Build it carefully.

### Background

When a tenant pays rent to an NRI landlord:

- Tenant must deduct 31.2% TDS from the rent
- Tenant must deposit TDS by the 7th of the following month
- Tenant must file Form 27Q quarterly (April, July, October, January)
- Landlord must receive Form 16A within 15 days of quarterly filing

### 3a. TDS Detection on Lease Creation

When a lease is created where `landlord.isNRI = true`:

1. Flag the lease as `hasTdsObligation = true` in Prisma
2. Calculate TDS amount: `tdsAmount = rentAmount * 0.312`
3. Calculate net rent: `netRent = rentAmount - tdsAmount`

Add to Lease model:

```prisma
model Lease {
  // existing fields...
  hasTdsObligation Boolean @default(false)
  tdsRate          Float   @default(0.312)
}
```

Add to Payment model:

```prisma
model Payment {
  // existing fields...
  tdsAmount        Float?  // TDS deducted from this payment
  netAmountReceived Float? // Amount actually received after TDS
  tdsDepositedAt   DateTime? // When tenant deposited TDS with govt
  tdsConfirmedByLandlord Boolean @default(false)
}
```

### 3b. Tenant TDS Warning

When a tenant pays rent for an NRI landlord (via UPI link or app):
Show a prominent notice BEFORE payment:

```
⚠️ TDS Obligation Notice

Your landlord is an NRI. As per Indian tax law,
you must deduct 31.2% TDS from this rent payment.

Rent amount:        ₹18,000
TDS to deduct:      ₹5,616
Amount to pay now:  ₹12,384

You must deposit ₹5,616 as TDS by [7th of next month].

I understand my TDS obligation  ☐
```

Tenant must check the box before payment proceeds.
On payment: record `tdsAmount = 5616` and `netAmountReceived = 12384` on the Payment.

### 3c. TDS Calendar & Reminders

Create a TDS calendar for each NRI landlord:

```typescript
// TDS reminder schedule (sent via WhatsApp)
// 5th of every month → "TDS deposit deadline is in 2 days for [tenant]"
// 7th of every month → "Today is the TDS deposit deadline for [tenant]"
// Quarterly → "Form 27Q filing is due this month"
```

New NestJS cron:

```typescript
@Cron('0 9 5 * *') // 5th of every month
async sendTdsDepositReminder() { ... }

@Cron('0 9 7 * *') // 7th of every month
async sendTdsDeadlineAlert() { ... }

// Quarterly: runs on 1st of April, July, October, January
@Cron('0 9 1 1,4,7,10 *')
async sendForm27QReminder() { ... }
```

WhatsApp message to tenant on 5th:

```
⚠️ TDS Reminder — Action Required

You have 2 days to deposit TDS for rent paid to [Landlord Name].

TDS amount: ₹[amount]
Deadline: [date]

Deposit at: https://onlineservices.tin.egov-nsdl.com
Challan: ITNS 281

Once deposited, reply "tds done" to confirm.
```

### 3d. TDS Summary Report (NRI Landlord)

New API endpoint: `GET /v1/nri/tds-summary`

```typescript
// Response
{
  financialYear: "2025-26",
  quarters: [
    {
      quarter: "Q3 (Oct-Dec 2025)",
      totalRent: 135000,
      totalTdsDeducted: 42120,
      netReceived: 92880,
      form27QDueDate: "2026-01-31",
      form27QFiled: false,
      tenants: [
        {
          name: "Rahul Sharma",
          pan: "ABCDE1234F",
          rentPaid: 54000,
          tdsDeducted: 16848,
          tdsDepositConfirmed: true
        }
      ]
    }
  ],
  annualSummary: {
    totalRentINR: 540000,
    totalTdsINR: 168480,
    netReceivedINR: 371520,
    totalRentForeign: 23220,
    foreignCurrency: "AED"
  }
}
```

### 3e. Form 16A Summary PDF

Generate a PDF summary (NOT the official form — a summary for the landlord's CA):

```
┌─────────────────────────────────────────────┐
│  RENTMATE — TDS SUMMARY FOR CA              │
│  Financial Year: 2025-26                    │
│  Landlord: Rajesh Kumar (NRI - UAE)         │
│  ─────────────────────────────────────────  │
│  Property: Sunshine PG, HSR Layout          │
│                                             │
│  Tenant: Rahul Sharma                       │
│  PAN: ABCDE1234F                            │
│  Total Rent Paid: ₹2,16,000                │
│  TDS Deducted @ 31.2%: ₹67,392            │
│  Net Amount Received: ₹1,48,608           │
│                                             │
│  Quarter-wise breakdown:                    │
│  Q1: ₹54,000 rent | ₹16,848 TDS           │
│  Q2: ₹54,000 rent | ₹16,848 TDS           │
│  Q3: ₹54,000 rent | ₹16,848 TDS           │
│  Q4: ₹54,000 rent | ₹16,848 TDS           │
│  ─────────────────────────────────────────  │
│  Generated by RentMate on [date]            │
│  This is a summary. File Form 27Q via NSDL. │
└─────────────────────────────────────────────┘
```

Endpoint: `GET /v1/nri/tds-summary/pdf` → returns PDF buffer → upload to Supabase → return URL.

---

## Task 4 — Property Health Reports

### 4a. Local Contact Role

When a landlord sets a `poaHolderPhone` in their profile:

- Create a special "LOCAL_CONTACT" role in the User system
- Local contact gets limited access: can only upload property photos and view maintenance requests
- Cannot see payment data, tenant financial details, or lease terms

### 4b. Monthly Photo Request Flow

New NestJS cron (runs on 1st of every month):

```typescript
@Cron('0 10 1 * *')
async requestPropertyPhotos() {
  // Find all NRI landlords with a poaHolderPhone
  // Send WhatsApp to local contact:
  // "Please take 5 photos of [Property Name] and reply with them here.
  //  [Landlord Name] will be notified once received."
}
```

### 4c. Photo Upload via WhatsApp

When local contact replies with images to the WhatsApp bot:

1. Interakt sends the image payload to the webhook
2. Download the image from Interakt's CDN
3. Upload to Supabase Storage under `property-photos/[propertyId]/[year]-[month]/`
4. Notify NRI landlord via WhatsApp:
   "📸 [Local Contact Name] has uploaded [n] photos of [Property Name]. View them in the app."

Handle image message type in the bot webhook:

```typescript
// Interakt image message payload
{
  "type": "whatsapp",
  "data": {
    "message": {
      "from": "919876543210",
      "type": "image",
      "image": { "url": "https://...", "caption": "Living room" }
    }
  }
}
```

### 4e. Property Health Score

Calculate a simple score (0-100) per property per month:

| Factor                     | Weight | Scoring                                          |
| -------------------------- | ------ | ------------------------------------------------ |
| Photos uploaded this month | 30pts  | 0 = 0pts, 1-3 = 15pts, 4+ = 30pts                |
| Open maintenance requests  | 30pts  | 0 = 30pts, 1 = 20pts, 2 = 10pts, 3+ = 0pts       |
| Rent collected on time     | 40pts  | All paid = 40pts, 1 late = 25pts, 2+ late = 0pts |

Show the Health Score on the NRI dashboard per property:

- 80-100: 🟢 Healthy
- 50-79: 🟡 Needs Attention
- 0-49: 🔴 At Risk

---

## Task 5 — Morning Digest (NRI WhatsApp Bot Command)

Add to the WhatsApp Bot (extends Week 3 bot):

### "morning" command

Pattern: `/^morning$/i` — also auto-sent daily at 8am landlord's timezone

```
🌅 *Good Morning, Rajesh!*
📍 Dubai | Wednesday, 11 Mar 2026

💰 *Rent Status — March 2026*
✅ Collected: ₹85,000 (AED 3,655)
⏳ Pending: 2 tenants (₹36,000)
🔴 Overdue: 1 tenant (₹18,000)

🏠 *Property Health*
Sunshine PG: 🟢 Healthy (92/100)
Lotus Gardens: 🟡 Attention (65/100)

📋 *TDS Reminder*
Rahul's TDS deposit is due in 2 days (₹5,616)

🔧 *Maintenance*
1 open request — AC not working (Priya, 1 day)

Reply with any command or open the app for details.
```

### "income" command (NRI-specific)

Pattern: `/^income$/i`

```
💰 *Your Rental Income*

This month: ₹1,35,000 = AED 5,820
Last month: ₹1,20,000 = AED 5,160
This year:  ₹3,85,000 = AED 16,555

Exchange rate: 1 INR = 0.043 AED
(Updated 2 hours ago)
```

### "tds" command (NRI-specific)

Pattern: `/^tds$/i`

```
📋 *TDS Summary — Q4 FY2025-26*

Tenant: Rahul Sharma
Rent this quarter: ₹54,000
TDS @ 31.2%: ₹16,848
Net received: ₹37,152
TDS deposit status: ⏳ Pending (due 7 Apr)

Form 27Q due: 31 May 2026

Reply *report* to get the full TDS PDF for your CA.
```

---

## Task 6 — NRI Pricing Tier (Backend Flag)

### 6a. Add subscription tier to User model

```prisma
enum SubscriptionTier {
  FREE
  LOCAL_PRO
  NRI_ESSENTIAL
  NRI_PREMIUM
}

model User {
  // existing fields...
  subscriptionTier  SubscriptionTier @default(FREE)
  subscriptionStart DateTime?
  subscriptionEnd   DateTime?
}
```

### 6b. Feature gates

Create a simple `SubscriptionGuard` that checks tier before allowing access:

| Feature                 | Minimum tier  |
| ----------------------- | ------------- |
| Basic rent tracking     | FREE          |
| WhatsApp bot (basic)    | FREE          |
| NRI dashboard           | NRI_ESSENTIAL |
| Dual currency display   | NRI_ESSENTIAL |
| TDS automation          | NRI_ESSENTIAL |
| Property Health Reports | NRI_ESSENTIAL |
| TDS PDF for CA          | NRI_PREMIUM   |
| Legal notice automation | NRI_PREMIUM   |
| PoA holder access       | NRI_PREMIUM   |
| Morning digest WhatsApp | NRI_PREMIUM   |

### 6c. Upgrade prompt

When a FREE/LOCAL user tries to access an NRI feature:
Return HTTP 402 with:

```json
{
  "error": "UPGRADE_REQUIRED",
  "message": "This feature requires NRI Essential plan",
  "upgradeUrl": "[APP_URL]/upgrade"
}
```

Frontend shows an upgrade modal with pricing:

```
NRI Essential — ₹1,499/month
• Dual currency dashboard
• TDS compliance automation
• Property health reports
• Timezone-aware reminders

NRI Premium — ₹2,999/month
Everything in Essential, plus:
• TDS PDF reports for CA
• Legal notice automation
• Power of Attorney access
• Daily WhatsApp morning digest
```

---

## Definition of Done ✅

**Dual Currency**

- [ ] NRI landlord dashboard shows ₹ + AED/GBP/USD for every amount
- [ ] `GET /v1/nri/income-summary` returns correct data with live exchange rates
- [ ] Exchange rate updates every hour and shows "Updated X hours ago"

**TDS Compliance**

- [ ] Creating a lease for NRI landlord correctly flags `hasTdsObligation = true`
- [ ] Tenant payment screen shows TDS warning with correct amounts (31.2%)
- [ ] Tenant cannot pay without checking TDS acknowledgement checkbox
- [ ] TDS reminder WhatsApp sent to tenant on 5th of month
- [ ] `GET /v1/nri/tds-summary` returns correct quarterly breakdown
- [ ] TDS summary PDF generates correctly and uploads to Supabase

**Property Health**

- [ ] Local contact receives monthly photo request via WhatsApp
- [ ] Photo upload via WhatsApp reply works and stores in Supabase
- [ ] Property Health Score calculates correctly (test all three factors)
- [ ] Health score displayed per property on NRI dashboard

**Morning Digest**

- [ ] "morning" command returns correct summary with timezone-adjusted date
- [ ] "income" command shows correct INR + foreign currency amounts
- [ ] "tds" command shows correct quarterly TDS summary
- [ ] Auto-morning digest fires at 8am landlord's local timezone (test with "Asia/Dubai")

**Pricing**

- [ ] FREE user attempting NRI feature gets 402 UPGRADE_REQUIRED response
- [ ] Frontend shows upgrade modal with correct pricing
- [ ] NRI_ESSENTIAL user can access TDS automation but not TDS PDF
- [ ] NRI_PREMIUM user can access all features

**General**

- [ ] All NRI features hidden from non-NRI landlords (no UI clutter for local users)
- [ ] `pnpm typecheck` passes with zero errors
- [ ] All new Prisma fields migrated with `npx prisma db push`

---

## Important Constraints

- Do NOT implement actual Razorpay subscription billing yet — just store the tier in DB
  (Manual upgrade for now: admin sets tier via a simple endpoint)
- Do NOT build Form 27Q itself — only a CA-readable summary PDF
- TDS calculation is always 31.2% (Section 195) — do not make this configurable yet
- Currency conversion uses the free open.er-api.com API — no paid service needed
- Property Health Score is calculated on-demand (not stored) — compute it fresh each time
- Local Contact WhatsApp image download must use server-side fetch (never expose CDN URL to client)
- All NRI-specific endpoints must check `user.isNRI === true` — return 403 if not NRI
