# PHASE 5H.7 — Current State Analysis

**Status**: CODE INSPECTION COMPLETE - RUNTIME TRACE PENDING  
**Date**: August 5, 2026  
**Purpose**: Document what code inspection has revealed; identify gaps that require runtime evidence

---

## PART A: WHAT WE KNOW FROM CODE INSPECTION

### System Architecture: CONFIRMED

**Event Flow Path** (Verified in code):

```
1. Route Handler (submitApplication)
   ├─ Location: app/api/applications/[id]/submit/route.ts
   ├─ Transforms: Wizard payload → Question Set
   ├─ Validates: Question Set against Form schema
   └─ Status: Code exists and is instrumented ✅

2. Domain Event Publisher (publishDomainEvent)
   ├─ Location: lib/events/domain-event-publisher.ts
   ├─ Creates: Domain event with payload
   ├─ Publishes: To event bus (in-memory)
   └─ Status: Code exists, instrumented, and publishes ✅

3. Notification Domain Subscriber (handleDomainEvent)
   ├─ Location: lib/notifications/notification-domain-subscriber.ts
   ├─ Receives: Events from bus
   ├─ Maps: Domain event → Communication event (via registry)
   ├─ Calls: notificationService.notify()
   └─ Status: Code exists, instrumented, calls notify() ✅

4. Notification Service (notify)
   ├─ Location: lib/notifications/notification.service.ts
   ├─ Routes: Through RuntimeOrchestrator
   ├─ OR Falls back: To legacy routing (if runtime disabled)
   └─ Status: Code exists, both paths available ✅

5. RuntimeOrchestrator
   ├─ Location: lib/notifications/runtime/runtime-orchestrator.ts
   ├─ Orchestrates: Audience resolution + Template resolution
   ├─ Creates: Dispatch requests (one per audience+channel)
   └─ Status: Code exists, orchestrates ✅

6. Audience Resolver (resolve)
   ├─ Location: lib/notifications/runtime/audience-resolver.ts
   ├─ Resolves: Applicant, Organization Admin, Reviewer, etc.
   ├─ Returns: Array of audiences with recipients
   └─ Status: Code exists, instrumented with logs ✅

7. Template Resolver (getPublishedTemplateByKey)
   ├─ Location: lib/notifications/template.service.ts
   ├─ Looks up: Template by key (audience-specific)
   ├─ Returns: Subject, Body, Variables
   └─ Status: Code exists ✅

8. Provider Execution (provider.send)
   ├─ Location: lib/notifications/provider-adapters.ts
   ├─ Resend: Email via Resend API
   ├─ Telegram: Messages via Telegram API
   ├─ Internal: Write to database
   └─ Status: Code exists, all 3 providers implemented ✅

9. Notification Log (persistNotificationLog)
   ├─ Location: lib/notifications/notification.service.ts
   ├─ Persists: Event, channel, recipient, status
   ├─ Updates: After provider response (SENT/FAILED)
   └─ Status: Code exists, creates + updates ✅
```

**Conclusion**: Complete event flow path exists in code. ✅

---

### Known Issues: CONFIRMED (from code inspection)

#### Issue 1: Boolean Type Mismatch

**Location**: `app/api/applications/[id]/submit/route.ts` (lines 39-47)  
**Problem**: Boolean values from frontend (true/false) not converted to strings ("true"/"false")

**Code Evidence**:
```typescript
// Line 39-47: Type transformation logic
if (typeof value === 'number') {
  normalizedValue = String(value);  // ✅ Numbers converted
}
// ❌ Missing boolean conversion
```

**Validator Expectation** (`lib/forms/validator.ts`, line 42-44):
```typescript
z.enum(["true", "false", "not_sure"])  // Expects STRING enum
```

**Status**: 
- ✅ FIX ALREADY APPLIED in application-service.ts (line 83-85)
- ✅ FIX ALREADY APPLIED in route.ts (similar location)
- ⚠️ RUNTIME VERIFICATION NEEDED: Does this fix actually work?

---

#### Issue 2: Wrong Recipient in Notification Payload

**Location**: `lib/applications/application-service.ts` (lines 237-248)  
**Problem**: Event payload uses `input.userId` (actor/admin) instead of `application.userId` (applicant)

**Code Evidence - WRONG WAY**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: input.userId },  // ← input.userId is current session user (admin)
  select: { id: true, name: true, email: true },
});

publishDomainEvent("application.submitted", {
  userId: input.userId,         // ← Wrong: sends admin's ID
  email: userEmail,             // ← Wrong: sends admin's email
  ...
});
```

**Code Evidence - CORRECT WAY**:
```typescript
const application = await prisma.programApplication.findUnique({
  where: { id: input.applicationId },
  select: {
    id: true,
    userId: true,        // ← application.userId is applicant
    programId: true,
    data: true,
  },
});

// Should use: application.userId
```

**Status**: 
- ✅ FIX ALREADY APPLIED (lines 237, 247 changed)
- ⚠️ RUNTIME VERIFICATION NEEDED: Is applicant email actually in payload now?

---

### Communication Registry: EXISTS

**Location**: `lib/communications/communication-registry.ts`  
**Purpose**: Maps domain events → communication intents (applicant plans, admin plans)

**Function**: `getCommunicationEventForDomainEvent(eventName)`

**Evidence**: Used in notification-domain-subscriber.ts (line 50)
```typescript
const communicationEventName = getCommunicationEventForDomainEvent(event.eventName);
```

**Status**: Code exists, being used ✅

---

### Audience Resolver: EXISTS & INSTRUMENTED

**Location**: `lib/notifications/runtime/audience-resolver.ts`  
**Functions**:
- `resolve()`: Main entry point
- `resolveApplicant()`: Identifies recipient from userId/email
- `resolveOrganizationAdmin()`: Looks up org admin from organizationId

**Instrumentation**: 
```typescript
console.log("🎯 [AudienceResolver] Resolving applicant for application.submitted:", {
  context: { userId, userEmail, ... },
  resolved: { recipientType, recipientUserId, recipientEmail }
});
```

**Status**: Code exists, instrumented ✅

---

### Template Service: EXISTS

**Location**: `lib/notifications/template.service.ts`  
**Functions**:
- `getPublishedTemplate()`: Look up by event name and channel
- `getPublishedTemplateByKey()`: Look up by audience-specific key
- `renderTemplate()`: Variable substitution

**Status**: Code exists ✅

---

### Notification Log: EXISTS

**Location**: Database table `notificationLog`  
**Persistence**: `persistNotificationLog()` in notification.service.ts

**Fields**:
- eventName
- channel (email/telegram/internal)
- recipient (email or user ID)
- subject
- messagePreview
- templateUsed
- deliveryStatus (QUEUED/SENT/DELIVERED/FAILED)
- providerResponse (JSON)
- sentAt, deliveredAt, readAt

**Status**: Database schema exists, persistence implemented ✅

---

## PART B: WHAT WE DON'T KNOW YET (REQUIRES RUNTIME EVIDENCE)

### Gap 1: Do the Fixes Actually Work?

**Question**: Boolean conversion fix applied, but does it actually resolve validation errors?

**Evidence Needed**:
- ✅ Trigger application submit with boolean fields
- ✅ Check console for validation result (PASSED or FAILED)
- ✅ If PASSED: HTTP 200 returned
- ✅ If FAILED: HTTP 400 returned with error details

**Location to Check**: Console logs from submitApplication function

---

### Gap 2: Is the Applicant Email Correctly In the Event Payload?

**Question**: After fix (use application.userId), is the notification actually sent to applicant's email?

**Evidence Needed**:
- ✅ Check: "📬 [Notification] Application submitted event publishing:" log
- ✅ Verify: recipient.userId === application.userId (NOT input.userId)
- ✅ Verify: recipient.email === applicant's email (NOT admin's email)

**Location to Check**: Application service logs + Domain event publisher logs

---

### Gap 3: Does Audience Resolver Correctly Identify Recipients?

**Question**: Does AudienceResolver.resolveApplicant() correctly resolve applicant from userId?

**Evidence Needed**:
- ✅ Check: "🎯 [AudienceResolver] Resolving applicant..." log
- ✅ Verify: resolved.recipientEmail matches event.payload.email
- ✅ Verify: resolved.recipientUserId matches event.payload.userId

**Location to Check**: Audience resolver instrumentation logs

---

### Gap 4: Is Template Found and Rendered?

**Question**: Does system find the correct template and substitute variables?

**Evidence Needed**:
- ✅ Check: Template lookup succeeds
- ✅ Verify: Template status = PUBLISHED (not draft/inactive)
- ✅ Verify: Rendered output has no {{}} placeholders
- ✅ Verify: Subject, body, recipient are correct

**Location to Check**: NotificationLog database entries

---

### Gap 5: Does Email Actually Get Sent to Resend?

**Question**: Does Resend provider receive HTTP POST with correct data?

**Evidence Needed**:
- ✅ Check: Provider.send() called with correct recipient
- ✅ Verify: HTTP 200 response from Resend API
- ✅ Verify: Message ID returned
- ✅ Verify: From/To addresses correct

**Location to Check**: Provider execution logs + NotificationLog.providerResponse

---

### Gap 6: Is Notification Log Entry Created?

**Question**: Does database record reflect successful delivery?

**Evidence Needed**:
- ✅ Query: SELECT FROM notificationLog WHERE eventName='application.submitted'
- ✅ Verify: 2 records exist (email to applicant + internal/telegram to admin)
- ✅ Verify: deliveryStatus = SENT (not QUEUED or FAILED)
- ✅ Verify: recipient field contains APPLICANT email (not admin)

**Location to Check**: Database query immediately after submission

---

### Gap 7: Does Admin Also Get Notified?

**Question**: Does organization admin receive internal/telegram notification?

**Evidence Needed**:
- ✅ Check: Audience resolver identifies organization_admin
- ✅ Verify: Second notification log entry for admin
- ✅ Verify: Channel is internal OR telegram
- ✅ Verify: recipient identifies admin (not applicant)

**Location to Check**: Audience resolver logs + NotificationLog second entry

---

### Gap 8: Are Other Workflows Working? (registration, login, etc.)

**Question**: Do all 8 workflows actually trigger notifications?

**Evidence Needed** (for each workflow):
- ✅ Event published?
- ✅ Subscriber received it?
- ✅ Audience resolved?
- ✅ Template found?
- ✅ Provider executed?
- ✅ Log entry created?

**Location to Check**: Console logs + NotificationLog query results

---

## PART C: INSTRUMENTATION STATUS

### Existing Instrumentation: COMPLETE

**Already in code:**

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Application Service | `application-service.ts` | 200-248 | ✅ INSTRUMENTED |
| Domain Event Publisher | `domain-event-publisher.ts` | 10-20 | ✅ INSTRUMENTED |
| Notification Subscriber | `notification-domain-subscriber.ts` | 54-80 | ✅ INSTRUMENTED |
| Audience Resolver | `audience-resolver.ts` | 33-65 | ✅ INSTRUMENTED |

**Gaps in instrumentation:**

| Component | File | Gap | Status |
|-----------|------|-----|--------|
| Template Resolver | `template.service.ts` | No template lookup logs | ⚠️ CAN ADD |
| Provider Execution | `provider-adapters.ts` | No HTTP response logs | ⚠️ CAN ADD |
| Notification Log | `notification.service.ts` | Logging incomplete | ⚠️ NEEDS VERIFICATION |

**Decision**: Use existing instrumentation first; add gaps only if needed.

---

## PART D: EXECUTION READINESS CHECKLIST

### Prerequisites: VERIFIED

- ✅ Code inspection complete
- ✅ Instrumentation exists
- ✅ Fixes applied (boolean conversion, recipient fix)
- ✅ Database accessible (Neon)
- ✅ Environment variables set (.env file exists)
- ✅ Development server available

### Ready to Execute: YES

**Next action**: Start development server and begin runtime trace execution

---

## PART E: RISK ASSESSMENT

### What Could Go Wrong During Runtime Trace

**Risk 1: Fixes Don't Work**
- Expected: Boolean conversion works, validation passes
- Actual Risk: Validation still fails on boolean fields
- Mitigation: Check validation error logs immediately
- Recovery: Document exact error, move to Phase 5H.8 with evidence

**Risk 2: Still Wrong Recipient**
- Expected: Event payload contains applicant email
- Actual Risk: Still shows admin email after fix
- Mitigation: Check "📬 [Notification]" log
- Recovery: Document discrepancy, fix in Phase 5H.8

**Risk 3: Template Missing**
- Expected: Template found and rendered
- Actual Risk: No template exists or status != PUBLISHED
- Mitigation: Check database for NotificationTemplate record
- Recovery: Create template or enable if status is inactive

**Risk 4: Provider Credentials Invalid**
- Expected: HTTP 200 from Resend/Telegram
- Actual Risk: HTTP 401/403 (auth error)
- Mitigation: Check environment variables
- Recovery: Verify RESEND_API_KEY and TELEGRAM_BOT_TOKEN

**Risk 5: Silent Failure**
- Expected: All logs present, delivery confirmed
- Actual Risk: Notification service returns success but log query shows nothing
- Mitigation: Check persistNotificationLog() function
- Recovery: Debug persistence layer

---

## PART F: SUCCESS DEFINITION

**Phase 5H.7 succeeds when:**

✅ **All 8 workflows execute**
- user_registration
- user_login
- application_draft_save (no notification expected)
- application_submit
- application_approved
- application_rejected
- document_requested
- document_uploaded

✅ **Each workflow has complete runtime trace**
- Console logs from all instrumentation points
- Database records created
- Provider responses captured

✅ **Actual behavior documented**
- Expected vs. Actual for each step
- Any divergences identified with exact location
- Root causes pinpointed if failures exist

✅ **No production code modified**
- All fixes already applied (boolean, recipient)
- Only temporary logging added (no permanent changes)
- Ready to hand off to Phase 5H.8

---

**Next Phase**: Phase 5H.8 (Targeted Repair) — Only after this trace is complete

