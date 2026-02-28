# UI to Backend Gap Analysis

Last updated: 2026-02-24

## What Exists Today

- React + Vite + TypeScript frontend.
- Mobile-like layout constrained to ~430px width.
- Routing for landlord, tenant, and shared screens.
- Mock data service using `localStorage` (`services/mockBackend.ts`).
- Static/hardcoded UI data across most pages.

## Critical Findings

### 1) No production auth

- Login/register screens do not validate real credentials.
- Role selection is controlled by local state/localStorage.
- No token lifecycle, password reset, email verification, session invalidation, or device management.

### 2) No real backend/API boundary

- No server or serverless API routes.
- No request auth middleware.
- No rate limiting, input validation, or audit trail.
- No background jobs (reminders, ledger updates, notifications).

### 3) No persistent relational data model

- Properties/units/tenants/leases/payments/maintenance/chat are not persisted in a DB.
- Records are hardcoded or simulated in component state.
- No referential integrity, transactions, or reporting-grade history.

### 4) No payment infrastructure

- Rent payment UI exists, but no payment processor integration.
- Card/bank data shown in UI is placeholder only.
- No webhook handling, reconciliation, payout logic, or refund/dispute workflow.

### 5) No document/file storage pipeline

- Lease/document upload controls are visual only.
- No object storage buckets, signed URLs, MIME checks, malware scanning, or retention policy.

### 6) No push notifications or messaging backend

- Chat is static.
- No realtime channels, message persistence, attachment handling, or moderation controls.
- No push token registration or delivery pipeline (APNS/FCM).

### 7) No observability/security baseline

- No structured logging, error tracking, tracing, or alerting.
- No RBAC/RLS policies.
- No secrets strategy for production.
- No compliance guardrails around PII/payment data.

### 8) Not app-store ready yet

- Current app is web-first with no native wrappers/config.
- Missing iOS/Android native project setup, signing, permissions strategy, app icons/splash, policies, and submission artifacts.

## Feature Coverage Matrix (UI vs Real Backend)

- Auth/Onboarding: UI present, backend missing.
- Properties/Units: partial mock backend only.
- Tenant Assignment/Invites: UI present, backend missing.
- Rent Collection + Approvals: UI present, backend missing.
- Expense Tracking/Financial Reports: UI present, backend missing.
- Maintenance Requests: UI present, backend missing.
- Chat + Attachments: UI present, backend missing.
- Profile/Account/Payment Methods: UI present, backend missing.
- Lease Documents: UI present, backend missing.

## Immediate Technical Debt to Address Before Build

- Remove runtime dependency patterns in `index.html` (CDN Tailwind/import map) and move to build-managed assets.
- Introduce typed domain models and API client boundaries before wiring endpoints.
- Replace `localStorage` session logic with secure auth/session state.
- Define schema + access model first (RLS/RBAC), then wire endpoints.
