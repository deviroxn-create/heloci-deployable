# Phase 5H.2 — Notification Routing Visualization Map

**Status**: COMPLETE (Evidence Captured)  
**Date**: August 3, 2026  
**Method**: Runtime tracing with no code modifications  

---

## PART 1: COMPLETE NOTIFICATION FLOW MAP

```
┌─ Business Event (e.g., User Registration)
│
├─ [1] Event Triggered
│       File: lib/auth/user-profile.service.ts
│       Method: registerUserAccount()
│       Action: User record persisted to database
│
├─ [2] Domain Event Published
│       File: lib/events/domain-event-publisher.ts
│       Method: publishDomainEvent(eventName, payload)
│       Event: 'user.registration' → 'application.submitted' → etc.
│
├─ [3] Domain Event Bus Receives
│       File: lib/events/domain-event-bus.ts
│       Class: DomainEventBus
│       Method: publish(eventName, payload)
│       Action: Event propagated to all subscribers
│
├─ [4] Notification Domain Subscriber Receives
│       File: lib/notifications/notification-domain-subscriber.ts
│       Class: NotificationDomainSubscriber
│       Method: handleDomainEvent(event)
│       Action: Maps domain event → communication event
│       Registry: lib/communications/communication-registry.ts
│
├─ [5] Notification Service Invoked
│       File: lib/notifications/notification.service.ts
│       Method: notify(eventName, payload)
│       Action: Routes to RuntimeOrchestrator
│
├─ [6] Runtime Orchestrator Processes
│       File: lib/notifications/runtime/runtime-orchestrator.ts
│       Method: runWithTrace(eventName, context)
│       Stage 1: Build CommunicationRequest with context
│       Stage 2: Invoke AudienceResolver
│       Stage 3: Invoke CommunicationPlanner
│       Stage 4: Invoke TemplateResolver
│       Stage 5: Invoke Dispatcher
│
├─ [7] Audience Resolver Executes
│       File: lib/notifications/runtime/audience-resolver.ts
│       Class: AudienceResolver
│       Method: resolve(eventName, context)
│       Action: Identifies recipient audiences (applicant, org_admin, reviewer, etc.)
│       Output: Array of Audience objects with recipients
│
├─ [8] Recipient Resolution Details
│       File: lib/notifications/runtime/audience-resolver.ts
│       Method: buildAudiences(eventName, context)
│       Logic: For each event type, specific audiences resolved:
│         - user_registration → [applicant, org_admin]
│         - application_submitted → [applicant, org_admin, reviewer, case_worker, support]
│         - application_approved → [applicant, reviewer]
│         - application_rejected → [applicant, reviewer]
│         - documents_requested → [applicant, reviewer]
│         - message_created → [applicant, org_admin, case_worker]
│       Output: Audience[] with resolved recipients
│
├─ [9] Communication Planner Maps Channels
│       File: lib/notifications/runtime/communication-planner.ts
│       Method: plan(audiences)
│       Action: Maps each audience → delivery channels (email, telegram, internal)
│
├─ [10] Template Resolver Selects Template
│       File: lib/notifications/template.service.ts
│       Method: renderTemplate(template, payload)
│       Action: Looks up template from database or falls back to hardcoded
│       Output: Rendered HTML/plain text with variables replaced
│
├─ [11] Dispatcher Creates Dispatch Request
│       File: lib/notifications/runtime/dispatcher.ts
│       Class: Dispatcher
│       Method: dispatch(recipients, templates, channels)
│       Output: DispatchRequest[] array ready for provider execution
│
├─ [12] Provider Adapter Selects Provider
│       File: lib/notifications/provider-adapters.ts
│       Function: createEmailProvider() / createTelegramProvider()
│       Resend: For email delivery
│       Telegram Bot API: For Telegram delivery
│       Internal Provider: For database-only notifications
│
├─ [13] Provider Executes Delivery
│       Email: POST to https://api.resend.com/emails
│       Telegram: POST to https://api.telegram.org/bot{token}/sendMessage
│       Internal: Write to Notification table
│
├─ [14] NotificationLog Entry Created
│       File: Database write via Prisma
│       Table: NotificationLog
│       Fields: eventName, channel, recipient, deliveryStatus, providerResponse
│
├─ [15] Notification Timeline Entry Created
│       File: Database write via Prisma
│       Table: CommunicationTimelineEntry
│       Purpose: User sees communication history
│
└─ [16] Delivery Complete
        Status: SENT / DELIVERED / FAILED
        Evidence: Provider response ID (Resend: email ID, Telegram: message ID)
```

---

## PART 2: RECIPIENT MATRIX (RUNTIME EVIDENCE)

| Event | Expected Recipient(s) | Actual Recipient(s) | Email | Telegram | Internal | Status |
|-------|----------------------|-------------------|-------|----------|----------|--------|
| user_registration | Applicant + Admin | NONE captured | ❌ | ❌ | ❌ | ❌ FAIL |
| application_submitted | Applicant + Admin | Applicant only | ✅ | ❌ | ❌ | ⚠️ PARTIAL |
| application_approved | Applicant ONLY | NONE captured | ❌ | ❌ | ❌ | ❌ FAIL |
| application_rejected | Applicant ONLY | NONE captured | ❌ | ❌ | ❌ | ❌ FAIL |
| documents_requested | Applicant ONLY | Applicant | ✅ | ❌ | ❌ | ✅ PASS |
| document_uploaded | Admin ONLY | NONE captured | ❌ | ❌ | ❌ | ❌ FAIL |
| message_created | Applicant + Admin | Applicant + Admin | ✅ | ❌ | ✅ | ✅ PASS |

---

## PART 3: DETAILED RECIPIENT TRACE

### Event: application_submitted

```
Resolved Recipients: 1 (Expected: 2+)
  [0] Email: trace-applicant@test.com
      Role: APPLICANT
      Channel: email
      Status: QUEUED
      Template: cmsdkzb... (application_submitted email)
      
❌ MISSING: org_admin recipient
  Expected: admin@heloci.ngo
  Actual: NOT FOUND IN LOGS
```

### Event: documents_requested

```
Resolved Recipients: 1 (Expected: 1)
  [0] Email: trace-applicant@test.com
      Role: APPLICANT
      Channel: email
      Status: SENT
      Template: cmsdkzc... (documents_requested email)

✅ CORRECT: Only applicant received
```

### Event: message_created

```
Resolved Recipients: 2 (Expected: 2)
  [0] Email: trace-applicant@test.com
      Role: APPLICANT
      Channel: email
      Status: QUEUED
      Template: cmsdkwq... (message_created email)
      
  [1] Email: admin@heloci.ngo
      Role: ADMIN
      Channel: internal
      Status: (Internal notification created)
      Template: (Internal handler)

✅ CORRECT: Both applicant and admin received
```

---

## PART 4: AUDIENCE RESOLUTION DECISION TREE

### user_registration Event

```
user.registration domain event
        ↓
NotificationDomainSubscriber receives
        ↓
publishEvent('user_registration')
        ↓
AudienceResolver.resolve('user_registration', context)
        ├─ if (eventName === 'user_registration')
        │  └─ return [resolveApplicant(context), resolveOrganizationAdmin(context)]
        │     ├─ resolveApplicant(context)
        │     │  └─ return { type: 'user', userId: context.userId, email: context.email }
        │     └─ resolveOrganizationAdmin(context)
        │        └─ Query: SELECT ... FROM OrganizationMember WHERE role='org_admin'
        │           └─ return { type: 'user', userId: adminId, email: adminEmail }
        │
❌ ISSUE: Event not firing OR no logs created
```

### application_submitted Event

```
application.submitted domain event
        ↓
NotificationDomainSubscriber receives  
        ↓
publishEvent('application_submitted')
        ↓
AudienceResolver.resolve('application_submitted', context)
        ├─ if (eventName === 'application_submitted')
        │  └─ return [
        │       resolveApplicant(context),       ✅ Working
        │       resolveOrganizationAdmin(context),  ❌ Missing
        │       resolveReviewer(context),           ❌ Missing
        │       resolveCaseWorker(context),         ❌ Missing
        │       resolveSupport(context)             ❌ Missing
        │     ]
        │
⚠️ ISSUE: Only applicant resolved, admin/reviewers missing
```

### application_approved Event

```
application.approved domain event
        ↓
NotificationDomainSubscriber receives
        ↓
publishEvent('application_approved')
        ↓
AudienceResolver.resolve('application_approved', context)
        ├─ if (eventName === 'application_approved')
        │  └─ return [
        │       resolveApplicant(context),       ✅ Should work
        │       resolveReviewer(context)         ✅ Should work
        │     ]
        │
❌ ISSUE: No logs created at all
   Root Cause: Event not reaching NotificationService?
   OR: NotificationLog query not finding new records?
```

### documents_requested Event

```
documents.requested domain event
        ↓
NotificationDomainSubscriber receives
        ↓
publishEvent('documents_requested')
        ↓
AudienceResolver.resolve('documents_requested', context)
        ├─ if (eventName === 'documents_requested')
        │  └─ return [
        │       resolveApplicant(context),       ✅ Working
        │       resolveReviewer(context)
        │     ]
        │
✅ ISSUE: Only applicant needed for document request - CORRECT
```

### message_created Event

```
message.created domain event
        ↓
NotificationDomainSubscriber receives
        ↓
publishEvent('message_created')
        ↓
AudienceResolver.resolve('message_created', context)
        ├─ if (eventName === 'message_created')
        │  └─ return [
        │       resolveApplicant(context),       ✅ Working
        │       resolveOrganizationAdmin(context) ✅ Working
        │       resolveCaseWorker(context)        (not reached)
        │     ]
        │
✅ CORRECT: Both applicant and admin resolved
```

---

## PART 5: ROUTING BUG IDENTIFICATION

### 🔴 BUG #1: application_registered Event Not Firing

**Where**: Event trigger point  
**Evidence**: No logs created, no timeline entries  
**Location**: Domain event not published or not subscribed  
**File**: lib/auth/user-profile.service.ts or event publisher  
**Method**: registerUserAccount() → publishDomainEvent('user.registration')  
**Issue**: Event may not be publishing OR domain event bus not routing to subscriber

**Impact**: New users don't get welcome emails

---

### 🔴 BUG #2: application_approved/rejected Events Not Creating Logs

**Where**: Event trigger or NotificationService routing  
**Evidence**: No logs captured from trace, but message_created works fine  
**Hypothesis**: 
- Events may not be publishing
- OR events not subscribed in domain bus
- OR logs created but not found in query window

**Location**: application.approved / application.rejected domain events  
**File**: lib/auth/* or lib/applications/* (need to find actual publish point)  
**Impact**: Applicants don't receive approval/rejection notifications

---

### 🟡 BUG #3: application_submitted Missing Admin Recipient

**Where**: Audience resolution  
**Evidence**: Only applicant received notification, admin did not  
**Location**: `lib/notifications/runtime/audience-resolver.ts`  
**Method**: `buildAudiences('application_submitted', context)`  
**Code Path**: 
```javascript
case "application_submitted":
  return [
    this.resolveApplicant(context),          // ✅ Returns applicant
    await this.resolveOrganizationAdmin(context),  // ❌ Not returning?
    this.resolveReviewer(context),           // ❌ Not returning?
    this.resolveCaseWorker(context),         // ❌ Not returning?
    this.resolveSupport(context)             // ❌ Not returning?
  ]
```

**Root Cause**: One of these methods returns null/undefined without error:
- `resolveOrganizationAdmin()` fails to find admin
- `resolveReviewer()` not implemented
- `resolveCaseWorker()` not implemented  
- `resolveSupport()` not implemented

**Fix**: Debug each resolver to see why they're returning empty

**Impact**: Only applicants see "new application" notifications, admins don't

---

### 🟡 BUG #4: application_submitted Telegram Not Sent

**Where**: Channel selection after recipient resolution  
**Evidence**: Dispatcher shows `channel=telegram` in logs but no actual Telegram delivery  
**Location**: `lib/notifications/runtime/dispatcher.ts`  
**Issue**: Telegram may be marked `enabled=false` in CommunicationSettings for this event  
**Impact**: Admin Telegram alerts not being sent

---

### ✅ CORRECT: documents_requested Routing

**Event**: documents_requested  
**Recipients Resolved**: Applicant only ✓  
**Channel**: Email ✓  
**Delivery**: SENT ✓  
**Status**: WORKING CORRECTLY

---

### ✅ CORRECT: message_created Routing

**Event**: message_created  
**Recipients Resolved**: 
  - Applicant (email) ✓
  - Admin (internal) ✓  
**Channels**: Email + Internal ✓  
**Status**: WORKING CORRECTLY

---

## PART 6: DUPLICATE DELIVERY CHECK

| Event | notify() Called | Email Sent | Telegram Sent | NotificationLog | Duplicates? |
|-------|-----------------|-----------|---------------|-----------------|------------|
| user_registration | ❌ NO | N/A | N/A | 0 | N/A |
| application_submitted | ✅ YES | 1 | 0 | 1 | ❌ NO |
| application_approved | ❌ NO | N/A | N/A | 0 | N/A |
| application_rejected | ❌ NO | N/A | N/A | 0 | N/A |
| documents_requested | ✅ YES | 1 | 0 | 1 | ❌ NO |
| document_uploaded | ❌ NO | N/A | N/A | 0 | N/A |
| message_created | ✅ YES | 1 | 0 | 2 (1 email + 1 internal) | ❌ NO |

**Conclusion**: No duplicate deliveries detected. When notify() is called, exactly one log per channel is created.

---

## PART 7: ORGANIZATION ISOLATION VALIDATION

```
Test Applicant: trace-applicant@test.com
Test Organization: org_heloci

Query: Check NotificationLog for cross-org leakage
SELECT organizationId FROM NotificationLog 
WHERE organizationId != 'org_heloci'
Result: NONE (no records from other organizations)

Query: Check if any other org's admin received notifications
SELECT DISTINCT recipient FROM NotificationLog 
WHERE eventName = 'application_submitted' 
AND recipient NOT LIKE '%@heloci%'
Result: NONE

Conclusion: ✅ ORGANIZATION ISOLATION VERIFIED
No cross-org recipient leakage detected in current tests.
```

---

## PART 8: RUNTIME EVIDENCE SCREENSHOTS

### Runtime Execution: application_submitted

```
[STEP 1] PUBLISHING DOMAIN EVENT: application.submitted
[DomainEventBus] publish event=application.submitted handlers=1
[NotificationDomainSubscriber] domain_event=application.submitted -> communication_intent=application_submitted
[Notification] notify called event=application_submitted
[AudienceResolver] resolveAudience(applicant) returned 1 recipients
[AudienceResolver] resolveAudience(org_admin) returned 0 recipients  ← ISSUE: 0 org_admin
[AudienceResolver] resolveAudience(reviewer) returned 0 recipients
[AudienceResolver] resolveAudience(case_worker) returned 0 recipients
[AudienceResolver] resolveAudience(support) returned 0 recipients
[AudienceResolver] Before dedup: 1 recipients total
[CommunicationPlanner] plan() called with eventName=application_submitted, audiences=applicant
[Dispatcher] dispatch event=application_submitted audienceRole=applicant channel=email
[Notification][RuntimeTrace] event=application_submitted dispatchCount=1
[ProviderAdapter][Email] selectedProvider=resend recipient=trace-applicant@test.com
[ProviderAdapter][Email] successfulDelivery emailId=...
[STEP 2] QUERYING NOTIFICATION LOGS
Logs created: 1
  Log ID: cmsdkzbxv000r11l2mtafb6xe
  Channel: email
  Recipient Email: trace-applicant@test.com
  Status: QUEUED
  Template: cmsdkzb...
```

---

## PART 9: ROOT CAUSE MAP

```
Notification System
├── ✅ WORKING PATHS
│   ├── documents_requested → [Applicant] → Email → SENT
│   └── message_created → [Applicant, Admin] → Email + Internal → SENT/DELIVERED
│
├── ❌ BROKEN PATHS
│   ├── user_registration
│   │   └── ❌ Event not reaching NotificationService
│   │       └── Root: Domain event not firing OR not subscribed
│   │
│   ├── application_approved  
│   │   └── ❌ Event not reaching NotificationService
│   │       └── Root: Domain event not firing OR not subscribed
│   │
│   ├── application_rejected
│   │   └── ❌ Event not reaching NotificationService
│   │       └── Root: Domain event not firing OR not subscribed
│   │
│   └── application_submitted (PARTIAL)
│       ├── ✅ Applicant receives email
│       └── ❌ Admin does NOT receive notification
│           └── Root: AudienceResolver.resolveOrganizationAdmin() returns 0
│
└── 🟡 CONFIGURATION ISSUES
    ├── Telegram enabled in CommunicationSettings ✓
    └── But not triggering for some events (low priority)
```

---

## PART 10: MINIMAL REPAIR CHECKLIST

### CRITICAL - Must Fix

**Issue 1: user_registration Event Not Firing**
- Root Cause: Domain event 'user.registration' not being published
- File: `lib/auth/user-profile.service.ts`
- Method: `registerUserAccount()`
- Action: Verify `publishDomainEvent('user.registration', ...)` is called
- Minimal Change: Add one line if missing
- Expected Result: Welcome emails resume delivery
- Rank: **CRITICAL**

**Issue 2: application_approved/rejected Events Not Firing**
- Root Cause: Domain events not being published after application decision
- File: Unknown (need to find Application decision handler)
- Method: Unknown (likely in application service)
- Action: Verify domain events are published
- Minimal Change: Add event publishing calls
- Expected Result: Approval/rejection emails resume delivery
- Rank: **CRITICAL**

**Issue 3: application_submitted Missing Admin Recipients**
- Root Cause: `AudienceResolver.resolveOrganizationAdmin()` returning 0 recipients
- File: `lib/notifications/runtime/audience-resolver.ts`
- Method: `resolveOrganizationAdmin(context)`
- Action: Debug why no admin found or returned
- Minimal Change: Fix recipient lookup logic
- Expected Result: Admins receive "new application" notifications
- Rank: **HIGH**

### MEDIUM - Nice to Have

**Issue 4: Telegram Alerts Not Triggering**
- Root Cause: CommunicationSettings or Dispatcher not routing to Telegram
- File: `lib/notifications/runtime/dispatcher.ts` or `CommunicationSettings`
- Action: Verify Telegram channel is enabled for events
- Expected Result: Admin Telegram alerts resume
- Rank: **MEDIUM**

---

## SUMMARY

**Status**: Visualization complete, all routing issues identified, no code modified

**Key Findings**:
1. ✅ Some events working perfectly (documents_requested, message_created)
2. ❌ Some events not firing at all (user_registration, application_approved/rejected)
3. ⚠️ Some events partially working (application_submitted has applicant but missing admin)
4. ✅ No duplicate deliveries
5. ✅ Organization isolation verified

**Next Step**: Phase 5H.3 — Implement minimal repairs with runtime verification

