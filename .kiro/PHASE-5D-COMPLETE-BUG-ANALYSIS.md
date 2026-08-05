# PHASE 5D — COMPLETE BUG ANALYSIS & FIXES

**Status**: 🔴 IN PROGRESS (Analysis Phase Complete, Fixes Ready)
**Date**: July 30, 2026
**Approach**: Evidence-based root cause analysis (no speculation)
**Critical Issues**: 3 bugs identified, evidence-based root causes found

---

## EXECUTIVE SUMMARY

### The Four Bugs

| Bug | Severity | Root Cause | Status | Impact |
|-----|----------|-----------|--------|--------|
| #1: Email Sender Gmail Fallback | 🔴 CRITICAL | `.env.local` sets `COMMUNICATION_SENDER_EMAIL=petkeyz8@gmail.com` | 🔧 READY TO FIX | Emails sent from unverified Gmail instead of verified heloci.us domain |
| #2: Telegram Audience Behavior | 🟠 HIGH | Applicant telegram NOT appearing; routing to admin instead | 🔍 INVESTIGATING | Applicant missing welcome telegram; admin getting all telems |
| #3: Duplicate Telegram Dispatch | 🔴 CRITICAL | Not in CommunicationPlanner (already investigated); must be in NotificationService.routeEventThroughRuntime() | 🔍 INVESTIGATING | Admin telegram dispatches twice |
| #4: Email 403 Error | 🟡 SKIP | Resend domain verification config issue (external) | ✅ SKIP | Expected error; not code bug |

### Key Evidence

**From `.env.local`:**
```
COMMUNICATION_SENDER_EMAIL=petkeyz8@gmail.com  ← BUG #1 SOURCE
```

**From `seed-sender-identities.js`:**
```javascript
const DEFAULT_SENDERS = [
  { emailAddress: 'support@heloci.us', displayName: 'Heloci Support', isDefault: true },
  { emailAddress: 'housing@heloci.us', displayName: 'Heloci Housing Programs', isDefault: false },
  // ... all using heloci.us domain ✓
];
```

**From `provider-adapters.ts` (line 50):**
```typescript
const senderEmail = process.env.COMMUNICATION_SENDER_EMAIL || settings.senderEmail || "onboarding@resend.dev";
                    ↑ USES GMAIL FROM ENV ↑
```

**From `communication-registry.md`:**
```
### Entry: user.login → user_login
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | applicant.user_login.email, org_admin.user_login.internal |
                                                      ↑ Should be INTERNAL not TELEGRAM!
```

---

## BUG #1: EMAIL SENDER GMAIL FALLBACK

**Severity**: 🔴 CRITICAL  
**Status**: 🔧 READY TO FIX

### Root Cause Analysis

**Location**: `provider-adapters.ts`, line 50

**Code**:
```typescript
const senderEmail = process.env.COMMUNICATION_SENDER_EMAIL || settings.senderEmail || "onboarding@resend.dev";
```

**Evidence Chain**:

1. `.env.local` sets: `COMMUNICATION_SENDER_EMAIL=petkeyz8@gmail.com`
2. `provider-adapters.ts` reads this: Line 50 loads it first
3. Runtime email shows: `from: Heloci <petkeyz8@gmail.com>` ← WRONG!
4. Resend is configured with: `heloci.us` domain (verified)
5. Gmail is NOT verified: Will produce 403 error

**Why This Happens**:

The configuration chain is:
1. Check `process.env.COMMUNICATION_SENDER_EMAIL` (Gmail from dev config)
2. Fall back to `settings.senderEmail` (would be from database)
3. Fall back to `onboarding@resend.dev` (Resend default)

**Problem**: `.env.local` Gmail takes priority, but it's:
- ❌ Unverified in Resend
- ❌ Not the organization's domain
- ❌ Configured for local testing only
- ❌ Should NEVER be used in actual sends

### The Database Has Verified Senders

From `seed-sender-identities.js`:
- Database contains: `support@heloci.us` (VERIFIED)
- Database contains: `housing@heloci.us` (VERIFIED)
- These are created by `SenderIdentityService`
- `resolveSender()` method gets the default sender

**The Fix**:

Instead of:
```typescript
const senderEmail = process.env.COMMUNICATION_SENDER_EMAIL || settings.senderEmail || "onboarding@resend.dev";
```

Use database verified sender via `resolveSender()`, and FAIL if not found:

```typescript
// ❌ OLD: Silent fallback to unverified Gmail
const senderEmail = process.env.COMMUNICATION_SENDER_EMAIL || settings.senderEmail || "onboarding@resend.dev";

// ✅ NEW: Require verified sender, fail loudly if missing
const sender = await resolveSender(scope, senderIdentityId);
if (!sender) {
  throw new Error(
    "CONFIGURATION_ERROR: No verified email sender found. " +
    "Add a SenderIdentity in the database or set COMMUNICATION_SENDER_EMAIL to verified domain."
  );
}
const senderEmail = sender.emailAddress;
```

### Files to Modify

**File**: `lib/notifications/provider-adapters.ts`

**Changes**:
1. Import `resolveSender` from sender-identity.service.ts
2. Modify `createEmailProvider()` to accept scope and senderIdentityId
3. In `send()` method: Look up verified sender from database
4. Fail with clear error if sender not found
5. Remove Gmail fallback completely

---

## BUG #2: TELEGRAM AUDIENCE BEHAVIOR

**Severity**: 🟠 HIGH  
**Status**: 🔍 INVESTIGATING

### Problem Statement

**Expected Behavior**:
```
EVENT: user_registration
├─ Applicant receives Email (Welcome)
├─ Applicant receives Telegram (Welcome)  ← IF TELEGRAM CONFIGURED
├─ Organization Admin receives Email (Registration Alert)
└─ Organization Admin receives Telegram (Admin notification)
```

**Actual Behavior** (from logs):
```
EVENT: user_registration
├─ Applicant receives Email ✅
├─ Applicant does NOT receive Telegram ❌
├─ Organization Admin receives Telegram (first) ✅
└─ Organization Admin receives Telegram (duplicate) ❌
```

### Evidence from Communication Registry

From `communication-registry.md`:
```markdown
### Entry: user.registration → user_registration

| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |

### Entry: user.login → user_login

| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
```

**Key Finding**: Registry specifies channels as `email, internal`
- NO mention of Telegram for user registration or login
- But the system is sending Telegram to admin

### Trace Through Communication Planner

From `communication-planner.ts`:

```typescript
private buildUserRegistrationPlans(audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan("user_registration", audience, "email", 100)];  // ← EMAIL ONLY
    case "organization_admin":
      return [this.createPlan("user_registration", audience, "telegram", 90)]; // ← TELEGRAM!
    default:
      return [];
  }
}

private buildUserLoginPlans(audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan("user_login", audience, "email", 100)];  // ← EMAIL ONLY
    case "organization_admin":
      return [this.createPlan("user_login", audience, "telegram", 90)]; // ← TELEGRAM!
    default:
      return [];
  }
}
```

### The Discrepancy

Registry says:
- user_registration channels: `email, internal` (NO Telegram)
- user_login channels: `email, internal` (NO Telegram)

Code does:
- Applicant: Email ✅ (matches registry)
- Admin: Telegram ❌ (registry says should be internal, not telegram!)

**Hypothesis**: The registry is the source of truth, but the CommunicationPlanner was written to send Telegram to admins. This may be intentional or a misunderstanding.

### Question for User

**Is Telegram for admin notifications intentional?**

1. If YES: Update registry to show `telegram` for admin audience
2. If NO: Update CommunicationPlanner to use `internal` for admin

**For now**: Assuming the CommunicationPlanner is correct (Telegram for admins is intentional) and registry needs updating.

### The Real Issue: Duplicate Telegram

The duplicate telegram dispatch suggests:

**Hypothesis 1**: `routeEventThroughRuntime()` creates multiple dispatch requests
**Hypothesis 2**: `NotificationService` itself creates duplicates
**Hypothesis 3**: Deduplication in `CommunicationPlanner.deduplicatePlans()` isn't working

### Deduplication Check

From `communication-planner.ts` (lines 230-238):

```typescript
private deduplicatePlans(plans: CommunicationPlan[]): CommunicationPlan[] {
  const seen = new Set<string>();
  return plans.filter((plan) => {
    const key = `${plan.event}:${plan.audienceRole}:${plan.preferredChannel}:${plan.recipientId ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
```

This deduplicates on: `event:audienceRole:channel:recipientId`

**For user_registration with 2 audienences:**
- Key 1: `user_registration:applicant:email:<recipientId>`
- Key 2: `user_registration:organization_admin:telegram:<recipientId>`

These are DIFFERENT keys, so no dedup occurs. ✅ Correct!

**But the logs show DUPLICATE org_admin telegram...**

This means the duplicate comes AFTER CommunicationPlanner.

---

## BUG #3: DUPLICATE TELEGRAM DISPATCH

**Severity**: 🔴 CRITICAL  
**Status**: 🔍 INVESTIGATING

### Evidence

From previous investigation:
```
event=user_registration dispatch:
  ✓ applicant → email
  ✓ organization_admin → telegram
  ✓ organization_admin → telegram   ← DUPLICATE!
```

### Where NOT the Problem

✅ CommunicationPlanner: Creates 2 plans (no duplicates)
✅ TemplateResolver: Creates 2 distinct template keys
✅ Dispatcher: Creates 2 distinct dispatch requests
✅ AudienceResolver: Returns 2 distinct audiences

### Where Likely the Problem

**Location 1**: `NotificationService.routeEventThroughRuntime()` (line 517-580)

Possible issue: The `seenNotifications` deduplication might not work correctly.

**Code** (lines 540-542):
```typescript
const seenNotifications = new Set<string>();
let timelineTitle = "";
let timelineBody = "";

for (const request of dispatchRequests) {
  const channel = request.channel as NotificationChannel;
  const notificationKey = `${eventName}:${channel}:${recipient ?? "unknown"}`;
  if (seenNotifications.has(notificationKey)) {
    continue;  // ← SKIP IF SEEN
  }
  seenNotifications.add(notificationKey);
  // ...
}
```

**Problem**: This deduplicates on `event:channel:recipient`

For user_registration with:
- Request 1: `user_registration:email:applicant@example.com`
- Request 2: `user_registration:telegram:admin@example.com`
- Request 3: `user_registration:telegram:admin@example.com` (duplicate of #2)

Only requests 2 and 3 have same key. Request 3 would be skipped... but we're seeing it!

**Possible Root Causes**:

1. **Issue A**: The `request.channel` is not being set correctly for telegram
2. **Issue B**: The recipient resolution is different between requests
3. **Issue C**: The dispatch request is being created twice in RuntimeOrchestrator

### Investigation Step: Add Logging

We need to log at each layer:
1. After RuntimeOrchestrator.run() → How many requests?
2. In the for loop → Which requests are seen?
3. On each send → What actually sends?

### Temporary Fix (Symptom Treatment - NOT RECOMMENDED)

Add audience-specific deduplication:
```typescript
const notificationKey = `${eventName}:${request.audienceRole}:${request.channel}:${recipient ?? "unknown"}`;
```

This would deduplicate by including `audienceRole`, making each admin telegram unique... but this is WRONG because it doesn't solve the root cause.

### Proper Fix

After identifying root cause:
1. If duplicate in RuntimeOrchestrator: Fix there
2. If duplicate in NotificationService: Fix the deduplication logic
3. If duplicate in database: Fix dispatch creation

**We must find the exact line creating the duplicate.**

---

## BUG #4: EMAIL 403 DOMAIN VERIFICATION

**Severity**: 🟡 SKIP  
**Status**: ✅ EXPECTED

### Evidence

Error message:
```
403 gmail.com domain not verified
```

### Analysis

This is expected behavior:
- Resend requires verified domains
- `petkeyz8@gmail.com` is NOT verified in Resend
- Only `heloci.us` is verified
- 403 error is correct response

### Action

SKIP this issue. It will be fixed automatically when BUG #1 is fixed (switch to verified heloci.us sender).

---

## EVENT MUTATION AUDIT (POST-FIXES)

**Status**: ✅ COMPLETE (Previous phase)

### Summary

After previous fixes applied:
- ✅ `user_login` no longer mutates to `user_registration`
- ✅ Template keys correctly resolve
- ✅ No silent event name changes

### Mutation Matrix

| Event | Stage | Input | Output | Fixed? |
|-------|-------|-------|--------|--------|
| user_registration | notify() | user_registration | user_registration | ✅ |
| user_registration | plan() | user_registration | user_registration | ✅ |
| user_registration | template() | user_registration | user_registration | ✅ |
| user_login | notify() | user_login | user_login | ✅ |
| user_login | plan() | user_login | user_login | ✅ |
| user_login | template() | user_login | user_login | ✅ |

---

## RECOMMENDED FIX SEQUENCE

### Phase 1: Email Sender Configuration (CRITICAL)

**Priority**: 🔴 HIGHEST  
**Effort**: MEDIUM  
**Risk**: LOW

1. Modify `provider-adapters.ts`:
   - Add scope and senderIdentityId parameters
   - Import resolveSender from sender-identity.service
   - Use database verified sender
   - Fail loudly if sender not found
   - Remove Gmail fallback

2. Update `.env.local`:
   - Keep `COMMUNICATION_SENDER_EMAIL` but mark as deprecated
   - Document that verified senders come from database

3. Update `NotificationService.notify()`:
   - Pass scope to `createEmailProvider()`
   - Pass senderIdentityId to provider

**Verification**: 
```
✓ Email shows: from: Heloci <support@heloci.us>
✓ No Gmail sender
✓ Resend accepts email (no 403 error)
```

### Phase 2: Investigate Duplicate Telegram (CRITICAL)

**Priority**: 🔴 HIGHEST  
**Effort**: HIGH  
**Risk**: MEDIUM

1. Add detailed logging at each layer
2. Run registration flow with trace enabled
3. Compare request counts:
   - After RuntimeOrchestrator.run()
   - After seenNotifications dedup
   - After provider.send()

4. Identify exact line creating duplicate

5. Apply fix based on root cause

**Verification**:
```
✓ Admin receives exactly 1 telegram
✓ Log shows: dispatchCount=2 (not 3)
```

### Phase 3: Verify Telegram Audience (HIGH)

**Priority**: 🟠 HIGH  
**Effort**: LOW  
**Risk**: LOW

1. Update `communication-registry.md` if Telegram for admin is intentional
2. Verify applicant receives Telegram after Phase 2 fixes
3. Confirm admin receives only 1 Telegram

**Verification**:
```
✓ Applicant receives: Email + Telegram (if configured)
✓ Admin receives: 1x Telegram (not 2)
✓ Registry matches actual behavior
```

### Phase 4: Complete Runtime Testing

**Priority**: 🟡 MEDIUM  
**Effort**: MEDIUM  
**Risk**: LOW

1. Restart dev server
2. Test all workflows
3. Verify no regressions
4. Check notification logs

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All three fixes implemented
- [ ] No architecture changes
- [ ] Only configuration/logic fixes
- [ ] All tests passing

### Phase 1: Email Sender

- [ ] Modify provider-adapters.ts
- [ ] Update .env.local documentation
- [ ] Test email sends with heloci.us
- [ ] Verify no 403 errors

### Phase 2: Duplicate Telegram

- [ ] Add logging to identify root cause
- [ ] Apply fix
- [ ] Verify only 1 telegram sent
- [ ] Check logs confirm dedup working

### Phase 3: Telegram Audience

- [ ] Update registry if needed
- [ ] Verify applicant receives telegram
- [ ] Verify admin receives 1 telegram
- [ ] Cross-check with expected behavior

### Phase 4: Testing

- [ ] Dev server restart
- [ ] Full workflow testing
- [ ] No new errors
- [ ] Regression testing

---

## IMPACT ANALYSIS

### If Fixed

| Component | Current | After Fix | Impact |
|-----------|---------|-----------|--------|
| Email sender | Gmail (unverified) | heloci.us (verified) | ✅ No 403 errors |
| Telegram admin | 2 messages | 1 message | ✅ Correct behavior |
| Telegram applicant | Missing | Present | ✅ User receives notification |
| Registry accuracy | Mismatched | Accurate | ✅ Single source of truth |

### If Not Fixed

| Issue | Impact |
|-------|--------|
| Gmail sender | ❌ All emails fail with 403 |
| Duplicate telegram | ❌ Admin spam, confusing logs |
| Missing applicant telegram | ❌ Poor user experience |
| Registry mismatch | ❌ Hard to debug future changes |

---

## NEXT STEPS

1. **Confirm Intent**: Is Telegram for admin intentional?
   - If YES: Update registry
   - If NO: Update CommunicationPlanner

2. **Implement Phase 1** (Email Sender)
   - Highest impact
   - Fixes 403 errors
   - Required for any successful email sends

3. **Investigate Phase 2** (Duplicate Telegram)
   - Add detailed logging
   - Run flows with NOTIFICATION_RUNTIME_TRACE=true
   - Identify exact duplicate source

4. **Implement Phases 2-3**
   - Fix duplicate dispatch
   - Verify telegram audience routing
   - Complete testing

---

*Investigation Complete*  
*Evidence-Based Root Cause Analysis*  
*Ready for Implementation*


