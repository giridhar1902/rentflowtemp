# API (`apps/api`)

NestJS API foundation for the property management platform.

## Run

```bash
pnpm --filter api dev
```

## Build

```bash
pnpm --filter api build
```

## API Docs

- Swagger UI: `http://localhost:4000/v1/docs`
- Health: `http://localhost:4000/v1/health`
- Readiness: `http://localhost:4000/v1/ready`

## Environment

Copy `.env.example` to `.env` and configure credentials before running.

Required for authenticated routes:

- `SUPABASE_URL` for JWKS-based access-token verification (new Supabase signing keys).
- `SUPABASE_JWT_SECRET` for legacy HS256 token verification.
- `SUPABASE_SERVICE_ROLE_KEY` for tenant invite-email dispatch when invited email has no existing account.
- Optional: `TENANT_INVITE_REDIRECT_URL` for invite email link target (supports appending `?code=<inviteCode>`).
- `DATABASE_URL` reachable by the API process (global auth guard maps token identity to internal user records via Prisma).

Required for online payments (Phase 6):

- `CASHFREE_ENVIRONMENT` (`sandbox` or `production`)
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_WEBHOOK_SECRET`
- Optional:
  - `CASHFREE_API_VERSION` (default `2025-01-01`)
  - `CASHFREE_RETURN_URL`
  - `CASHFREE_NOTIFY_URL`
  - `CASHFREE_API_BASE_URL` (for local/mock testing)

Required for signed documents (Phase 7):

- `API_PUBLIC_BASE_URL` (used to generate upload/download absolute URLs)
- `DOCUMENT_SIGNING_SECRET` (HMAC key for signed URL tokens)
- Optional:
  - `DOCUMENT_STORAGE_ROOT` (default `./.local-storage/documents`)
  - `DOCUMENT_MAX_FILE_SIZE_BYTES` (default `15728640`)
  - `DOCUMENT_UPLOAD_URL_TTL_MS` (default `600000`)
  - `DOCUMENT_DOWNLOAD_URL_TTL_MS` (default `300000`)

## Prisma

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:validate
pnpm --filter api prisma:migrate:dev
pnpm --filter api prisma:seed
```

## Authorization Notes

- `GET /v1/auth/public` is public.
- `GET /v1/auth/protected` requires valid Supabase bearer token.
- `GET /v1/auth/admin-only` requires role `ADMIN`.
- Role extraction uses signed token `app_metadata.role` (never `user_metadata`).

## Phase 3-7 API Surface

- Profile/session:
  - `GET /v1/users/me`
  - `PATCH /v1/users/me`
  - `POST /v1/users/me/role` (onboarding role set: `LANDLORD`/`TENANT`)
- Properties/units:
  - `GET /v1/properties`
  - `POST /v1/properties`
  - `GET /v1/properties/:propertyId`
  - `PATCH /v1/properties/:propertyId`
  - `GET /v1/properties/:propertyId/units`
  - `POST /v1/properties/:propertyId/units`
  - `PATCH /v1/properties/:propertyId/units/:unitId`
- Invitations/leases:
  - `GET /v1/properties/:propertyId/invitations`
  - `POST /v1/properties/:propertyId/invitations`
  - `GET /v1/leases/invitations/mine`
  - `POST /v1/leases/invitations/accept`
  - `GET /v1/leases`
  - `GET /v1/leases/:leaseId`
  - `POST /v1/leases`
  - `PATCH /v1/leases/:leaseId`
- Billing:
  - `GET /v1/billing/charges`
  - `GET /v1/billing/charges/:chargeId`
  - `POST /v1/billing/charges/generate-monthly`
  - `POST /v1/billing/charges/:chargeId/online-session`
  - `POST /v1/billing/charges/:chargeId/cash-payments`
  - `GET /v1/billing/payments`
  - `GET /v1/billing/payments/pending-review`
  - `POST /v1/billing/payments/:paymentId/review`
  - `POST /v1/billing/payments/:paymentId/reconcile`
  - `GET /v1/billing/payment-methods`
  - `POST /v1/billing/payment-methods`
  - `POST /v1/billing/payment-methods/:methodId/default`
  - `GET /v1/billing/reports/summary`
  - `POST /v1/billing/webhooks/cashfree` (public)
- Maintenance:
  - `GET /v1/maintenance/requests`
  - `POST /v1/maintenance/requests`
  - `GET /v1/maintenance/requests/:requestId`
  - `PATCH /v1/maintenance/requests/:requestId/status`
  - `GET /v1/maintenance/requests/:requestId/comments`
  - `POST /v1/maintenance/requests/:requestId/comments`
- Chat:
  - `GET /v1/chat/threads`
  - `POST /v1/chat/threads/lease/:leaseId/ensure`
  - `GET /v1/chat/threads/:threadId`
  - `GET /v1/chat/threads/:threadId/messages`
  - `POST /v1/chat/threads/:threadId/messages`
- Documents:
  - `GET /v1/documents`
  - `POST /v1/documents/uploads/sign`
  - `GET /v1/documents/:documentId/download-url`
  - `PUT /v1/documents/upload/:token` (public signed upload)
  - `GET /v1/documents/download/:token` (public signed download)
- Notifications:
  - `GET /v1/notifications`
  - `PATCH /v1/notifications/:notificationId/read`
  - `POST /v1/notifications/read-all`
  - `GET /v1/notifications/push-devices`
  - `POST /v1/notifications/push-devices`
  - `DELETE /v1/notifications/push-devices/:deviceId`
