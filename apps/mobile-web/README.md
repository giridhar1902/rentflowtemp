# Mobile/Web App (`apps/mobile-web`)

## Run Web Dev

From repository root:

```bash
pnpm --filter mobile-web dev
```

## Build Web

```bash
pnpm --filter mobile-web build
```

## Environment

Copy `.env.example` to `.env` and configure:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEEP_LINK_SCHEME`
- `VITE_DEEP_LINK_HOST`
- `VITE_APP_VERSION`

## Capacitor Commands

Run inside `apps/mobile-web`:

```bash
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
npm run mobile:doctor
```

## Mobile Environment Separation

Two environment templates are provided:

- `.env.mobile.dev.example`
- `.env.mobile.prod.example`

Copy and fill:

```bash
cp apps/mobile-web/.env.mobile.dev.example apps/mobile-web/.env.mobile.dev
cp apps/mobile-web/.env.mobile.prod.example apps/mobile-web/.env.mobile.prod
```

From repository root:

```bash
npm run mobile:sync:dev
npm run mobile:sync:prod
```

## Release Build Helpers

Android:

```bash
cp apps/mobile-web/android/keystore.properties.example apps/mobile-web/android/keystore.properties
npm run mobile:android:release
```

iOS:

```bash
# Update team/profile values first:
# apps/mobile-web/ios/App/ExportOptions.release.plist
npm run mobile:ios:release
```

## Deep Links

Configured deep-link format:

`rentflow://app.rentflow.local/<route>`

Examples:

- `rentflow://app.rentflow.local/tenant/home`
- `rentflow://app.rentflow.local/tenant/pay`

## Push Registration

On native platforms, app startup requests push permission and registers a token with backend endpoint:

`POST /v1/notifications/push-devices`

Backend push delivery provider setup (FCM/APNs) is infrastructure/configuration and is outside this package.
