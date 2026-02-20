# QA Testing Checklist

Pre-production testing checklist. Test on a real mobile device (iOS Safari or Android Chrome) in addition to desktop where noted — this is a PWA and mobile behavior differs meaningfully.

**Legend:** `[ ]` = not tested · `[x]` = passed · `[!]` = bug found

---

## 1. Authentication

### Signup
- [ ] Signup without invite code → account created → "Invite Only" blocked screen appears (not dashboard)
- [ ] Signup with valid invite code via `?invite=CODE` URL → account created → tier upgraded → onboarding starts
- [ ] Signup with expired invite code → error shown, account NOT created, no success message
- [ ] Signup with maxed-out invite code → error shown, account NOT created, no success message
- [ ] Signup with disabled invite code → error shown, account NOT created, no success message
- [ ] Signup with duplicate email → shows "account already exists" error (not "check your email")
- [ ] After signup, confirmation email arrives in inbox (not spam)
- [ ] Clicking confirmation link → redirects to app and logs user in

### Login
- [ ] Valid credentials → logs in → goes to dashboard (or onboarding if new)
- [ ] Invalid credentials → shows error
- [ ] Session persists after page refresh
- [ ] Session persists after closing and reopening browser tab

### Sign Out
- [ ] Sign out from Settings ("More" tab) → redirects to login
- [ ] Sign out from "Invite Only" blocked screen → redirects to login
- [ ] After sign out, protected routes redirect to `/login`
- [ ] After sign out, back button cannot navigate to dashboard

---

## 2. Invite & Entitlement System

### Invite Only Screen (Free Tier)
- [ ] Free user sees blocked screen immediately after login
- [ ] Blocked screen shows correct signed-in email
- [ ] Invite code input is present and accepts text
- [ ] Entering valid code → "Apply Code" → tier upgrades → enters app (no page reload needed)
- [ ] Entering invalid code → friendly error message → input stays editable
- [ ] Entering expired code → friendly error message
- [ ] Entering already-maxed code → friendly error message

### Invite Link Flow (Existing Free Account)
- [ ] Visit `/login?invite=CODE` while logged out → code stored in localStorage → sign in → auto-redemption fires → enters app directly (never sees blocked screen)
- [ ] Visit `/login?invite=CODE` while already logged in as free user → redirected to dashboard → blocked screen shows with code pre-filled → click "Apply Code" → enters app
- [ ] After successful redemption, `pendingInviteCode` is cleared from localStorage

### Auto-Redemption
- [ ] Beta/paid user logs in with stale `pendingInviteCode` in localStorage → code is silently cleared, no RPC call made

---

## 3. Onboarding Flow

### Trigger
- [ ] New user (no `daily_goal` row) → always redirected to `/dashboard/onboarding/goals`
- [ ] Onboarding routes inaccessible to unauthenticated users
- [ ] Existing user (has `daily_goal` row) → never redirected to onboarding

### Goals Page — Recommended Mode
- [ ] Default mode is "Recommended"
- [ ] Age, sex, weight, height inputs all update calculation live
- [ ] Weight unit toggle (lbs/kg) works
- [ ] Height unit toggle (ft-in/cm) works
- [ ] Goal selector (Lose / Maintain / Gain) works
- [ ] Activity level slider moves through all 5 positions (1–5)
- [ ] Each slider position shows correct label and description:
  - [ ] 1 — Sedentary: "Desk job, little to no exercise"
  - [ ] 2 — Light: "Light exercise 1–3 days/week"
  - [ ] 3 — Moderate: "Moderate exercise 3–5 days/week"
  - [ ] 4 — Active: "Hard exercise 6–7 days/week"
  - [ ] 5 — Very Active: "Very hard exercise or physical job"
- [ ] Calculated macro preview updates in real time as inputs change
- [ ] Advanced settings toggle reveals protein bias slider
- [ ] Protein bias slider (25%–35%) updates macro preview

### Goals Page — Manual Mode
- [ ] Switch to Manual mode
- [ ] All 5 macro inputs accept values
- [ ] Continue saves the manually entered values

### Goals Page — Save
- [ ] Continue saves goals to database
- [ ] After saving, redirects to How It Works page

### How It Works Page
- [ ] Content loads and displays
- [ ] Continue → First Meal page

### First Meal Page
- [ ] Content loads
- [ ] CTA navigates to Log Meal

---

## 4. Meal Logging

### Photo Capture
- [ ] "Open Camera" opens device camera (mobile) or file picker (desktop)
- [ ] Taking/selecting a photo shows preview
- [ ] "Retake Photo" clears preview and reopens camera

### Context Input
- [ ] Optional context field appears after photo is selected
- [ ] 500 character limit enforced with counter shown
- [ ] Context field hidden while analyzing

### Analysis
- [ ] "Analyze Meal" triggers loading state ("Analyzing your meal...")
- [ ] Successful analysis → navigates to Confirm Meal page with results
- [ ] Photo data and context passed correctly to Confirm page

### No Food Detected (EDGE-CASE-2)
- [ ] Photo with no food → amber "No food detected" card appears
- [ ] Page scrolls to the card automatically (UX-2)
- [ ] Tips list visible in the card
- [ ] "Try Again" button opens camera again
- [ ] "Analyze Meal" and "Retake Photo" buttons hidden when no-food card is showing

### Error Handling
- [ ] Network error → red error card appears
- [ ] Page scrolls to error card automatically (UX-2)
- [ ] Error message is human-readable (not a raw technical error)
- [ ] After error, "Retake Photo" still works

---

## 5. Confirm Meal Page (New Meal)

- [ ] Food items list populates from AI analysis
- [ ] Each food shows name, weight, calories, and macros
- [ ] Macro totals sum correctly at the top
- [ ] Can edit food name inline
- [ ] Can edit weight/macros inline
- [ ] Can remove a food item
- [ ] Can add a new food item manually
- [ ] Meal notes field editable
- [ ] "Save Meal" saves to database and navigates to Home
- [ ] Saved meal appears on Home page immediately

---

## 6. Confirm Meal Page (Edit Mode)

- [ ] Clicking a meal card on Home or History opens Confirm in edit mode
- [ ] Existing food items load correctly
- [ ] Existing notes load correctly
- [ ] Can add a food item → persists on save
- [ ] Can remove a food item → persists on save
- [ ] Can edit macros → persists on save
- [ ] "Save" updates database and returns to previous page
- [ ] Meal thumbnail still shows correctly after edit

---

## 7. Home Page

- [ ] Daily calorie ring shows correct total vs goal
- [ ] Protein, carbs, fat, fiber rings all display correctly
- [ ] Rings update correctly when meals are logged/deleted
- [ ] Meal cards show thumbnail, food names, macro badges
- [ ] Meal cards with 3+ foods show "+ N more" truncation
- [ ] Tap meal card → opens in edit mode
- [ ] Swipe left on meal card → triggers delete
- [ ] Delete is optimistic (card disappears immediately)
- [ ] Empty state shown when no meals logged today

---

## 8. History Page

- [ ] Past meals grouped by date
- [ ] Dates display correctly (today, yesterday, full dates)
- [ ] Meal thumbnails load via signed URLs
- [ ] Tap meal → opens edit mode
- [ ] Swipe to delete works on history meals
- [ ] Empty state shown when no history

---

## 9. Goals Page

- [ ] Current goals display correctly
- [ ] All 5 macro fields editable
- [ ] Save updates database
- [ ] Changes reflected on Home page macro rings immediately

---

## 10. Settings / More

- [ ] Account email displayed correctly
- [ ] Dark mode toggle switches theme
- [ ] Dark mode preference persists after page refresh
- [ ] Dark mode preference syncs across devices (DB-backed)
- [ ] Sign out works

---

## 11. Dark Mode

Run through these screens in both light and dark mode:
- [ ] Login page
- [ ] Invite Only blocked screen
- [ ] Onboarding Goals page
- [ ] Home page
- [ ] Log Meal page (no photo, with photo, analyzing, no-food card, error card)
- [ ] Confirm Meal page
- [ ] History page
- [ ] Goals page
- [ ] Settings page

---

## 12. PWA / Mobile

- [ ] App is installable (Add to Home Screen prompt appears on mobile)
- [ ] Installed app opens in standalone mode (no browser chrome)
- [ ] App icon displays correctly on home screen
- [ ] Safe area insets work on notched iPhones (no content behind notch/home bar)
- [ ] No pull-to-refresh or scroll bounce on iOS
- [ ] Camera capture works from installed PWA on iOS Safari
- [ ] Camera capture works from installed PWA on Android Chrome

---

## 13. Navigation & Routing

- [ ] Bottom nav tabs all navigate correctly
- [ ] Active tab highlighted correctly on each page
- [ ] Direct URL to deep link (e.g. `/dashboard/history`) works on GitHub Pages (SPA routing)
- [ ] Page scroll resets to top when navigating between tabs (QOL-5)
- [ ] Back button behaves correctly (no login → dashboard loops)
- [ ] Unauthenticated access to any `/dashboard/*` route redirects to `/login`

---

## 14. Performance & Edge Cases

- [ ] Large photo (12MP+) compresses and uploads without error
- [ ] Analysis completes within a reasonable time (~5–10s)
- [ ] Signed URLs for photos load correctly (not expired)
- [ ] Rapid tab switching doesn't break state
- [ ] Logging a second meal same day: totals accumulate correctly
- [ ] Logging meals across midnight: grouped to correct day
- [ ] Deleting a meal reverts correctly if server returns error

---

## 15. Build Verification

Run before declaring prod-ready:

```bash
cd pwa
npm run lint     # zero warnings
npm run build    # zero TypeScript errors
```

- [ ] `npm run lint` passes clean
- [ ] `npm run build` passes clean
- [ ] GitHub Actions deploy workflow completes successfully
- [ ] Deployed site at `https://james-dyer.github.io/macro-tracker/` loads correctly

---

## Known Limitations (Not Blocking Beta)

- **PROD-1:** Supabase built-in email (rate limited) — acceptable for small beta, blocked on PROD-2
- **PROD-2:** No custom domain yet — using GitHub Pages URL for now
- **BETA-1:** No analytics yet — low priority
- **TEST-1:** QOL-6 invite flow with real existing free account not yet verified end-to-end
