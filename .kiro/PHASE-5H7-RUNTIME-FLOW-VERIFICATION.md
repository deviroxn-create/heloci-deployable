# PHASE 5H.7 — Forensic Runtime Flow Verification

**Status**: INITIATING COMPREHENSIVE RUNTIME TRACE  
**Date**: August 5, 2026  
**Mission**: Map exact runtime behavior of notification system before any code changes  
**Authority**: Forensic evidence collection phase (NO PRODUCTION CODE CHANGES)

---

## EXECUTIVE SUMMARY

This phase documents the **expected system design** and then **traces the actual runtime behavior** for 8 critical workflows. Every finding is backed by runtime evidence only.

**Rules:**
- ✅ Collect evidence
- ✅ Temporary logging allowed
- ❌ NO business logic changes
- ❌ NO notification routing changes
- ❌ NO database schema changes

---

# PART A: EXPECTED SYSTEM DESIGN

## Overview: Event → Notification Delivery Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ EXPECTED RUNTIME ARCHITECTURE                                   │
└─────────────────────────────────────────────────────────────────┘

User Action (Application Submit)
    ↓
Route Handler (POST /api/applications/{id}/submit)
    ├─ Extract: applicationId, userId (actor), wizardPayload
    ├─ Transform: Wizard Data → Question Set
    ├─ Validate: Question Set against Form Schema
    └─ Update: Database (status = "submitted")

Domain Event Publisher
    ↓
Domain Event Created
    ├─ Event Name: "application.submitted"
    ├─ Payload: { userId, email, applicationId, programId, organizationId }
    ├─ Correlation ID: Generated
    └─ Timestamp: NOW

Domain Event Bus
    ├─ Store: Event in memory
    └─ Broadcast: To all subscribers

Notification Domain Subscriber
    ├─ Receives: application.submitted event
    ├─ Maps: domain event → communication intent
    └─ Calls: notificationService.notify()

Notification Service (notify method)
    ├─ Load: Communication settings
    ├─ Load: Notification preferences
    └─ Route: Through RuntimeOrchestrator

RuntimeOrchestrator
    ├─ Audience Resolver: Who should receive?
    │  ├─ Resolve: Applicant (from userId/email)
    │  ├─ Resolve: Organization Admin (from organizationId)
    │  └─ Resolve: Reviewer, CaseWorker, Support
    │
    ├─ Communication Registry: What should be sent?
    │  └─ Look up: Audience-specific plans
    │
    ├─ Template Resolver: Which template?
    │  ├─ For each audience
    │  ├─ For each channel (email, telegram)
    │  └─ Render: Variable substitution
    │
    └─ Channel Dispatcher: Via which channel?
        ├─ Email → Resend API
        ├─ Telegram → Telegram API
        └─ Internal → Database

Provider Execution
    ├─ Email: POST to Resend → HTTP 200 → messageId
    ├─ Telegram: POST to Telegram → HTTP 200 → messageId
    └─ Internal: Write to NotificationLog

Notification Log
    ├─ Record: Event, Template, Recipient, Channel
    ├─ Status: SENT / DELIVERED / FAILED
    ├─ Timestamp: Delivery time
    └─ Provider Response: Raw API response

Return to Notification Domain Subscriber
    └─ Result: { delivered: boolean, channels, deliveryResults }
```

---

## Workflow 1: User Registration

### Step 1: Incoming Request

```
POST /api/auth/register
{
  "email": "alice@example.com",
  "password": "***",
  "firstName": "Alice",
  "lastName": "Applicant"
}
```

**Expected Authentication**: None (registration is public)  
**Expected Organization**: None (new user, no org yet)  
**Correlation ID**: Generated

### Step 2: Business Logic

**Expected Flow**:
1. Validate email (not already used)
2. Hash password
3. Create User record
4. **Publish Event**: `user_registered`
5. Return: User ID

**Expected Event Payload**:
```javascript
{
  userId: "user-uuid",
  email: "alice@example.com",
  name: "Alice Applicant",
  organizationId: null,
  // ... other fields
}
```

### Step 3: Database Write

**Expected Queries**:
1. SELECT user WHERE email = "alice@example.com" (check exists)
2. INSERT User (id, email, passwordHash, firstName, lastName)
3. COMMIT

**Expected Rows Changed**: 1 (User record)

### Step 4: Domain Event Published

**Event Name**: `user_registered`  
**Event Fired**: YES  
**Payload**:
```javascript
{
  userId: "user-xxx",
  email: "alice@example.com",
  name: "Alice Applicant",
  organizationId: null
}
```

### Step 5: Notification Subscriber Receives Event

**Expected**: YES  
**Processing Time**: < 100ms  
**Payload Unchanged**: YES

### Step 6: Communication Registry Lookup

**Expected Event**: `user_registered`  
**Expected Plans**:
```
- Audience: applicant → Channels: [email]
- Audience: organization_admin → Channels: [] (no org yet)
```

### Step 7: Audience Resolution

**Expected Audiences**:
1. **Applicant**: alice@example.com (from userId → user lookup)
2. **Organization Admin**: SKIP (organizationId is null)

### Step 8: Template Resolution

**For Applicant → Email**:
- Template Key: `applicant.user_registered.email`
- Template Status: PUBLISHED
- Variables:
  - `{{firstName}}`: "Alice"
  - `{{email}}`: "alice@example.com"
  - `{{supportEmail}}`: support@heloci.ngo (from settings)

**Rendered Preview**:
```
Subject: Welcome to Heloci, Alice!
Body: Thank you for registering. Verify your email: [link]
```

### Step 9: Channel Routing

**Email Dispatch**:
- **To**: alice@example.com
- **From**: noreply@heloci.ngo (from settings)
- **Provider**: Resend API
- **Status**: SENT

**Telegram**: None (applicant has no telegram)

**Internal**: Database record only

### Step 10: Notification Log

**Record Created**: YES  
**Database ID**: notif-uuid-1  
**Status**: SENT  
**Fields**:
```
{
  eventName: "user_registered",
  channel: "email",
  recipient: "alice@example.com",
  subject: "Welcome to Heloci, Alice!",
  messagePreview: "Thank you for registering...",
  templateUsed: "applicant.user_registered.email",
  deliveryStatus: "SENT",
  sentAt: NOW,
  userId: "user-xxx"
}
```

### Step 11: Delivery

**Provider Response (Resend)**:
```json
{
  "id": "resend-msg-123",
  "from": "noreply@heloci.ngo",
  "to": "alice@example.com",
  "created_at": "2026-08-05T10:00:00Z"
}
```

**Status**: SENT  
**Confirmed**: YES

---

## Workflow 2: User Login

### Step 1: Incoming Request

```
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "***"
}
```

**Expected Authentication**: None (pre-auth request)  
**Expected User**: alice@example.com (from database)  
**Correlation ID**: Generated

### Step 2: Business Logic

**Expected Flow**:
1. Find user by email
2. Verify password
3. Create session/JWT
4. **Publish Event**: `user_login`
5. Return: Session token

**Expected Event Payload**:
```javascript
{
  userId: "user-xxx",
  email: "alice@example.com",
  name: "Alice Applicant"
}
```

### Steps 3-11: Same pattern as User Registration

---

## Workflow 3: Application Draft Save

### Expected**: NO notification

This is a draft save, not a completed action. No domain event should be published.

**Verification**: Check logs for no `application.draft_saved` event

---

## Workflow 4: Application Submit

### Step 1: Incoming Request

```
POST /api/applications/{id}/submit
{
  "wizardPayload": {
    "personal.firstName": "Bob",
    "personal.isVeteran": true,
    "household.householdSize": 4,
    ...
  }
}
```

**Authenticated User**: alice@heloci.ngo (admin, actor)  
**Application Owner**: bob@example.com (applicant, recipient)  
**Application ID**: app-123  
**Program ID**: prog-456  
**Organization ID**: org-789  
**Correlation ID**: Generated

### Step 2: Business Logic

**Expected Flow**:
1. Load application (find owner: bob)
2. Transform wizard data → question set
3. Validate question set
4. Update application status → "submitted"
5. **Publish Event**: `application.submitted`
6. Return: {success: true}

**CRITICAL**: Event payload should contain **application owner's** details, not actor's.

**Expected Event Payload**:
```javascript
{
  userId: "user-bob-xxx",      // ← Applicant (owner), NOT actor (admin)
  email: "bob@example.com",    // ← Applicant's email, NOT admin's
  name: "Bob Applicant",       // ← Applicant's name, NOT admin's
  applicationId: "app-123",
  programId: "prog-456",
  organizationId: "org-789"
}
```

### Step 3: Database Write

**Expected Queries**:
1. SELECT programApplication WHERE id = "app-123"
2. SELECT user WHERE id = "bob-xxx" (get applicant)
3. SELECT program WHERE id = "prog-456" (get org)
4. UPDATE programApplication SET status = "submitted", submittedAt = NOW
5. COMMIT

**Expected Rows Changed**: 1 (Application status)

### Step 4: Domain Event Published

**Event Name**: `application.submitted`  
**Event Fired**: YES  
**Payload**: See above (owner's details)

### Step 5-11: Same pattern as Registration

**Expected Audiences**:
1. **Applicant** (bob): Email notification
2. **Organization Admin** (alice): Internal/Telegram notification

**Expected Recipients**:
- Email: bob@example.com (applicant, NOT alice)
- Telegram: org-admin-telegram-id (organization admin broadcast)

---

## Workflow 5: Application Approved

### Step 1: Incoming Request

```
PATCH /api/admin/applications/{id}
{
  "status": "approved",
  "decidedAt": NOW
}
```

**Authenticated User**: admin@heloci.ngo  
**Application Owner**: applicant@example.com  
**Application ID**: app-123  
**Program ID**: prog-456  
**Organization ID**: org-789

### Step 2: Business Logic

**Expected**: Status changes from "review" → "approved"  
**Should Publish**: YES, `application.approved`  
**Event Payload**: Should contain **applicant's** details

### Steps 3-11: Same pattern as Application Submit

**Expected Audiences**:
1. **Applicant**: Email confirmation
2. **Admin**: Telegram/Internal notification

---

## Workflow 6: Application Rejected

Same pattern as Application Approved (opposite status)

---

## Workflow 7: Document Requested

### Step 1: Incoming Request

```
POST /api/admin/document-requests
{
  "applicationId": "app-123",
  "documentType": "PAYSTUBS",
  "deadline": "2026-08-15"
}
```

**Authenticated User**: admin@heloci.ngo  
**Application Owner**: applicant@example.com (recipient)  
**Application ID**: app-123

### Step 2: Business Logic

**Expected Flow**:
1. Create DocumentRequest record
2. **Publish Event**: `document_requested`
3. Return: DocumentRequest

**Expected Event Payload**:
```javascript
{
  userId: "applicant-xxx",    // ← Applicant (recipient)
  email: "applicant@example.com",
  documentType: "PAYSTUBS",
  deadline: "2026-08-15",
  applicationId: "app-123"
}
```

### Steps 3-11: Same pattern

**Expected Recipient**: Applicant (email notification)

---

## Workflow 8: Document Uploaded

### Step 1: Incoming Request

```
POST /api/applicant/document-upload
{
  "applicationId": "app-123",
  "documentRequestId": "dreq-456",
  "file": [binary data]
}
```

**Authenticated User**: applicant@example.com  
**Document Request Created By**: admin@heloci.ngo  
**Document Request ID**: dreq-456

### Step 2: Business Logic

**Expected Flow**:
1. Save file
2. Update DocumentRequest status → "submitted"
3. **Publish Event**: `document_uploaded`
4. Return: Success

**Expected Event Payload**:
```javascript
{
  userId: "admin-xxx",        // ← Who needs to know (admin/reviewer)
  email: "admin@heloci.ngo",
  documentType: "PAYSTUBS",
  submittedBy: "applicant@example.com",
  applicationId: "app-123",
  documentRequestId: "dreq-456"
}
```

### Steps 3-11: Same pattern

**Expected Recipient**: Admin/Reviewer (Telegram/Internal)

---

# PART B: RUNTIME TRACE EXECUTION PLAN

## Instrumentation Points

**The following logs are added (temporary, for audit only):**

### Point 1: Application Service (submitApplication)

Already instrumented in application-service.ts:
```
Step 1: Incoming Request ✅
Step 2: Business Logic ✅
Step 3: Transformation ✅
Step 4: Question Set ✅
Step 5: Validator ✅
```

### Point 2: Domain Event Publisher

Already instrumented in domain-event-publisher.ts:
```
Step 1: Event Published ✅
```

### Point 3: Notification Domain Subscriber

Already instrumented in notification-domain-subscriber.ts:
```
Step 2: Domain Subscriber ✅
Step 3: Event Mapping ✅
Step 4: Notification Service Result ✅
```

### Point 4: Audience Resolver

Already instrumented in audience-resolver.ts:
```
Step 5: Audience Resolution ✅
```

---

# PART C-D: PENDING RUNTIME EXECUTION

**Status**: AWAITING DATABASE CONNECTION & DEV SERVER START

**Next Steps**:

1. Start development server: `npm run dev`
2. For each workflow:
   - Trigger action (register, login, submit, etc.)
   - Collect console logs
   - Query database immediately
   - Document findings
3. Compile runtime evidence into trace report
4. Compare expected vs. actual behavior
5. Identify exact divergence points

---

## Trace Execution Checklist

- [ ] Workflow 1: User Registration (Trace Complete)
- [ ] Workflow 2: User Login (Trace Complete)
- [ ] Workflow 3: Application Draft Save (Trace Complete)
- [ ] Workflow 4: Application Submit (Trace Complete)
- [ ] Workflow 5: Application Approved (Trace Complete)
- [ ] Workflow 6: Application Rejected (Trace Complete)
- [ ] Workflow 7: Document Requested (Trace Complete)
- [ ] Workflow 8: Document Uploaded (Trace Complete)

---

## Recipient Verification Matrix

Will be populated during runtime trace:

| Event | Expected Recipient | Actual Recipient | Match | Evidence |
|-------|-------------------|------------------|-------|----------|
| user_registered | alice@example.com | ? | ❓ | Pending |
| user_login | alice@example.com | ? | ❓ | Pending |
| application_submitted | bob@example.com | ? | ❓ | Pending |
| application_approved | bob@example.com | ? | ❓ | Pending |
| application_rejected | bob@example.com | ? | ❓ | Pending |
| document_requested | bob@example.com | ? | ❓ | Pending |
| document_uploaded | admin@heloci.ngo | ? | ❓ | Pending |

---

## Template Verification Matrix

Will be populated during runtime trace:

| Event | Channel | Template Status | Found | Active | Variables Resolved | Evidence |
|-------|---------|-----------------|-------|--------|-------------------|----------|
| user_registered | email | ? | ❓ | ❓ | ❓ | Pending |
| application_submitted | email | ? | ❓ | ❓ | ❓ | Pending |

---

## Provider Verification Matrix

Will be populated during runtime trace:

| Event | Channel | Provider | Called | Success | Response Code | Evidence |
|-------|---------|----------|--------|---------|---------------|----------|
| user_registered | email | Resend | ❓ | ❓ | ❓ | Pending |
| application_submitted | email | Resend | ❓ | ❓ | ❓ | Pending |

---

## Database Verification Matrix

Will be populated after runtime trace:

| Query | Expected Rows | Actual Rows | Match | Evidence |
|-------|---------------|-------------|-------|----------|
| NotificationLog for user_registered | 1 | ? | ❓ | Pending |
| NotificationLog for application_submitted | 2 (email + admin) | ? | ❓ | Pending |

---

# PART E: COMPLETION CRITERIA

**Phase 5H.7 is complete when:**

- ✅ All 8 workflows have been executed
- ✅ Runtime logs captured for every step
- ✅ Expected vs. actual behavior documented
- ✅ Divergence points identified (if any)
- ✅ Root causes pinpointed (if failures exist)
- ✅ NO production code has been modified

**Expected Outcome**:
- If all workflows match expected behavior → Move to Phase 5H.8 (Targeted Repair) with high confidence
- If divergences found → Document exact runtime evidence for each failure

---

**Authority**: This phase completes the forensic audit before any remediation begins.

