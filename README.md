# RentMate (RentFlow) 🏠

RentMate is a modern, full-stack property management application designed for both Landlords and Tenants, with a specialized focus on PG (Paying Guest) and shared-room accommodations.

Built as a Turborepo monorepo, it features a responsive React web app (wrapped natively via Capacitor) and a scalable NestJS backend powered by Prisma and PostgreSQL.

## 🚀 Key Features

### For Landlords 🏢

- **Portfolio Dashboard**: Track occupancy rates, pending payments, and active maintenance requests at a glance.
- **PG & Shared Room Management**: Create properties, divide them into Units, and subdivide Units into individually rentable Beds.
- **Utility Splits**: Easily record utility bills (Electricity, Water, etc.) and automatically split them proportionally across tenants.
- **Google Maps Integration**: Visually pin property locations for accurate address data.
- **Automated Rent Tracking**: Monitor offline cash payments, track EMI deposits, and issue receipts.

### For Tenants 🙋

- **Tenant Dashboard**: View current lease details, upcoming dues, and historical payment records.
- **Maintenance Portal**: Submit and track repair requests directly to the landlord.
- **Automated Splitting**: See exactly what portion of the unit's utility bills you are responsible for.

---

## 🛠 Tech Stack

### Frontend (`apps/mobile-web`)

- **React 19** + **Vite**
- **Capacitor** (for Android/iOS native wrappers)
- **Tailwind CSS** (Custom Design System with Glassmorphism)
- **Headless UI** & **Framer Motion** (Accessible, animated components)
- **Google Maps API** (React component wrapper)

### Backend (`apps/api`)

- **NestJS** (Modular, domain-driven architecture)
- **Prisma ORM** (Type-safe database interactions)
- **PostgreSQL** (Relational data modeling for Units, Beds, and Leases)
- **Supabase** (JWT Authentication & Managed Database Hosting)

---

## 💻 Local Development Setup

### Prerequisites

- Node.js v22+
- `pnpm` (Package Manager)
- Docker Desktop (Required for local Supabase DB emulation)

### 1. Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

### 2. Environment Variables

Copy the `.env.example` files to `.env` in the root and in each sub-app (`apps/api` and `apps/mobile-web`).

_Make sure to add your `VITE_GOOGLE_MAPS_API_KEY` in the frontend `.env` to enable map features._

### 3. Start Local Database (Supabase)

```bash
npx supabase start
```

### 4. Sync Database & Seed Mock Data

Once the database is running, push the Prisma schema and seed it with realistic investor demo data (2 properties, 5 beds, tenants, and utility bills):

```bash
cd apps/api
npx prisma generate
npx prisma db push
npx prisma db seed
cd ../..
```

### 5. Start the Development Servers

Use Turborepo to spin up both the NestJS API and the Vite React app simultaneously from the root:

```bash
pnpm dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/v1`

---

## 📱 Mobile App (Android) Setup

1. Build the React web bundle:
   ```bash
   pnpm --filter mobile-web build
   ```
2. Sync the bundle with the native Capacitor project:
   ```bash
   cd apps/mobile-web
   npx cap sync android
   ```
3. Open Android Studio to build and run the APK:
   ```bash
   npx cap open android
   ```

## 🔐 Authentication Notes

The authentication pipeline utilizes Supabase JWTs. The global NestJS Auth Guard validates these tokens and automatically maps them to internal `User` records in Prisma, attaching role-specific contexts (`LANDLORD` or `TENANT`) to every authorized request.
