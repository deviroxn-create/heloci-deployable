# PHASE 5H.7 — EXECUTION GUIDE

**Status**: Ready for Runtime Observation  
**Date**: August 4, 2026  
**Purpose**: Forensic observation of actual system behavior

---

## CRITICAL RULES

**FORBIDDEN**:
- ❌ NO code modifications to business logic
- ❌ NO changes to validators, mappers, or transformers
- ❌ NO changes to notification routing
- ❌ NO changes to audience resolver logic
- ❌ NO database modifications
- ❌ NO template modifications

**ALLOWED**:
- ✅ Temporary console.log() instrumentation (for observation only)
- ✅ Reading/viewing behavior via console logs
- ✅ Documenting observations in markdown files
- ✅ Creating test data if needed

**CURRENT INSTRUMENTATION STATUS**:

| File | Component | Status |
|------|-----------|--------|
| app/api/applications/[id]/submit/route.ts | HTTP handler | ✅ Logging STEP 1-2 |
| lib/applications/application-service.ts | Business logic | ✅ Logging STEP 3-6 |
| lib/events/domain-event-publisher.ts | Event publish | ✅ Logging step 1 |
| lib/notifications/notification-domain-subscriber.ts | Subscriber | ✅ Logging step 2-4 |
| lib/notifications/runtime/audience-resolver.ts | Audience resolution | ✅ Logging resolution results |

---

## WORKFLOW 1: USER REGISTRATION (APPLICANT)

### Objective
Verify that when a user registers, they receive a welcome email and the organization receives a registration notification.

### Setup
1. Start development server: `npm run dev`
2. Open browser: http://localhost:3000
3. Open browser console (F12)
4. Open terminal with server logs visible

### Execution

**ACTION**: Register a new user

```
1. Navigate to http://localhost:3000/auth/register
2. Fill form:
   - Email: testuser-{{timestamp}}@example.com
   - Password: Test@1234
   - First Name: Test
   - Last Name: User
3. Click "Sign Up"
4. Watch server terminal for logs
```

### Expected Console Output

```
STEP 1: [AuthService] User registration initiated
  Email: testuser-{{timestamp}}@example.com

STEP 2: [Database] User created
  User ID: {{userId}}
  Organization ID: {{orgId}}

========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: user.registration
  Payload Keys: userId, email, organizationId, ...
  User ID: {{userId}}
  Organization ID: {{orgId}}
  Correlation ID: {{correlationId}}

Step 2: Domain Subscriber
  Event Received: user.registration
  Payload: {...}

Step 3: Event Mapping
  Domain Event: user.registration
  Communication Event: user_registration

Step 4: Notification Service Result
  Delivered: true
  Channels: ["email", "internal"]

Step 5: Audience Resolution
  Event: user_registration
  Context:
    userId: {{userId}}
    userEmail: {{email}}
    organizationId: {{orgId}}
  Resolved Audiences: 2
    [0] Role: applicant
        Recipient Type: user
        User ID: {{userId}}
        Email: {{email}}
    [1] Role: organization_admin
        Recipient Type: user
        User ID: {{adminId}}
        Email: {{adminEmail}}
```

### Verification Checklist

- [ ] User created in database
- [ ] Domain event published (console shows "user.registration")
- [ ] Subscriber received event (console shows "Event Received")
- [ ] Registry mapped to "user_registration" (console shows mapping)
- [ ] **Applicant resolved** (console shows applicant with email)
- [ ] **Org admin resolved** (console shows org_admin with email)
- [ ] Both have different emails
- [ ] Notification delivered (console shows "Delivered: true")
- [ ] Email channel used (console shows channels include "email")
- [ ] Internal channel used (console shows channels include "internal")

### Success Criteria

✅ User receives welcome email (check email inbox or logs)  
✅ Organization admin receives registration notification  
✅ **Applicant email ≠ Admin email** (critical)  
✅ Correct templates sent to each audience  

---

## WORKFLOW 2: APPLICATION SUBMISSION

### Objective
Verify that when an applicant submits an application:
1. Application status changes to "SUBMITTED"
2. Domain event `application.submitted` is published
3. Applicant receives email notification
4. Organization admin receives Telegram notification
5. **Applicant email ≠ Admin telegram** (no cross-contamination)

### Setup
1. Ensure server is running
2. Log in as an applicant with an existing draft application
3. Open browser console (F12)
4. Terminal with server logs visible

### Execution

**ACTION**: Submit application

```
1. Navigate to /admin/applications
2. Find a draft application
3. Open it
4. Click "Submit Application"
5. Watch server terminal for logs
```

### Expected Console Output (COMPLETE TRACE)

```
========== SUBMIT PIPELINE TRACE ==========
STEP 1: Incoming HTTP Request
  Request URL: POST /api/applications/{{appId}}/submit
  Authenticated User ID: {{userId}}
  User Email: {{userEmail}}
  Application ID: {{appId}}

STEP 2: Raw Wizard Payload (Before Any Transformation)
  Total Keys: 81
  Keys and Values:
    housingGoals: ["affordable_rent"] (object)
    incomeRange: "15000_plus" (string)
    [...more keys...]

STEP 3: Transformation (Wizard → QuestionSet)
  BEFORE (Wizard):
    Total keys: 81
    housingGoals: ["affordable_rent"]
    housing.currentHousingSituation: "renting"
    [...more keys...]
  AFTER (QuestionSet):
    Total keys: {{transformedKeyCount}}
    [Check if housingGoals is present]
    currentHousing: "renting"
    [...more keys...]

STEP 4: Question Set (From getFormForProgram)
  Program: {{programSlug}}
  Total Questions: 11
    incomeRange: Required=true Type=select
    householdSize: Required=true Type=select
    state: Required=false Type=select
    zipCode: Required=false Type=text
    isVeteran: Required=true Type=radio
    hasDisability: Required=true Type=radio
    isSenior: Required=true Type=radio
    isStudent: Required=false Type=radio
    currentHousing: Required=true Type=select
    riskOfEviction: Required=true Type=radio
    housingGoals: Required=true Type=multiselect

STEP 5: Validator Input & Result
  Payload Keys: {{allKeys}}
  Schema Keys: {{schemaKeys}}
  Validation Result: PASSED [or FAILED + error details]
  
  [If FAILED, check Errors:]
  Errors:
    Field: {{fieldName}}
    Expected: REQUIRED/OPTIONAL
    Received: {{value}}
    Message: {{errorMessage}}

STEP 6: Database Write [if validation passed]
  [Database write details]

========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: application.submitted
  Payload Keys: applicationId, userId, organizationId, programId, ...
  User ID: {{applicantId}}
  Organization ID: {{orgId}}

Step 2: Domain Subscriber
  Event Received: application.submitted
  Payload: {...}

Step 3: Event Mapping
  Domain Event: application.submitted
  Communication Event: application_submitted

Step 4: Notification Service Result
  Delivered: true
  Channels: ["email", "telegram", "internal"]

Step 5: Audience Resolution
  Event: application_submitted
  Context:
    userId: {{applicantId}}
    userEmail: {{applicantEmail}}
    organizationId: {{orgId}}
    organizationAdminId: {{adminId}}
    organizationAdminEmail: {{adminEmail}}
    reviewerId: {{reviewerId}}
  Resolved Audiences: 5
    [0] Role: applicant
        Recipient Type: user
        User ID: {{applicantId}}
        Email: {{applicantEmail}}
    [1] Role: organization_admin
        Recipient Type: user
        User ID: {{adminId}}
        Email: {{adminEmail}}
    [2] Role: reviewer
        Recipient Type: user
        User ID: {{reviewerId}}
        Email: {{reviewerEmail}}
    [3] Role: case_worker
        Recipient Type: [if exists]
    [4] Role: support
        Recipient Type: email
        Email: support@example.com
```

### Verification Checklist

**STEP 1-2: HTTP & Transformation**
- [ ] HTTP request logged with correct user ID
- [ ] Raw wizard payload has 81 keys
- [ ] housingGoals present in wizard: `["affordable_rent"]`
- [ ] After transformation, check if housingGoals is still present
- [ ] If **housingGoals is MISSING**, this is BUG #1

**STEP 3-5: Validation**
- [ ] Question set loaded (11 questions)
- [ ] Validator ran
- [ ] If validation FAILED:
  - [ ] Check which field failed (housingGoals? zipCode?)
  - [ ] Document exact error message
  - [ ] This confirms validation failure root cause

**STEP 6: Database**
- [ ] Application status changed to "SUBMITTED"
- [ ] Database write confirmed

**PART 2: Notification**
- [ ] Domain event published: `application.submitted`
- [ ] Subscriber received event
- [ ] Registry mapped: `application.submitted` → `application_submitted`
- [ ] Notification Service called with correct audiences
- [ ] **CRITICAL**: Applicant audience resolved to applicant email
- [ ] **CRITICAL**: Org admin audience resolved to admin email
- [ ] **CRITICAL**: Emails are DIFFERENT

### Success Criteria

✅ Application submission succeeds (HTTP 200)  
✅ Application status becomes "SUBMITTED"  
✅ Domain event published  
✅ Notification sent with correct recipients  
✅ **Applicant receives email (not Telegram)**  
✅ **Admin receives Telegram (not email)**  
✅ **No cross-contamination**  

### Expected Failures to Document

If validation fails:
- [ ] Document which field failed
- [ ] Document exact error message
- [ ] Document if it's housingGoals (missing) or zipCode (invalid format)

If application status doesn't change:
- [ ] Document the error
- [ ] Check if validation was the blocker

If notification doesn't send:
- [ ] Document if subscriber received event
- [ ] Document if registry lookup failed
- [ ] Document if audience resolution failed

---

## WORKFLOW 3: APPLICATION APPROVED

### Objective
Verify approval notification reaches correct recipients.

### Execution

```
1. From admin dashboard
2. Find the submitted application
3. Click "Approve"
4. Watch server terminal for logs
```

### Expected Console Output

```
========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: application.approved
  Payload Keys: applicationId, userId, organizationId, ...

Step 3: Event Mapping
  Domain Event: application.approved
  Communication Event: application_approved

Step 5: Audience Resolution
  Resolved Audiences: 3
    [0] Role: applicant
        Email: {{applicantEmail}}
    [1] Role: organization_admin
        Email: {{adminEmail}}
    [2] Role: reviewer
        Email: {{reviewerEmail}}
```

### Verification

- [ ] Event published
- [ ] Applicant, admin, reviewer resolved
- [ ] **Different emails for each audience**
- [ ] Approval email sent to applicant
- [ ] Approval telegram sent to admin

---

## WORKFLOW 4: DOCUMENT REQUESTED

### Objective
Verify document request notification reaches applicant.

### Execution

```
1. From admin dashboard
2. Find submitted application
3. Click "Request Documents"
4. Select document type
5. Click "Send Request"
6. Watch server terminal for logs
```

### Expected Console Output

```
========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: documents.requested

Step 5: Audience Resolution
  Resolved Audiences: 2
    [0] Role: applicant
        Email: {{applicantEmail}}
    [1] Role: reviewer
        Email: {{reviewerEmail}}
```

### Verification

- [ ] Event published
- [ ] Applicant resolved
- [ ] Document request email sent
- [ ] Deadline included in email

---

## PHASE 5H.7 SUCCESS CRITERIA

This phase is **COMPLETE ONLY WHEN**:

- [x] WORKFLOW 1 (Registration) executed and documented
- [x] WORKFLOW 2 (Submission) executed and documented  
- [x] WORKFLOW 3 (Approval) executed and documented
- [x] WORKFLOW 4 (Documents) executed and documented
- [x] All console logs captured
- [x] All recipients verified
- [x] All templates verified
- [x] All divergences from expected behavior documented
- [x] Root cause evidence collected for any divergences

**Only then** can Phase 5H.8 (Targeted Repair) begin.

---

## DOCUMENTATION TEMPLATE

For each workflow, create a file:

**File**: `.kiro/PHASE-5H7-WORKFLOW-{{n}}-{{name}}-TRACE.md`

**Contents**:

```markdown
# WORKFLOW {{N}}: {{NAME}}

**Date**: {{date}}
**Status**: {{OBSERVED / DIVERGED / FAILED}}

## Expected vs Actual

### Expected
[What should happen per architecture]

### Actual
[What actually happened per console logs]

### Divergence
[If different, where did it diverge?]

## Evidence

### Console Logs
[Full console output]

### Database State
[Database records created/modified]

### Recipients
[Who received what]

### Templates
[Which templates rendered]

## Root Cause (If diverged)

[Exact file, function, line where divergence begins]
```

---

## NEXT PHASE

Once all workflows are traced and documented:

1. **Create summary report**:
   - List all workflows executed
   - List any divergences found
   - Document root cause for each divergence

2. **Begin Phase 5H.8 (Targeted Repair)**:
   - Based on documented evidence only
   - Fix only confirmed issues
   - No changes to architecture

