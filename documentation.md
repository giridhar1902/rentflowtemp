# Property Management App Documentation

Last updated: 2026-02-26

## Purpose

This file is the documentation index and coordination entrypoint for the project.

## Current Status

- UI has been migrated into monorepo `apps/mobile-web`.
- API Phase 1 foundation is complete in `apps/api` (modules, global pipeline, OpenAPI, Sentry hook).
- API Phase 2 is complete and runtime-validated (Prisma schema/migrations/seed, Supabase JWT verification, internal user mapping, role guard enforcement).
- Phase 3 is complete (real auth/session/profile wiring across frontend and backend profile APIs).
- Phase 4 is complete (properties/units/invitations/leases APIs + frontend live wiring for core property and invite flows).
- Phase 5 is complete (billing core APIs, idempotent charge generation, cash approval workflow, payment method APIs, reporting aggregates, and frontend billing wiring).
- Phase 6 is complete (Cashfree online payments: checkout session creation, webhook verification/idempotency, reconciliation flow, and tenant online checkout wiring).
- Phase 7 is complete (maintenance lifecycle, chat persistence, signed document access flow, in-app notifications, push registration plumbing, and frontend wiring for collaboration screens).
- Phase 8 is in progress (Capacitor Android/iOS setup, deep-link + push runtime wiring, env-separated mobile sync/release scripts implemented; final native build validation pending local toolchain prerequisites and signing credentials).
- Post-login blank-screen regression has been fixed (auth state hydration + route guard handling for profile-unresolved sessions).
- Role default routing now includes `ADMIN` -> `/landlord/dashboard` to prevent post-auth redirect loops.
- API token verification now supports both Supabase legacy HS256 secret and new JWKS-based signing keys to avoid post-login `/v1/users/me` 401s.
- Tenant navigation consistency fix applied: bottom navigation now stays visible on Pay Rent and Lease/Documents pages.
- Registration flow now handles Supabase email-rate-limit responses with explicit user guidance and temporary client-side cooldown.
- Add Property submission/upload reliability improved: required `state` validation aligned with API contract, actionable error reporting added, and property/document file uploads wired end-to-end.
- Invitation flow reliability improved: tenant invite inbox endpoint + UI wiring, signup-time invite-code capture for tenants, post-login invite-code path, registered-invitee detection, and non-blocking Supabase invite email dispatch attempt for non-registered invitee emails.
- Invite delivery behavior clarified: invitation email dispatch depends on Supabase Auth sender/rate-limit state; when throttled, invite creation still succeeds and tenant can join via invite code.
- Lease document visibility tightened: lease page now surfaces lease-specific files plus property-level documents of type `LEASE`, fixing tenant view gaps when landlord uploaded lease files at property scope.
- Landlord dashboard occupancy calculation now uses active leases mapped to units (not `unit.status`), eliminating 0%-occupied regressions when unit status lags lease assignment.
- Property metadata persistence added: landlord-entered floors, unit count, and amenity/features are now stored in backend and returned in property APIs.
- Tenant property details page added and wired from Active Lease card (`/tenant/property/:propertyId`) with property photo, amenities, and overview details.
- Landlord property cards/details now render uploaded property image documents instead of placeholder-only visuals.
- Tenant maintenance request form no longer fails silently on client-side constraints; it now displays explicit validation guidance and parses backend error payloads into readable messages.
- Landlord maintenance workflow now supports direct completion from open statuses (including `SUBMITTED -> COMPLETED`), and status dropdown options are aligned with backend transition rules to prevent invalid transition errors.
- Supabase credentials are configured in local env files for current development flow; backend verification is currently aligned with legacy HS256 JWT secret mode.
- Local backend boot check is validated with temporary Postgres and `/v1/health` returns 200 (2026-02-24).
- Payments and hosting decisions are still pending.
- Phase 0 through Phase 7 are complete and validated.

## Docs Index

- `docs/ui-backend-gap-analysis.md`: Deep audit of current UI vs production requirements.
- `docs/implementation-plan-v1.md`: Recommended architecture, rollout plan, costs, and launch checklist.
- `docs/tech-stack-v1.md`: Scale-oriented technology stack recommendation and decision checklist.
- `docs/phase-by-phase-implementation-plan.md`: Detailed execution phases with objectives, deliverables, and exit criteria.
- `docs/phase-0-execution-log.md`: Executed Phase 0 changes and current validation blockers.
- `docs/phase-1-execution-log.md`: Executed Phase 1 backend foundation and validation evidence.
- `docs/phase-2-execution-log.md`: Executed Phase 2 database/auth/access-model implementation and validation evidence.
- `docs/phase-3-execution-log.md`: Executed Phase 3 identity/profile/session implementation and validation evidence.
- `docs/phase-4-execution-log.md`: Executed Phase 4 properties/units/invite/lease implementation and validation evidence.
- `docs/phase-5-execution-log.md`: Executed Phase 5 billing-core implementation and validation evidence.
- `docs/phase-6-execution-log.md`: Executed Phase 6 Cashfree online-payments implementation and validation evidence.
- `docs/phase-7-execution-log.md`: Executed Phase 7 collaboration workflows implementation and validation evidence.
- `docs/phase-8-execution-log.md`: Executed Phase 8 mobile packaging/native readiness implementation and current validation blockers.
- `docs/mobile-release-runbook.md`: Operational runbook for mobile env setup, sync, and release build commands.
- `docs/access-control-matrix-v1.md`: Role authorization matrix and access enforcement principles.
- `task.md`: Frozen Current Build TODO and execution checklist.

## Context Memory

- `.context/state/current_focus.json`: Machine-readable project memory for handoff across sessions.
