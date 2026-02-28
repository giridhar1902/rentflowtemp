# Implementation Plan v1

Last updated: 2026-02-24

## Goal

Ship a production-ready property management app (tenant + landlord) with backend, database, auth, payments, storage, notifications, and app-store deployment using low upfront cost and pay-as-you-scale services.

## Recommended Architecture (Low-Cost, Production-Oriented)

### Client

- Keep current React/Vite codebase.
- Add Capacitor for native iOS/Android builds and app-store packaging.
- Keep web deployment for admin/testing and future landlord web access.

### Backend Platform

- Supabase as primary backend:
  - Postgres DB
  - Auth
  - Storage
  - Realtime
  - Edge Functions for privileged operations and webhooks

### Payments

- Stripe for online rent payments (card/ACH by region availability).
- Do not store raw card data in app/backend.
- Keep cash flow as first-class workflow with landlord approval + immutable ledger event.

### Notifications

- Push: FCM + APNS via Capacitor push plugin.
- In-app: persisted notification table + unread state.
- Scheduled reminders via Supabase scheduled jobs/Edge functions.

### Observability

- Sentry (frontend + edge functions) for errors.
- Structured app logs for key business events (payments, approvals, lease actions).
- Basic alerting on failures for payment webhooks and scheduled jobs.

## Why This Stack

- Minimal infrastructure overhead.
- Fastest path from current UI prototype to production.
- Postgres fits relational domain (properties, leases, payments, requests).
- Strong upgrade path if traffic/complexity grows.

## Alternative (Not Recommended for Initial Launch)

- Full custom backend (NestJS/Fastify + Postgres + Redis + queue + storage).
- Better control, but materially higher build/ops burden and higher risk for first launch on a tight budget.

## Domain Model (v1)

- `users` (auth identity profile, role)
- `landlord_profiles`, `tenant_profiles`
- `properties`
- `units`
- `leases`
- `tenant_invitations`
- `payment_methods` (token refs only, never raw PAN)
- `rent_charges` (monthly charges)
- `payments`
- `payment_events` (immutable event log)
- `expenses`
- `maintenance_requests`
- `maintenance_comments`
- `chat_threads`
- `chat_messages`
- `documents`
- `notifications`
- `audit_logs`

## API Surface (v1 Modules)

- Auth + Profile
- Properties + Units
- Tenant Invite + Assignment
- Lease + Documents
- Billing + Charges + Payments + Cash Approvals
- Maintenance + Status Workflow
- Chat + Attachments
- Reports + Dashboard Metrics
- Notifications + Preferences

## Security Baseline (Must-Have Before Launch)

- Role-based authorization and row-level security.
- Input validation on every API/function boundary.
- File upload controls: size/type restrictions + signed URLs.
- Secrets in environment vault only.
- Audit logs for privileged actions.
- Rate limiting for auth-sensitive endpoints.

## Delivery Phases

### Phase 0: Foundation Hardening

- Stabilize frontend build pipeline (remove runtime CDN/import map dependency).
- Set environment and config strategy (dev/staging/prod).
- Introduce typed API client and domain DTOs.

### Phase 1: Auth + Data Core

- Supabase project and schema migrations.
- Auth flows: register/login/logout/session refresh/reset password.
- Profiles + role-aware route guards.

### Phase 2: Property and Lease Core

- Properties/units CRUD.
- Tenant invite and acceptance flow.
- Lease records + lease document storage/download.

### Phase 3: Rent and Financials

- Rent charge generation.
- Stripe payment intents + webhook reconciliation.
- Cash payment submission + landlord approve/reject.
- Payment history + owner-side collections view.

### Phase 4: Maintenance + Chat + Notifications

- Maintenance request lifecycle.
- Realtime chat with message persistence.
- Push + in-app notification delivery.

### Phase 5: Mobile Packaging + Store Submission

- Capacitor iOS/Android setup, app signing, permissions.
- QA regression + performance pass.
- Privacy policy, terms, app-store metadata, screenshots, review submission.

## Cost Profile (Early Stage)

- Supabase: free tier to start; pay once active users/data/job volume grows.
- Cloudflare Pages/Vercel for frontend hosting: free tier initially.
- Stripe: no monthly baseline required for many setups; transaction fees per payment.
- Sentry: free tier initially.
- Mandatory external costs:
  - Apple Developer Program: $99/year.
  - Google Play Console: $25 one-time.

## Decision Gates Required Before Build

1. Mobile strategy: keep React + Capacitor (recommended) vs rewrite in React Native.
2. Backend strategy: Supabase-first (recommended) vs custom Node backend.
3. Payment scope for V1: online payments + cash approvals, or cash-only first.
4. Geographic launch market (impacts payment rails, compliance text, tax handling).
5. Multi-property manager support in V1 or single landlord account first.

## Definition of Done for V1 Launch

- All major UI flows call real APIs and persist data.
- Role-based authorization enforced across all modules.
- Payment/webhook flows reconciled and tested.
- Crash/error monitoring active.
- Test suite green for critical flows (auth, property create, invite, payment, maintenance).
- Signed Android and iOS builds generated and submitted.
