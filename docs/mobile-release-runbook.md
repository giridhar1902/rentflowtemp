# Mobile Release Runbook (Capacitor)

Last updated: 2026-02-25

## Scope

Operational runbook for producing Android/iOS store builds from `apps/mobile-web`.

## Environment Files

Create from examples and fill values:

- `apps/mobile-web/.env.mobile.dev`
- `apps/mobile-web/.env.mobile.prod`

Key variables:

- `CAPACITOR_APP_ID`
- `CAPACITOR_APP_NAME`
- `CAPACITOR_DEEP_LINK_SCHEME`
- `CAPACITOR_DEEP_LINK_HOST`
- `CAPACITOR_SERVER_URL` (dev only)
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Sync Native Projects

```bash
npm run mobile:sync:dev
npm run mobile:sync:prod
```

These commands build web assets and run Capacitor sync using selected env profile.

## Android Release

1. Prepare keystore file and config:

- copy `apps/mobile-web/android/keystore.properties.example` -> `apps/mobile-web/android/keystore.properties`
- place JKS in `apps/mobile-web/android/keystore/`

2. Build release AAB:

```bash
npm run mobile:android:release
```

Output:

- `apps/mobile-web/android/app/build/outputs/bundle/release/app-release.aab`

## iOS Release

1. Update export options file:

- `apps/mobile-web/ios/App/ExportOptions.release.plist`

2. Ensure signing prerequisites in Xcode:

- Apple Team configured
- Distribution certificate installed
- App Store provisioning profile available
- Push Notifications capability enabled if using push

3. Build and export archive:

```bash
npm run mobile:ios:release
```

Output:

- `apps/mobile-web/ios/App/output/release`

## Deep Links

Current deep-link format:

- `rentflow://app.rentflow.local/<route>`

Examples:

- `rentflow://app.rentflow.local/tenant/home`
- `rentflow://app.rentflow.local/tenant/pay`

## Push Notifications

Runtime registration flow:

- app requests notification permission on native startup
- device token is registered via backend endpoint:
  - `POST /v1/notifications/push-devices`

Infra dependencies outside repo:

- Android: Firebase project + `google-services.json`
- iOS: APNs capability/profile + Apple key/certificate setup

## Known Local Validation Prerequisites

- If `xcodebuild` fails with plugin/framework errors, run:
  - `sudo xcode-select -s /Applications/Xcode.app`
  - `sudo xcodebuild -runFirstLaunch`
- If Gradle wrapper cannot download distributions, ensure network access to:
  - `https://services.gradle.org`
