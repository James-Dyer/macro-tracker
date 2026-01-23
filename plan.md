# Plan: Authentication Flow & Protected Routes

## Context

The MacroTracker MVP has database integration and data hooks working, but there's no authentication UI and routes are unprotected. Users must manually authenticate via console or Supabase Dashboard.

**Current State (before beginning implementation):**
- ✅ Supabase client properly configured with modern publishable keys
- ✅ `useSession` hook exists (`pwa/src/hooks/useSession.ts`) but is **not used anywhere**
- ✅ Data hooks (useMeals, useGoals) check auth via `supabase.auth.getUser()` but throw errors
- ✅ Edge Functions: `save-meal` validates JWT, `analyze-meal` only checks header presence
- ❌ **No login/signup pages**
- ❌ **No route guards** - all routes accessible without auth
- ❌ **No auth context** - each component makes independent auth calls

## Implementation Plan

### Phase 1: Core Auth Infrastructure

#### 1.1 Create AuthContext Provider

**File:** `pwa/src/contexts/AuthContext.tsx` (new file)

Create a React Context that wraps the existing `useSession` hook to provide global auth state.

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useSession } from '../hooks/useSession';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  const value = {
    session,
    user: session?.user ?? null,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Why:** Provides centralized auth state without duplicating the existing `useSession` logic. Components access auth via `useAuth()` hook.

---

#### 1.2 Create ProtectedRoute Component

**File:** `pwa/src/components/auth/ProtectedRoute.tsx` (new file, create directory)

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Typography } from '../ui';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <Typography variant="body" color="secondary">
            Loading...
          </Typography>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Why:** Declarative route protection. Shows loading state during auth check, redirects to login if unauthenticated, renders nested routes if authenticated.

---

#### 1.3 Update App Router Structure

**File:** `pwa/src/App.tsx`

**Current structure:**
```typescript
<BrowserRouter>
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/log" element={<LogMealPage />} />
      // ... other routes
    </Route>
  </Routes>
</BrowserRouter>
```

**New structure:**
```typescript
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/log" element={<LogMealPage />} />
          <Route path="/confirm" element={<ConfirmMealPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

**Changes:**
1. Wrap entire app in `<AuthProvider>`
2. Add `/login` route (public)
3. Nest all existing routes under `<ProtectedRoute>`
4. Add catch-all redirect

---

### Phase 2: Login/Signup Page

#### 2.1 Create Unified Auth Page

**File:** `pwa/src/pages/LoginPage.tsx` (new file)

Unified page with tabs for login/signup (modern UX pattern, space-efficient).

**Key features:**
- Tab switcher for Login vs Sign Up modes
- Email + password inputs
- Error and success message displays
- Loading states during submission
- Form validation (email format, 6-char password minimum)
- Gradient background to differentiate from main app
- Matches existing design system (Tailwind v4, DM Sans, animations)

**Auth flow:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      setMessage('Check your email to confirm your account!');
      setMode('login'); // Switch to login tab after signup
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      navigate('/', { replace: true });
    }
  } catch (err: any) {
    setError(err.message || 'Authentication failed');
  } finally {
    setLoading(false);
  }
};
```

**Email confirmation handling:**
```typescript
useEffect(() => {
  // Handle redirect from email confirmation link
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/', { replace: true });
    }
  };
  handleAuthCallback();
}, [navigate]);
```

**UI Structure:**
```
┌─────────────────────────────────────┐
│       🥗 MacroTracker               │
│   Track your nutrition with AI      │
├─────────────────────────────────────┤
│  ┌─────────┬─────────┐             │
│  │ Log In  │ Sign Up │ ← Tabs      │
│  └─────────┴─────────┘             │
│                                     │
│  Email                              │
│  ┌───────────────────────────────┐ │
│  │ your@email.com                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Password                           │
│  ┌───────────────────────────────┐ │
│  │ ••••••••                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Log In / Create Account     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### Phase 3: Update Existing Components

#### 3.1 Fix Data Hooks Auth Handling

**Files:** `pwa/src/hooks/useMeals.ts` and `pwa/src/hooks/useGoals.ts`

**Current issue (line 53 in useMeals):**
```typescript
if (!user) {
  throw new Error("Not authenticated");
}
```

**Problem:** Throws error instead of gracefully handling. Since `ProtectedRoute` prevents unauthenticated access, this is now defensive code.

**Fix:**
```typescript
if (!user) {
  // Route guard handles this, but be defensive
  setMeals([]);
  setLoading(false);
  return;
}
```

Apply same pattern to `useGoals.ts`.

---

#### 3.2 Update SettingsPage Sign Out

**File:** `pwa/src/pages/SettingsPage.tsx` (lines 63-70)

**Current:**
```typescript
const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    window.location.reload(); // ❌ Causes full page reload
  } catch (err) {
    console.error('Failed to sign out:', err);
  }
};
```

**Updated:**
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    navigate('/login', { replace: true }); // ✅ Clean navigation
  } catch (err) {
    console.error('Failed to sign out:', err);
    alert('Failed to sign out. Please try again.');
  }
};
```

---

### Phase 4: Edge Function Security

#### 4.1 Improve analyze-meal JWT Validation

**File:** `supabase/functions/analyze-meal/index.ts` (lines 50-60)

**Current issue:** Only checks for Authorization header presence, doesn't validate JWT.

**Current code:**
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401 });
}
// ❌ Continues without validating JWT
```

**Fixed code (mirror save-meal pattern):**
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: "Missing authorization header" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
  );
}

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  { global: { headers: { Authorization: authHeader } } }
);

// ✅ Validate JWT by extracting user
const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

if (userError || !user) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
  );
}

// Continue with existing logic...
```

**Why:** Ensures only valid, authenticated users can analyze photos. Prevents unauthorized API usage.

---

## Files Summary

### New Files (3)
1. `pwa/src/contexts/AuthContext.tsx` - Global auth state provider
2. `pwa/src/components/auth/ProtectedRoute.tsx` - Route guard component
3. `pwa/src/pages/LoginPage.tsx` - Login/signup UI

### Modified Files (5)
1. `pwa/src/App.tsx` - Add AuthProvider, ProtectedRoute, /login route
2. `pwa/src/hooks/useMeals.ts` - Remove error throw, return early instead
3. `pwa/src/hooks/useGoals.ts` - Remove error throw, return early instead
4. `pwa/src/pages/SettingsPage.tsx` - Navigate to /login on sign out
5. `supabase/functions/analyze-meal/index.ts` - Add JWT validation

---

## Migration Strategy (Non-Breaking Incremental Deployment)

### Step 1: Infrastructure (No breaking changes)
1. Create `AuthContext.tsx`
2. Create `ProtectedRoute.tsx`
3. Wrap App in `AuthProvider` (doesn't affect existing functionality)

### Step 2: Auth UI (No breaking changes)
4. Create `LoginPage.tsx`
5. Add `/login` route to App.tsx (public route, no guards yet)

### Step 3: Enable Protection (Breaking - requires auth)
6. Wrap existing routes in `ProtectedRoute`
7. Test unauthenticated redirect to `/login`

### Step 4: Cleanup
8. Update data hooks to return early instead of throwing
9. Update SettingsPage sign out navigation
10. Update `analyze-meal` JWT validation

**Benefit:** Can test auth flow before enforcing route protection.

---

## Verification Plan

### 1. Route Protection Tests

**Unauthenticated user:**
- [ ] Visiting `/` redirects to `/login`
- [ ] Visiting `/log` redirects to `/login`
- [ ] Visiting `/history` redirects to `/login`
- [ ] Visiting `/settings` redirects to `/login`
- [ ] Can access `/login` without issues

**Authenticated user:**
- [ ] Can access all protected routes (/, /log, /confirm, /history, /settings)
- [ ] Bottom navigation works correctly
- [ ] Back button after login doesn't return to login page

### 2. Authentication Flow Tests

**Sign Up:**
- [ ] Valid email + password shows "Check your email" message
- [ ] Invalid email shows error
- [ ] Password < 6 chars shows error
- [ ] Existing email shows "User already registered" error
- [ ] Switches to Login tab after successful signup

**Log In:**
- [ ] Correct credentials redirects to HomePage
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Loading spinner shows during submission

**Email Confirmation:**
- [ ] Clicking confirmation link in email redirects to app
- [ ] Confirmed user can log in successfully

**Session Persistence:**
- [ ] Refreshing page maintains logged-in state
- [ ] Closing and reopening tab maintains session
- [ ] Session persists across browser restarts

**Sign Out:**
- [ ] Sign out button in SettingsPage works
- [ ] Redirects to `/login` after sign out
- [ ] Cannot access protected routes after sign out

### 3. Data Fetching Tests

**Authenticated user:**
- [ ] HomePage loads meals correctly
- [ ] HistoryPage shows meal history
- [ ] SettingsPage displays user email
- [ ] LogMealPage can capture and analyze photos
- [ ] ConfirmMealPage can save meals

**Unauthenticated user:**
- [ ] Data hooks return empty state (not errors)
- [ ] No console errors from data fetching

### 4. Edge Function Security Tests

**analyze-meal function:**
- [ ] Rejects requests without Authorization header (401)
- [ ] Rejects requests with invalid JWT (403)
- [ ] Accepts requests with valid JWT
- [ ] Returns proper AI analysis for authenticated users

**save-meal function:**
- [ ] Rejects requests without Authorization header (401)
- [ ] Rejects requests with invalid JWT (403)
- [ ] Accepts requests with valid JWT
- [ ] Saves meals associated with correct user_id

### 5. Edge Case Tests

**Network issues:**
- [ ] Login with network failure shows error
- [ ] Retry after network restored works

**Auth state changes:**
- [ ] Session expiry redirects to login
- [ ] Token refresh happens automatically (Supabase handles this)

**Multiple tabs:**
- [ ] Logging in on one tab updates other tabs
- [ ] Logging out on one tab updates other tabs

**Navigation edge cases:**
- [ ] Rapid clicking during auth doesn't break app
- [ ] Direct URL access to /confirm works when logged in

---

## Technical Details

### Auth State Management

**Session Persistence:**
- Supabase stores session in localStorage automatically
- `useSession` hook initializes from localStorage on mount
- `onAuthStateChange` listener updates state on auth events

**Token Refresh:**
- Supabase auto-refreshes tokens before expiry
- `onAuthStateChange` fires when tokens refresh
- No manual refresh logic needed

**Multi-tab Sync:**
- `onAuthStateChange` listener fires across tabs
- Auth state stays synchronized automatically

### Security Considerations

**JWT Storage:**
- Tokens stored in localStorage (standard for SPAs)
- HttpOnly cookies would require server-side rendering

**XSS Protection:**
- React escapes all outputs by default
- No innerHTML or dangerouslySetInnerHTML used

**CSRF Protection:**
- Supabase API uses token-based auth (no cookies)
- CORS headers properly configured in Edge Functions

**RLS Policies:**
- All database tables have RLS enabled
- Policies check `auth.uid() = user_id`
- Edge Functions inherit user context from JWT

### Performance

**Initial Load:**
- `useSession` checks localStorage (synchronous)
- Auth check completes in < 50ms

**Route Navigation:**
- `ProtectedRoute` uses existing session state (no API call)
- No loading spinner on navigation (already loaded)

**Auth State Updates:**
- Context provider prevents unnecessary re-renders
- Only components using `useAuth()` re-render on auth changes

---

## Design Patterns

### Matches Existing Architecture

1. **Component Structure:** LoginPage follows same pattern as other pages
2. **Styling:** Uses existing Tailwind v4 theme, design tokens, UI components
3. **Animations:** Uses `animate-scale-in`, `animate-fade-in` from index.css
4. **Error Handling:** Matches pattern from LogMealPage (Card with error message)
5. **Loading States:** Matches HomePage loading spinner
6. **Type Safety:** Full TypeScript coverage

### React Best Practices

1. **Hooks:** Custom `useAuth()` hook for clean API
2. **Context:** Single source of truth for auth state
3. **Composition:** `ProtectedRoute` wraps routes declaratively
4. **Effects:** Cleanup subscriptions in useEffect returns
5. **Error Boundaries:** Could add in future for better error handling

---

## Future Enhancements (Out of Scope)

- Magic link authentication (passwordless)
- Social auth (Google, Apple, GitHub)
- Password reset flow
- Email change flow
- Profile picture upload
- Multi-factor authentication (MFA)
- Remember me checkbox
- Session timeout warnings

---

## Success Criteria

After implementation:
- ✅ No unauthenticated access to protected routes
- ✅ Smooth login/signup UX with clear feedback
- ✅ Session persists across page refreshes
- ✅ Edge Functions validate JWTs properly
- ✅ Sign out redirects to login
- ✅ No console errors during auth flows
- ✅ Multi-tab auth state stays synchronized
- ✅ Fast auth checks (< 100ms on repeat visits)

---

## Critical Implementation Order

1. **AuthContext** (foundation)
2. **ProtectedRoute** (route guard)
3. **LoginPage** (user-facing UI)
4. **App.tsx updates** (integrate components)
5. **Data hooks fixes** (remove error throws)
6. **Edge Function security** (JWT validation)

This order ensures each step builds on the previous without breaking existing functionality.
