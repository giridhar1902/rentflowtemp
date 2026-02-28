# UI System Refactor: Phase 11 Quality Gates Log

Date: 2026-02-28
Status: Completed
Scope: Token guardrails + visual baseline + bundle budget enforcement

## Objective

Add strict, automation-friendly quality gates so the global design system refactor is protected against regression and drift.

## Changes Implemented

1. Added `apps/mobile-web/scripts/check-ui-guardrails.mjs` to detect:
   - hardcoded Tailwind palette utilities in app surfaces
   - `dark:*` per-component overrides
   - inline color literals (`#...`, `rgb/rgba`)
2. Wired UI guardrails into lint:
   - `apps/mobile-web/package.json` -> `lint` now runs `check:ui-guardrails` first.
3. Added visual baseline harness:
   - `apps/mobile-web/src/visual/routeVisualBaseline.test.tsx`
   - deterministic mocked auth/api/native bridge
   - light + dark snapshots across core public, landlord, tenant, and shared routes
   - snapshot artifacts in `apps/mobile-web/src/visual/__snapshots__/routeVisualBaseline.test.tsx.snap`
4. Added visual baseline scripts:
   - `visual:baseline:update`
   - `visual:baseline:check`
5. Added bundle budget enforcement:
   - `apps/mobile-web/scripts/check-bundle-budget.mjs`
   - integrated into `build` so CI build fails when thresholds are exceeded
   - `build:mobile` now delegates to `build` to keep the same gate
6. Updated lint config to avoid false positives on node scripts:
   - `apps/mobile-web/eslint.config.js` ignores `scripts/` (scripts are validated via direct execution).

## Validation

Executed after Phase 11 changes:

1. `npm --workspace apps/mobile-web run visual:baseline:update` -> pass
2. `npm --workspace apps/mobile-web run visual:baseline:check` -> pass
3. `npm --workspace apps/mobile-web run lint` -> pass
4. `npm --workspace apps/mobile-web run test` -> pass
5. `npm --workspace apps/mobile-web run build` -> pass (includes budget check)

## Notes

1. Visual baseline uses Vitest DOM snapshot fallback (no browser screenshot tool installation required).
2. Bundle budgets remain configurable via env vars:
   - `BUNDLE_BUDGET_ENTRY_KB`
   - `BUNDLE_BUDGET_RUNTIME_KB`
   - `BUNDLE_BUDGET_TOTAL_KB`
