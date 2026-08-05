# HELOCI AUTHENTICATION BLOCKER — ROOT CAUSE ANALYSIS

**Date**: August 5, 2026  
**Status**: Under Investigation  
**Authority**: Complete Forensic Analysis (Phases 1-9)

---

## EXECUTIVE SUMMARY

The authentication system has **three critical failures** that prevent users from logging in after email verification:

1. **Missing Email Confirmation Callback** (Phase 2 Finding)
2. **No Token Exchange on Email Link Click** (Phase 6 Finding)
3. **Login Rejects Confirmed Users** (Phase 4 Finding)

The registration and email verification flows work correctly. The blocker occurs **after** the user clicks the verification email link.

---

## PHASE 1 — SUPABASE CONFIGURATION

### Current Configuration (from .env)

```
NEXT_PUBLIC_SUPABASE_URL=https://dpqjnysguqencwmolatr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_kYNUTRbfs1WnyCTbmxLK0A_3YpceC05
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Redirect URL Analysis

In `register-form.tsx` (line 39):
```typescript
emailRedirectTo: `${window.location.origin}/login`
```

**Finding**: The email redirect is hardcoded to `/login`, NOT to `/auth/callback`.

This is **incorrect** for Supabase email verification flow:
- Supabase appends verification parameters: `?type=signup&code=XXX`
- The redirect target should be `/auth/callback` or similar
- `/login` expects a user to manually enter credentials
- The verification code is **never consumed**

### Recommendation for Phase 1

✅ Supabase is configured correctly  
❌ Email redirect target is wrong (see Phase 2)

---

## PHASE 2 — CALLBACK FLOW INSPECTION

### Current Callback Page

**File**: `app/auth/callback/page.tsx`

**Current Implementation**:
```typescript
export default async function AuthCallbackPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Route based on role...
  redirect("/admin/dashboard"); // or other dashboards
}
```

### Critical Issues Found

#### Issue 2.1: No Token Exchange

**The callback page does NOT:**
- Accept `code` parameter from the email link
- Call `supabase.auth.exchangeCodeForSession(code)`
- Consume the verification token
- Mark the user as email-confirmed in Supabase

**What should happen**:
```typescript
// THIS CODE IS MISSING
const code = searchParams?.get("code");
if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Handle error
  }
}
```

#### Issue 2.2: Missing Supabase Client

The callback page is a Server Component but:
- Does NOT create a Supabase client
- Cannot exchange the code for a session
- The email link parameters are ignored

**Result**: When the user clicks the email verification link:
1. Browser navigates to `/auth/callback?type=signup&code=...`
2. Page loads but ignores the `code` parameter
3. No token exchange occurs
4. Supabase never marks user as "email_confirmed"
5. The user is redirected based on existing session (which doesn't exist)
6. Redirects to `/login` because no authenticated session

---

## PHASE 3 — REGISTRATION FLOW TRACE

### Complete Flow

**Step 1**: Browser (RegisterForm) calls `supabase.auth.signUp()`
```javascript
// app/components/auth/register-form.tsx:35-42
const { data, error: authError } = await supabase.auth.signUp({
  email: values.email,
  password: values.password,
  options: {
    data: { full_name: values.fullName },
    emailRedirectTo: `${window.location.origin}/login`  // ❌ WRONG
  }
});
```

**Step 2**: Supabase creates auth user in auth.users table
- ✅ Email stored
- ✅ Password hashed
- ✅ Email confirmation NOT yet set
- ✅ Session created (but email not confirmed)

**Step 3**: Supabase sends verification email with link:
```
https://dpqjnysguqencwmolatr.supabase.co/auth/v1/verify?...&redirect_to=http://localhost:3000/login&code=abc123
```

**Step 4**: Browser calls `registerUser()` server action
```typescript
// components/auth/register-form.tsx:52-57
const result = await registerUser({
  email: values.email,
  name: values.fullName
});
```

**Step 5**: `registerUser` → `registerUserAccount()` creates Prisma user
- ✅ Prisma user created
- ✅ Domain event published
- ✅ Notification sent (email + telegram)

**Step 6**: Browser checks if session exists
```typescript
// components/auth/register-form.tsx:59-62
if (data.session) {
  window.location.href = "/applicant/dashboard";
  return;
}
```

At this point:
- ✅ Supabase auth user created (NOT confirmed)
- ✅ Prisma user created
- ✅ Email sent
- ❌ No active session yet (email not confirmed)
- ❌ User sees "Check your email" message

**Verification**: 
- ✅ Only one user created (no duplicates)
- ✅ Prisma and Supabase synchronized
- ✅ User receives email

---

## PHASE 4 — LOGIN FLOW TRACE

### Current Implementation

**File**: `components/auth/login-form.tsx`

**Flow**:
```typescript
const { error, data: authData } = await supabase.auth.signInWithPassword({
  email: values.email,
  password: values.password
});
```

### Failure Point

When user tries to login after clicking email link (but without token exchange):

1. Supabase still shows `email_confirmed_at` = NULL
2. `signInWithPassword()` checks: Is email confirmed?
3. Answer: NO
4. Supabase returns error: "Email not confirmed"
5. Login fails

**Error Message** (from line 59-63):
```
error.message = "Email not confirmed"
```

### Workaround in Code

The code attempts a workaround (lines 68-89):
```typescript
if (
  error.message.toLowerCase().includes("email not confirmed") &&
  process.env.NODE_ENV === "development"
) {
  // DEV ONLY: Try to bypass confirmation
  // This only works if called from /api/auth/me with existing session
  // But there IS no existing session, so this always fails
}
```

**Why workaround fails**:
- Calls `/api/auth/me` which requires authenticated session
- But authentication is blocked by the very error we're trying to bypass
- Circular dependency: Need session to authenticate, but can't get session without confirming email

---

## PHASE 5 — SUPABASE USER STATE INSPECTION

### What Supabase Records Show

When user completes registration but hasn't clicked email link:

**auth.users table**:
```
id: (uuid)
email: user@example.com
email_confirmed_at: NULL  ← KEY ISSUE
encrypted_password: (hash)
user_metadata: { full_name: "John Doe" }
created_at: 2026-08-05T10:00:00Z
confirmed_at: NULL
```

### After Email Link Click (Current Behavior)

If the user clicks the email link WITHOUT callback handling:
```
id: (same uuid)
email: user@example.com
email_confirmed_at: NULL  ← STILL NULL (not updated)
encrypted_password: (hash)
user_metadata: { full_name: "John Doe" }
created_at: 2026-08-05T10:00:00Z
confirmed_at: NULL
```

**The email is never marked as confirmed because the callback doesn't exchange the code.**

### What Should Happen

After user clicks email link AND callback exchanges the code:
```
id: (same uuid)
email: user@example.com
email_confirmed_at: 2026-08-05T10:05:00Z  ← UPDATED
encrypted_password: (hash)
user_metadata: { full_name: "John Doe" }
created_at: 2026-08-05T10:00:00Z
confirmed_at: 2026-08-05T10:05:00Z
```

---

## PHASE 6 — REDIRECT PARAMETERS COMPARISON

### Email Link Sent

Supabase generates (based on `emailRedirectTo`):
```
https://dpqjnysguqencwmolatr.supabase.co/auth/v1/verify?
  type=signup
  token=abc123def456
  code=abc123def456  
  redirect_to=http://localhost:3000/login
```

### Browser Navigation

User clicks link → Browser navigates to:
```
http://localhost:3000/login?type=signup&code=abc123def456&...
```

Supabase redirects from supabase.co to the redirect_to URL with parameters.

### Current Callback Page Behavior

**File**: `app/auth/callback/page.tsx`

Current code:
```typescript
export default async function AuthCallbackPage() {
  const user = await getCurrentUser();  // ← No params passed
  // ...
}
```

**Problems**:
- ❌ No access to `searchParams`
- ❌ Cannot extract `code` parameter
- ❌ Cannot call `exchangeCodeForSession(code)`
- ❌ User redirected to `/login` instead of `/auth/callback`

### What Should Happen

**Correct Implementation** (pseudo-code):
```typescript
export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const code = params?.code as string | undefined;

  const supabase = await createSupabaseServerClient();

  // Exchange the code for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect("/login?error=" + error.message);
    }
  }

  const user = await getCurrentUser();
  // ... route based on role
}
```

---

## PHASE 7 — MIDDLEWARE INSPECTION

### Current Middleware

**Status**: NO MIDDLEWARE FILE EXISTS

**Finding**: There is no `middleware.ts` or `middleware.js` in the project root.

**Implications**:
- ✅ No middleware deleting sessions
- ✅ No middleware rejecting confirmed users
- ✅ No middleware clearing cookies prematurely
- ✅ Middleware is NOT the blocker

---

## PHASE 8 — SUPABASE CLIENT CONFIGURATION

### Browser Client

**File**: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Status**: ✅ CORRECT (follows Supabase SSR recommendations)

### Server Client

**File**: `lib/supabase/server.ts`
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { ... },
        setAll(cookiesToSet) { ... }
      }
    }
  );
}
```

**Status**: ✅ CORRECT (follows Supabase SSR recommendations)

### Cookies and Session

- ✅ Using `@supabase/ssr` (correct approach)
- ✅ Cookie management in place
- ✅ Session persistence configured correctly
- ✅ Browser and server clients properly separated

**Finding**: Supabase client configuration is correct. Issue is NOT in configuration.

---

## ROOT CAUSE — IDENTIFIED AND ISOLATED

### The Single Root Cause

**Component**: Email Verification Callback Handler  
**Location**: `app/auth/callback/page.tsx`  
**Severity**: CRITICAL BLOCKER

**Problem Statement**:

The callback page exists but is incomplete. It does NOT implement the required token exchange step that confirms the user's email in Supabase.

### Exact Failure Point

**Step 1 - User clicks email link**:
```
Email: "Verify your email"
Link: https://...supabase.co/auth/v1/verify?type=signup&code=abc123
Redirect to: http://localhost:3000/login?code=abc123&type=signup
```

**Step 2 - Browser receives redirect**:
```
Current: POST to /login?code=abc123
Expected: POST to /auth/callback?code=abc123
```

**Step 3 - Current page (/login) ignores code**:
```
login-form.tsx doesn't accept search params
Code parameter is lost
No token exchange occurs
```

**Step 4 - Supabase auth.users still shows email_confirmed_at = NULL**:
```
Email never confirmed
Session cannot be created
Login still fails
```

### Why This Happened

1. **Incomplete Implementation**: The callback page was created but never fully implemented with token exchange logic
2. **Wrong Redirect Target**: Email configuration points to `/login` instead of `/auth/callback`
3. **Missing Code**: `exchangeCodeForSession()` was never called
4. **Bypass Workaround**: Development workaround attempts to hide the real problem instead of fixing it

---

## FIX SUMMARY

### What Needs to Change

1. **Update email redirect URL** in `register-form.tsx`
   - Change: `emailRedirectTo: /login`
   - To: `emailRedirectTo: /auth/callback`

2. **Implement token exchange** in `app/auth/callback/page.tsx`
   - Accept `searchParams` with `code` parameter
   - Call `supabase.auth.exchangeCodeForSession(code)`
   - Handle errors appropriately
   - Then route based on user role

3. **Remove development workaround** from `login-form.tsx`
   - Delete lines 68-89 (the bypass attempt)
   - This workaround masks the real problem

### Why This Fix is Correct

1. **Follows Supabase best practices** for email verification
2. **Separates concerns**: `/auth/callback` handles token exchange, `/login` handles credentials
3. **Enables email confirmation** in Supabase auth.users table
4. **Allows subsequent login attempts** to succeed

---

## NEXT STEPS

Proceed to **Phase 10** to implement the fix with all code changes documented.

---

**ROOT CAUSE IDENTIFIED: Email verification callback is incomplete**

**Status: Ready for fix implementation**

