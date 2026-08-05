# PHASE 5H.7 — Evidence Collection Protocol

**Status**: INSTRUMENTATION COMPLETE - READY FOR RUNTIME TRACE  
**Date**: August 5, 2026  
**Purpose**: Specify exactly what evidence must be collected and where

---

## EVIDENCE HIERARCHY

**LEVEL 1: Console Logs** (In-Memory Traces)
- Application Service → Business Logic
- Domain Event Publisher → Event Publishing
- Notification Domain Subscriber → Event Reception
- Audience Resolver → Recipient Resolution
- Provider Execution → Delivery Status

**LEVEL 2: Database Queries** (Persistent Records)
- User table: Verify applicant/admin exists
- NotificationLog table: Verify record created
- NotificationTemplate table: Verify template status
- OrganizationMember table: Verify org admin exists

**LEVEL 3: Provider API Responses** (External Confirmation)
- Resend API: HTTP 200, messageId, from/to
- Telegram API: HTTP 200, messageId, chat_id
- Response body: Full JSON captured

**LEVEL 4: Runtime State** (System Behavior)
- Event bus state: Event received?
- Subscriber state: Handler triggered?
- Context values: Correct user/org/app data?

---

## INSTRUMENTATION POINTS & COLLECTION

### Point 1: Application Service (submitApplication)

**File**: `lib/applications/application-service.ts`  
**Function**: `submitApplication()`  
**Lines**: Already instrumented with STEP logs

**Evidence to Capture**:

```
✅ STEP 1: Incoming Request
   actor.id (current user)
   application.id
   application.userId (owner)
   
✅ STEP 2: Business Logic
   Validation: PASSED/FAILED
   Fields validated
   
✅ STEP 3: Transformation
   wizard keys count
   questionSet keys count
   Boolean conversion check

✅ STEP 4: Question Set
   allQuestions.length
   
✅ STEP 5: Validator
   Valid: YES/NO
   Errors: [field: error, ...]

📬 STEP 6: Notification Event Publishing
   actor vs application.userId (MUST BE DIFFERENT)
   email in payload (MUST BE APPLICANT'S, NOT ACTOR'S)
   organizationId included
```

**What to Look For**:
- ✅ Does event payload contain applicant's userId (not actor's)?
- ✅ Does event payload contain applicant's email (not actor's)?
- ✅ Is organizationId correctly set?

---

### Point 2: Domain Event Publisher

**File**: `lib/events/domain-event-publisher.ts`  
**Function**: `publishDomainEvent()`  
**Lines**: Already instrumented

**Evidence to Capture**:

```
========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: application.submitted
  User ID: [should be applicant]
  Organization ID: [should be org]
  Application ID: [should be app]
  Correlation ID: [generated]
```

**What to Look For**:
- ✅ Event name correct?
- ✅ User ID is applicant (not admin)?
- ✅ Payload includes all required fields?

---

### Point 3: Notification Domain Subscriber

**File**: `lib/notifications/notification-domain-subscriber.ts`  
**Function**: `handleDomainEvent()`  
**Lines**: Already instrumented

**Evidence to Capture**:

```
Step 2: Domain Subscriber
  Event Received: application.submitted
  Payload: {...}

Step 3: Event Mapping
  Domain Event: application.submitted
  Communication Event: [lookup from registry]

Step 4: Notification Service Result
  Delivered: YES/NO
  Channels: [email, ...]
```

**What to Look For**:
- ✅ Event received by subscriber?
- ✅ Communication event mapping exists?
- ✅ Notification service invoked?

---

### Point 4: Audience Resolver

**File**: `lib/notifications/runtime/audience-resolver.ts`  
**Function**: `resolve()` / `resolveApplicant()`  
**Lines**: Already instrumented

**Evidence to Capture**:

```
Step 5: Audience Resolution
  Event: application.submitted
  Context:
    userId: [applicant id]
    userEmail: [applicant email]
    organizationId: [org id]
    organizationAdminId: [admin id or null]
    reviewerId: [reviewer or null]

🎯 [AudienceResolver] Resolving applicant for application.submitted:
  context:
    userId: [should be applicant]
    userEmail: [should be applicant email]
  resolved:
    recipientType: user/email
    recipientUserId: [applicant id]
    recipientEmail: [applicant email]

Resolved Audiences: N
  [0] Role: applicant
      Recipient Type: user
      User ID: [applicant id]
      Email: [applicant email]
  [1] Role: organization_admin
      Recipient Type: user
      User ID: [admin id]
      Email: [admin email]
```

**What to Look For**:
- ✅ Applicant audience resolved?
- ✅ Applicant email correct?
- ✅ Organization admin included?
- ✅ Admin email correct?

---

### Point 5: Template Resolver

**File**: `lib/notifications/runtime/template-resolver.ts` (check location)  
**Expected Evidence**:

```
Template Resolution
  For applicant, email:
    Template ID: applicant.application-submitted.email
    Subject: "Your application was submitted"
    Status: ACTIVE/PUBLISHED
    Variables resolved:
      {{firstName}}: [name]
      {{lastName}}: [name]
      {{applicationId}}: [id]
      {{organizationName}}: [org name]
      {{programName}}: [program]
```

**What to Look For**:
- ✅ Template found?
- ✅ Template status PUBLISHED?
- ✅ All variables resolved (no {{}} remaining)?

---

### Point 6: Channel Dispatcher

**File**: `lib/notifications/notification.service.ts`  
**Expected Evidence**:

```
📤 [Dispatcher] Creating dispatch request:
  event: application.submitted
  template: applicant.application-submitted.email
  audience: applicant
  channel: email
  recipient:
    id: [applicant id]
    email: [applicant email]
```

**What to Look For**:
- ✅ Dispatch created for applicant → email?
- ✅ Dispatch created for admin → internal/telegram?
- ✅ Correct audience-specific template?

---

### Point 7: Provider Execution

**Expected Evidence** (for Resend Email):

```
POST https://api.resend.com/emails
{
  "from": "noreply@heloci.ngo",
  "to": "[applicant email]",
  "subject": "Your application was submitted",
  "html": "..."
}

HTTP 200
{
  "id": "resend-msg-xxx",
  "from": "noreply@heloci.ngo",
  "to": "[applicant email]",
  "created_at": "2026-08-05T10:00:00Z"
}
```

**What to Look For**:
- ✅ POST sent to Resend API?
- ✅ To: header correct (applicant email)?
- ✅ HTTP 200 response?
- ✅ Message ID returned?

**Expected Evidence** (for Telegram Admin):

```
POST https://api.telegram.org/bot[token]/sendMessage
{
  "chat_id": "[org admin chat id]",
  "text": "New application submitted by [applicant name]..."
}

HTTP 200
{
  "ok": true,
  "result": {
    "message_id": 123456
  }
}
```

**What to Look For**:
- ✅ POST sent to Telegram API?
- ✅ Chat ID correct?
- ✅ HTTP 200 response?

---

### Point 8: Notification Log

**File**: Database table `notificationLog`  
**Expected Evidence**:

```
SELECT * FROM notificationLog 
WHERE eventName = 'application.submitted'
AND createdAt > NOW() - INTERVAL 1 MINUTE

Results:
[
  {
    id: 'notif-uuid-1',
    eventName: 'application.submitted',
    channel: 'email',
    recipient: '[applicant email]',
    subject: 'Your application was submitted',
    templateUsed: 'applicant.application-submitted.email',
    deliveryStatus: 'SENT' or 'DELIVERED',
    userId: '[applicant id]',
    sentAt: NOW,
    providerResponse: { id: 'resend-msg-xxx', ... }
  },
  {
    id: 'notif-uuid-2',
    eventName: 'application.submitted',
    channel: 'internal',
    recipient: '[admin id]',
    subject: 'New Application',
    templateUsed: 'admin.application-submitted.internal',
    deliveryStatus: 'SENT',
    userId: '[admin id]',
    sentAt: NOW
  }
]
```

**What to Look For**:
- ✅ Email log entry created for applicant?
- ✅ Internal log entry created for admin?
- ✅ Recipient field correct (not admin's email)?
- ✅ DeliveryStatus SENT or DELIVERED?
- ✅ ProviderResponse captured?

---

## CRITICAL VERIFICATION POINTS

### Verification 1: Correct Applicant Identified

**Evidence**: 
- Application service logs show: actor ≠ applicant
- Domain event payload contains applicant's userId and email
- Audience resolver logs show applicant email resolved correctly
- NotificationLog recipient field contains applicant's email

### Verification 2: Correct Admin Identified

**Evidence**:
- Audience resolver logs show org admin resolved
- Notification log shows internal/telegram entry for admin
- If telegram: Telegram API response confirms messageId

### Verification 3: Template Correctly Selected

**Evidence**:
- Log shows templateKey includes audience prefix (e.g., "applicant.application-submitted.email")
- Template record exists and status = PUBLISHED
- Rendered preview shows variable substitution (no {{}} remaining)

### Verification 4: Delivery Confirmed

**Evidence**:
- Email: Resend API returns HTTP 200 with messageId
- Telegram: Telegram API returns HTTP 200 with ok:true
- NotificationLog shows deliveryStatus = SENT or DELIVERED
- ProviderResponse field populated

---

## RUNTIME TRACE EXECUTION

### Step-by-Step Trace for Application Submit

**1. Start Development Server**
```bash
npm run dev
```

**2. Monitor Console Logs**
```bash
# In separate terminal, tail logs
tail -f ~/.kiro/runtime-trace.log 2>/dev/null || echo "Logs will appear in console"
```

**3. Trigger Application Submit**

**Setup**: Create test data first
```bash
# 1. Register applicant
POST http://localhost:3000/api/auth/register
{
  "email": "bob@example.com",
  "password": "password123",
  "firstName": "Bob",
  "lastName": "Applicant"
}
Response: { id: "[bob-id]", email: "bob@example.com" }

# 2. Verify Bob logged in
POST http://localhost:3000/api/auth/login
{
  "email": "bob@example.com",
  "password": "password123"
}
Response: { token: "[bob-token]" }

# 3. Create application draft (as Bob)
POST http://localhost:3000/api/applications
Header: Authorization: Bearer [bob-token]
{
  "programId": "[prog-id]"
}
Response: { id: "[app-id]", status: "draft" }

# 4. Save draft data (as Bob)
PUT http://localhost:3000/api/applications/[app-id]/draft
Header: Authorization: Bearer [bob-token]
{
  "pageData": {
    "personal.firstName": "Bob",
    "personal.lastName": "Applicant",
    "personal.isVeteran": false,
    "household.householdSize": 3,
    ...
  }
}
Response: { success: true }
```

**Execute: Application Submit (as Admin)**
```bash
# Admin logs in
POST http://localhost:3000/api/auth/login
{
  "email": "admin@heloci.ngo",
  "password": "admin-password"
}
Response: { token: "[admin-token]" }

# Admin submits Bob's application
POST http://localhost:3000/api/applications/[app-id]/submit
Header: Authorization: Bearer [admin-token]
{
  "wizardPayload": {
    "personal.firstName": "Bob",
    "personal.lastName": "Applicant",
    "personal.isVeteran": "false",
    "household.householdSize": "3",
    ...
  }
}
```

**4. Capture Console Logs**

Copy all logs from console starting with:
```
STEP 1: Incoming Request
through
Step 4: Notification Service Result
```

**5. Query Database Immediately**

```sql
-- Within 5 seconds of request
SELECT * FROM notificationLog 
WHERE eventName = 'application.submitted'
ORDER BY createdAt DESC
LIMIT 2;

-- Should return 2 rows: one email to Bob, one internal/telegram to admin
```

**6. Compile Evidence**

Create evidence document with:
- All console logs (copy-paste)
- SQL query results (copy-paste)
- Provider responses (if available in logs)
- Timestamp of request and completion

---

## EXPECTED OUTPUTS BY WORKFLOW

### Workflow: Application Submit

**Console Logs Expected**:
```
STEP 1: Incoming Request
  applicationId: app-123
  userId (actor): admin-456
  userEmail (actor): admin@heloci.ngo

📬 [Notification] Application submitted event publishing:
  actor: { id: "admin-456", name: "current_user" }
  application: { id: "app-123", ownerId: "bob-789" }
  recipient: { userId: "bob-789", email: "bob@example.com", name: "Bob" }

========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: application.submitted
  User ID: bob-789
  Organization ID: org-789

Step 2: Domain Subscriber
  Event Received: application.submitted

Step 3: Event Mapping
  Domain Event: application.submitted
  Communication Event: application_submitted

Step 4: Notification Service Result
  Delivered: true
  Channels: ["email", "internal"]

Step 5: Audience Resolution
  Resolved Audiences: 2
    [0] Role: applicant, Email: bob@example.com
    [1] Role: organization_admin, Email: admin@heloci.ngo

[Template resolved for email and internal]

📤 [Dispatcher] Creating dispatch request:
  channel: email, recipient: bob@example.com
  channel: internal, recipient: [admin id]
```

**Database Results Expected**:
```
id          | eventName               | channel  | recipient             | deliveryStatus | userId
notif-xxx-1 | application.submitted   | email    | bob@example.com       | SENT           | bob-789
notif-xxx-2 | application.submitted   | internal | [admin id]            | SENT           | admin-456
```

---

## DIVERGENCE DETECTION

**If actual logs differ from expected:**

1. **Missing Event**: "Step 1: Event Published" not in logs
   - Root: Event not published
   - Location: application-service.ts, missing publishDomainEvent() call

2. **Wrong Recipient**: Event shows admin's email instead of applicant's
   - Root: Notification payload uses input.userId (actor) instead of application.userId (owner)
   - Location: application-service.ts, line 237-248

3. **Missing Audience**: Only applicant resolved, no admin
   - Root: Audience resolver not including organization admin
   - Location: audience-resolver.ts, resolveOrganizationAdmin()

4. **Template Not Found**: No template resolution log
   - Root: Template doesn't exist or status not PUBLISHED
   - Location: Database query NotificationTemplate

5. **Provider Failed**: HTTP 5xx or no response
   - Root: Provider credentials invalid or service down
   - Location: environment variables (RESEND_API_KEY, TELEGRAM_BOT_TOKEN)

6. **No Log Entry**: Database query returns 0 rows
   - Root: Log persistence failed or wrong event name
   - Location: persistNotificationLog() function

---

## SUCCESS CRITERIA

**Phase 5H.7 Runtime Trace is complete when:**

- ✅ All 8 workflows executed successfully
- ✅ Console logs captured for each workflow
- ✅ Database evidence collected
- ✅ Provider responses verified (where applicable)
- ✅ Actual behavior matches expected behavior (or divergence documented)
- ✅ No production code was modified during trace

**Next Phase**: Phase 5H.8 (Targeted Repair) - Only then are code changes permitted.

