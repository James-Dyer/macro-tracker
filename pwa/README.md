# MacroTracker PWA

This directory contains the React frontend for
[MacroTracker](../README.md), an AI-powered meal photo and macro tracking app.

For product context, backend architecture, deployment, and the full repository
layout, start with the [root README](../README.md).

## Stack

- React 19 and TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- Supabase JavaScript client
- `vite-plugin-pwa` and Workbox

## Setup

Requires Node.js 20 and access to a configured Supabase project.

```bash
npm ci
cp .env.local.example .env.local
```

Set the public Supabase credentials in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the development server:

```bash
npm run dev
```

Vite serves from `http://localhost:5173`; the app route is
`http://localhost:5173/macro-tracker/`. Its router basename and production asset
base match the GitHub Pages deployment.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Frontend Structure

```text
src/
├── pages/       # Public, dashboard, and onboarding routes
├── components/  # Reusable UI, layout, and auth components
├── hooks/       # Meal, goal, session, cache, and entitlement logic
├── contexts/    # Auth and theme providers
├── services/    # Supabase client
└── utils/       # Images, caching, calculations, errors, and logging
```

Public routes are the landing page and login. All `/dashboard/*` routes are
guarded by `ProtectedRoute`, which enforces authentication, beta entitlement,
and required onboarding.

## PWA Behavior

The Vite PWA configuration:

- Generates an installable standalone app
- Automatically updates the service worker
- Caches built assets
- Uses network-first caching for Supabase REST requests
- Uses cache-first behavior for Supabase Storage images

Test camera capture and installation on a real iOS or Android device before
release. The full manual test plan is in
[`../QA_CHECKLIST.md`](../QA_CHECKLIST.md).
