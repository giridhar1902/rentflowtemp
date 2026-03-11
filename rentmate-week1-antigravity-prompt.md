# RentMate — Week 1 Build Prompt for Antigravity

## Goal

Wire the existing NestJS + Supabase + Prisma + React stack so that:

1. A landlord can sign up / log in via phone OTP (Supabase Auth)
2. A logged-in landlord can create a Property
3. A landlord can add a Tenant to a Property
4. All data persists in PostgreSQL (via Prisma + Supabase)
5. The landlord dashboard displays their properties and tenants after a page refresh

---

## Existing Stack (do not change these)

- **Monorepo:** Turborepo with pnpm
- **Frontend:** `apps/mobile-web` — React 19 + Vite + Tailwind CSS + Capacitor
- **Backend:** `apps/api` — NestJS + Prisma ORM + PostgreSQL
- **Database host:** Supabase (managed Postgres + Auth)
- **Auth:** Supabase JWT — already validated by a global NestJS AuthGuard
- **ORM:** Prisma — schema lives at `apps/api/prisma/schema.prisma`

---

## Task 1 — Supabase Auth: Phone OTP Login (Frontend)

### What to build

A login screen in the React frontend that:

- Shows a phone number input field (with +91 prefix for India)
- On submit, calls `supabase.auth.signInWithOtp({ phone })` to send an OTP via SMS
- Shows a 6-digit OTP input field after the SMS is sent
- On OTP submit, calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- On success, stores the Supabase session and redirects to `/dashboard`
- On failure, shows a clear inline error message

### Rules

- Use the existing Supabase client instance (do not create a new one)
- Do not use email/password auth — phone OTP only
- The login screen should be mobile-first and match the existing Tailwind design system
- After login, the Supabase JWT must be attached to every subsequent API call to NestJS as a Bearer token in the Authorization header

---

## Task 2 — Prisma Schema: Add Missing Tables

### Check the existing schema first

Open `apps/api/prisma/schema.prisma` and check which of the following models already exist.

### Add only what is missing — do not delete or modify existing models

```prisma
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  role      Role     @default(LANDLORD)
  createdAt DateTime @default(now())

  properties Property[]
  leases     Lease[]
}

enum Role {
  LANDLORD
  TENANT
}

model Property {
  id        String   @id @default(uuid())
  name      String
  address   String
  city      String   @default("Bengaluru")
  createdAt DateTime @default(now())

  landlordId String
  landlord   User     @relation(fields: [landlordId], references: [id])

  units Unit[]
}

model Unit {
  id         String   @id @default(uuid())
  label      String   // e.g. "Flat 2B" or "Room 3"
  rentAmount Float
  createdAt  DateTime @default(now())

  propertyId String
  property   Property @relation(fields: [propertyId], references: [id])

  leases Lease[]
  beds   Bed[]
}

model Bed {
  id        String   @id @default(uuid())
  label     String   // e.g. "Bed A", "Bed B"
  createdAt DateTime @default(now())

  unitId String
  unit   Unit   @relation(fields: [unitId], references: [id])

  leases Lease[]
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  phone     String   @unique
  email     String?
  createdAt DateTime @default(now())

  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id])

  leases Lease[]
}

model Lease {
  id          String      @id @default(uuid())
  startDate   DateTime
  endDate     DateTime?
  rentAmount  Float
  depositAmount Float     @default(0)
  status      LeaseStatus @default(ACTIVE)
  createdAt   DateTime    @default(now())

  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])

  unitId     String?
  unit       Unit?    @relation(fields: [unitId], references: [id])

  bedId      String?
  bed        Bed?     @relation(fields: [bedId], references: [id])

  landlordId String
  landlord   User     @relation(fields: [landlordId], references: [id])

  payments Payment[]
}

enum LeaseStatus {
  ACTIVE
  ENDED
  PENDING
}

model Payment {
  id          String        @id @default(uuid())
  amount      Float
  method      PaymentMethod @default(CASH)
  status      PaymentStatus @default(PENDING)
  paidAt      DateTime?
  dueDate     DateTime
  notes       String?
  createdAt   DateTime      @default(now())

  leaseId String
  lease   Lease  @relation(fields: [leaseId], references: [id])
}

enum PaymentMethod {
  CASH
  UPI
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
}
```

After updating the schema, run:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

---

## Task 3 — NestJS API: Three Endpoints

Build the following REST endpoints inside the existing NestJS app. Follow the existing module/controller/service pattern already in the codebase.

All endpoints are protected by the existing global AuthGuard. The authenticated user's ID is available via `@CurrentUser()` decorator (or however the existing codebase injects it — match that pattern exactly).

### 3a. POST /v1/properties — Create a property

**Request body:**

```json
{
  "name": "Sunshine PG",
  "address": "12th Main, HSR Layout",
  "city": "Bengaluru"
}
```

**Behaviour:** Creates a Property in Prisma linked to the authenticated landlord's User ID.

**Response:**

```json
{
  "id": "uuid",
  "name": "Sunshine PG",
  "address": "12th Main, HSR Layout",
  "city": "Bengaluru",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### 3b. GET /v1/properties — List landlord's properties

**Behaviour:** Returns all properties belonging to the authenticated landlord, including their units and active leases count.

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Sunshine PG",
    "address": "12th Main, HSR Layout",
    "city": "Bengaluru",
    "unitCount": 3,
    "activeTenantsCount": 5
  }
]
```

---

### 3c. POST /v1/properties/:propertyId/tenants — Add a tenant to a property

**Request body:**

```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "rentAmount": 8000,
  "depositAmount": 16000,
  "startDate": "2026-02-01",
  "unitLabel": "Room 2",
  "bedLabel": "Bed A"
}
```

**Behaviour:**

1. Find or create a Tenant record by phone number
2. Create a Unit under the given property (using `unitLabel`)
3. Create a Bed under that Unit (using `bedLabel`) — optional, only if bedLabel is provided
4. Create a Lease linking Tenant → Unit (or Bed if provided) → Landlord
5. Return the created lease with tenant details

**Response:**

```json
{
  "leaseId": "uuid",
  "tenant": {
    "name": "Rahul Sharma",
    "phone": "9876543210"
  },
  "unit": "Room 2",
  "bed": "Bed A",
  "rentAmount": 8000,
  "startDate": "2026-02-01",
  "status": "ACTIVE"
}
```

---

## Task 4 — Frontend: Landlord Dashboard

Build or update the landlord dashboard at `/dashboard` in `apps/mobile-web`.

### Dashboard must show:

1. **Header:** "Good morning, [landlord name]" + a logout button
2. **Properties list:** Cards showing each property with name, address, unit count, active tenant count
3. **"Add Property" button:** Opens a simple form (name, address) → calls `POST /v1/properties` → refreshes the list
4. **Per-property "Add Tenant" button:** Opens a form collecting tenant name, phone, rent amount, deposit, start date, unit label, bed label (optional) → calls `POST /v1/properties/:id/tenants` → shows success confirmation

### Rules for the forms:

- Phone number field must accept 10-digit Indian numbers only (validate on frontend)
- Rent amount field must be numeric, in INR (₹)
- All fields show inline validation errors before submission
- On successful submission, close the form and refresh the property/tenant list without a full page reload
- Show a loading spinner while API calls are in progress
- Show a clear error message if the API call fails

### Data fetching:

- On dashboard load, call `GET /v1/properties` and display results
- All API calls must include the Supabase JWT as `Authorization: Bearer <token>`
- If the JWT is expired or missing, redirect to the login screen

---

## Task 5 — Environment Variables

Ensure the following are documented in `.env.example` files:

### Root / `apps/api/.env.example`

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-supabase-jwt-secret
```

### `apps/mobile-web/.env.example`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:4000/v1
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
```

---

## Definition of Done ✅

Before marking this complete, verify ALL of the following manually:

- [ ] A new landlord can enter their phone number, receive an OTP SMS, and log in successfully
- [ ] After login, they land on `/dashboard`
- [ ] They can click "Add Property", fill the form, submit, and see the new property card appear
- [ ] They can click "Add Tenant" on a property, fill the form, submit, and see a success confirmation
- [ ] After a full browser refresh, all properties and tenants are still visible (data persisted in Supabase)
- [ ] Logging out clears the session and redirects to the login screen
- [ ] No TypeScript errors (`pnpm typecheck` passes)
- [ ] No console errors in the browser during normal usage

---

## Important Constraints

- Do NOT introduce new packages without checking if an equivalent already exists in `package.json`
- Do NOT change the Turborepo or pnpm workspace configuration
- Do NOT modify the existing AuthGuard or JWT validation logic — extend it if needed
- Match the existing code style, naming conventions, and file structure exactly
- If any existing model in `schema.prisma` conflicts with the schema above, flag it and ask before modifying
