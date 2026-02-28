# PropTech Manager Codebase Analysis

## Overview

PropTech Manager is a React-based frontend application designed for property management. Built with React 19 and compiled via Vite, this application supports dual user experiences tailored for Landlords and Tenants. Currently, it acts mostly as a functional prototype, relying on a mock backend wrapper over `localStorage` for data persistence.

## Tech Stack

- **Framework**: React 19 (Hooks, Functional Components)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (loaded via CDN in `index.html`), integrated with Google Fonts (Manrope, Inter, Public Sans) and Material Icons.
- **Routing**: `react-router-dom` (using `HashRouter` for client-side routing)
- **Data Visualization**: Recharts (for financial reports and dashboards)
- **Backend**: Mocked via `services/mockBackend.ts` (simulated latency and `localStorage` persistence)

## Application Architecture

### 1. Entry Point and Routing (`App.tsx`, `index.tsx`, `index.html`)

The application boots from `index.html` loading `index.tsx`, which renders `App.tsx`.
`index.html` employs an unconventional approach for a Vite app: it uses an `importmap` via `esm.sh` for resolving React and react-router dependencies instead of bundling them, and it loads Tailwind CSS via a script CDN.

`App.tsx` handles the core layout and routing logic. The application is visibly designed for a mobile-first or mobile-only experience, framed within a `max-w-[430px]` centered column.

Routes are logically grouped into three main categories:

1. **Authentication & Onboarding**: `/login`, `/register`, `/register/invite`
2. **Landlord Portal**:
   - Dashboard (`/landlord/dashboard`)
   - Properties Management (`/landlord/properties`, `/landlord/property/:id`, `/landlord/add-property`)
   - Financials (`/landlord/finance`, `/landlord/payments`, `/landlord/add-expense`)
   - Maintenance (`/landlord/maintenance`)
3. **Tenant Portal**: Home (`/tenant/home`), Payments (`/tenant/pay`), Requests (`/tenant/request`)
4. **Shared Views**: Chat, Profile, Account Info, Payments, Lease Agreement.

### 2. State & Data Handling (`services/mockBackend.ts`)

The project contains a simulated API layer to facilitate UI/UX development without a live backend.

- **Auth Simulation**: `login`, `logout`, `getCurrentUser` operations are mocked and role associations ('landlord' vs 'tenant') are stored securely in `localStorage`.
- **Latency Simulation**: A standard `DELAY = 800` (800ms) is applied to all backend calls to simulate real-world network operations.
- **Data Persistence**: Uses a safe wrapper around `localStorage` (`safeStorage` and `safeJSONParse`) to seed initial mock data (e.g., properties like "Sunrise Apartments") and persist user-created properties and state.

### 3. Integrations

- **AI/Gemini UI**: While no complex logic hooks are present for Gemini natively in the frontend components, `vite.config.ts` securely injects `GEMINI_API_KEY` into `process.env`. The application was initialized from a Google AI Studio template (as confirmed by the `README.md`), which sets the stage for future integration of Gemini-powered features like a smart chat assistant or dynamic property descriptions.

## Summary & Recommendations

The application is structurally robust for UI prototyping. It effectively utilizes React Router for clear segregation of Landlord and Tenant duties.

**Next Steps/Improvements For Production**:

1. **Migrate Tailwind Config**: Move Tailwind CSS away from the runtime CDN script in `index.html` and compile it via PostCSS within the Vite build pipeline for vastly improved performance.
2. **Remove Importmaps**: Replace `esm.sh` native imports in `index.html` to allow Vite to bundle and minify dependencies directly, resolving caching and versioning fragility.
3. **Backend Integration**: Replace the `mockBackend.ts` interface with actual API calls to a robust backend server.
