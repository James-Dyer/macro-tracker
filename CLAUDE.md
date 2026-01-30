# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High Priority Agent Instructions

- Review `PRD.md` for product requirements and context before making authoritative decisions.
- If you are Claude Code and implementing anything related to frontend UI, you must use the "Frontend Design" plugin.
- If you need to work with anything for Supabase (deployment, table updates, etc.), you must use the Supabase MCP server. If the Supabase MCP server is not active or is inaccessible, do not use the Supabase CLI; stop and tell the user that Supabase operations require the MCP server.
- **CRITICAL:** When deploying Edge Functions via Supabase MCP, always set `verify_jwt: false` (equivalent to `--no-verify-jwt` flag). All functions manually validate JWTs using the pattern in "Edge Function Patterns" section.

## Project Overview

**MacroTracker** is an AI-powered PWA for tracking nutrition via food photos. Users photograph meals on a food scale, and the app uses AI vision to identify foods, read scale weight via OCR, and calculate complete nutrition data (calories, protein, carbs, fat, fiber).

**Tech Stack:**
- **Frontend:** React 19 + TypeScript PWA (Vite + Tailwind v4)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Google Gemini Pro Vision (food recognition + OCR)
- **Deployment:** Progressive Web App (installable, offline-capable)

**Key Differentiator:** Food scale integration for weight-based accuracy (vs. volume estimation competitors).

## Development Commands

```bash
# Frontend (PWA) - run from /pwa directory
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # TypeScript compile + production build
npm run preview    # Preview production build locally
npm run lint       # ESLint check

# Environment setup
# Required: Create pwa/.env.local with:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture Overview

### Frontend Structure

```
pwa/src/
├── pages/              # Route-level components
│   ├── LoginPage       # Auth (login/signup tabs)
│   ├── HomePage        # Daily summary + macro progress
│   ├── LogMealPage     # Camera/photo capture
│   ├── ConfirmMealPage # Review/edit AI results before saving
│   ├── HistoryPage     # Calendar view of past meals
│   └── SettingsPage    # Goals + account management
├── components/
│   ├── ui/             # Reusable UI primitives (Button, Card, Input, etc.)
│   ├── layout/         # AppLayout + BottomNav
│   └── auth/           # ProtectedRoute (route guard)
├── hooks/              # Custom React hooks
│   ├── useMeals        # Fetch/manage meals, calculate daily totals
│   ├── useGoals        # Fetch/save daily macro goals
│   └── useSession      # Supabase auth session management
├── contexts/           # React Context providers
│   └── AuthContext     # Global auth state (wraps useSession)
├── services/
│   └── supabase.ts     # Supabase client initialization
└── utils/
    └── imageUtils.ts   # Image compression, validation, upload
```

### Routing Architecture

- **AuthProvider** wraps entire app (provides global auth state)
- **ProtectedRoute** guards all routes except `/login`
- **AppLayout** provides bottom navigation for authenticated routes
- Routes are declarative via React Router v7 nested structure

### Authentication Flow

1. **AuthContext** (`contexts/AuthContext.tsx`) provides global auth state via `useAuth()` hook
2. **useSession** hook manages Supabase session + `onAuthStateChange` listener
3. **ProtectedRoute** component redirects unauthenticated users to `/login`
4. **LoginPage** has tab-based login/signup UI (email + password)
5. Session persists in localStorage automatically (Supabase handles refresh tokens)

**Important:** All protected pages assume user is authenticated (ProtectedRoute enforces this). Data hooks gracefully return empty state if auth check fails (defensive coding).

### Data Flow

**Hooks-based data management:**
- `useMeals()` - Fetches meals with food_items via Postgres join, provides `getTodayMeals()` and `calculateDailyTotals()`
- `useGoals()` - Fetches user's daily macro goals, provides `saveGoals()` for upsert
- Both hooks check `supabase.auth.getUser()` and return early with defaults if not authenticated

**Edge Functions:**
- `analyze-meal` - Takes photo path in Storage, downloads image with service role key, calls Gemini API for food recognition + nutrition data
- `save-meal` - Accepts food items array, inserts meal + food_items with proper user_id association

**Storage:**
- Photos uploaded to `meal-photos` bucket with RLS policies (user_id-based isolation)
- Photos compressed client-side before upload (browser-image-compression)

### Database Schema

```sql
-- Tables (see supabase/migrations/00001_create_schema.sql)
daily_goal (user_id unique, calories, protein, carbs, fat, fiber)
meal (user_id, timestamp, photo_url, notes)
food_item (meal_id FK, name, weight_g, calories, protein, carbs, fat, fiber)

-- RLS Policies: All tables have user_id-based isolation
-- food_item access controlled via meal ownership (EXISTS subquery)
```

**Important:** Daily totals are computed on read (not stored). Aggregation is instant for ~15 rows/day.

## Design System

**Tailwind v4 Configuration:**
- Custom design tokens in `index.css` (@theme directive)
- Color palette: `--color-primary` (green #22C55E), `--color-protein`, `--color-carbs`, `--color-fat`, `--color-fiber`
- Typography: DM Sans font family, semantic variants via Typography component
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`, stagger utilities

**UI Components:**
- All UI primitives in `components/ui/` with consistent API (variant, size, fullWidth props)
- MacroSummary - Circular progress rings for daily goals
- MealCard - Displays meal with food items, macro badges, photo thumbnail
- BottomNav - Fixed navigation (Home, Log, History, Settings)

**Visual Style:**
- Clean, minimal interface
- Staggered animations for list items (`stagger-1`, `stagger-2`, etc.)
- Gradient backgrounds for auth pages (differentiate from main app)
- Monospace fonts for numerical data (tabular-nums)

## Edge Function Patterns

**CRITICAL: JWT Verification Configuration**
- All Edge Functions are deployed with `--no-verify-jwt` flag (JWT verification disabled)
- Functions MUST manually validate JWTs using the pattern below
- When deploying via MCP server, ensure `verify_jwt: false` is set

**Authentication (Manual JWT Validation):**
```typescript
// Extract JWT token from Authorization header
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  throw new ApiError(ErrorCode.MISSING_AUTH, 'Missing authorization header', 401);
}

const token = authHeader.replace('Bearer ', '');

// Create Supabase client with REQUIRED environment variables
const supabaseClient = createClient(
  EnvValidator.getRequired("SUPABASE_URL"),
  EnvValidator.getRequired("SUPABASE_ANON_KEY")
);

// Validate JWT by passing token EXPLICITLY to getUser()
const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

if (userError || !user) {
  throw new ApiError(ErrorCode.INVALID_AUTH, 'Unauthorized', 403);
}
```

**Environment Variables (Fail Fast):**
```typescript
// Always validate required env vars at startup - FAIL HARD if missing
const envValidation = EnvValidator.validate({
  required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  optional: ['GEMINI_API_KEY', 'OPENAI_API_KEY'],
});

if (!envValidation.valid) {
  const errorMsg = `Missing required environment variables: ${envValidation.missing.join(', ')}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}
```

**Service Role Usage:**
- Only use service role key for operations requiring bypass of RLS (e.g., reading Storage)
- Always validate JWT first, then create separate client with service key if needed

**CORS:**
- All Edge Functions include CORS headers for browser requests
- Handle OPTIONS preflight requests

## Common Workflows

### Adding a New Page

1. Create page component in `pwa/src/pages/`
2. Add route in `App.tsx` under ProtectedRoute (or as public route)
3. Add navigation item to `BottomNav.tsx` if main section
4. Use existing hooks (useMeals, useGoals) for data fetching
5. Match design system (Typography, Card, Button components)

### Creating a Custom Hook

1. Place in `pwa/src/hooks/`
2. Use `supabase.auth.getUser()` for auth check (return early with defaults if not authenticated)
3. Provide loading, error states
4. Return cleanup functions in useEffect for subscriptions
5. Export TypeScript interfaces for data types

### Modifying Database Schema

1. Create new migration in `supabase/migrations/` (numbered sequentially)
2. Include RLS policies with `auth.uid() = user_id` checks
3. Apply via Supabase Dashboard SQL Editor or CLI
4. Update TypeScript interfaces in relevant hooks/components

## Important Constraints

**Environment Variables:**
- All Vite env vars must be prefixed with `VITE_` to be exposed to client
- Never commit `.env.local` (contains Supabase keys)
- Use `.env.local.example` as template

**TypeScript:**
- `verbatimModuleSyntax: true` - Must use `import type` for type-only imports
- Strict mode enabled - No implicit any, null checks enforced

**PWA Configuration:**
- Service worker auto-generates (vite-plugin-pwa)
- Runtime caching: API calls 5min, images 7 days
- Manifest in `vite.config.ts`

**Image Handling:**
- Compress before upload (target <2MB)
- Unique filenames: `${userId}/${timestamp}-${random}.jpg`
- Upload to Storage, store path in database, not base64

## AI Integration Notes

**Gemini API Integration:**
- Gemini returns complete nutrition data (no external database lookups needed)
- Single API call per meal (food identification + nutrition + OCR in one request)
- Structured JSON output via prompt engineering
- API key stored in Supabase Edge Function secrets (not in code)

**Scale Reading:**
- OCR extracts weight from scale display in photo
- Falls back to manual entry if OCR fails
- Scale usage is optional (app works without scale, just lower accuracy)

## Testing & Verification

**Manual Testing Checklist:**
- Unauthenticated access redirects to `/login`
- Signup creates user, shows email confirmation message
- Login redirects to HomePage
- Session persists across page refreshes
- Sign out redirects to `/login`
- Protected routes require authentication
- Photo upload + AI analysis returns food data
- Meal save associates with correct user_id
- Daily totals calculate correctly
- Goals persist to database

**Build Verification:**
```bash
npm run build  # Must complete without TypeScript errors
npm run lint   # Must pass ESLint checks
```

## Known Patterns

**Loading States:**
- Show spinner during initial data fetch
- Use `loading` state from hooks
- Prevent interaction with `disabled` props during async operations

**Error Handling:**
- Display user-friendly error messages in Card with red background
- Console.error for debugging but don't expose technical details to users
- Graceful degradation (empty states, default values)

**Form Patterns:**
- Controlled inputs (value + onChange)
- Disable inputs during submission
- Clear form after successful submission
- Show success messages in green Card

**Navigation:**
- Use `navigate('/path', { replace: true })` to prevent back-button loops
- Bottom navigation stays visible on all authenticated routes
- LoginPage has no navigation (full-screen)

## Development Philosophy

This project follows a **learning-first approach** (see PRD.md). When implementing features:
- Explain React concepts being used (state, effects, context, etc.)
- Prefer clarity over cleverness
- Add inline comments explaining "why" not "what"
- Use TypeScript for self-documenting interfaces
- Follow existing patterns in the codebase

## File Locations Reference

- **Auth:** `contexts/AuthContext.tsx`, `hooks/useSession.ts`, `components/auth/ProtectedRoute.tsx`
- **Data Hooks:** `hooks/useMeals.ts`, `hooks/useGoals.ts`
- **Edge Functions:** `../supabase/functions/analyze-meal/`, `../supabase/functions/save-meal/`
- **Migrations:** `../supabase/migrations/00001_create_schema.sql`
- **Supabase Client:** `services/supabase.ts`
- **Design System:** `index.css` (theme tokens), `components/ui/*`
