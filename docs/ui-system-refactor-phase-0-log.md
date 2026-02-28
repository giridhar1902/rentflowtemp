# UI System Refactor: Phase 0 Baseline Lock

Date: 2026-02-27
Status: Completed
Scope: `apps/mobile-web` UI system refactor readiness

## Objective

Lock an objective baseline before global visual refactoring so design-system work can be validated without changing business logic.

## Baseline Health Checks

Executed from repository root on 2026-02-27:

1. `npm --workspace apps/mobile-web run typecheck` -> pass
2. `npm --workspace apps/mobile-web run lint` -> pass
3. `npm --workspace apps/mobile-web run test` -> pass
4. `npm --workspace apps/mobile-web run build` -> pass

Build note:

- Vite reports large chunk warning (`dist/assets/index-*.js` near 982 kB, gzip ~263 kB). This is not a blocker for Phase 0/1, but is tracked for the performance hardening phase.

## Current UI Surface Inventory

- Route count in `apps/mobile-web/src/App.tsx`: 24
- Page components in `apps/mobile-web/src/pages`: 23
- Shared components in `apps/mobile-web/src/components`: 3

Routes currently registered:

1. `/`
2. `/login`
3. `/register`
4. `/forgot-password`
5. `/reset-password`
6. `/register/invite`
7. `/landlord/dashboard`
8. `/landlord/finance`
9. `/landlord/properties`
10. `/landlord/add-property`
11. `/landlord/property/:id`
12. `/landlord/maintenance`
13. `/landlord/payments`
14. `/landlord/add-expense`
15. `/tenant/home`
16. `/tenant/pay`
17. `/tenant/request`
18. `/tenant/property/:propertyId`
19. `/chat`
20. `/profile`
21. `/profile/account`
22. `/profile/payments`
23. `/lease`
24. `*`

## Style Debt Snapshot (Pre-Refactor)

Measured indicators of decentralized styling:

1. `className="..."` occurrences in page/component TSX: 1077
2. Token-incompatible style usage hits (`bg-primary`, `text-primary`, `focus:ring-primary`, `bg-background-light`, `backdrop-blur`, etc.): 221
3. Inline or literal color references (`#hex`, `rgba(...)`) across TS/CSS: 15

Conclusion: styling is highly distributed and needs central tokenization before component-level migration.

## Guardrails for Phase 1+

1. No API contract changes.
2. No auth/session/route behavior changes.
3. No domain data-flow changes.
4. Changes limited to theme tokens, visual primitives, and styling composition.
5. All subsequent phases must keep `typecheck`, `lint`, `test`, and `build` green.

## Exit Criteria Status

1. Baseline health commands recorded: complete
2. Route and UI inventory captured: complete
3. Risk notes documented: complete
4. Refactor guardrails defined: complete
