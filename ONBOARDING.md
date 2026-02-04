# MacroTracker v1 Onboarding Flow  
**Positioning:** AI-powered macro tracking from a single meal photo  
**Core promise:** Snap a photo → see your macros  
**Note:** Scale support remains internal and invisible to users in v1

---

## Onboarding goals
- Get users to their **first successful meal log as fast as possible**
- Require **macro goals** with minimal friction
- Establish trust in AI results without over-explaining
- Keep all steps skippable except goals

---

## High-level principles
- Camera-first experience
- Minimal education, maximum action
- One required decision (daily macro goals)
- Everything editable later
- No mention of scales, OCR, or hardware

---

## Step-by-step onboarding flow

### 1. Account creation
**Screen:** Create account  
**Inputs**
- Email
- Password

**Copy (example)**
- Headline: TODO
- Subtext: TODO

**Behavior**
- On success, route directly into onboarding (not Home)
- NOTE: new users may have to confirm thier email first so we may have to take this into account for direct onboarding routing.
- maybe some safeguard logic that still gets the user to onboard even if they close the tab and reopens another instance. 

---

### 2. Set macro goals (required)
**Screen:** Set your daily macros  
This is the only mandatory onboarding step.

**Modes**
- **Recommended (default)**
  - Goal: lose / maintain / gain
  - Activity level: low / medium / high
  - Optional protein bias slider
  - System calculates calories + macros (will need to look up the formula(s))
- **Manual**
  - Calories
  - Protein
  - Carbs
  - Fat
  - Fiber (optional)

**UX notes**
- Single screen
- Live-updating macro bars
- Copy: *You can change this anytime*

**Persistence**
- Save to `daily_goal`

---

### 3. How it works (optional, skippable)
**Screen:** How it works  
Single-card explanation, no scrolling.

**Content**
- Take a photo of your meal
- AI identifies foods and estimates portions
- Review and adjust before saving

**CTAs**
- Primary: Try it
- Secondary: Skip

---

### 5. First meal log (guided action)
**Screen:** Log your first meal  

**Primary CTA**
- Take a photo

**Secondary CTA**
- Upload a photo

**Microcopy**
- *Works with plates, bowls, takeout, and home cooking*

Routes into existing `LogMealPage`.

---

### 6. Confirm meal (trust-building moment)
**Screen:** ConfirmMealPage (existing)

**Key emphasis**
- Editing is obvious and encouraged
- Tap-to-edit food items and portions
- Neutral, confident copy (no defensive accuracy language)

This screen is where user trust is established.

---

### 7. Success → Home
**Screen:** Meal saved

**Content**
- Today’s macro progress partially filled
- Reinforcement copy: *Logged in seconds*

Onboarding is now complete.

---

## Routing suggestion
```txt
/login
/onboarding/goals        (required)
/onboarding/how-it-works (optional)
/onboarding/camera       (optional)
/log                     (first meal)
/home
