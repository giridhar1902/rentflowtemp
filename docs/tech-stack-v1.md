# Tech Stack v1 (Scale-Oriented, Budget-Conscious)

Last updated: 2026-02-24

## Decision Status

- Backend framework: `NestJS` (locked)
- ORM: `Prisma` (locked)
- Auth provider: `Supabase Auth` (locked)
- Hosting provider: pending decision
- Payments scope for V1: pending decision

## Non-Negotiables

- Not a toy architecture.
- Must support gradual scale without full rewrites.
- Must stay low-cost at low traffic.
- API-first so frontend can move from Capacitor to React Native later.

## Recommended Architecture Pattern

- **Modular monolith backend** (clear domain modules, one deployable service at start).
- **Managed Postgres** + strict schema migrations.
- **Queue + async workers** for reminders, webhooks, notifications.
- **Object storage** for documents/images.
- **Observability from day one** (errors, logs, tracing hooks).

This gives startup speed now and a clean split into services later if scale demands it.

## Proposed Stack

### Mobile/Web Client

- React + TypeScript (existing app)
- Vite
- Capacitor (iOS + Android packaging)
- React Router
- TanStack Query (server state/cache/retries)
- React Hook Form + Zod (form + validation)
- Tailwind (build-time, not CDN runtime)

### Backend API

- Node.js + TypeScript
- NestJS (module boundaries + guard/interceptor ecosystem)
- Zod DTO validation at boundaries
- OpenAPI/Swagger for contract visibility

### Data Layer

- PostgreSQL (Supabase-hosted Postgres initially)
- Prisma ORM + migration pipeline
- Redis (Upstash) for cache/rate limit/queues
- BullMQ for async jobs (rent reminders, retries, reconciliation jobs)

### Auth & Access

- Supabase Auth (email/password first; social later optional)
- JWT access + refresh token flow
- Role model: landlord, tenant, admin
- Row-level authorization enforced in API (and DB policies where applicable)

### Storage

- Supabase Storage (initial)
- Signed URLs for upload/download
- File type/size validation + scanning pipeline hook

### Payments

- Stripe (payment intents + webhook reconciliation)
- Support:
  - Online rent payment (card/ACH based on launch geography)
  - Cash submission with landlord approval flow
- Immutable payment event log for auditability

### Realtime & Notifications

- Realtime messaging/events: Supabase Realtime initially
- Push notifications:
  - FCM (Android)
  - APNS (iOS)
  - Device token registry in backend
- In-app notifications table with read/unread state

### Observability & Security

- Sentry (client + backend)
- Structured JSON logs
- Request IDs + audit logs for sensitive operations
- Rate limiting, input validation, secure headers
- Secrets via environment manager only

### DevOps / Delivery

- Monorepo: `pnpm` + Turborepo
- CI/CD: GitHub Actions
- Deploy:
  - Frontend: Cloudflare Pages or Vercel
  - API Worker: Railway/Render/Fly
  - DB/Auth/Storage: Supabase

## Why This Is Scalable

- Modular monolith avoids distributed-system overhead too early.
- Postgres-first model supports strong consistency for leases/payments.
- Queue-based async handling prevents webhook/reminder spikes from breaking request latency.
- API contracts remain client-agnostic, enabling RN migration later.

## Explicit Tradeoffs

- Supabase accelerates delivery but adds partial vendor coupling.
  - Mitigation: keep schema ownership + API logic in NestJS, avoid BaaS lock-in in business logic.
- NestJS adds structure overhead vs plain Express/Fastify.
  - Benefit: safer growth with teams and feature volume.
- Realtime via Supabase is sufficient now but may need dedicated infra at very large scale.

## Deferred Until Scale Justifies It

- Microservices split
- Kafka/NATS event bus
- Multi-region active-active DB
- Dedicated search index cluster
- Data warehouse/BI pipeline

## Remaining Decision Checklist

1. Confirm deploy providers:
   - API: Railway/Render/Fly?
   - Frontend: Cloudflare Pages/Vercel?
2. Confirm V1 payment scope:
   - Online + cash approvals
   - Cash-only first
3. Confirm launch geography/compliance baseline.
