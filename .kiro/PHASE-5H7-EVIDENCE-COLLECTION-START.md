# PHASE 5H.7 — START EVIDENCE COLLECTION

**Status**: Ready for execution  
**All templates prepared**: YES  
**Code modifications**: NONE  
**Instructions**: Below

---

## YOUR ROLE

Execute workflows via browser/UI while watching server console for logs.
Document console evidence in the prepared templates.
No code changes. No fixes. Only observation.

---

## SETUP

### 1. Start Development Server

```bash
npm run dev
```

Keep this terminal open. All instrumentation logs appear here.

### 2. Open Browser

```
http://localhost:3000
```

### 3. Open Server Terminal

Side-by-side with browser so you can watch logs while executing actions.

---

## EVIDENCE FILES PREPARED

All 8 workflows have evidence collection templates:

```
.kiro/PHASE-5H7-WORKFLOW-1-USER-REGISTRATION-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-2-USER-LOGIN-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-3-DRAFT-SAVE-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-4-APPLICATION-SUBMIT-EVIDENCE.md  ⭐ CRITICAL
.kiro/PHASE-5H7-WORKFLOW-5-APPLICATION-APPROVED-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-6-APPLICATION-REJECTED-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-7-DOCUMENTS-REQUESTED-EVIDENCE.md
.kiro/PHASE-5H7-WORKFLOW-8-INTERNAL-MESSAGING-EVIDENCE.md
```

---

## EXECUTION ORDER

### WORKFLOW 1: USER REGISTRATION

**In Browser:**
1. Navigate to http://localhost:3000/auth/register
2. Fill in form:
   - Email: test-{{timestamp}}@example.com
   - Password: Test@1234
   - Name: Test User
3. Click Register

**In Server Terminal:**
Watch for instrumentation:
```
STEP 1: [AuthService] User registration initiated
  Email: {{email}}

STEP 2: [Database] User created
  User ID: {{userId}}

========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: user.registration
  [payload details]

Step 2: Domain Subscriber
  Event Received: user.registration

Step 3: Event Mapping
  Domain Event: user.registration
  Communication Event: user_registration

Step 5: Audience Resolution
  [audience details]
```

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-1-USER-REGISTRATION-EVIDENCE.md`
Fill in all sections with what you see in console
Mark PASS or FAIL

---

### WORKFLOW 2: USER LOGIN

**In Browser:**
1. Navigate to http://localhost:3000/auth/login
2. Enter credentials you just registered
3. Click Login

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-2-USER-LOGIN-EVIDENCE.md`
Fill in evidence
Mark PASS or FAIL

---

### WORKFLOW 3: APPLICATION DRAFT SAVE

**In Browser:**
1. After login, navigate to application form
2. Fill in some fields (don't complete)
3. Click Save Draft

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-3-DRAFT-SAVE-EVIDENCE.md`
Expected: NO event published (draft is interim state)
Mark PASS or FAIL

---

### WORKFLOW 4: APPLICATION SUBMIT ⭐

**CRITICAL WORKFLOW - Full trace required**

**In Browser:**
1. Navigate to application form
2. Fill ALL required fields
3. Click Submit

**In Server Terminal - Watch for COMPLETE trace:**

Look for STEPS 1-6:
```
========== SUBMIT PIPELINE TRACE ==========
STEP 1: Incoming HTTP Request
  [details]

STEP 2: Raw Wizard Payload
  [payload details]
  Check: housingGoals present?

STEP 3: Transformation
  BEFORE: [keys]
  AFTER: [keys]
  CHECK: Is housingGoals in AFTER?

STEP 4: Question Set
  [question details]

STEP 5: Validator Input & Result
  [validation details]
  If FAILED: Which field? What error?

STEP 6: Database Write
  [database operation]
```

Then look for PART 2 (notification trace):
```
========== PART 2: NOTIFICATION TRACE ==========
Step 1: Event Published
  Event Name: application.submitted
  [payload]

Step 2: Domain Subscriber
  Event Received: application.submitted

Step 3: Event Mapping
  Domain Event: application.submitted
  Communication Event: application_submitted

Step 5: Audience Resolution
  [audiences]
  CHECK: applicant email ≠ admin email?

Step 4: Notification Service Result
  Delivered: [true/false]
  Channels: [list]
```

**⚠️ CRITICAL CHECK:**

If you see this in console:
```
STEP 5: Validator Input & Result
  Validation Result: FAILED
```

STOP. Do NOT continue past this divergence.
Copy the exact error message.
Record it in the evidence file under "If FAIL".
Mark FAIL and move to next workflow.

If validation PASSES, continue watching.

If you see:
```
Step 5: Audience Resolution
  Audience 0: applicant
    Email: {{applicantEmail}}
  Audience 1: org_admin  
    Email: {{adminEmail}}
```

**Verify the emails are DIFFERENT.**
If they are the same → CROSS-CONTAMINATION BUG.
Record exact evidence.

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-4-APPLICATION-SUBMIT-EVIDENCE.md`
Paste COMPLETE console output
Fill in all sections
Mark PASS or FAIL
If FAIL, document EXACTLY where divergence begins

---

### WORKFLOW 5: APPLICATION APPROVED

**In Browser:**
1. Go to admin dashboard
2. Find the application you just submitted
3. Click Approve

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-5-APPLICATION-APPROVED-EVIDENCE.md`
Fill in evidence from console
Mark PASS or FAIL

---

### WORKFLOW 6: APPLICATION REJECTED

**In Browser:**
1. Submit another application (repeat Workflow 4)
2. Go to admin dashboard
3. Find new application
4. Click Reject

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-6-APPLICATION-REJECTED-EVIDENCE.md`
Fill in evidence
Mark PASS or FAIL

---

### WORKFLOW 7: DOCUMENTS REQUESTED

**In Browser:**
1. Go to admin dashboard
2. Find an application
3. Click "Request Documents"
4. Select document type
5. Click Send

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-7-DOCUMENTS-REQUESTED-EVIDENCE.md`
Fill in evidence
Mark PASS or FAIL

---

### WORKFLOW 8: INTERNAL MESSAGING

**In Browser:**
1. Go to case/conversation
2. Type a message
3. Click Send

**Document:**
Open `.kiro/PHASE-5H7-WORKFLOW-8-INTERNAL-MESSAGING-EVIDENCE.md`
Fill in evidence
Mark PASS or FAIL

---

## AFTER ALL WORKFLOWS

1. Open `.kiro/PHASE-5H7-FINAL-EVIDENCE-MATRIX.md`
2. For each workflow, fill in matrix row:
   - First Divergence (or "NO DIVERGENCE")
   - Root Cause (from evidence)
   - Evidence (reference to console)

3. If any FAILED workflows:
   - Ensure exact divergence point is documented
   - Ensure evidence is copied verbatim from console
   - Ensure root cause is backed by evidence

---

## RULES (NON-NEGOTIABLE)

❌ NO code changes
❌ NO validator changes
❌ NO mapper changes
❌ NO architecture changes
✅ Observation only
✅ Evidence only
✅ Console logs only

---

## EXPECTED FINDINGS

Based on Phase 5H investigation, we expect to find:

### Likely Issues:

1. **Application Submit (Workflow 4)**
   - housingGoals missing after transformation
   - Validation fails because housingGoals required but missing
   - Application never submitted (HTTP 400)
   - Domain event never published

2. **Cross-Contamination Risk**
   - Admin might receive applicant template
   - Applicant might receive admin template
   - Verify via Workflow 4 console

### Possible Issues:

3. **Notification routing errors**
   - Check Workflows 1, 2, 5, 6, 7, 8

---

## NEXT PHASE

Once evidence matrix is complete → Phase 5H.8 (Targeted Repair) begins.

Repairs will be made ONLY for documented divergences with evidence.

---

## BEGIN NOW

1. ✅ Start `npm run dev`
2. ✅ Execute Workflow 1 (Registration)
3. ✅ Document in PHASE-5H7-WORKFLOW-1-*.md
4. ✅ Continue through Workflow 8
5. ✅ Fill evidence matrix
6. ✅ Ready for Phase 5H.8

**Ready to begin.**

