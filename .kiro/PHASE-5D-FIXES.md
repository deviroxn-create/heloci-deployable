# PHASE 5D — RUNTIME FIXES APPLIED

**Status**: ✅ TWO CRITICAL FIXES APPLIED
**Date**: July 30, 2026
**Scope**: 2 files, 4 modifications, ~20 lines total

---

## FIX #1: CommunicationPlanner Event Routing ✅ APPLIED

### Problem
`user_login` events falling through to `buildUserRegistrationPlans()` function, which hardcoded `event="user_registration"` instead of `event="user_login"`.

### File
`lib/notifications/runtime/communication-planner.ts`

### Changes

**Before** (Lines 51-53):
```typescript
case "user_registration":
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
```

**After** (Lines 52-54):
```typescript
case "user_registration":
  return sortedAudiences.flatMap((audience) => this.buildUserRegistrationPlans(audience));
case "user_login":
  return sortedAudiences.flatMap((audience) => this.buildUserLoginPlans(audience));
```

**New Function Added** (Lines 188-196):
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

### Result
user_login events now create plans with `event="user_login"` instead of `event="user_registration"`.

---

## FIX #2: TemplateResolver Event Mapping ✅ APPLIED

### Problem
`user_login` events falling through to case returning `"user-registration"` template key instead of `"user-login"`.

### File
`lib/notifications/runtime/template-resolver.ts`

### Changes

**Before** (Lines 79-84):
```typescript
case "user_registration":
case "user_login":
  return "user-registration";
```

**After** (Lines 79-84):
```typescript
case "user_registration":
  return "user-registration";
case "user_login":
  return "user-login";
```

### Result
- user_registration events load `applicant.user-registration.email` + `admin.user-registration.telegram`
- user_login events load `applicant.user-login.email` + `admin.user-login.telegram`

---

## VERIFICATION CHECKLIST

After restarting dev server:

### Runtime Trace Verification

Expected logs for user_login event:

```
✅ [Notification] notify called event=user_login
✅ [Dispatcher] dispatch event=user_login templateKey=applicant.user-login.email
✅ [Dispatcher] dispatch event=user_login templateKey=admin.user-login.telegram
```

NOT:
```
❌ [Dispatcher] dispatch event=user_registration templateKey=applicant.user-registration.email
```

### Email Content Verification

Applicant should receive:
- **Subject**: Login confirmation (not "Welcome")
- **Body**: Login message (not "Your account has been created")

### Telegram Message Verification

Admin should receive:
- Login notification (not registration notification)

---

## INVESTIGATION: Problem #3 (Telegram Duplication)

### Finding

Traced complete runtime execution for user_registration event:

✅ AudienceResolver: Returns [applicant, org_admin] recipients
✅ RuntimeOrchestrator adaptation: Converts to [applicant, organization_admin] audiences
✅ CommunicationPlanner: Creates 2 plans (applicant→email, org_admin→telegram)
✅ TemplateResolver: Creates 2 resolutions with correct templateKeys
✅ Dispatcher: Creates 2 DispatchRequests with correct audience roles

**Verdict**: No duplication found in RuntimeOrchestrator.

### Hypothesis

The duplicate `organization_admin → telegram` dispatch is likely coming from either:
1. NotificationService.routeEventThroughRuntime() creating additional dispatches
2. Another event listener creating additional notifications
3. Database-level issue during persistence

### Recommendation

After restarting dev server, check:

```sql
SELECT 
  eventName, 
  audienceRole, 
  channel, 
  COUNT(*) as count
FROM NotificationLog 
WHERE eventName = 'user_registration' 
GROUP BY eventName, audienceRole, channel;

-- If still showing duplicates:
-- SELECT * FROM NotificationLog WHERE eventName = 'user_registration' ORDER BY createdAt DESC LIMIT 10;
```

If duplicates persist, investigate NotificationService.routeEventThroughRuntime() for secondary dispatch.

---

## CODE CHANGES SUMMARY

| File | Changes | Lines | Status |
|------|---------|-------|--------|
| communication-planner.ts | Separate cases + new function | +2, +9 | ✅ Applied |
| template-resolver.ts | Separate cases | +1 | ✅ Applied |
| **Total** | **2 files, 2 functions** | **+12 lines** | **✅ Done** |

---

## IMPACT

### Events Fixed
- ✅ user_login: Now dispatches correct templates
- ✅ user_registration: Still works correctly

### Events Unaffected
- ✅ application_submitted, application_approved, etc. (other handlers correct)
- ✅ documents_requested, document_approved, etc. (other handlers correct)
- ✅ staff_invited, staff_role_changed, etc. (other handlers correct)

### Workflows Fixed
- Workflow #2: User Login - will now dispatch login templates
- Workflow #3: Password Reset - if affected by same pattern (needs verification after restart)

---

## NEXT STEPS

### Immediate (Before Dev Server Restart)

- [x] Fix #1 applied to communication-planner.ts
- [x] Fix #2 applied to template-resolver.ts
- [ ] Restart dev server: `npm run dev`

### After Dev Server Restart

1. **Test Workflow #1** (User Registration):
   - Verify registration templates still dispatch correctly
   - Check server logs for `event=user_registration`
   - Confirm applicant email shows registration content

2. **Test Workflow #2** (User Login):
   - Verify login templates dispatch correctly
   - Check server logs for `event=user_login` (not `event=user_registration`)
   - Confirm applicant email shows login content
   - Confirm admin telegram shows login alert (not registration alert)

3. **Investigate Problem #3** (if needed):
   - Run SQL query to check for duplicate dispatches
   - If duplicates found, trace NotificationService.routeEventThroughRuntime()

4. **Resume Phase 5D Testing**:
   - After verification, continue testing remaining 21 workflows

---

## DEPLOYMENT CHECKLIST

- [ ] Verify code changes applied
- [ ] Restart dev server
- [ ] Test Workflow #1 (User Registration)
- [ ] Test Workflow #2 (User Login)
- [ ] Check for remaining issues
- [ ] Update Phase 5D status
- [ ] Continue testing remaining workflows

---

## ROLLBACK (if needed)

Both changes are isolated and easily reversible:

**Revert Fix #1**:
```
Restore communication-planner.ts lines 51-54
Add back fall-through case
Remove buildUserLoginPlans() function
```

**Revert Fix #2**:
```
Restore template-resolver.ts lines 79-84
Change back to fall-through case with "user-registration" return
```

**Estimated rollback time**: 2 minutes

---

## SUMMARY

✅ **Two critical runtime bugs fixed**

1. CommunicationPlanner now routes user_login to correct handler
2. TemplateResolver now maps user_login to correct template key
3. Both fixes minimal and isolated
4. No architecture changes required
5. Ready for testing

**Status**: Ready to restart dev server and continue Phase 5D testing

---

*Fixes Applied: July 30, 2026*
*Status: Ready for Verification Testing*

