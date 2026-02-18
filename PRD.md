# Product Requirements Document: Macro Tracker App

**Version:** 1.0
**Status:** Draft
**Last Updated:** January 2026

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Market Research & Competitive Analysis](#2-market-research--competitive-analysis)
3. [Product Vision & User Flow](#3-product-vision--user-flow)
4. [Technical Architecture](#4-technical-architecture)
5. [Learning-First Development Approach](#5-learning-first-development-approach)
6. [Feature Specifications](#6-feature-specifications)
7. [Data Models](#7-data-models)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Monetization Strategy](#9-monetization-strategy)
10. [Success Metrics](#10-success-metrics)
11. [Timeline & Milestones](#11-timeline--milestones)
12. [Known Risks & Unknowns](#12-known-risks--unknowns)

---

## 1. Executive Summary

### App Name Options

| Name | Rationale |
|------|-----------|
| **MacroSnap** | Action-oriented, quick photo = macro data |
| **SnapTrack** | Instant tracking with a snap |
| **BiteMath** | Clever - the math of every bite |
| **QuickMacro** | Emphasizes speed and simplicity |
| **FotoFit** | Photo-based fitness tracking |

*Final selection pending trademark and app store availability verification*

### Problem Statement

Manual calorie and macro tracking is tedious and error-prone. Users must search databases, estimate portion sizes, and manually enter data for every meal—leading to abandonment or inaccurate tracking.

### Solution

An AI-powered mobile app that recognizes food from photos with instant, accurate results. Users take a single photo of their meal, and the app automatically identifies foods, estimates portions, and calculates calories and macros—all in seconds.

### Key Differentiator

**One-photo simplicity.** While competitors require expensive subscriptions, tedious database searches or complex measurement setups, our app delivers complete nutrition tracking in seconds with just a single photo. No equipment needed, no manual entry—just snap and track.

---

## 2. Market Research & Competitive Analysis

### Competitor Landscape

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| **MyFitnessPal** | 18M+ food database, AI photo recognition, fitness integration | $19.99/mo premium, complex UI |
| **Lose It!** | Clean UI, 32M food database, $39.99/yr | Less fitness integration |
| **Cal AI** | Depth sensor for volume estimation, simple UX | Subscription required |
| **SnapCalorie** | LIDAR volumetric measurement, volume-based estimation | iOS only, requires newer devices |

### Market Opportunity

- Competing photo-based apps are expensive ($20/mo) or require specialized hardware
- Opportunity to provide fastest, simplest tracking experience at competitive pricing
- Growing health-conscious consumer base seeking effortless tracking tools

---

## 3. Product Vision & User Flow

### Core Hypothesis

> Users will adopt macro tracking if it's effortless. By eliminating manual entry and equipment requirements, we can dramatically reduce friction and increase daily engagement.

> **Design Principle:** Never block logging. Speed and simplicity are the priority—a logged meal with AI estimates is infinitely better than an abandoned meal.

### Simple User Flow (Photo-First)

```
┌─────────────────────────────────────────────────────────┐
│  User takes photo of meal (< 5 seconds)                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  AI analyzes image instantly                            │
│  - Identifies all food items                            │
│  - Estimates portion sizes                              │
│  - Calculates complete nutrition data                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Confirmation screen (< 2 seconds)                      │
│  - Shows identified foods with macros                   │
│  - User can adjust portions or add/remove items         │
│  - Tap "Save" to complete (total time: < 10 seconds)   │
└─────────────────────────────────────────────────────────┘
```

### Analytics for Product Validation

| Metric | Purpose |
|--------|---------|
| Time to log meal (photo to save) | Validate speed/simplicity value proposition |
| AI food identification accuracy | Track improvement in recognition quality |
| Gemini 2.5 Flash Lite vs GPT-4o Mini | AI accuracy comparison (currently uses Gemini primary, OpenAI fallback) |
| Onboarding completion rate | Measure drop-off in 3-page onboarding flow |
| Manual vs Recommended goal setup | User preference for calculated vs manual macro entry |
| User context input usage | % of meals with user-provided cooking context |
| Zero-edit meal saves | % of meals saved without user corrections |

### Onboarding Flow (New Users)

**Design Principle:** Guide new users through essential setup while explaining value proposition.

```
┌─────────────────────────────────────────────────────────┐
│  User signs up and logs in                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  OnboardingGoalsPage - Set daily macro goals            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ RECOMMENDED MODE (default)                        │  │
│  │ - Enter: age, sex, weight, height                 │  │
│  │ - Select: goal (lose/maintain/gain weight)        │  │
│  │ - Select: activity level                          │  │
│  │ - Adjust: protein bias slider (0.25-0.35)         │  │
│  │ → Calculates BMR/TDEE (Mifflin-St Jeor equation)  │  │
│  │ → Shows live preview of calculated macros         │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ MANUAL MODE (alternative)                         │  │
│  │ - Enter calories, protein, carbs, fat, fiber      │  │
│  │ - For users who already know their targets        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  OnboardingHowItWorksPage - App walkthrough             │
│  - Explains instant photo-based tracking                │
│  - Shows one-photo simplicity and speed                 │
│  - Demonstrates macro tracking UI                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  OnboardingFirstMealPage - Guided first meal            │
│  - Prompts user to log first meal                       │
│  - Shows example of good photo                          │
│  - Explains confirmation/editing flow                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  HomePage - User enters main app                        │
└─────────────────────────────────────────────────────────┘
```

**Onboarding Completion Check:**
- Checks if user has `daily_goal` record in database
- New users without goals are redirected to onboarding automatically
- `ProtectedRoute` component enforces this redirect
- After onboarding, users can update goals anytime from GoalsPage

**BMR/TDEE Calculation Details:**
```
BMR (Mifflin-St Jeor):
  BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + sex_offset
  sex_offset: +5 (male), -161 (female)

TDEE (Total Daily Energy Expenditure):
  TDEE = BMR * activity_multiplier
  activity_multipliers:
    - Sedentary (little/no exercise): 1.2
    - Lightly active (1-3 days/week): 1.375
    - Moderately active (3-5 days/week): 1.55
    - Very active (6-7 days/week): 1.725

Goal Adjustment:
  target_calories = TDEE + goal_adjustment
  goal_adjustments:
    - Lose weight: -500 cal
    - Maintain weight: 0 cal
    - Gain weight: +500 cal

Macro Distribution:
  protein_g = (target_calories * protein_bias) / 4
  fat_g = (target_calories * 0.25) / 9
  carbs_g = (remaining_calories_after_protein_and_fat) / 4
  fiber_g = (target_calories / 1000) * 12

  protein_bias: User-adjustable slider (0.25-0.35, default 0.30)
```

---

## 4. Technical Architecture

### Frontend: React PWA (Vite + Tailwind)

- **Why React PWA:** Single responsive web codebase installable across platforms (desktop/mobile) with no app store friction
- **TypeScript:** Type safety and better developer experience
- **PWA:** Offline caching, install prompts, and add-to-home-screen support

### Backend: Supabase

| Feature | Benefit |
|---------|---------|
| PostgreSQL database | Reliable, full SQL support |
| Row Level Security | Data isolation by user |
| Built-in auth | Email, social, MFA support |
| Edge Functions | Deno/TypeScript serverless functions |
| Real-time subscriptions | Live sync across devices |
| Open-source | No vendor lock-in |
| Spend caps | Predictable pricing |

### AI/Vision API Options

| Criteria | Google Gemini 2.5 Flash Lite | OpenAI GPT-4o Mini |
|----------|------------------------------|-------------------|
| Food ID accuracy | Strong | Strong |
| Portion estimation | Strong (visual analysis) | Strong (visual analysis) |
| Nutrition estimation | Strong (trained on nutrition data) | Strong (trained on nutrition data) |
| Single API call | Yes - complete meal analysis | Yes - complete meal analysis |
| Free tier | Generous (60 req/min) | Limited |
| Pricing | $0.0025/image | $0.01-0.03/image |
| Latency | ~1-2 seconds | ~2-4 seconds |
| Structured output | Response schema | JSON schema (strict mode) |

**Strategy:** Build an abstraction layer to support both providers. Start with Gemini 2.5 Flash Lite (cost-effective), validate accuracy, fallback to GPT-4o Mini if Gemini API fails, implement robust error handling for reliability.

**Current Implementation:** Edge function tries Gemini first, automatically falls back to OpenAI on failure.

**Nutrition Data Approach:** AI models return complete nutrition data (calories, protein, carbs, fat, fiber) based on food identification and weight estimation. This eliminates the need for external nutrition databases and keeps the system simple with a single API call per meal.

### Payments: RevenueCat + Stripe

- **RevenueCat:** Manages cross-platform subscriptions, single source of truth for entitlements
- **Stripe:** Web billing option (avoids 30% app store cut for eligible users)

---

## 5. Learning-First Development Approach

> **Development Philosophy:** This project prioritizes learning over speed. Implementation should be instructional—explaining concepts, showing patterns, discussing trade-offs. The goal is to master React and web/PWA fundamentals, not just produce working code.

### Core React Concepts to Master

| Concept | Learn During | Key Lessons |
|---------|--------------|-------------|
| Components | UI screens | Functional vs class, composition, props |
| useState | Form inputs, toggles | State immutability, batching, closures |
| useEffect | API calls, subscriptions | Dependency arrays, cleanup, race conditions |
| useContext | Auth, themes | When to use vs prop drilling |
| useReducer | Complex meal editing | Actions, reducers, dispatch patterns |
| useMemo/useCallback | Lists, heavy calculations | Referential equality, when optimization matters |
| Custom Hooks | Reusable logic | Extracting and sharing stateful logic |

### Web/PWA Specifics

| Topic | What to Learn |
|-------|---------------|
| Routing | React Router - nested routes, protected routes, navigation patterns |
| Styling | Tailwind CSS + design tokens; responsive layouts without StyleSheet |
| Media capture | Browser camera/file input (`capture` attr, permissions, getUserMedia fallback) |
| PWA | Service workers, caching strategies, offline UX, install prompts |
| Performance | List virtualization/windowing, memoization, bundle splitting |
| Accessibility | ARIA for forms, focus management, keyboard navigation |

### Rendering & Performance Concepts

- Why components re-render (props, state, context changes)
- React.memo and when to use it
- The children prop and composition patterns
- Keys in lists and reconciliation
- Avoiding common pitfalls (objects/arrays in deps, inline functions)

### Implementation Instruction Style

When building each feature:
1. **Explain the concept** being used before writing code
2. **Show the "naive" approach first**, then the optimized approach
3. **Point out potential bugs/pitfalls** and how to avoid them
4. **Suggest experiments** ("try removing this dependency and see what happens")
5. **Reference official docs** for deeper reading

---

## 6. Feature Specifications

### MVP Features

| Feature | Description | React Concepts Learned |
|---------|-------------|----------------------|
| **Auth screens** | Sign up, login, password reset | useState for forms, useEffect for session check, useContext for auth state |
| **Onboarding flow** | 3-page guided setup (goals with BMR/TDEE calc, how-it-works, first meal) | Multi-step forms, conditional routing, localStorage persistence |
| **Photo capture** | Camera/file input with optional user context | Media capture APIs, async/await, image compression + thumbnails |
| **AI recognition UI** | Send photo, display results with provider fallback | Loading states, error handling, Gemini → OpenAI fallback |
| **Confirmation/edit screen** | Review/adjust AI results OR edit existing meals | Dual-mode component, controlled inputs, CRUD operations |
| **Meal logging** | Save meals with photo + thumbnail to Storage | API calls, optimistic updates, dual-file uploads, signed URLs |
| **Meal editing** | Edit saved meals (add/remove/update food items) | Update transactions, optimistic UI, swipe-to-delete gestures |
| **Daily tracking view** | Today's meals with swipe-to-delete | useMemo for calculations, gesture handling, optimistic deletes |
| **Goal setting** | Set calorie/macro targets (calculated or manual entry) | BMR/TDEE calculator (Mifflin-St Jeor), slider controls, form validation |
| **Calendar view** | Historical meals grouped by date | Date grouping, signed URL caching, list performance |
| **Dashboard** | Daily progress with circular macro rings | Data visualization, progress indicators, custom hooks |
| **Dark mode** | System-wide theme toggle with persistence | useContext for theme, localStorage, CSS variables |
| **Entitlement system** | Invite-code-based tier access (free/beta/paid) with closed beta gating | Postgres RPC, atomic transactions, RLS, custom hooks |

### Build Order (Pedagogical Sequence)

1. **Static UI first** - Learn Tailwind utility patterns, Flexbox/grid, component composition
2. **Add local state** - useState, controlled components
3. **Navigation** - React Router setup, nested routes, params
4. **Auth flow** - useContext, protected routes
5. **API integration** - useEffect, loading/error states
6. **Complex state** - useReducer for meal editing
7. **Performance** - useMemo, useCallback, list virtualization/windowing
8. **Polish** - Custom hooks, error boundaries, offline support

### Post-MVP Features (STILL TBD) (v1.x)

- Manual entry (text search, no photo required)
- Barcode scanning
- Recipe creation/saving
- Meal templates (quick-log favorites)
- Weekly/monthly reports
- Export data (CSV)
- Apple Health / Google Fit sync
- Social features (optional)
- Premium tier with advanced analytics

---

## 7. Data Models

### User
```
id: uuid (primary key)
email: string (unique)
name: string
created_at: timestamp
```

### DailyGoal
```
id: uuid (primary key)
user_id: uuid (foreign key → User, UNIQUE - one goal per user)
calories: integer
protein: integer (grams)
carbs: integer (grams)
fat: integer (grams)
fiber: integer (grams)
created_at: timestamp
updated_at: timestamp
```

**Note:** Onboarding uses BMR/TDEE calculations (Mifflin-St Jeor equation) for "Recommended" mode. Users can also enter goals manually.

### Meal
```
id: uuid (primary key)
user_id: uuid (foreign key → User)
timestamp: timestamp
photo_url: string (DEPRECATED - legacy public URLs)
photo_path: string (Storage path for full image, requires signed URL)
thumbnail_path: string (Storage path for thumbnail, ~100KB, 400px)
notes: string (optional user context for AI, e.g., "fried chicken")
created_at: timestamp
```

**Note:** App uses `photo_path` and `thumbnail_path` with 1-hour signed URLs for security. Legacy `photo_url` field retained for backward compatibility but not used in new meals.

### FoodItem
```
id: uuid (primary key)
meal_id: uuid (foreign key → Meal)
name: string
weight_g: integer (rounded from AI estimate)
calories: integer
protein: numeric(5,2) (grams, rounded to 0.1g)
carbs: numeric(5,2) (grams, rounded to 0.1g)
fat: numeric(5,2) (grams, rounded to 0.1g)
fiber: numeric(5,2) (grams, rounded to 0.1g)
```

**Note:** AI provides nutrition estimates. Users can manually edit any value in ConfirmMealPage before saving.

*Note: Daily totals are computed on read from FoodItems. No denormalized summary table needed at MVP scale (~15 rows/day; aggregation is instant).*

### UserProfile
```
id: uuid (primary key)
user_id: uuid (foreign key → auth.users, UNIQUE)
tier: text ('free' | 'beta' | 'paid')
created_at: timestamp
updated_at: timestamp
```

**Note:** Auto-created by database trigger on every new signup (defaults to `'free'`). Tier can only be changed via the `redeem_invite()` RPC (SECURITY DEFINER—bypasses RLS). Users have SELECT-only access; no self-promotion possible.

**Closed Beta:** During the testing phase, `free` tier users are blocked at `ProtectedRoute` and shown an "Invite Only" screen. Access requires redeeming a valid invite code at signup.

### InviteCode
```
id: uuid (primary key)
code: text (unique)
tier: text ('beta' | 'paid')
max_uses: integer
expires_at: timestamp (nullable)
status: text ('active' | 'disabled')
created_at: timestamp
```

**Note:** Service-role access only (no user RLS policies). Codes distributed as URL params: `/login?invite={code}`. The `redeem_invite()` Postgres RPC atomically validates, checks expiry, enforces max uses, and upgrades the user's tier in a single locked transaction.

### InviteRedemption
```
id: uuid (primary key)
invite_code_id: uuid (foreign key → InviteCode)
user_id: uuid (foreign key → auth.users, UNIQUE — one redemption per user)
redeemed_at: timestamp
```

**Note:** Audit trail for all redemptions. LoginPage captures `?invite={code}` from the URL, persists it to localStorage for resilience, and attempts redemption immediately after signup. AuthContext retries auto-redemption on next login if the first attempt fails.

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Time to useful feedback | < 5 seconds (photo capture → results displayed) |
| AI inference time | < 3 seconds (excludes upload, cold starts) |
| App launch time | < 2 seconds |
| Offline support | Read-only (view history); new logs require connectivity |
| Data encryption | At rest and in transit |
| Privacy compliance | GDPR compliant |
| Health data classification | Not HIPAA-targeted; treated as sensitive personal data |
| Supported platforms | iOS 14+, Android 10+ |

---

## 9. Monetization Strategy

### Current State: Closed Beta (Invite-Only)

The app is currently in closed beta. A three-tier entitlement system is fully implemented in the database and frontend:

| Tier | Access | Assignment |
|------|--------|------------|
| **free** | Blocked — "Invite Only" screen | Default for all new signups |
| **beta** | Full app access | Granted via invite code redemption |
| **paid** | Full app access (future premium features) | Reserved for future payment integration |

**How it works:**
- Every new signup automatically gets a `user_profile` record with `tier = 'free'` (via database trigger)
- Free-tier users are blocked at `ProtectedRoute` with a friendly "invite only" message and sign-out button
- Beta access is granted by redeeming an invite code — via `?invite={code}` URL param at signup, or auto-applied from localStorage on next login
- Invite codes are stored in the `invite_code` table with configurable max uses and expiry
- Code redemptions are tracked in `invite_redemption` (one per user, prevents double-dipping)
- The `redeem_invite` Postgres RPC handles atomic validation with row-level locking

**Database tables:** `user_profile`, `invite_code`, `invite_redemption`
**Frontend:** `useEntitlement` hook, `useInviteRedemption` hook, `AuthContext.tier`

### Future Freemium Model (Post-Beta)

| Tier | Price | Planned Features |
|------|-------|----------|
| **Free** | $0 | Limited AI scans/day, basic tracking |
| **Premium** | $4.99/mo or $39.99/yr | Unlimited scans, advanced analytics, data export, priority support |

**Note:** `useEntitlement` hook is scaffolded but not yet enforcing any limits — all tiers currently have full access. Feature gates will be wired up when the free tier opens.

### Revenue Optimization (Post-Beta)

- RevenueCat for subscription management
- Stripe web billing for users who prefer to avoid app store fees
- Annual plan discount to improve retention

---

## 10. Success Metrics

### Engagement Metrics

| Metric | Target |
|--------|--------|
| Day 1 retention | > 40% |
| Day 7 retention | > 20% |
| Day 30 retention | > 10% |
| Daily active users | Track growth MoM |
| Meals logged per user per day | > 2 |

*Note: These targets are ambitious for a new consumer health app. Early-stage apps typically see Day 7 retention of 10-15%. Targets serve as aspirational benchmarks.*

### Product Metrics

| Metric | Target |
|--------|--------|
| Food identification accuracy | > 90% (correct food type) |
| Ingredient granularity accuracy | > 75% (specific variant vs generic) |
| Cooking method detection | > 70% (fried/baked/steamed) |
| Portion estimation accuracy | > 70% (within 20% of actual) |
| Zero-correction rate | > 60% (no user edits needed) |
| Average time to log meal | < 10 seconds (photo to save) |
| Subscription conversion rate | 2-5% of active users |

*Note: Initial conversion typically 1-3%. Higher rates require obvious accuracy advantage, scan limit friction, and clear value messaging before paywall.*

---

## 11. Timeline & Milestones

### Phase 1: Core MVP ✅ COMPLETED
- ✅ Authentication (sign up, login, logout)
- ✅ Onboarding flow (3-page guided setup with BMR/TDEE calculator)
- ✅ Photo capture with compression and thumbnail generation
- ✅ AI food recognition (Gemini + OpenAI fallback)
- ✅ Meal logging with confirmation/edit flow
- ✅ Meal editing (add/remove/update food items)
- ✅ Swipe-to-delete gestures

### Phase 2: Tracking & Goals ✅ COMPLETED
- ✅ Calendar view (historical meals grouped by date)
- ✅ Goal setting (calculated via BMR/TDEE or manual entry)
- ✅ Dashboard with circular macro progress rings
- ✅ Daily totals calculation
- ✅ Dark mode theme toggle

### Phase 3: Polish & Testing 🔄 IN PROGRESS
- ✅ Performance optimization (image compression, thumbnail caching, signed URL caching)
- ✅ Error handling with categorization (ErrorCategory enum)
- ✅ Entitlement system: three-tier (free/beta/paid) with invite code redemption
- ✅ Closed beta gate: free-tier users blocked at ProtectedRoute with invite-only screen
- ✅ Branding pivot: removed all food scale references, messaging updated to one-photo simplicity
- ⏳ Known issues (see TODO.md):
  - Security: Validate photoPath belongs to user (SECURITY-1)
  - Edge case: Handle empty foods array from AI (EDGE-CASE-2)
  - Edge case: Duplicate email signup gives no error (EDGE-CASE-4)
  - QoL: Theme preference stored in localStorage only, not synced across devices (QOL-3)
- ⏳ Beta testing with real users
- ⏳ Bug fixes and refinements

### Phase 4: Launch ⏳ NOT STARTED
- ⏳ App store submission (iOS and Android)
- ⏳ Marketing site (LandingPage exists but not deployed)
- ⏳ Support documentation
- ⏳ Analytics integration (Google Analytics/Plausible)
- ⏳ Error tracking (Sentry/LogRocket)

---

## 12. Known Risks & Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI misclassification trust erosion | Users lose confidence after errors | Always allow corrections; improve AI over time with user feedback |
| Portion estimation variance | AI estimates may differ from actual portions | Allow user corrections; show confidence scores; learn from corrections |
| AI nutrition estimation variance | Estimated macros may vary from USDA values | Allow user corrections; consider future DB integration for common foods |
| Lighting/plating variance | Poor photos reduce accuracy | Provide photo tips; graceful degradation; improve AI model |
| International food coverage | Non-US foods poorly recognized | AI models trained on diverse datasets; improve over time |
| User perception of accuracy | Users may doubt AI estimates | Transparent confidence scores; easy editing; educational content |
| Cold start latency | Edge functions slow on first call | Keep functions warm; show progress indicator |

---

## Appendix: Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 PWA (Vite 7.2.4 + Tailwind v4) | Installable web app with familiar React patterns, minimal deployment friction |
| Tracking Method | Photo-only (no equipment required) | Maximizes simplicity and adoption; removes all friction |
| AI Service | Gemini 2.5 Flash Lite (primary) + GPT-4o Mini (fallback) | Cost-effective, automatic failover for reliability |
| Backend | Supabase | Full-featured, open-source, predictable pricing |
| Storage Strategy | Dual-file (full + thumbnail) with signed URLs | Security (RLS) + performance (mobile optimization) |
| Onboarding | BMR/TDEE calculator (Mifflin-St Jeor) + manual option | Personalized recommendations vs user control |
| Beta Access | Invite code system (free/beta/paid tiers) | Control rollout during testing; prevent unmetered free usage |
| Payments | RevenueCat + Stripe | Cross-platform subscriptions with web billing option (not yet implemented) |
| Development Approach | Learning-first, instructional | Master fundamentals, not just ship code |
| Theme System | Dark/light mode with localStorage persistence | User preference, modern UX expectation |
| Navigation | 5-item BottomNav (Home, History, Log, Goals, More) | Logical grouping, center FAB for primary action |
| Fiber tracking | Yes, MVP | Important for digestive health, commonly requested |
| Meal editing | Yes, MVP | Users need ability to correct AI mistakes post-save |
| Manual entry | Post-MVP | Keep MVP focused on AI photo differentiator |
| Daily totals | Computed on read | ~15 rows/day; aggregation is instant; avoids derived data complexity |
| Image compression | Client-side (browser-image-compression) | Reduces upload time, server costs, storage costs |
