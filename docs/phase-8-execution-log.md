# Phase 8 Execution Log

Date: 2026-02-25
Status: In progress (implementation complete; final native validation blocked by local prerequisites)

## Scope Executed

- Added Capacitor stack to `apps/mobile-web`:
  - `@capacitor/core`
  - `@capacitor/cli`
  - `@capacitor/android`
  - `@capacitor/ios`
  - `@capacitor/app`
  - `@capacitor/push-notifications`
- Added Capacitor config and scripts:
  - `apps/mobile-web/capacitor.config.ts`
  - npm scripts for `mobile:add:*`, `mobile:sync`, `mobile:doctor`, `mobile:open:*`
  - root scripts for `mobile:sync:dev`, `mobile:sync:prod`, release helpers
- Initialized native projects:
  - `apps/mobile-web/android/`
  - `apps/mobile-web/ios/`
- Configured deep-link and permissions:
  - Android intent filter + scheme/host resources
  - iOS URL scheme entries in `Info.plist`
  - iOS background remote-notification mode
- Wired push registration runtime:
  - Added `NativeBridge` component to listen for deep links and register push tokens
  - Token registration integrated with backend `POST /v1/notifications/push-devices`
- Added release pipeline artifacts:
  - Android signing config support via `keystore.properties`
  - Android/iOS release scripts under `scripts/mobile/`
  - iOS export options template
  - Mobile runbook doc (`docs/mobile-release-runbook.md`)

## Files Introduced

- `apps/mobile-web/capacitor.config.ts`
- `apps/mobile-web/src/components/NativeBridge.tsx`
- `apps/mobile-web/.env.mobile.dev.example`
- `apps/mobile-web/.env.mobile.prod.example`
- `apps/mobile-web/android/keystore.properties.example`
- `apps/mobile-web/android/keystore/.gitkeep`
- `apps/mobile-web/ios/App/ExportOptions.release.plist`
- `scripts/mobile/cap-sync.sh`
- `scripts/mobile/android-build-release.sh`
- `scripts/mobile/ios-build-release.sh`
- `docs/mobile-release-runbook.md`
- `docs/phase-8-execution-log.md`

## Files Updated

- `apps/mobile-web/package.json`
- `apps/mobile-web/src/App.tsx`
- `apps/mobile-web/src/vite-env.d.ts`
- `apps/mobile-web/.env.example`
- `apps/mobile-web/README.md`
- `apps/mobile-web/eslint.config.js`
- `apps/mobile-web/android/app/src/main/AndroidManifest.xml`
- `apps/mobile-web/android/app/src/main/res/values/strings.xml`
- `apps/mobile-web/android/app/build.gradle`
- `apps/mobile-web/android/.gitignore`
- `apps/mobile-web/ios/App/App/Info.plist`
- `apps/mobile-web/ios/App/App/AppDelegate.swift`
- `package.json`
- `.env.example`
- `task.md`
- `.context/state/current_focus.json`

## Validation

- Passed workspace checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Passed Capacitor checks:
  - `cd apps/mobile-web && npm run mobile:sync`
  - `cd apps/mobile-web && npm run mobile:doctor`
- Native toolchain checks attempted:
  - `xcodebuild -list -project apps/mobile-web/ios/App/App.xcodeproj` -> failed due local Xcode plugin/framework integrity issue.
  - `GRADLE_USER_HOME=... ./gradlew tasks` -> failed due network access to `services.gradle.org` unavailable in environment.

## Blockers For Phase-Exit Completion

- Local Xcode setup requires first-launch/framework repair before iOS archive validation.
- Gradle wrapper cannot complete full task validation without outbound network access.
- Signed release artifacts still require real signing credentials/profiles from owner account.

## Post-implementation Hotfixes (2026-02-26)

- Fixed web post-login blank-screen regression caused by transient `session` truthy + `profile` unresolved auth state.
- Updated auth synchronization to avoid inconsistent session/profile state when profile hydration fails.
- Updated route guards to hold rendering on `<Splash />` until profile resolution for authenticated sessions.
- Fixed authenticated redirect loop for `ADMIN` users by mapping default role route to landlord dashboard instead of `/login`.
- Added route-mapping unit tests for landlord/tenant/admin defaults.
- Fixed backend token-validation compatibility for Supabase new signing keys by adding JWKS verification path (while keeping legacy HS256 secret validation support).
- Fixed missing bottom navigation on tenant Pay Rent and Lease/Documents pages; adjusted Pay Rent fixed CTA tray to sit above the nav bar.
- Added registration rate-limit UX guard: clear error messaging for Supabase email throttle and temporary signup cooldown to reduce repeated resend attempts.
- Fixed landlord Add Property flow where save could fail silently and document upload buttons were non-functional; wired state-field validation and property/document file upload pipeline.
- Fixed tenant-landlord invite delivery gaps: added tenant invitation inbox endpoint + UI, signup-time invite-code input (tenant-only), post-login invite-code entry path, invitee-account detection + in-app notification for existing users, and non-blocking Supabase invite email dispatch attempt for non-registered emails.
- Fixed tenant lease-document visibility gap: lease screen now fetches property-scoped documents and filters to lease-relevant records (direct lease-linked docs + property-level `LEASE` docs), so landlord-uploaded lease files appear for tenants.
- Fixed landlord occupancy card mismatch: dashboard occupancy now derives from active leases mapped to unit IDs instead of `unit.status`, aligning with occupancy badges shown in property listings.
- Fixed landlord property photo visibility gap: property list/detail now resolve and render uploaded property image documents.
- Added persisted property metadata pipeline: landlord Add Property now sends `floors`, `totalUnits`, and amenity/features; backend schema/DTO/service now store and return this data.
- Added tenant-facing property details route (`/tenant/property/:propertyId`) linked from Active Lease card; page shows property photo, metadata, and amenities.
- Hardened property read response for tenant role by filtering included lease rows to authenticated tenant only.
- Fixed tenant maintenance submit UX regression: request form now surfaces concrete validation messages (title/details/lease linkage) and parses backend error bodies into user-readable messages instead of raw/ambiguous failures.
- Fixed landlord maintenance status workflow mismatch: backend now permits direct completion from open states (`SUBMITTED`/`REVIEWING`/`SCHEDULED` -> `COMPLETED`), and landlord status dropdown now only presents valid transitions for each request state.
- Fixed landlord maintenance error rendering: JSON API error payloads are now parsed into readable message strings instead of dumping raw response bodies to the page.

### Files Updated

- `apps/mobile-web/src/context/AuthContext.tsx`
- `apps/mobile-web/src/components/ProtectedRoute.tsx`
- `apps/mobile-web/src/lib/routes.ts`
- `apps/mobile-web/src/lib/routes.test.ts`
- `apps/api/src/auth/supabase-jwt.service.ts`
- `apps/api/src/auth/supabase-jwt.service.spec.ts`
- `apps/api/README.md`
- `apps/api/.env.example`
- `apps/mobile-web/src/pages/tenant/PayRent.tsx`
- `apps/mobile-web/src/pages/shared/LeaseAgreement.tsx`
- `apps/mobile-web/src/pages/Register.tsx`
- `apps/mobile-web/src/pages/landlord/AddProperty.tsx`
- `apps/api/src/properties/properties.module.ts`
- `apps/api/src/properties/properties.service.ts`
- `apps/api/src/leases/leases.controller.ts`
- `apps/api/src/leases/leases.service.ts`
- `apps/api/.env.example`
- `apps/api/README.md`
- `apps/mobile-web/src/lib/api.ts`
- `apps/mobile-web/src/pages/tenant/TenantHome.tsx`
- `apps/mobile-web/src/pages/tenant/TenantInvite.tsx`
- `apps/mobile-web/src/pages/Register.tsx`
- `apps/mobile-web/src/pages/landlord/PropertyDetails.tsx`
- `apps/mobile-web/src/pages/shared/LeaseAgreement.tsx`
- `apps/mobile-web/src/pages/landlord/Dashboard.tsx`
- `apps/mobile-web/src/pages/landlord/PropertiesList.tsx`
- `apps/mobile-web/src/pages/tenant/TenantPropertyDetails.tsx`
- `apps/mobile-web/src/App.tsx`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/0002_property_metadata/migration.sql`
- `apps/api/src/properties/dto/create-property.dto.ts`
- `apps/api/src/properties/dto/update-property.dto.ts`
- `apps/mobile-web/src/pages/tenant/NewRequest.tsx`
- `apps/api/src/maintenance/maintenance.service.ts`
- `apps/mobile-web/src/pages/landlord/MaintenanceList.tsx`

### Validation

- `npm --workspace apps/mobile-web run lint`
- `npm --workspace apps/mobile-web run typecheck`
- `npm --workspace apps/mobile-web run test`
- `npm --workspace apps/mobile-web run build`
- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run lint`
- `npm --workspace apps/api run test`
- `npm --workspace apps/api run build`
- `npm --workspace apps/mobile-web run typecheck` (post-hotfix)
- `npm --workspace apps/mobile-web run lint` (post-hotfix)
- `npm --workspace apps/mobile-web run test` (post-hotfix)
- `npm --workspace apps/mobile-web run build` (post-hotfix)
- `npm --workspace apps/api run prisma:generate`
- `npx prisma migrate deploy --schema prisma/schema.prisma` (from `apps/api`; applied `0002_property_metadata`)
- `npm --workspace apps/mobile-web run typecheck` (maintenance UX patch)
- `npm --workspace apps/mobile-web run lint` (maintenance UX patch)
- `npm --workspace apps/mobile-web run test` (maintenance UX patch)
- `npm --workspace apps/mobile-web run build` (maintenance UX patch)
- `npm --workspace apps/api run typecheck` (maintenance transition patch)
- `npm --workspace apps/api run build` (maintenance transition patch)
- `npm --workspace apps/mobile-web run typecheck` (landlord maintenance dropdown patch)
- `npm --workspace apps/mobile-web run build` (landlord maintenance dropdown patch)

### Invite Delivery Operational Notes

- If landlord invites a brand-new email, backend attempts Supabase Admin invite email (`/auth/v1/invite`) using `SUPABASE_SERVICE_ROLE_KEY`.
- Email dispatch failures (rate limits, sender config, SMTP) are intentionally non-blocking: invitation record is still created and tenant can join via invite code.
- Existing tenant accounts are linked directly to invite (`inviteeUserId`) and receive in-app invite visibility via tenant invitation inbox endpoint.
