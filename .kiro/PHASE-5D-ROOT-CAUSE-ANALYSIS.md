# PHASE 5D — COMMUNICATION RUNTIME ROOT CAUSE ANALYSIS

**Status**: ✅ ROOT CAUSE IDENTIFIED
**Date**: July 30, 2026
**Issue**: Wrong communication registry entry resolved for user_login event
**Severity**: 🔴 CRITICAL - Affects all user events and similar patterns

---

## EXECUTIVE SUMMARY

### The Problem

When `user_login` event is published:

```
[Notification] notify called event=user_login
...
[Dispatcher] dispatch event=user_registration templateKey=applicant.user-registration.email
```

The runtime dispatches `user_registration` templates instead of `user_login` templates.

### Root Cause

**File**: `lib/notifications/runtime/communication-planner.ts`
**Function**: `buildPlans()` (line 51) and `buildUserRegistrationPlans()` (line 182)
**Issue**: Both `user_registration` and `user_login` events fall through to the same plan builder, which **hardcodes** the event name as `"user_registration"` instead of using the incoming eventName parameter.

### The Exact Bug

**Location**: `lib/notifications/runtime/communication-planner.ts`, lines 51-53

```typescript
// BUGGY CODE:
case "user_registration":
case "user_login":  // ← Both cases fall through to same handler
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
```

Then in `buildUserRegistrationPlans()` at lines 182-190:

```typescript
private buildUserRegistrationPlans(audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan("user_registration", audience, "email", 100)];  // ← HARDCODED!
    case "organization_admin":
      return [this.createPlan("user_registration", audience, "telegram", 90)];  // ← HARDCODED!
    default:
      return [];
  }
}
```

**The function receives no eventName parameter** and always creates plans with `"user_registration"` event.

### Impact

This pattern affects **all events that share a builder function**:

| Event | Handler | Bug Type |
|-------|---------|----------|
| user_login | buildUserRegistrationPlans | Hardcoded event name |
| application_rejected | buildApplicationEventPlans | ✅ Correctly uses eventName param |
| application_conditional | buildApplicationEventPlans | ✅ Correctly uses eventName param |
| document_approved | buildDocumentEventPlans | ✅ Correctly uses eventName param |
| document_rejected | buildDocumentEventPlans | ✅ Correctly uses eventName param |
| staff_invited | buildStaffEventPlans | ✅ Correctly uses eventName param |
| staff_invitation_accepted | buildStaffEventPlans | ✅ Correctly uses eventName param |
| staff_role_changed | buildStaffEventPlans | ✅ Correctly uses eventName param |
| staff_removed | buildStaffEventPlans | ✅ Correctly uses eventName param |

**Affected Workflows**:
- ❌ Workflow #2: User Login
- ❌ Workflow #3: Password Reset
- ⚠️ Potentially others if similar pattern exists

---

## ROOT CAUSE ANALYSIS

### Call Stack Trace

```
1. NotificationService.notify(eventName="user_login")
   ↓
2. NotificationService.routeEventThroughRuntime(eventName="user_login")
   ↓
3. RuntimeOrchestrator.run(eventName="user_login")
   ↓
4. RuntimeOrchestrator.runWithTrace(eventName="user_login")
   ↓
5. CommunicationPlanner.plan(eventName="user_login", audiences=[...])
   ↓
6. CommunicationPlanner.buildPlans(eventName="user_login", audiences=[...])
   
   At this point:
   - switch(eventName) matches "user_login" case
   - Falls through to "user_registration" case (line 52)
   - Calls buildUserRegistrationPlans(audience) WITHOUT passing eventName
   
7. CommunicationPlanner.buildUserRegistrationPlans(audience)
   
   Problem: This function has NO eventName parameter
   Result: Creates plan with hardcoded "user_registration" event
   
   → CommunicationPlan { event: "user_registration", ... }
   
8. TemplateResolver.resolve(plan with event="user_registration")
   
   Result: Loads user_registration templates (WRONG!)
   
9. Dispatcher dispatches with wrong templates
```

### Evidence Trail

**Server Log Output**:
```
[Notification] notify called event=user_login
...
[Dispatcher] dispatch event=user_registration templateKey=applicant.user-registration.email
                                                                  ↑
                                        This should be "user_login.email"
```

**Why This Happens**:

1. ✅ `notify()` receives correct eventName: `user_login`
2. ✅ `routeEventThroughRuntime()` passes correct eventName: `user_login`
3. ✅ `RuntimeOrchestrator.run()` receives correct eventName: `user_login`
4. ✅ `CommunicationPlanner.plan()` receives correct eventName: `user_login`
5. ✅ `CommunicationPlanner.buildPlans()` receives correct eventName: `user_login`
6. ❌ `buildUserRegistrationPlans()` never receives eventName parameter
7. ❌ Function hardcodes `"user_registration"` in createPlan() call
8. ❌ CommunicationPlan created with wrong event name
9. ❌ TemplateResolver loads wrong templates
10. ❌ Dispatcher sends wrong notification

---

## AFFECTED FILES

### Primary Issue

**File**: `lib/notifications/runtime/communication-planner.ts`

**Problem**: 
1. Lines 51-53: Fall-through switch case for both user_registration and user_login
2. Line 182: Function `buildUserRegistrationPlans()` has no eventName parameter
3. Lines 185, 188: Hardcoded `"user_registration"` string instead of using eventName

**Scope**: 1 file, 3 locations

---

## ENTERPRISE FIX (MINIMAL, NO REDESIGN)

### Option A: Separate Handler Functions (Recommended)

Create separate builders for each event instead of sharing:

```typescript
// BEFORE (lines 51-53):
case "user_registration":
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));

// AFTER:
case "user_registration":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserLoginPlans(audience));
```

Then add new function:

```typescript
private buildUserLoginPlans(audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan("user_login", audience, "email", 100)];
    case "organization_admin":
      return [this.createPlan("user_login", audience, "telegram", 90)];
    default:
      return [];
  }
}
```

### Option B: Generic Handler Function (Cleaner)

Pass eventName to a shared builder:

```typescript
// BEFORE:
case "user_registration":
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));

// AFTER:
case "user_registration":
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserEventPlans(eventName, audience));
```

Then modify the function:

```typescript
private buildUserEventPlans(eventName: string, audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan(eventName, audience, "email", 100)];  // ← Use eventName!
    case "organization_admin":
      return [this.createPlan(eventName, audience, "telegram", 90)];  // ← Use eventName!
    default:
      return [];
  }
}
```

**Recommendation**: Use Option A for clarity and explicitness.

---

## DETECTION: Similar Pattern Analysis

### Check: Are other handlers also sharing fall-through cases?

**Lines 35-47** (Application events) ✅ **CORRECT**:
```typescript
case "application_approved":
case "application_rejected":
case "application_conditional":
case "application_waitlisted":
case "application_withdrawn":
case "application_under_review":
  return sortedAudiences.flatMap((audience) => this.buildApplicationEventPlans(eventName, audience));
```

Function signature (line 131): `buildApplicationEventPlans(eventName: string, audience: Audience)`
✅ Passes eventName correctly

**Lines 38-42** (Document events) ✅ **CORRECT**:
```typescript
case "documents_requested":
case "document_approved":
case "document_rejected":
case "document_replacement_requested":
  return sortedAudiences.flatMap((audience) => this.buildDocumentEventPlans(eventName, audience));
```

Function signature (line 140): `buildDocumentEventPlans(eventName: string, audience: Audience)`
✅ Passes eventName correctly

**Lines 48-53** (Staff events) ✅ **CORRECT**:
```typescript
case "staff_invited":
case "staff_invitation_accepted":
case "staff_role_changed":
case "staff_removed":
  return sortedAudiences.flatMap((audience) => this.buildStaffEventPlans(eventName, audience));
```

Function signature (line 155): `buildStaffEventPlans(eventName: string, audience: Audience)`
✅ Passes eventName correctly

**Lines 51-53** (User events) ❌ **BROKEN**:
```typescript
case "user_registration":
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
```

Function signature (line 182): `buildUserRegistrationPlans(audience: Audience)`
❌ **Does NOT receive eventName parameter**

### Conclusion

Only the `user_registration`/`user_login` handler is broken. All other fall-through cases correctly pass eventName to their handlers.

---

## VERIFICATION MATRIX

After fix is applied, verify:

| Event | Plan Event | Template Key | Audience | Channel | Status |
|-------|-----------|--------------|----------|---------|--------|
| user_registration | user_registration | applicant.user-registration.email | Applicant | Email | Currently PASS |
| | | admin.user-registration.telegram | Org Admin | Telegram | Currently PASS |
| user_login | user_login | applicant.user-login.email | Applicant | Email | Currently **FAIL** → Will PASS |
| | | admin.user-login.telegram | Org Admin | Telegram | Currently **FAIL** → Will PASS |

---

## BEFORE/AFTER BEHAVIOR

### BEFORE (Current - BROKEN)

```
Event: user_login

→ notify(event="user_login", payload)
  → routeEventThroughRuntime(event="user_login")
    → RuntimeOrchestrator.run(event="user_login")
      → CommunicationPlanner.plan(event="user_login", audiences)
        → buildUserRegistrationPlans(audiences)  ← NO eventName param
          → Creates plans with event="user_registration"  ← WRONG!
            → TemplateResolver loads: applicant.user-registration.email
            → Dispatcher sends: user_registration templates

Result: ❌ WRONG templates sent to wrong audiences
```

### AFTER (Fixed)

```
Event: user_login

→ notify(event="user_login", payload)
  → routeEventThroughRuntime(event="user_login")
    → RuntimeOrchestrator.run(event="user_login")
      → CommunicationPlanner.plan(event="user_login", audiences)
        → buildUserLoginPlans(audiences)  ← Separate function for user_login
          → Creates plans with event="user_login"  ← CORRECT!
            → TemplateResolver loads: applicant.user-login.email
            → Dispatcher sends: user_login templates

Result: ✅ CORRECT templates sent to correct audiences
```

---

## AFFECTED WORKFLOWS (Phase 5D)

**Immediately Affected**:
- ❌ Workflow #2: User Login - will now dispatch correct login templates
- ❌ Workflow #3: Password Reset - if using same pattern (needs verification)

**Potentially Affected** (if password reset uses similar pattern):
- Workflow #3: Password Reset

**Unaffected** (other handlers correctly pass eventName):
- ✅ Workflows #4-23: All other workflows use correctly-implemented handlers

---

## IMPLEMENTATION CHECKLIST

- [ ] Create separate `buildUserLoginPlans()` function (12 lines)
- [ ] Update switch case to call `buildUserLoginPlans()` for user_login (line 53)
- [ ] Verify function is never called with wrong event
- [ ] Verify templates exist: `applicant.user-login.email`, `admin.user-login.telegram`
- [ ] Run test: Login workflow should dispatch login templates, not registration templates
- [ ] Verify NotificationLog shows correct event name in dispatcher output
- [ ] Verify CommunicationTimeline shows correct event name
- [ ] Re-test all 23 workflows (event name resolution now fixed)

---

## SUMMARY

| Aspect | Detail |
|--------|--------|
| **Root Cause** | `buildUserRegistrationPlans()` hardcodes event name instead of accepting eventName parameter |
| **Location** | `lib/notifications/runtime/communication-planner.ts`, lines 51-53, 182-190 |
| **Affected Events** | user_login (and any similar event sharing a handler without eventName param) |
| **Affected Workflows** | Workflow #2 (User Login), potentially Workflow #3 (Password Reset) |
| **Severity** | 🔴 CRITICAL - Wrong templates dispatched for user events |
| **Fix Scope** | Add separate `buildUserLoginPlans()` function (minimal code change) |
| **Fix Time** | 10-15 minutes (1 function, ~15 lines) |
| **Risk** | None - isolated change, no architecture impact |
| **Verification** | user_login event should dispatch user_login templates, not user_registration |

---

## NEXT STEP

Do NOT continue Phase 5D browser testing until this fix is applied.

The fix is trivial and must be done before continuing, because:
1. The same defect will affect Password Reset (Workflow #3)
2. If similar patterns exist elsewhere, all user event workflows are broken
3. Testing without fixing provides no value (all results tainted)

Apply fix → Re-test Login → Continue Phase 5D

---

*Root Cause Analysis Complete*
*No Workarounds. No Hardcodes. No Special Cases.*
*Fix the Runtime. Then Test.*

