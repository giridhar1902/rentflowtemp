# Task Tracker

Last updated: 2026-02-26

## Current Build TODO (Frozen after "Start build")

- Status: `LOCKED` (Phase 8 in progress)
- [x] Add Capacitor Android and iOS projects in `apps/mobile-web` and sync built web assets.
- [x] Configure deep links and app permissions for both platforms (Android intent filters + iOS URL types).
- [x] Wire push-notification registration plumbing in mobile app runtime and backend token registration call.
- [x] Implement environment separation for mobile builds (`dev`/`prod`) and production-safe Capacitor config strategy.
- [x] Add release-signing pipeline docs/scripts for Android and iOS build candidates.
- [ ] Validate Phase 8 (workspace lint/typecheck/test/build + Capacitor sync/build checks) and update project memory/docs.

## Future Items TODO

- Not initialized yet.

## Session Notes

- Planning artifacts added:
  - `documentation.md`
  - `docs/ui-backend-gap-analysis.md`
  - `docs/implementation-plan-v1.md`
  - `docs/tech-stack-v1.md`
  - `docs/phase-by-phase-implementation-plan.md`
  - `.context/state/current_focus.json`
- Phase 0 execution started with locked Current Build TODO.
- Phase 0 implementation and validation completed.
- Phase 1 execution started with locked Current Build TODO.
- Phase 1 implementation and validation completed.
- Phase 2 execution started with locked Current Build TODO.
- Phase 2 implementation completed with passing lint/typecheck/test/build and auth-role guard unit coverage.
- Phase 2 runtime bootstrap validation completed against a fresh Docker Postgres and live API endpoint smoke tests.
- Phase 3+4 execution started with locked combined TODO scope.
- Phase 3+4 completed with passing lint/typecheck/test/build and fresh-DB runtime API validation (profile/property/invite/lease flows).
- Phase 5 execution started with locked billing-core TODO scope.
- Phase 5 completed with passing lint/typecheck/test/build and runtime validation of generation idempotency, cash approve/reject workflows, payment methods, and reporting aggregates.
- Phase 6 execution started with locked Cashfree online-payments TODO scope.
- Phase 6 completed with passing lint/typecheck/test/build and runtime validation of Cashfree checkout session flow, webhook idempotency, and reconciliation transitions.
- Phase 7 execution started with locked collaboration/workflow TODO scope.
- Phase 7 completed with passing lint/typecheck/test/build and runtime validation of maintenance/chat/documents/notifications collaboration flows.
- Phase 8 execution started with locked mobile packaging/native readiness TODO scope.
- Phase 8 implementation completed for Capacitor setup/deep links/push/runtime wiring and release scripts; native build validation is blocked by local toolchain prerequisites (Xcode first-launch/plugin integrity and Gradle network access).
- Hotfix applied for web login blank-screen regression: auth sync now keeps `session`/`profile` state consistent and route guards block profile-unresolved redirects until auth hydration completes.
- Hotfix applied for `ADMIN` redirect-loop bug: default authenticated route now resolves to `/landlord/dashboard`; unit tests added in `apps/mobile-web/src/lib/routes.test.ts`.
- Runtime auth-load issue diagnosed and resolved locally: API crashed on Prisma `P1001` due Postgres not running; local `proptech-postgres` container booted on `5432`, migrations+seed applied sequentially, and `/v1/health` verified OK.
- Backend auth verifier upgraded for Supabase signing-key compatibility: supports legacy HS256 (`SUPABASE_JWT_SECRET`) and new JWKS flow via `SUPABASE_URL` (fixes `/v1/users/me` 401 "Invalid access token" after login).
- Mobile-web navigation regression fixed: `BottomNav` is now rendered on Pay Rent (`/tenant/pay`) and Lease/Documents (`/lease`) pages, and Pay Rent fixed action tray is offset above nav to avoid overlap.
- Signup UX hardening added for Supabase email throttle: register flow now maps email-rate-limit errors to clear guidance and enforces a short client cooldown to prevent repeated resend hammering.
- Add Property flow fixed: step-1 now captures/validates `state` (required by backend), error modal now shows real API error details, and step-6 upload controls are fully wired to file pickers + backend document upload at submit.
- Tenant-landlord invite system upgraded: backend now links invites to existing tenant accounts, creates in-app invite notifications, exposes `GET /leases/invitations/mine` for tenant inbox, supports invite-code entry during tenant signup + post-login, and attempts Supabase invite email dispatch for non-registered invitee emails.
- Invite-flow validation rerun completed: `apps/api` + `apps/mobile-web` typecheck/lint/test/build passed after wiring tenant invitation inbox and signup/post-login invite-code acceptance.
- Invite email operational caveat documented: Supabase Auth rate limits/SMTP setup can block invite email delivery temporarily; invite-code acceptance path remains functional fallback.
- Hotfix applied for lease documents visibility mismatch: lease page now includes lease-bound docs and property-level `LEASE` docs so landlord-uploaded lease files are visible to tenants.
- Hotfix applied for landlord dashboard occupancy mismatch: occupancy percent now derives from active lease-to-unit mapping (same source-of-truth used by property occupancy badges), not stale `unit.status`.
- Property data-flow upgrade applied: amenities/features from landlord Add Property are now persisted to backend (`Property.amenities`, `floors`, `totalUnits`) instead of being UI-only.
- Tenant property detail experience added: active-lease property name now opens a dedicated tenant property page with cover photo, overview, and features.
- Landlord photo visibility fixed: properties list and property detail now load/render uploaded cover images from property-scoped image documents.
- Security hardening in property read path: tenant property detail API now scopes included lease rows to the authenticated tenant.
- Tenant maintenance-request UX hardening applied: removed silent submit-block behavior by surfacing explicit validation messages (title/details/lease linkage) and added robust API error-body parsing for actionable failure output.
- Landlord maintenance status transition hotfix applied: backend now allows direct completion from open states (`SUBMITTED`/`REVIEWING`/`SCHEDULED` -> `COMPLETED`), and landlord maintenance dropdown now shows only valid transitions and parses API errors into human-readable text.
