# STEP 4: VERIFICATION CHECKLIST

**Objective**: Run POST /submit, verify logs, confirm fix is complete  
**Status**: ⏳ READY FOR EXECUTION  
**Date**: August 4, 2026

---

## EXECUTION INSTRUCTIONS

### 1. Prepare Test Data

You need:
- An existing draft application (or create one via POST /api/applications)
- Application ID: `{applicationId}`
- Admin user logged in (for authentication)
- Test applicant with valid email

Example:
```
applicationId = "app-test-abc123"
admin = "admin@heloci.ngo"
applicant_email = "test-applicant@example.com"
```

### 2. Make the Request

```bash
POST /api/applications/{applicationId}/submit
Content-Type: application/json

{
  "data": {
    "housing.state": "CA",
    "housing.zipCode": "94301",
    "household.householdSize": 3,
    "personal.isVeteran": true,
    "personal.isSenior": false,
    "personal.isStudent": false,
    "housing.facingEviction": false
  }
}
```

### 3. Expected Response

**Status**: HTTP 200 (not 400!)

```json
{
  "success": true
}
```

**Database**:
- Application status: "draft" → "submitted"
- submittedAt: now set
- data: merged with new fields

---

## VERIFICATION POINTS

### ✅ HTTP Response Verification

**Expected**:
```
Status: 200 OK
Body: { "success": true }
```

**If Status 400**: Boolean conversion not working
- Check route.ts line 49-51 added correctly
- Check application-service.ts line 85-88 added correctly

### ✅ Console Logs Verification

**You should see exactly 3 log entries** (in order):

#### LOG #1: Application Service Entry Point

```
📬 [Notification] Application submitted event publishing: {
  actor: { id: "user-admin-xyz", name: "current_user" },
  application: { id: "app-test-abc123", ownerId: "user-applicant-456" },
  recipient: { 
    userId: "user-applicant-456", 
    email: "test-applicant@example.com", 
    name: "Test Applicant"
  },
  template: "application.submitted",
  organizationId: "org-heloci"
}
```

**Check**:
- [ ] `actor.id` = current logged-in user (admin)
- [ ] `application.ownerId` = application owner (applicant)
- [ ] `recipient.userId` = `application.ownerId` (SAME, not admin)
- [ ] `recipient.email` = applicant's email (NOT admin's)
- [ ] `template` = "application.submitted"

**If Missing**: Check line 250-255 in application-service.ts

---

#### LOG #2: Audience Resolver

```
🎯 [AudienceResolver] Resolving applicant for application.submitted: {
  context: {
    userId: "user-applicant-456",
    userEmail: "test-applicant@example.com",
    recipientId: undefined,
    recipientEmail: "test-applicant@example.com"
  },
  resolved: {
    recipientType: "user",
    recipientUserId: "user-applicant-456",
    recipientEmail: "test-applicant@example.com"
  }
}
```

**Check**:
- [ ] `context.userId` = applicant ID (from event)
- [ ] `context.userEmail` = applicant email
- [ ] `resolved.recipientType` = "user"
- [ ] `resolved.recipientUserId` = applicant ID (CONSISTENT)
- [ ] `resolved.recipientEmail` = applicant email (CONSISTENT)

**If Missing**: Check audience-resolver.ts lines after resolveApplicant() definition

---

#### LOG #3: Dispatcher

```
📤 [Dispatcher] Creating dispatch request: {
  event: "application.submitted",
  template: "application_submitted_email",
  audience: "applicant",
  channel: "email",
  recipient: {
    id: undefined,
    metadata: { source: "template-resolution" }
  }
}
```

**Check**:
- [ ] `event` = "application.submitted"
- [ ] `template` = "application_submitted_email" (or similar)
- [ ] `audience` = "applicant"
- [ ] `channel` = "email"
- [ ] Dispatch request created for correct audience

**If Missing**: Check dispatcher.ts lines 20-36 (dispatch method)

---

## EVIDENCE OF CORRECT FIX

If you see ALL THREE logs with the checks above passing:

✅ **Boolean conversion is working**
- HTTP 200 proves validation passed
- Booleans were converted to strings

✅ **Recipient routing is correct**
- LOG #1: Event has applicant's email (not admin's)
- LOG #2: Resolver maps event to applicant recipient
- LOG #3: Dispatch sends to applicant audience

✅ **No further code changes needed**
- Logs prove the fix is correct
- Issues are resolved

---

## TROUBLESHOOTING

### If Status 400 (Validation Error)

**Cause**: Boolean conversion not applied

**Debug**:
1. Check that route.ts has the `typeof value === 'boolean'` block
2. Check that application-service.ts has matching boolean conversion
3. Add debug log before validation to see what types are being sent

**Note**: Do NOT change input.userId back to application.userId. The recipient fix must stay.

### If Status 200 but wrong recipient in logs

**Check**:
- [ ] Line 237 in application-service.ts: `where: { id: application.userId }` (not `input.userId`)
- [ ] Line 257 in application-service.ts: `userId: application.userId` (not `input.userId`)

If these are correct but logs still show wrong recipient:
- Check database: is `application.userId` the applicant or admin?
- Check that application was created with correct owner

### If Logs Not Appearing

**Check environment**:
- These logs use `console.log()` (always visible, not debug)
- Should appear in:
  - Local dev: terminal/IDE console
  - Production: CloudWatch/logging service
  - Docker: container logs

**If still not appearing**:
- Check that files were saved correctly
- Restart development server
- Check that POST endpoint is being called

---

## WHAT HAPPENS AFTER VERIFICATION

### If All Checks Pass ✅

1. Applicant receives welcome email
   - Check applicant's email inbox
   - Email subject: "Application Submitted"
   - Email body contains confirmation

2. Admin receives org_admin notification (if configured)
   - Depends on audience configuration
   - Separate from applicant notification

3. Notification logs recorded
   - Check `NotificationLog` table
   - Should show applicant's email as recipient

### If Any Check Fails ❌

1. Do NOT apply additional fixes
2. Document which logs were missing/wrong
3. Use the logs to identify root cause
4. See "Troubleshooting" section above

---

## NEXT STEPS AFTER STEP 4

**If verification passes**:
- ✅ Issue is FIXED
- ✅ No further code changes needed
- ✅ Ready to deploy

**If verification reveals issues**:
- Follow "Troubleshooting" above
- Use logs to confirm actual root cause
- May need to trace deeper into notification system

---

## QUICK REFERENCE: Expected Logs

Copy and search your logs for these patterns:

```
// SEARCH 1: Boolean conversion worked
"success": true

// SEARCH 2: Event publishing worked
📬 [Notification] Application submitted event publishing

// SEARCH 3: Resolver worked
🎯 [AudienceResolver] Resolving applicant

// SEARCH 4: Dispatcher worked
📤 [Dispatcher] Creating dispatch request
```

All 4 should appear in the logs = Fix is complete ✅

---

## SUMMARY

**Steps 1-3**: ✅ Complete  
**Step 4**: ⏳ Ready to execute

**What to do now**:
1. Find or create a test application
2. Call POST /api/applications/{id}/submit with test data
3. Check for HTTP 200 response
4. Search logs for the 3 instrumentation points
5. Verify each log shows correct recipient (applicant, not admin)
6. If all checks pass, issue is FIXED

**Time needed**: ~5 minutes for full verification
