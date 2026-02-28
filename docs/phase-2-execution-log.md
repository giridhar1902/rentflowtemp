# Phase 2 Execution Log

Date: 2026-02-24
Status: Complete

## Scope Executed

- Added Prisma schema covering:
  - users/profiles/roles
  - properties/units/leases/invitations
  - charges/payments/payment events/payment methods
  - maintenance requests/comments
  - chat threads/messages
  - documents/notifications/audit logs
- Added migration and seed pipeline:
  - `prisma/migrations/0001_init/migration.sql`
  - `prisma/seed.ts`
  - package scripts for generate/validate/migrate/seed.
- Added Nest Prisma foundation:
  - `PrismaModule`
  - `PrismaService`
- Integrated Supabase JWT verification into global auth guard:
  - verifies token signature with `SUPABASE_JWT_SECRET`
  - maps token identity to internal user via DB upsert
  - populates request auth context (`id`, `sub`, `role`, `email`).
- Added role metadata and enforcement:
  - `@Roles(...)` decorator
  - global `AppRolesGuard`
  - admin-only route (`GET /v1/auth/admin-only`).
- Added/updated access model documentation:
  - `docs/access-control-matrix-v1.md`

## Security Notes

- Hardened role source handling: role claims are read from signed `app_metadata` first and not from `user_metadata`.

## Tests and Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed.
  - Added unit tests for:
    - `SupabaseJwtService`
    - `AppAuthGuard`
    - `AppRolesGuard`
  - Critical authorization test count: 11 passing tests.
- `npm run build` passed.
- `npm run prisma:validate --workspace=apps/api` passed.
- `npm run prisma:generate --workspace=apps/api` passed.
- Fresh Postgres bootstrap/runtime validation completed using temporary Docker Postgres (`postgres:16-alpine`) on `127.0.0.1:55432`:
  - `npm run prisma:migrate:deploy --workspace=apps/api` passed (fresh DB).
  - `npm run prisma:seed --workspace=apps/api` passed.
  - Direct DB verification via `docker exec ... psql`:
    - after seed: `User` row count = `3`
    - after runtime auth flow tests: `User` row count = `5` (2 upserted runtime identities).
  - API runtime smoke tests (built app with live DB) passed:
    - `GET /v1/health` -> `200`
    - `GET /v1/auth/public` -> `200`
    - `GET /v1/auth/protected` (no token) -> `401`
    - `GET /v1/auth/protected` (tenant token) -> `200` with internal user mapping
    - `GET /v1/auth/admin-only` (tenant token) -> `403`
    - `GET /v1/auth/admin-only` (admin token) -> `200`
    - `GET /v1/users/me` (admin token) -> `200`
