# PHASE 5H.7 — FORENSIC RUNTIME METHODOLOGY

**Date**: August 4, 2026  
**Mission**: Observe the system as it actually behaves, without modification  

---

## WHAT IS FORENSIC OBSERVATION?

Forensic observation is **investigative analysis of system behavior without intervention**.

**Unlike Phase 5H (investigation with fixes):**
- We do NOT fix problems we identify
- We do NOT modify code
- We do NOT change configuration
- We ONLY observe and document

**Why forensic observation?**

The user's earlier correction revealed a critical error in my approach:

> "I want it to verify the architecture assumption. Do not fix anything until this question is answered."

This taught us that fixing without full understanding creates false confidence. A "fix" that hides a deeper architectural problem leads to brittle systems that appear to work but fail in unexpected ways.

**Forensic observation ensures:**
- ✅ Every statement is backed by runtime evidence
- ✅ No assumptions made without proof
- ✅ Complete picture before repair begins
- ✅ Fixes target root causes, not symptoms

---

## THE FORENSIC QUESTION

We must answer with 100% confidence:

> "When an applicant submits an application, does the applicant receive applicant-facing notifications and does the admin receive admin-facing notifications, or is there cross-contamination?"

This is not a "probably" question. It must be answered with console logs showing:
- Exact recipient resolved for each audience
- Exact email address for applicant
- Exact telegram chat ID for admin
- Evidence that applicant email ≠ admin telegram recipient

---

## THE EVIDENCE HIERARCHY

### Tier 1: Runtime Observation (Accepted)
✅ Console logs showing actual execution  
✅ Database records showing actual state changes  
✅ Provider API responses showing actual delivery  

### Tier 2: Code Analysis (Rejected without Tier 1)
❌ "The code should do X"  
❌ "The architecture intends X"  
❌ "Logic path analysis suggests X"  

Without runtime evidence, code analysis is speculation.

---

## INSTRUMENTATION STRATEGY

We have temporary logging at key decision points:

```
User Action
    ↓
HTTP Handler [LOGS: Request details]
    ↓
Business Service [LOGS: Transformation, validation, DB writes]
    ↓
Domain Event Publisher [LOGS: Event name, payload]
    ↓
Subscriber [LOGS: Event received, registry lookup]
    ↓
Notification Service [LOGS: Audience resolution]
    ↓
Provider [LOGS: Delivery attempt, HTTP status]
    ↓
NotificationLog [LOGS: DB record created]
```

Each stage produces console output that we capture and analyze.

---

## THE OBSERVATION PROCESS

### Phase 1: Execute Workflow
Run a complete user workflow (e.g., submit application).

### Phase 2: Capture Logs
Copy all console output from:
- Browser console (if client-side)
- Server terminal (for backend logs)

### Phase 3: Parse Logs
Extract key data points:
- Did event publish? (YES / NO)
- Did subscriber receive it? (YES / NO)
- What audiences were resolved? (list)
- What recipients were identified? (IDs + emails)
- Were templates sent? (YES / NO, which templates?)
- Were providers invoked? (YES / NO, which providers?)

### Phase 4: Compare to Expected
Create comparison table:
- Expected recipient per registry
- Actual recipient per logs
- Match? (✅ YES / ❌ NO)

### Phase 5: Document Divergence
If actual ≠ expected:
- Exact step where divergence begins
- Exact code file + function + line
- Exact runtime value that caused divergence

---

## CRITICAL VERIFICATION POINTS

### For Application Submission:

**✅ MUST SEE in console:**

1. **Incoming Request**
   ```
   STEP 1: Incoming HTTP Request
   Request URL: POST /api/applications/{{appId}}/submit
   Authenticated User ID: {{userId}}
   ```

2. **Transformation (before validation)**
   ```
   STEP 3: Transformation (Wizard → QuestionSet)
   BEFORE: Total keys: 81, includes housingGoals
   AFTER: Total keys: {{N}}, housingGoals [[check if present]]
   ```

3. **Validation Result**
   ```
   STEP 5: Validator Input & Result
   Validation Result: PASSED [or FAILED + specific errors]
   ```

4. **Database Write** (if validation passed)
   ```
   STEP 6: Database Write
   [Insert/update SQL logged]
   ```

5. **Domain Event Published**
   ```
   Step 1: Event Published
   Event Name: application.submitted
   User ID: {{userId}}
   ```

6. **Subscriber Received**
   ```
   Step 2: Domain Subscriber
   Event Received: application.submitted
   ```

7. **Registry Mapping**
   ```
   Step 3: Event Mapping
   Domain Event: application.submitted
   Communication Event: application_submitted
   ```

8. **Audience Resolution**
   ```
   Step 5: Audience Resolution
   Event: application_submitted
   Resolved Audiences: {{N}}
     [0] Role: applicant
         Recipient Type: user
         User ID: {{applicantId}}
         Email: {{applicantEmail}}
     [1] Role: organization_admin
         Recipient Type: user
         User ID: {{adminId}}
         Email: {{adminEmail}}
   ```

9. **Notification Result**
   ```
   Step 4: Notification Service Result
   Delivered: true
   Channels: ["email", "telegram", "internal"]
   ```

---

## WHAT WE'RE TESTING FOR

### Test Case 1: Happy Path
**Scenario**: Valid application submitted  
**Expected**: 
- ✅ Submission succeeds (HTTP 200)
- ✅ Application status → SUBMITTED
- ✅ Domain event published
- ✅ Applicant receives applicant template via email
- ✅ Admin receives admin template via telegram
- ✅ Reviewer receives reviewer template via internal

**We observe**: Every step above shows in console logs

---

### Test Case 2: Validation Failure (housingGoals)
**Scenario**: housingGoals missing after transformation  
**Expected**: 
- ❌ Submission fails (HTTP 400)
- ❌ Validation error: "housingGoals is required"
- ❌ Domain event NOT published
- ❌ No notifications sent

**We observe**: 
- STEP 3 shows housingGoals present in BEFORE, missing in AFTER
- STEP 5 shows validation error for housingGoals
- No Step 2 (event published) in console

**Evidence**: Console logs at STEP 3 + STEP 5

---

### Test Case 3: Wrong Recipient Routing
**Scenario**: Applicant receives admin notification (cross-contamination)  
**Expected**: ❌ Never happens  

**If it does happen, evidence shows**:
- STEP 5 shows applicant audience resolved
- But notification goes to admin email/telegram
- Template is admin template, not applicant template

**Root cause location**: 
- AudienceResolver returning wrong recipient?
- NotificationService sending to wrong audience?
- Template selection wrong?

**We find**: Console logs show exact recipient ID/email for applicant, then trace where that email gets replaced

---

## RED FLAGS TO WATCH FOR

| Red Flag | Meaning | Action |
|----------|---------|--------|
| No "Step 2" in console | Event not published | Check domain event publisher |
| No "Step 5" in console | Subscriber didn't receive | Check event bus |
| "Delivered: false" | Notification failed | Check provider logs |
| Applicant email = Admin email | Multi-tenant bug | Check audience resolver |
| Missing template variables | Template rendering failed | Check template resolver |
| "Validation failed" | Invalid data | Check transformation logic |

---

## WHEN OBSERVATION IS COMPLETE

We create a final report with:

```markdown
# PHASE 5H.7 FINAL FORENSIC REPORT

## Workflows Executed
- [x] WORKFLOW 1: User Registration
- [x] WORKFLOW 2: Application Submission
- [x] WORKFLOW 3: Application Approved
- [x] WORKFLOW 4: Document Requested
- [x] WORKFLOW 5: Application Rejected

## Evidence Collected
- [x] Console logs: {{N}} events traced
- [x] Database state: {{N}} records verified
- [x] Provider responses: {{N}} deliveries confirmed
- [x] Recipients: {{N}} audiences verified

## Divergences Found
- {{N}} divergences from expected behavior
  - [Issue 1]: Evidence at line XYZ in console
  - [Issue 2]: Evidence at line ABC in console

## Root Cause Analysis
| Issue | Expected | Actual | Evidence | File | Function | Line |
|-------|----------|--------|----------|------|----------|------|

## Repair Plan (Phase 5H.8)
- Repair 1: [Ordered by risk/impact]
- Repair 2: [...]
```

---

## SUCCESS CRITERIA FOR PHASE 5H.7

- [x] All instrumentation logging is in place (verified)
- [x] Forensic trace plan documented
- [x] Execution guide documented
- [x] Workflows ready for execution
- [x] Evidence collection templates prepared

**Next**: Execute workflows and document evidence.

