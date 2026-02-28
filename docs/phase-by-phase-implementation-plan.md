# Phase-by-Phase Implementation Plan

Last updated: 2026-02-25
Status: In execution (Phases 0-7 implemented, Phase 8 in progress)

## Locked Decisions

- Backend framework: `NestJS`
- ORM/migrations: `Prisma`
- Auth provider: `Supabase Auth`
- Mobile strategy: `Capacitor` over current React app
- Online payment provider for India-first launch: `Cashfree`

## Open Decisions (Deferred)

- API hosting provider: Railway vs Render vs Fly
- Launch geography (compliance + payment rails)

## Execution Principles

- API-first architecture (client-agnostic for future React Native migration).
- No business-critical logic in frontend.
- Schema-first development with migration discipline.
- Every phase has hard exit criteria before moving forward.

## Phase Plan

### Phase 0: Repo and Build Hardening

Objective:

- Convert current UI prototype into a production-ready engineering baseline.

Work:

- Introduce monorepo structure (`apps/mobile-web`, `apps/api`, `packages/*`).
- Replace runtime Tailwind/importmap setup with build-time tooling.
- Add lint, typecheck, test, formatting, and commit hooks.
- Add environment strategy (`.env.example`, per-app config loading).
- Add CI skeleton (typecheck + lint + unit tests + build).

Deliverables:

- Stable local dev boot for web app and API.
- Deterministic build pipeline and CI checks.

Exit criteria:

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass in CI.
- No runtime CDN/importmap dependency remains.

### Phase 1: Backend Foundation (NestJS Core)

Objective:

- Stand up API foundation with security and observability baseline.

Work:

- Initialize NestJS app with module boundaries:
  - `auth`, `users`, `properties`, `leases`, `billing`, `maintenance`, `chat`, `notifications`, `documents`
- Add global validation pipes and error filter strategy.
- Add structured logging, request IDs, health/readiness endpoints.
- Add OpenAPI generation and versioned routing (`/v1`).
- Add Sentry integration (API side).

Deliverables:

- Running API foundation with consistent response/error model.

Exit criteria:

- Health checks operational.
- OpenAPI doc generated from source and published in dev.
- Authenticated and unauthenticated route guards testable.

### Phase 2: Database and Access Model (Prisma + Supabase)

Objective:

- Create durable relational model and enforce access rules.

Work:

- Design Prisma schema for:
  - users/profiles/roles
  - properties/units/tenancies/leases
  - charges/payments/payment_events
  - maintenance requests/comments
  - threads/messages
  - documents/notifications/audit_logs
- Implement migration pipeline and seed strategy.
- Integrate Supabase Auth token verification in API guards.
- Map auth identities to internal user records.
- Define authorization matrix (landlord/tenant/admin).

Deliverables:

- Migration-managed Postgres schema + auth integration.

Exit criteria:

- Fresh DB bootstrap from migrations works.
- Role authorization tests pass for critical endpoints.
- No direct localStorage auth dependencies remain in app logic.

### Phase 3: Identity, Profile, and Session Flows

Objective:

- Replace mock login/register/profile with real auth/session architecture.

Work:

- Implement API endpoints for profile read/update.
- Wire frontend to Supabase Auth SDK + backend token-protected APIs.
- Implement route guards and role-aware navigation.
- Implement logout/session-expiry behavior and error UX.
- Add forgot/reset password flow.

Deliverables:

- Fully working auth lifecycle across landlord and tenant roles.

Exit criteria:

- Login/register/logout/reset flows pass e2e tests.
- Unauthorized access to protected routes is blocked.

### Phase 4: Property, Units, Invites, Leases

Objective:

- Ship core property management domain.

Work:

- CRUD for properties and units with ownership checks.
- Tenant invite flow:
  - generate invite token/code
  - accept invite
  - attach tenant to lease/unit
- Lease management:
  - create/update lease
  - lease status lifecycle
  - lease document metadata
- Replace mock/hardcoded property and lease screens with live APIs.

Deliverables:

- Core landlord-tenant relationship and lease lifecycle in production DB.

Exit criteria:

- Landlord can create property/unit and invite tenant end-to-end.
- Tenant can join and view assigned lease.

### Phase 5: Billing Core and Payment Architecture

Objective:

- Build billing ledger and charge lifecycle, independent of final payment choice.

Work:

- Implement monthly charge generation engine.
- Implement billing statuses and ledger event log.
- Implement cash submission and landlord approve/reject.
- Implement payment method model (token references only).
- Build reporting aggregates used by dashboard/finance pages.

Deliverables:

- Auditable billing engine with cash workflow.

Exit criteria:

- Monthly charge generation is deterministic and idempotent.
- Cash approval updates ledger atomically with audit trail.

Decision gate before next phase:

- Confirm V1 payments:
  - `Option A`: online + cash
  - `Option B`: cash-only launch

### Phase 6: Online Payments (Conditional)

Objective:

- Add online collection flow if Option A is selected.

Work:

- Cashfree integration for order/session-based checkout.
- Webhook ingestion + signature verification.
- Reconciliation jobs and retry policies.
- Failed/refund/dispute state handling.

Deliverables:

- Online payment pipeline with reconciled ledger events.

Exit criteria:

- End-to-end online payment test passes with webhook-driven finalization.
- Duplicate webhook delivery handled safely (idempotent).

### Phase 7: Maintenance, Chat, Documents, Notifications

Objective:

- Complete tenant/landlord collaboration workflows.

Work:

- Maintenance request lifecycle and status transitions.
- Chat thread/message persistence and realtime updates.
- Document upload/download via signed URLs and validation.
- In-app notifications + push registration/delivery plumbing.

Deliverables:

- Operational communication and support workflows.

Exit criteria:

- Tenant request appears in landlord queue in near real time.
- Chat messages persist and reload correctly.
- Document upload/download secured by signed access flow.

### Phase 8: Mobile Packaging and Native Readiness

Objective:

- Convert production web app into shippable iOS/Android binaries.

Work:

- Add Capacitor iOS/Android projects.
- Configure deep links, app permissions, push setup.
- Build signing pipeline and environment separation for release builds.
- Device-level QA on representative iOS/Android versions.

Deliverables:

- Signed release candidates for both stores.

Exit criteria:

- Critical flows pass on physical devices.
- Crash-free smoke test baseline achieved.

### Phase 9: Security, Performance, and Launch Ops

Objective:

- Final hardening before store submission.

Work:

- Security checklist:
  - input validation coverage
  - authorization penetration checks
  - secret rotation/management verification
- Performance checks for key endpoints and screens.
- Backup, rollback, incident runbook, and on-call basics.
- Policy docs: privacy policy, terms, support, data deletion process.

Deliverables:

- Launch-ready operational posture.

Exit criteria:

- No P0/P1 defects open.
- Store submission artifacts complete and reviewed.

### Phase 10: Store Submission and Post-Launch Guardrails

Objective:

- Submit and operate safely after release.

Work:

- App Store + Play Store metadata and compliance forms.
- First release monitoring dashboard.
- Post-launch alert thresholds and hotfix process.

Deliverables:

- Public release + monitored rollout.

Exit criteria:

- Production monitoring stable after release window.

## Cross-Phase Engineering Standards

- Tests required for all critical domain flows.
- Backward-compatible API changes unless explicitly versioned.
- Migrations are forward-only and reviewed.
- Audit logs for privileged actions.
- Zero placeholder production code.

## Suggested Milestone Sequence

1. Milestone A: Phases 0-3 complete (auth and identity fully real)
2. Milestone B: Phases 4-5 complete (core PM and billing live)
3. Milestone C: Phases 6-8 complete (payments, collaboration, mobile binaries)
4. Milestone D: Phases 9-10 complete (hardening and store launch)
