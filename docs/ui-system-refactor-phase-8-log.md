# UI System Refactor: Phase 8 Execution Log

Date: 2026-02-27
Status: Completed
Scope: Pilot full-screen migration (Landlord Dashboard)

## Objective

Refactor one production screen end-to-end into the new global system as the canonical migration template for all remaining screens.

## Screen Migrated

1. `apps/mobile-web/src/pages/landlord/Dashboard.tsx`

## What Was Refactored

### 1) Layout System Consumption

1. Screen now uses `PageLayout` with dock-aware bottom inset.
2. Header/main spacing moved to global rhythm and section stack structure.
3. No business logic or data flow was changed.

### 2) Primitive System Consumption

The screen now consumes reusable primitives instead of ad-hoc card/button styling:

1. `InstitutionCard`
2. `Button`
3. `Badge`
4. `KpiValue`

### 3) Token-Driven Visuals

1. Colors moved to semantic tokens (surface/text/border/accent).
2. Card depth and borders now use elevation and stroke tokens.
3. Floating action control and header controls use tokenized styling.

### 4) Motion System Consumption

1. Financial KPI values use staggered `motion-number-reveal`.
2. Reveal delay controlled by `getRevealDelay(index)`.
3. Motion disables cleanly when `prefers-reduced-motion` is enabled.

### 5) Navigation + Flow Integrity

Maintained existing behavior:

1. Data loading calls (`billing summary`, `properties`, `pending reviews`, `notifications`).
2. Derived occupancy calculation logic.
3. All route navigations:
   - `/landlord/properties`
   - `/landlord/payments`
   - `/landlord/maintenance`
   - `/landlord/add-expense`
4. Bottom dock navigation remains unchanged via `BottomNav`.

## Why This Pilot Is the Template

This migration demonstrates the target pattern for all upcoming screens:

1. `PageLayout` for shell spacing and dock insets.
2. `InstitutionCard` for all card surfaces.
3. `Button`/`Badge`/`KpiValue` for consistent interaction and typography.
4. Motion utilities + reduced-motion checks for animation policy compliance.

## Validation

Executed after Phase 8 changes:

1. `npm --workspace apps/mobile-web run typecheck` -> pass
2. `npm --workspace apps/mobile-web run lint` -> pass
3. `npm --workspace apps/mobile-web run test` -> pass
4. `npm --workspace apps/mobile-web run build` -> pass

Build note:

- Existing large bundle warning remains and is deferred to the performance/code-splitting phase.
