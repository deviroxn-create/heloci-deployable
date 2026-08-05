# PHASE 5H.7 — FORENSIC RUNTIME FLOW VERIFICATION

**Date**: August 4, 2026  
**Status**: Trace Plan (Pre-Execution)  
**Mission**: Observe system behavior. No code modifications. No assumptions.

---

## PART A: EXPECTED SYSTEM ARCHITECTURE

Based on code inspection of communication registry, this is the intended architecture:

### ARCHITECTURE OVERVIEW

```
Business Action (User registers)
    ↓
Domain Event Published (user.registration)
    ↓
Event Bus
    ↓
NotificationDomainSubscriber listens
    ↓
Communication Registry lookup
    ↓
CommunicationEventName resolved
    ↓
NotificationService.notify(communicationEventName, payload)
    ↓
AudienceResolver identifies recipients
    ↓
For each audience:
    ├→ Template Resolver (selects template)
    ├→ Channel Resolver (email/telegram/internal)
    ├→ Provider dispatch (Resend API, Telegram API, DB)
    └→ NotificationLog entry created
    ↓
Delivery complete
```

---

## PART A.1: WORKFLOW 1 — USER REGISTRATION

### Expected Flow

| Step | Component | Input | Processing | Output | Evidence Required |
|------|-----------|-------|-----------|--------|-------------------|
| 1 | HTTP Handler | POST /auth/register | Parse request | User data | Request logged |
| 2 | Auth Service | User data | Create user record | User ID, email | DB insert confirmed |
| 3 | Domain Event | user.registration | Publish event | Event published | Console: "user.registration event published" |
| 4 | Event Bus | user.registration | Route to subscribers | Event received | Event bus delivers to subscriber |
| 5 | NotificationDomainSubscriber | user.registration | Read registry | communicationEventName: "user_registration" | Registry lookup logged |
| 6 | NotificationService | user_registration | Query audiences | audiences: ["applicant", "org_admin"] | Audience list logged |
| 7 | AudienceResolver | applicant | Resolve to user | User ID, email | User ID + email logged |
| 8 | AudienceResolver | org_admin | Resolve to org admins | Org admin list | Admin IDs logged |
| 9 | TemplateResolver | user_registration + applicant | Load template | Template ID, content | Template ID logged |
| 10 | ChannelResolver | applicant + email | Determine channel | email | Channel selected: email |
| 11 | EmailProvider | To:, Subject:, Body: | Send via Resend API | HTTP 200, message_id | Resend API response logged |
| 12 | NotificationLog | email delivery | Create DB record | Log ID, status | DB insert confirmed |
| 13 | Return | NotificationService | Result | delivered=true, channels=["email"] | Console logged |

### Expected Recipients

| Audience | Recipient Type | Count | Email | Telegram | Internal |
|----------|---|---|---|---|---|
| applicant | Registering user | 1 | ✅ Welcome | ❌ | ✅ (DB) |
| org_admin | Organization admins | N | ✅ | ❌ | ✅ (DB) |

### Expected Events Published

- Domain Event: `user.registration`
  - Payload: `{ userId, email, organizationId, ... }`
  - Timestamp: event creation time
  - Correlation ID: (if implemented)

### Expected Communication Event

- Name: `user_registration` (from registry)
- Audiences: `["applicant", "org_admin"]`
- Channels:
  - applicant: `["email", "internal"]`
  - org_admin: `["email", "internal"]`

---

## PART A.2: WORKFLOW 2 — APPLICATION SUBMISSION

### Expected Flow

| Step | Component | Input | Processing | Output | Evidence Required |
|------|-----------|-------|-----------|--------|-------------------|
| 1 | HTTP Handler | POST /applications/{id}/submit | Parse request | Wizard payload | Request logged (STEP 1 in submit route) |
| 2 | SubmitApplication | wizardPayload | Validate | Validation result | STEP 5 validation logged |
| 3 | Database | Valid data | Update status | Application.status = "SUBMITTED" | STEP 6 database write confirmed |
| 4 | Domain Event | application.submitted | Publish event | Event published | Console: "application.submitted event published" |
| 5 | Event Bus | application.submitted | Route to subscribers | Event received | Event bus delivers to subscriber |
| 6 | NotificationDomainSubscriber | application.submitted | Read registry | communicationEventName: "application_submitted" | Registry lookup logged |
| 7 | NotificationService | application_submitted | Query audiences | audiences: ["applicant", "org_admin", "reviewer", "case_worker", "support"] | Audience list logged |
| 8 | AudienceResolver | applicant | Resolve to user | Applicant user ID, email | User ID + email logged |
| 9 | AudienceResolver | org_admin | Resolve to org admins | Org admin IDs, emails | Admin IDs + emails logged |
| 10 | AudienceResolver | reviewer | Resolve to reviewers | Reviewer IDs, emails | Reviewer IDs logged |
| 11 | TemplateResolver | application_submitted + applicant | Load template | Template ID | Applicant template ID logged |
| 12 | TemplateResolver | application_submitted + org_admin | Load template | Template ID | Admin template ID logged |
| 13 | ChannelResolver | applicant → email | Determine channel | email | Channel selected: email |
| 14 | ChannelResolver | org_admin → telegram | Determine channel | telegram | Channel selected: telegram |
| 15 | EmailProvider | applicant email | Send via Resend API | HTTP 200 | Email delivery logged |
| 16 | TelegramProvider | org_admin chat_id | Send via Telegram API | HTTP 200 | Telegram delivery logged |
| 17 | NotificationLog | All deliveries | Create DB records | Log entries | DB inserts confirmed |
| 18 | Return | NotificationService | Result | delivered=true, channels=["email", "telegram", "internal"] | Console logged |

### Expected Recipients

| Audience | Type | Count | Template | Email | Telegram | Internal |
|----------|------|-------|----------|-------|----------|----------|
| applicant | Submitting user | 1 | applicant_submission_confirmation | ✅ | ❌ | ✅ |
| org_admin | Organization admins | N | admin_application_submitted | ❌ | ✅ | ✅ |
| reviewer | Program reviewers | N | reviewer_application_submitted | ❌ | ❌ | ✅ |
| case_worker | Case workers | N | caseworker_application_submitted | ❌ | ❌ | ✅ |
| support | Support team | N | support_application_submitted | ✅ | ❌ | ✅ |

### Key Verification Points

**CRITICAL**: Applicant should NEVER receive admin notifications via any channel
**CRITICAL**: Admin should NEVER receive applicant notifications via any channel

---

## PART A.3: WORKFLOW 3 — APPLICATION APPROVED

### Expected Flow

| Step | Component | Input | Processing | Output | Evidence |
|------|-----------|-------|-----------|--------|----------|
| 1 | HTTP Handler | PATCH /applications/{id}/status | Parse request | status: "approved" | Request logged |
| 2 | ApplicationService | status change | Update DB | Application updated | DB write confirmed |
| 3 | Domain Event | application.approved | Publish event | Event published | Event bus log |
| 4 | NotificationDomainSubscriber | application.approved | Registry lookup | communicationEventName: "application_approved" | Registry log |
| 5 | AudienceResolver | applicant | Resolve | applicant email | User ID logged |
| 6 | AudienceResolver | org_admin | Resolve | org admin Telegram | Admin IDs logged |
| 7 | TemplateResolver | application_approved + applicant | Load | Approval email template | Template ID logged |
| 8 | TemplateResolver | application_approved + org_admin | Load | Approval telegram template | Template ID logged |
| 9 | EmailProvider | Applicant | Send approval confirmation | HTTP 200 | Email log |
| 10 | TelegramProvider | Org admin | Send approval alert | HTTP 200 | Telegram log |
| 11 | NotificationLog | Both channels | Create DB records | Log entries | DB confirmed |

---

## PART A.4: WORKFLOW 4 — DOCUMENT REQUESTED

### Expected Flow

| Step | Component | Input | Processing | Output | Evidence |
|------|-----------|-------|-----------|--------|----------|
| 1 | HTTP Handler | POST /documents/request | Parse request | Document type, applicant ID | Request logged |
| 2 | DocumentService | Request data | Create DB record | DocumentRequest created | DB insert confirmed |
| 3 | Domain Event | documents.requested | Publish event | Event published | Event bus log |
| 4 | NotificationDomainSubscriber | documents.requested | Registry lookup | communicationEventName: "documents_requested" | Registry log |
| 5 | AudienceResolver | applicant | Resolve | Applicant email | User ID logged |
| 6 | AudienceResolver | reviewer | Resolve | Reviewer IDs | Reviewer IDs logged |
| 7 | TemplateResolver | documents_requested + applicant | Load | Doc request template | Template ID logged |
| 8 | EmailProvider | Applicant | Send request | HTTP 200 | Email log |
| 9 | NotificationLog | Email delivery | Create DB record | Log entry | DB confirmed |

---

## PART B: RUNTIME INSTRUMENTATION PLAN

### B.1: Instrumentation Already in Place

From code inspection, these have logging:

✅ **Submit route** (`app/api/applications/[id]/submit/route.ts`)
  - STEP 1: Incoming request (user, application ID, organization ID)
  - STEP 2: Raw wizard payload (before transformation)

✅ **Application service** (`lib/applications/application-service.ts`)
  - STEP 3: Transformation before/after
  - STEP 4: Question set from form
  - STEP 5: Validator input & result
  - STEP 6: Database write (if validation passes)

✅ **Domain subscriber** (`lib/notifications/notification-domain-subscriber.ts`)
  - STEP 2: Domain event received
  - STEP 3: Registry lookup (domain event → communication event)
  - STEP 4: Notification service result

### B.2: Additional Instrumentation Needed

**BEFORE RUNNING WORKFLOWS:**

Add temporary logging to these files (temporary only, removed after observation):

1. **`lib/events/domain-event-publisher.ts`**
   - Print: Event name, payload, timestamp
   - Print: "Event published: {eventName}"

2. **`lib/notifications/notification.service.ts`**
   - Print: Communication event name
   - Print: Audiences list
   - Print: For each audience: resolved user IDs, emails
   - Print: Template selection per audience
   - Print: Channel selection per audience
   - Print: Dispatch result (sent/failed)

3. **`lib/notifications/runtime/audience-resolver.ts`**
   - Print: Audience type
   - Print: For each user: ID, email, organization, role
   - Print: Reason included/excluded

4. **`lib/notifications/runtime/template-resolver.ts`**
   - Print: Communication event name
   - Print: Template ID selected
   - Print: Template status (active/inactive)
   - Print: Variable resolution (success/missing)

5. **`lib/notifications/runtime/channel-resolver.ts`**
   - Print: Audience type
   - Print: Available channels
   - Print: Selected channel
   - Print: Reason for selection

6. **`app/api/communications/send/route.ts`** (or equivalent)
   - Print: Provider called (Resend/Telegram)
   - Print: HTTP status
   - Print: Response payload
   - Print: Delivery status

---

## PART C: WORKFLOW EXECUTION PLAN

### Phase 1: Registration Flow

**ACTION**: Execute user registration via HTTP
**CAPTURE**: All console logs from steps 1-10
**VERIFY**: 
- ✅ User created in database
- ✅ user.registration domain event published
- ✅ Subscriber received event
- ✅ Registry mapped to user_registration
- ✅ Applicant received welcome email
- ✅ Org admin received registration notification
- ✅ NotificationLog entries created

**SUCCESS CRITERIA**: Both applicant and org_admin received correct templates via correct channels

---

### Phase 2: Application Submission

**ACTION**: Submit application via HTTP
**CAPTURE**: All console logs from STEP 1-6 (submit route) + steps 1-10 (notification pipeline)
**VERIFY**:
- ✅ Application status changed to "SUBMITTED"
- ✅ application.submitted domain event published
- ✅ Subscriber received event
- ✅ AudienceResolver identified applicant (email)
- ✅ AudienceResolver identified org_admin (telegram)
- ✅ Applicant received email (via Resend)
- ✅ Org admin received telegram (via Telegram API)
- ✅ Reviewer received internal notification
- ✅ Applicant email ≠ admin email
- ✅ NotificationLog entries created for each

**SUCCESS CRITERIA**: 
- Applicant email contains applicant template
- Admin telegram contains admin template
- No cross-contamination (applicant email ≠ admin content)

---

### Phase 3: Application Approved

**ACTION**: Approve application via admin dashboard
**CAPTURE**: All console logs from notification pipeline
**VERIFY**:
- ✅ Application status changed to "APPROVED"
- ✅ application.approved domain event published
- ✅ Subscriber received event
- ✅ Applicant received approval email
- ✅ Org admin received approval telegram
- ✅ NotificationLog entries created

**SUCCESS CRITERIA**: Approval notifications reach correct audiences

---

### Phase 4: Document Requested

**ACTION**: Request document from applicant
**CAPTURE**: All console logs
**VERIFY**:
- ✅ DocumentRequest created
- ✅ documents.requested domain event published
- ✅ Applicant received email with document request
- ✅ Deadline included in template
- ✅ NotificationLog entry created

---

## PART D: EVIDENCE COLLECTION TEMPLATE

For EACH workflow, capture:

```
=== WORKFLOW: [Name] ===

STEP 1: REQUEST RECEIVED
  URL: 
  Method: 
  User ID: 
  Organization ID: 
  Correlation ID: 

STEP 2: BUSINESS LOGIC
  Service Called: 
  Arguments: 
  Returned: 
  Status: SUCCESS / FAILED

STEP 3: DATABASE
  Queries Executed: 
  Rows Changed: 
  Transaction: COMMIT / ROLLBACK

STEP 4: DOMAIN EVENT
  Event Published: YES / NO
  Event Name: 
  Payload: 
  Correlation ID: 
  Timestamp: 

STEP 5: SUBSCRIBER RECEIVED
  Subscriber Active: YES / NO
  Event Name: 
  Processing Time: 
  Payload: 

STEP 6: REGISTRY LOOKUP
  Domain Event → Communication Event: 
  Audiences Identified: 
  Channels Assigned: 

STEP 7: AUDIENCE RESOLUTION
  For each audience:
    - Audience: 
      - Resolved IDs: 
      - Resolved Emails: 
      - Organization: 
      - Role: 
      - Reason Selected: 

STEP 8: TEMPLATE RESOLUTION
  Template Selected: 
  Template ID: 
  Variables Resolved: YES / NO
  Missing Variables: 
  Template Preview (first 100 chars): 

STEP 9: CHANNEL ROUTING
  Email Sent: YES / NO
    - To: 
    - From: 
    - Status Code: 
    - Provider Response: 
  Telegram Sent: YES / NO
    - Chat ID: 
    - Status Code: 
    - Provider Response: 
  Internal Created: YES / NO

STEP 10: NOTIFICATION LOG
  DB Record Created: YES / NO
  Log ID: 
  Status: 
  Channels: 

STEP 11: DELIVERY VERIFICATION
  Email: DELIVERED / FAILED
  Telegram: DELIVERED / FAILED
  Internal: CREATED / FAILED

=== END WORKFLOW ===
```

---

## PART E: COMPARISON TEMPLATE

For each workflow:

```
EXPECTED vs ACTUAL:

Issue: [Description of expected behavior]

Expected: [What should happen]
Actual: [What actually happened]
Match: ✅ YES / ❌ NO

Evidence:
  - File: 
  - Function: 
  - Line: 
  - Console Log: 

If NO match:
  Divergence Point: [Exact step where it diverged]
  Root Cause Hypothesis: [To be confirmed]
```

---

## PART F: EXECUTION CHECKLIST

Before starting:
- [ ] All temporary logging is disabled (not in code)
- [ ] Test data prepared (valid user, valid application)
- [ ] Development server running
- [ ] Browser console open
- [ ] Server terminal visible
- [ ] Database in known state

Workflows to execute:
- [ ] WORKFLOW 1: User Registration
- [ ] WORKFLOW 2: Application Submission
- [ ] WORKFLOW 3: Application Approved
- [ ] WORKFLOW 4: Document Requested
- [ ] WORKFLOW 5: Application Rejected

For each workflow:
- [ ] Capture all console output
- [ ] Verify all recipients
- [ ] Confirm all database records
- [ ] Check all provider responses
- [ ] Document any divergence

---

## SUCCESS CRITERIA

This phase is **complete only when**:

✅ Every workflow has been executed  
✅ Every notification has been traced end-to-end  
✅ Every recipient has been verified  
✅ Every template has been rendered correctly  
✅ Every database write has been confirmed  
✅ Every event publication has been confirmed  
✅ All divergences have been documented with exact location  

**Only then** may Phase 5H.8 (Targeted Repair) begin.

Until then, **no production code may be modified**.

