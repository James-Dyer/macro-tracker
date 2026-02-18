# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High Priority Agent Instructions

- Review `PRD.md` for product requirements and context before making authoritative decisions.
- If you are Claude Code and implementing anything related to frontend UI, you must use the "Frontend Design" plugin.
- If you need to work with anything for Supabase (deployment, table updates, etc.), you must use the Supabase MCP server. If the Supabase MCP server is not active or is inaccessible, do not use the Supabase CLI; stop and tell the user that Supabase operations require the MCP server.
- **CRITICAL:** When deploying Edge Functions via Supabase MCP, always set `verify_jwt: false` (equivalent to `--no-verify-jwt` flag). All functions manually validate JWTs using the pattern in "Edge Function Patterns" section.

## Project Overview

**MacroTracker** is an AI-powered PWA for tracking nutrition via food photos. Users take a single photo of their meal, and the app instantly identifies foods, estimates portions, and calculates complete nutrition data (calories, protein, carbs, fat, fiber)—all in seconds.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript PWA (Vite 7.2.4 + Tailwind v4)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Google Gemini 2.5 Flash Lite (primary) with OpenAI GPT-4o Mini fallback
- **Deployment:** Progressive Web App (installable, offline-capable)

**Key Differentiator:** One-photo simplicity. No equipment, no manual entry—just snap and track.

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
│   ├── LandingPage     # Marketing page (dark theme, animated)
│   ├── HomePage        # Daily summary + macro progress
│   ├── LogMealPage     # Camera/photo capture with optional context input
│   ├── ConfirmMealPage # Review/edit AI results (create new or edit existing meal)
│   ├── HistoryPage     # Past meals grouped by date
│   ├── GoalsPage       # Daily macro goal management
│   ├── SettingsPage    # Account, dark mode toggle, app info ("More" tab)
│   └── onboarding/     # Onboarding flow for new users
│       ├── OnboardingGoalsPage      # Recommended (BMR/TDEE calculator) vs Manual setup
│       ├── OnboardingHowItWorksPage # App walkthrough
│       └── OnboardingFirstMealPage  # Guided first meal capture
├── components/
│   ├── ui/             # Reusable UI primitives
│   │   ├── Button, Input, Card, Typography, Slider, ProgressBar, ButtonGroup
│   │   ├── MacroSummary    # Circular progress rings for daily goals
│   │   ├── MealCard        # Displays meal with thumbnail, foods, macros
│   │   └── SwipeableCard   # Swipe-to-delete gesture with fallback button
│   ├── layout/         # AppLayout + BottomNav
│   └── auth/           # ProtectedRoute (route guard with onboarding check)
├── hooks/              # Custom React hooks
│   ├── useMeals            # Fetch/manage meals, calculate totals, delete/update
│   ├── useGoals            # Fetch/save daily macro goals
│   ├── useSession          # Supabase auth session management
│   ├── useLocalStorage     # Persist state to localStorage
│   ├── useEntitlement      # Feature access checks based on user tier (scaffolded)
│   └── useInviteRedemption # Calls redeem_invite() RPC to upgrade user tier
├── contexts/           # React Context providers
│   ├── AuthContext     # Global auth state, onboarding detection
│   └── ThemeContext    # Dark/light theme toggle with localStorage
├── services/
│   └── supabase.ts     # Supabase client initialization
└── utils/
    ├── imageUtils.ts        # Compress, validate, upload images + thumbnails
    ├── macroCalculations.ts # BMR + TDEE calculation (Mifflin-St Jeor)
    ├── errors.ts            # Error parsing, categorization (ErrorCategory enum)
    └── logger.ts            # Development-focused logging
```

### Routing Architecture

- **AuthProvider** wraps entire app (provides global auth state)
- **ProtectedRoute** guards all routes except `/login`
- **AppLayout** provides bottom navigation for authenticated routes
- Routes are declarative via React Router v7 nested structure

### Authentication Flow

1. **AuthContext** (`contexts/AuthContext.tsx`) provides global auth state via `useAuth()` hook
   - Checks if user has `daily_goal` record to determine onboarding status
   - Fetches user `tier` from `user_profile` table (`free` | `beta` | `paid`)
   - Provides `refetchOnboarding()` and `refetchTier()` for manual refresh
   - Exposes `tierLoading` so ProtectedRoute can wait before making tier decisions
   - Attempts auto-redemption of any `pendingInviteCode` stored in localStorage on login
2. **useSession** hook manages Supabase session + `onAuthStateChange` listener
3. **ProtectedRoute** component enforces three gates in order:
   - Unauthenticated → redirect to `/login`
   - `tier === 'free'` → render "Invite Only" blocking screen (closed beta)
   - `needsOnboarding` → redirect to `/dashboard/onboarding/goals`
4. **LoginPage** handles invite codes via `?invite={code}` URL param:
   - Stores code in localStorage immediately for resilience
   - Attempts redemption during signup; falls back to auto-redemption on next login
5. Session persists in localStorage automatically (Supabase handles refresh tokens)

**Onboarding Flow (New Users):**
1. **OnboardingGoalsPage** - Set up daily macro goals:
   - **Recommended mode:** BMR/TDEE calculator (age, sex, weight, height, goal, activity level)
   - **Manual mode:** Direct macro entry
   - Uses Mifflin-St Jeor equation for BMR calculation
   - Protein bias slider (0.25-0.35) for customization
2. **OnboardingHowItWorksPage** - App walkthrough and feature explanation
3. **OnboardingFirstMealPage** - Guided first meal capture

**Important:** All protected pages assume user is authenticated (ProtectedRoute enforces this). Data hooks gracefully return empty state if auth check fails (defensive coding).

### Data Flow

**Hooks-based data management:**
- `useMeals()` - Fetches meals with food_items via Postgres join, provides:
  - `getTodayMeals()` - Filters to current date
  - `calculateDailyTotals(meals)` - Sums all macros
  - `deleteMeal(id)` - Optimistic delete with revert on error
  - `updateMeal(id, updates, foodItems)` - Edit meal notes and food items
  - Generates 1-hour signed URLs for photos/thumbnails (cached in state)
- `useGoals()` - Fetches user's daily macro goals, provides `saveGoals()` for upsert
- Both hooks check `supabase.auth.getUser()` and return early with defaults if not authenticated

**Edge Functions:**
- `analyze-meal` - Takes photo path in Storage, optional user context (e.g., "fried chicken")
  - Downloads image with service role key
  - Calls Gemini 2.5 Flash Lite (primary) or GPT-4o Mini (fallback)
  - Returns food recognition + portion estimates + complete nutrition data
  - Sanitizes user context to prevent prompt injection
- `save-meal` - Accepts food items array, timestamp, photo paths (full + thumbnail)
  - Inserts meal + food_items with proper user_id association
  - Validates ≥1 food item with name + positive weight

**Storage:**
- Photos uploaded to `meal-photos` bucket with RLS policies (user_id-based isolation)
- **Dual-file strategy:**
  - Full image: Compressed to ~1MB, max 1920px dimension
  - Thumbnail: 400px max dimension, ~100KB, quality 0.85
- Path format: `{userId}/{timestamp}-{random}.jpg` (thumbnail has `_thumb` suffix)
- Photos compressed client-side before upload (browser-image-compression v2.0.2)

### Database Schema

```sql
-- Tables (see supabase/migrations/)
daily_goal (
  id UUID PK,
  user_id UUID UNIQUE,
  calories, protein, carbs, fat, fiber INTEGER,
  created_at, updated_at TIMESTAMP
)

meal (
  id UUID PK,
  user_id UUID FK,
  timestamp TIMESTAMP,
  photo_url TEXT,        -- DEPRECATED: legacy public URLs
  photo_path TEXT,       -- Storage path for full image (signed URLs)
  thumbnail_path TEXT,   -- Storage path for thumbnail (signed URLs)
  notes TEXT,            -- Optional user context for AI (e.g., "fried chicken")
  created_at TIMESTAMP
)

food_item (
  id UUID PK,
  meal_id UUID FK,
  name TEXT,
  weight_g INTEGER,
  calories INTEGER,
  protein, carbs, fat, fiber NUMERIC(5,2)
)

-- Indexes:
-- idx_meal_user_timestamp (meal.user_id, meal.timestamp DESC)
-- idx_meal_photos (meal.photo_path, meal.thumbnail_path)
-- idx_food_item_meal (food_item.meal_id)

-- RLS Policies: All tables have user_id-based isolation
-- food_item access controlled via meal ownership (EXISTS subquery)

user_profile (
  id UUID PK,
  user_id UUID UNIQUE FK → auth.users,
  tier TEXT ('free' | 'beta' | 'paid') DEFAULT 'free',
  created_at, updated_at TIMESTAMP
)

invite_code (
  id UUID PK,
  code TEXT UNIQUE,
  tier TEXT ('beta' | 'paid'),
  max_uses INTEGER,
  expires_at TIMESTAMP (nullable),
  status TEXT ('active' | 'disabled')
)

invite_redemption (
  id UUID PK,
  invite_code_id UUID FK → invite_code,
  user_id UUID UNIQUE FK → auth.users,  -- one redemption per user
  redeemed_at TIMESTAMP
)

-- Entitlement RPC:
-- redeem_invite(p_code, p_user_id) - atomic validation + tier upgrade (SECURITY DEFINER)
-- Auto-trigger: create_user_profile() fires on auth.users INSERT → tier='free'
```

**Schema Migrations:**
1. `20260122060034_create_initial_schema.sql` - Initial tables + RLS policies
2. `20260131082225_add_photo_path.sql` - Added photo_path for signed URLs
3. `20260131083451_add_thumbnail_path.sql` - Added thumbnail_path for mobile optimization
4. `20260206074057_add_entitlement_system.sql` - user_profile, invite_code, invite_redemption tables + redeem_invite RPC

**Closed Beta:** `ProtectedRoute` blocks `free` tier users with an "Invite Only" screen. All new signups start as `free` until they redeem a valid invite code.

**Important:** Daily totals are computed on read (not stored). Aggregation is instant for ~15 rows/day.

## Design System

**Tailwind v4 Configuration:**
- Custom design tokens in `index.css` (@theme directive)
- Color palette: `--color-primary` (green #22C55E), `--color-protein`, `--color-carbs`, `--color-fat`, `--color-fiber`
- Typography: DM Sans font family, semantic variants via Typography component
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`, stagger utilities

**UI Components:**
- All UI primitives in `components/ui/` with consistent API (variant, size, fullWidth props)
- **MacroSummary** - Circular progress rings for daily goals (large 200px calorie ring + 4x 72px macro rings)
- **MealCard** - Displays meal with thumbnail (80x80px), up to 2 foods shown (+ "N more"), macro badges
- **SwipeableCard** - Swipe-to-delete gesture with fallback delete button for accessibility
- **BottomNav** - Fixed navigation with 5 items:
  - Home (daily summary)
  - History (past meals)
  - Log (center FAB - camera)
  - Goals (macro targets)
  - More (settings/account)

**Theme System:**
- **ThemeContext** provides dark/light mode toggle
- Persists theme preference to localStorage
- Applies `dark` class to document root for Tailwind dark mode
- Toggle available in SettingsPage ("More" tab) with emoji indicator (🌙/☀️)
- CSS variables in `index.css` define separate light/dark color tokens

**Visual Style:**
- Clean, minimal interface
- Staggered animations for list items (`stagger-1` through `stagger-4` with delays)
- Gradient backgrounds for auth pages (differentiate from main app)
- Monospace fonts for numerical data (tabular-nums)
- iOS-safe area handling with `safe-area-inset-*` CSS variables

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

### Editing an Existing Meal

1. User clicks MealCard on HomePage or HistoryPage
2. Navigate to `/dashboard/confirm-meal?mealId={id}` (edit mode)
3. ConfirmMealPage fetches meal data from `useMeals()`
4. User can:
   - Add new food items
   - Remove existing food items
   - Edit macros for any food
   - Update meal notes
5. On save, `useMeals().updateMeal()` handles:
   - Delete removed food items
   - Update modified food items
   - Insert new food items
   - Update meal notes
6. Returns to previous page (Home or History)

## Important Constraints

**Environment Variables:**
- All Vite env vars must be prefixed with `VITE_` to be exposed to client
- Never commit `.env.local` (contains Supabase keys)
- Use `.env.local.example` as template

**TypeScript:**
- `verbatimModuleSyntax: true` - Must use `import type` for type-only imports
- Strict mode enabled - No implicit any, null checks enforced

**PWA Configuration:**
- Service worker auto-generates (vite-plugin-pwa v1.2.0)
- **Runtime caching strategy (Workbox):**
  - API calls: NetworkFirst, 5min cache, max 50 entries
  - Images (png/jpg/jpeg/webp): CacheFirst, 7-day cache, max 100 entries
  - Static assets: Auto-cached (js, css, html, svg, woff2)
- **Manifest** (in `vite.config.ts`):
  - name: "MacroTracker", short_name: "Macros"
  - theme_color: #22C55E (primary green)
  - display: standalone (hides browser UI)
  - Icons: 192x192, 512x512 (with maskable variant for iOS)
- **iOS Support:**
  - Safe area CSS variables for notch/home indicator
  - Prevents pull-to-refresh and scroll bounce

**Image Handling:**
- **Dual-file upload strategy:**
  - Full image: Compressed to ~1MB, max 1920px dimension
  - Thumbnail: 400px max dimension, ~100KB, quality 0.85
- Unique filenames: `${userId}/${timestamp}-${random}.jpg` (thumbnail has `_thumb` suffix)
- Upload both to Storage, store paths in database (not base64 or URLs)
- **Signed URL generation:**
  - 1-hour expiry for security
  - Generated in `useMeals()` hook
  - Cached in state to avoid redundant API calls
  - Separate cache control: full images 1hr, thumbnails 24hr

## AI Integration Notes

**AI Provider Strategy:**
- **Primary:** Gemini 2.5 Flash Lite (`gemini-2.5-flash-lite`)
  - Cost-effective, fast inference (~1-2 seconds)
  - Uses response schema for structured output
- **Fallback:** OpenAI GPT-4o Mini (`gpt-4o-mini`)
  - Activates if Gemini API fails
  - Uses json_schema strict mode for structured output
- Both models return complete nutrition data (no external database lookups needed)
- Single API call per meal (food identification + portion estimation + nutrition in one request)
- API keys stored in Supabase Edge Function secrets (not in code)

**User Context Input:**
- Optional text input on LogMealPage (e.g., "fried chicken", "grilled salmon")
- Helps AI with cooking method detection and variant identification
- Sanitized for prompt injection patterns before sending to AI
- Field is optional - works without user input

**Portion Estimation:**
- AI analyzes visual cues (plate size, food volume, typical serving sizes)
- Estimates weight/portion for each identified food item
- Returns confidence scores to indicate estimation reliability
- Users can always adjust portions in confirmation screen

## Macro Calculation Algorithm

**Onboarding uses Mifflin-St Jeor equation for BMR/TDEE:**

```typescript
// Located in: utils/macroCalculations.ts

// 1. Calculate Basal Metabolic Rate (BMR)
BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + sex_offset
// sex_offset: +5 for male, -161 for female

// 2. Calculate Total Daily Energy Expenditure (TDEE)
TDEE = BMR * activity_multiplier
// activity_multipliers:
// - sedentary: 1.2
// - light: 1.375
// - moderate: 1.55
// - active: 1.725

// 3. Adjust for goal
target_calories = TDEE + goal_adjustment
// goal_adjustments:
// - lose: -500 cal
// - maintain: 0 cal
// - gain: +500 cal

// 4. Calculate macros
protein_g = (target_calories * protein_bias) / 4
fat_g = (target_calories * 0.25) / 9
carbs_g = (target_calories - protein_cal - fat_cal) / 4
fiber_g = (target_calories / 1000) * 12

// protein_bias: 0.25-0.35 (default: 0.30)
// Adjustable via slider in OnboardingGoalsPage
```

**Default Goals (if not set):**
- 2000 calories
- 150g protein
- 250g carbs
- 65g fat
- 30g fiber

## Testing & Verification

**Manual Testing Checklist:**
- Unauthenticated access redirects to `/login`
- Signup creates user, shows email confirmation message
- **Closed beta / invite gate:**
  - Signup without invite code → logs in → sees "Invite Only" screen (not dashboard)
  - Sign out button on invite screen works
  - Signup via `/login?invite={code}` → invite redeemed → full app access
  - Invite with expired/disabled/maxed-out code shows correct error
  - Pending invite code in localStorage auto-redeems on next login
- **New users forced to onboarding flow:**
  - OnboardingGoalsPage shows (no daily_goal record)
  - Recommended mode calculates BMR/TDEE correctly
  - Manual mode accepts direct macro entry
  - After goals saved, redirected to HowItWorks page
- Login redirects to HomePage (or onboarding if new user)
- Session persists across page refreshes
- Sign out redirects to `/login`
- Protected routes require authentication
- Photo upload + AI analysis returns food data
- **Meal editing:**
  - Click meal card opens ConfirmMealPage in edit mode
  - Can add/remove/edit food items
  - Updates persist to database
- **Swipe-to-delete:**
  - Swipe left on MealCard triggers delete
  - Optimistic UI update (reverts on error)
- Meal save associates with correct user_id
- Daily totals calculate correctly (including fiber)
- Goals persist to database
- **Dark mode toggle:**
  - Settings page has theme toggle
  - Preference persists to localStorage
  - Theme applies across all pages

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
- **Error Categorization** (utils/errors.ts):
  - ErrorCategory enum: AUTH, VALIDATION, NETWORK, API, STORAGE, UNKNOWN
  - `parseSupabaseFunctionError()` extracts structured errors from Edge Functions
  - Maps error codes to categories, determines if retryable
- **Edge Function Errors** (supabase/functions/_shared/errors.ts):
  - ApiError class with ErrorCode enum
  - Error codes: MISSING_AUTH, INVALID_AUTH, VALIDATION_ERROR, MISSING_CONFIG, EXTERNAL_API_ERROR, DATABASE_ERROR, INTERNAL_ERROR
  - Returns JSON with CORS headers: `{error: {code, message, details}, requestId}`

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
- **Entitlements:** `hooks/useEntitlement.ts`, `hooks/useInviteRedemption.ts`
- **Theme:** `contexts/ThemeContext.tsx`
- **Data Hooks:** `hooks/useMeals.ts`, `hooks/useGoals.ts`, `hooks/useLocalStorage.ts`
- **Onboarding:** `pages/onboarding/OnboardingGoalsPage.tsx`, `OnboardingHowItWorksPage.tsx`, `OnboardingFirstMealPage.tsx`
- **Main Pages:** `pages/HomePage.tsx`, `LogMealPage.tsx`, `ConfirmMealPage.tsx`, `HistoryPage.tsx`, `GoalsPage.tsx`, `SettingsPage.tsx`
- **Edge Functions:** `../supabase/functions/analyze-meal/`, `../supabase/functions/save-meal/`
- **Shared Edge Utils:** `../supabase/functions/_shared/env.ts`, `errors.ts`, `logger.ts`, `meal-schema.ts`
- **Migrations:**
  - `../supabase/migrations/20260122060034_create_initial_schema.sql`
  - `../supabase/migrations/20260131082225_add_photo_path.sql`
  - `../supabase/migrations/20260131083451_add_thumbnail_path.sql`
  - `../supabase/migrations/20260206074057_add_entitlement_system.sql`
- **Supabase Client:** `services/supabase.ts`
- **Utils:** `utils/imageUtils.ts`, `utils/macroCalculations.ts`, `utils/errors.ts`, `utils/logger.ts`
- **Design System:** `index.css` (theme tokens), `components/ui/*`
