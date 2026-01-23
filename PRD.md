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
| **ScaleSmart** | Emphasizes the scale differentiator + AI intelligence |
| **MacroSnap** | Action-oriented, quick photo = macro data |
| **PlateWeight** | Literal - what's on your plate + weight |
| **BiteMath** | Clever - the math of every bite |
| **GramWise** | Grams (weight) + wise (smart tracking) |

*Final selection pending trademark and app store availability verification*

### Problem Statement

Manual calorie and macro tracking is tedious and error-prone. Users must search databases, estimate portion sizes, and manually enter data for every meal—leading to abandonment or inaccurate tracking.

### Solution

An AI-powered mobile app that recognizes food from photos and integrates with food scales for accurate weight measurement. Users take a single photo of their meal on a scale, and the app automatically identifies foods, reads the weight, and calculates calories and macros.

### Key Differentiator

**Food scale integration.** While competitors rely on volume estimation (often 15-30% error), our app combines AI food recognition with actual weight measurement for significantly improved accuracy.

---

## 2. Market Research & Competitive Analysis

### Competitor Landscape

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| **MyFitnessPal** | 18M+ food database, 97% AI accuracy, fitness integration | $19.99/mo premium, complex UI |
| **Lose It!** | Clean UI, 32M food database, $39.99/yr | Less fitness integration |
| **Cal AI** | Depth sensor for volume estimation, simple UX | Subscription required |
| **SnapCalorie** | LIDAR volumetric measurement, 16% error rate | iOS only, requires newer devices |

### Market Opportunity

- No major app combines food scale weight + AI recognition
- Scale integration significantly improves accuracy over volume estimation
- Opportunity to undercut premium pricing while offering superior accuracy
- Growing health-conscious consumer base seeking accurate tracking tools

---

## 3. Product Vision & User Flow

### Core Hypothesis

> Scale-based tracking is more accurate, but we need to validate whether users value accuracy enough to adopt the extra step. Design for flexibility, measure outcomes, iterate.

> **Design Principle:** Never block logging. Accuracy degrades gracefully—a logged meal with estimated data is better than an abandoned meal.

### Adaptive User Flow (Scale-First Default)

```
┌─────────────────────────────────────────────────────────┐
│  User takes photo of meal                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  AI analyzes image                                      │
│  - Identifies food items                                │
│  - Detects if scale is visible                          │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────────────────────────┐
│ Scale detected│   │ No scale detected                 │
│ → Read weight │   │ → AI estimates portion            │
│ → High conf.  │   │ → Show confidence score           │
└───────┬───────┘   │ → Prompt: "Add scale for better   │
        │           │   accuracy" (non-blocking)        │
        │           └─────────────────┬─────────────────┘
        │                             │
        └──────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Confirmation screen                                    │
│  - User can adjust food items, weights                  │
│  - Shows calories/macros                                │
│  - Save to log                                          │
└─────────────────────────────────────────────────────────┘
```

### Analytics for Hypothesis Validation

| Metric | Purpose |
|--------|---------|
| Accuracy of scale based macros vs non-scale based macros | Significance of scale |
| Gemini vs OpenAI | AI accracy comparison |

### Scale Usage Protocol

1. User zeros the scale with empty plate
2. Places food on plate, plate on scale
3. Takes photo showing both plate and scale display
4. AI reads weight from scale display in photo
5. If scale display is obscured by plate, user can manually enter weight

**Fallback:** If weight cannot be determined, app prompts for manual weight entry but never blocks logging.

---

## 4. Technical Architecture

### Frontend: React Native

- **Why React Native:** Cross-platform deployment (iOS + Android) with a single codebase
- **TypeScript:** Type safety and better developer experience
- **Hermes Engine:** Fast startup and optimized performance

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

| Criteria | Google Gemini Pro Vision | OpenAI GPT-4V |
|----------|-------------------------|---------------|
| Food ID accuracy | Strong | Strong |
| OCR (scale reading) | Native support | Native support |
| Nutrition estimation | Strong (trained on USDA data) | Strong (trained on USDA data) |
| Single API call | Yes - complete meal analysis | Yes - complete meal analysis |
| Free tier | Generous (60 req/min) | Limited |
| Pricing | $0.0025/image | $0.01-0.03/image |
| Latency | ~1-2 seconds | ~2-4 seconds |
| Structured output | JSON mode available | JSON mode available |

**Strategy:** Build an abstraction layer to support both providers. Start with Gemini (cost-effective), validate accuracy, A/B test with GPT-4V if needed, implement fallback logic for reliability.

**Nutrition Data Approach:** AI models return complete nutrition data (calories, protein, carbs, fat, fiber) based on food identification and weight estimation. This eliminates the need for external nutrition databases and keeps the system simple with a single API call per meal.

### Payments: RevenueCat + Stripe

- **RevenueCat:** Manages cross-platform subscriptions, single source of truth for entitlements
- **Stripe:** Web billing option (avoids 30% app store cut for eligible users)

---

## 5. Learning-First Development Approach

> **Development Philosophy:** This project prioritizes learning over speed. Implementation should be instructional—explaining concepts, showing patterns, discussing trade-offs. The goal is to master React and React Native fundamentals, not just produce working code.

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

### React Native Specifics

| Topic | What to Learn |
|-------|---------------|
| Navigation | React Navigation - stack, tab, drawer patterns |
| Styling | StyleSheet vs inline styles - why RN doesn't use CSS |
| Lists | FlatList/SectionList - virtualization, keyExtractor, why not .map() |
| Platform code | Platform.OS, .ios.js/.android.js files |
| Native modules | When/why to bridge to native code |
| Gestures | Touch events, pan responders |

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
| **Photo capture** | Camera integration, permissions | Native modules, async/await, permissions handling |
| **AI recognition UI** | Send photo, display results | Loading states, error handling, useReducer for complex state |
| **Confirmation/edit screen** | Review and adjust AI results | Controlled inputs, form validation, lifting state up |
| **Meal logging** | Save meals to database | API calls with useEffect, optimistic updates, error boundaries |
| **Daily tracking view** | Today's meals and totals | useMemo for calculations, derived state patterns |
| **Goal setting** | Set calorie/macro targets (protein, carbs, fat, fiber) | Persistent storage, useCallback for handlers |
| **Calendar view** | Historical meal data | FlatList/SectionList, performance optimization, virtualization |
| **Dashboard** | Progress overview | Data visualization, custom hooks for data fetching |

### Build Order (Pedagogical Sequence)

1. **Static UI first** - Learn StyleSheet, Flexbox, component composition
2. **Add local state** - useState, controlled components
3. **Navigation** - React Navigation setup, passing params
4. **Auth flow** - useContext, protected routes
5. **API integration** - useEffect, loading/error states
6. **Complex state** - useReducer for meal editing
7. **Performance** - useMemo, useCallback, FlatList optimization
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
user_id: uuid (foreign key → User)
calories: integer
protein: integer (grams)
carbs: integer (grams)
fat: integer (grams)
fiber: integer (grams)
```

### Meal
```
id: uuid (primary key)
user_id: uuid (foreign key → User)
timestamp: timestamp
photo_url: string
notes: string (optional)
```

### FoodItem
```
id: uuid (primary key)
meal_id: uuid (foreign key → Meal)
name: string
weight_g: integer
calories: integer
protein: float (grams)
carbs: float (grams)
fat: float (grams)
fiber: float (grams)
```

*Note: Daily totals are computed on read from FoodItems. No denormalized summary table needed at MVP scale (~15 rows/day; aggregation is instant).*

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

### Freemium Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 AI scans/day, basic tracking, manual entry unlimited |
| **Premium** | $4.99/mo or $39.99/yr | Unlimited scans, advanced analytics, data export, priority support |

### Revenue Optimization

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
| Scale weight OCR accuracy | > 95% (when scale visible) |
| Zero-correction rate (all factors) | > 60% (no user edits needed) |
| Scale usage rate | Track for hypothesis validation |
| Subscription conversion rate | 2-5% of active users |

*Note: Initial conversion typically 1-3%. Higher rates require obvious accuracy advantage, scan limit friction, and clear value messaging before paywall.*

---

## 11. Timeline & Milestones

### Phase 1: Core MVP
- Authentication (sign up, login, logout)
- Photo capture and camera permissions
- AI food recognition integration
- Basic meal logging and confirmation flow

### Phase 2: Tracking & Goals
- Calendar view for historical data
- Goal setting and daily progress
- Dashboard with summary stats

### Phase 3: Polish & Testing
- Performance optimization
- Error handling and edge cases
- Beta testing with real users
- Bug fixes and refinements

### Phase 4: Launch
- App store submission (iOS and Android)
- Marketing site
- Support documentation

---

## 12. Known Risks & Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scale UX adoption | Users may skip scale step | Non-blocking; track usage analytics |
| AI misclassification trust erosion | Users lose confidence after errors | Always allow corrections; show confidence scores |
| AI nutrition estimation variance | Estimated macros may vary from USDA values | Allow user corrections; show confidence scores; consider future DB integration |
| Lighting/plating variance | Poor photos reduce accuracy | Provide photo tips; graceful degradation |
| International food coverage | Non-US foods poorly recognized | AI models trained on diverse datasets; improve over time |
| Weight reading failures | Scale obscured or unreadable | Manual weight entry fallback |
| Cold start latency | Edge functions slow on first call | Keep functions warm; show progress indicator |

---

## Appendix: Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React Native | Cross-platform with familiar React patterns, learning opportunity |
| Scale Requirement | Flexible (scale-first default) | Hypothesis to validate via analytics |
| AI Service | Abstraction layer, start with Gemini | Cost-effective, test and compare |
| Backend | Supabase | Full-featured, open-source, predictable pricing |
| Payments | RevenueCat + Stripe | Cross-platform subscriptions with web billing option |
| Development Approach | Learning-first, instructional | Master fundamentals, not just ship code |
| Fiber tracking | Yes, MVP | Important for digestive health, commonly requested |
| Manual entry | Post-MVP | Keep MVP focused on AI photo differentiator |
| Daily totals | Computed on read | ~15 rows/day; aggregation is instant; avoids derived data complexity |
