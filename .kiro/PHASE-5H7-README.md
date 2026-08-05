# PHASE 5H.7 — FORENSIC RUNTIME FLOW VERIFICATION

**Status**: Documentation Complete, Ready for Execution  
**Date**: August 4, 2026  
**Mission**: Observe actual system behavior. No code modifications.

---

## PURPOSE

This phase exists to answer a critical question with 100% confidence:

> When an applicant submits an application, does the system correctly route notifications to the applicant AND the organization admin without cross-contamination?

We will NOT fix anything. We will ONLY observe and document.

---

## DOCUMENTS IN THIS PHASE

### 1. **PHASE-5H7-FORENSIC-METHODOLOGY.md**
- **Purpose**: Understand the forensic approach
- **Read if**: You want to understand WHY we're doing this observation
- **Contains**: 
  - What is forensic observation?
  - Why it matters
  - Evidence hierarchy
  - Instrumentation strategy

### 2. **PHASE-5H7-EXPECTED-ARCHITECTURE.md**
- **Purpose**: Know what the system SHOULD do
- **Read if**: You want to understand the expected behavior
- **Contains**:
  - Complete architecture diagram
  - Communication registry entries
  - Audience resolution logic
  - Template selection logic
  - Channel routing logic
  - Critical invariants
  - Data flow walkthrough

### 3. **PHASE-5H7-FORENSIC-RUNTIME-TRACE-PLAN.md**
- **Purpose**: Understand the complete trace plan
- **Read if**: You want to understand what will be traced
- **Contains**:
  - Part A: Expected system architecture (5 workflows)
  - Part B: Instrumentation plan
  - Part C: Workflow execution plan
  - Part D: Evidence collection template
  - Part E: Comparison template
  - Success criteria

### 4. **PHASE-5H7-EXECUTION-GUIDE.md**
- **Purpose**: Step-by-step instructions for running workflows
- **Read if**: You are ready to execute the observation
- **Contains**:
  - Detailed steps for each workflow
  - Expected console output
  - Verification checklist
  - Success criteria per workflow
  - Documentation template

### 5. **PHASE-5H7-README.md** (this file)
- **Purpose**: Orientation and quick reference
- **Contains**: Overview, document index, execution checklist

---

## QUICK START

### Step 1: Understand the Mission
Read: **PHASE-5H7-FORENSIC-METHODOLOGY.md**

### Step 2: Understand Expected Behavior
Read: **PHASE-5H7-EXPECTED-ARCHITECTURE.md**

### Step 3: Prepare for Execution
Read: **PHASE-5H7-EXECUTION-GUIDE.md**

### Step 4: Execute Workflows
Follow: **PHASE-5H7-EXECUTION-GUIDE.md** → Workflows 1-4

### Step 5: Document Evidence
Create: `.kiro/PHASE-5H7-WORKFLOW-{{N}}-{{NAME}}-TRACE.md` (one per workflow)

### Step 6: Analyze Results
Compare expected vs actual, document divergences

### Step 7: Phase Complete
When all workflows traced, create final report

---

## EXECUTION CHECKLIST

- [ ] **BEFORE STARTING**
  - [ ] Development server running (`npm run dev`)
  - [ ] Browser at `http://localhost:3000`
  - [ ] Browser console open (F12)
  - [ ] Server terminal visible with logs
  - [ ] Test data prepared (test user account)

- [ ] **WORKFLOW 1: User Registration**
  - [ ] Execute registration
  - [ ] Capture console logs
  - [ ] Verify user created
  - [ ] Verify welcome email
  - [ ] Document in `PHASE-5H7-WORKFLOW-1-REGISTRATION-TRACE.md`

- [ ] **WORKFLOW 2: Application Submission**
  - [ ] Execute application submission
  - [ ] Capture COMPLETE console log trace
  - [ ] Verify application status changed
  - [ ] Verify domain event published
  - [ ] Verify applicant + admin audiences resolved
  - [ ] Verify applicant email ≠ admin telegram
  - [ ] Document in `PHASE-5H7-WORKFLOW-2-SUBMISSION-TRACE.md`

- [ ] **WORKFLOW 3: Application Approved**
  - [ ] Execute application approval
  - [ ] Capture console logs
  - [ ] Verify approval event published
  - [ ] Verify correct recipients
  - [ ] Document in `PHASE-5H7-WORKFLOW-3-APPROVED-TRACE.md`

- [ ] **WORKFLOW 4: Document Requested**
  - [ ] Execute document request
  - [ ] Capture console logs
  - [ ] Verify applicant receives request
  - [ ] Document in `PHASE-5H7-WORKFLOW-4-DOCUMENTS-TRACE.md`

- [ ] **ANALYSIS**
  - [ ] Create comparison table: expected vs actual
  - [ ] Document any divergences with evidence
  - [ ] Create root cause analysis for each divergence

- [ ] **PHASE COMPLETE**
  - [ ] All workflows documented
  - [ ] All console logs captured
  - [ ] All divergences identified
  - [ ] All root causes located
  - [ ] Final report created

---

## KEY VERIFICATION POINTS

### For Application Submission (Workflow 2):

**MUST SEE in console:**

1. ✅ HTTP request logged (STEP 1)
2. ✅ Raw wizard payload logged (STEP 2)
3. ✅ Transformation logged (STEP 3)
   - [ ] housingGoals present in BEFORE?
   - [ ] housingGoals present in AFTER?
4. ✅ Question set loaded (STEP 4)
5. ✅ Validation result (STEP 5)
   - [ ] PASSED or FAILED?
   - [ ] If FAILED, which field?
6. ✅ Database write logged (STEP 6)
7. ✅ Domain event published (Step 1 of PART 2)
8. ✅ Subscriber received (Step 2)
9. ✅ Registry lookup (Step 3)
10. ✅ Audience resolution (Step 5)
    - [ ] Applicant: User ID + Email
    - [ ] Org Admin: User ID + Email
    - [ ] **Applicant email ≠ Admin email?**
11. ✅ Notification result (Step 4)

### Critical Question

**After completing Workflow 2, ask:**

> Did the console logs prove that the applicant received an applicant-facing email AND the admin received an admin-facing telegram notification, with no cross-contamination?

**YES** → Continue to next workflow  
**NO** → Document exactly where divergence occurs  
**UNCLEAR** → Re-run workflow, capture more logs  

---

## WHEN PHASE 5H.7 IS COMPLETE

You will have:

✅ Evidence that every workflow executed (console logs)  
✅ Proof that (or proof that NOT) notifications reached correct recipients  
✅ Documentation of any cross-contamination  
✅ Exact location (file + function + line) of any divergence  
✅ Confidence in what needs to be repaired in Phase 5H.8  

**You will NOT have:**
❌ Any code modifications  
❌ Any bug fixes  
❌ Any architectural changes  

---

## RULES (NON-NEGOTIABLE)

### Rule 1: No Code Modifications
Temporary logging only. No business logic changes.

### Rule 2: Runtime Evidence Only
Every conclusion backed by console logs. No assumptions.

### Rule 3: No Fixes
Document divergences. Don't fix them.

### Rule 4: Complete Observation
All workflows executed before analysis begins.

---

## DOCUMENTS TO CREATE DURING EXECUTION

For each workflow executed, create:

```
PHASE-5H7-WORKFLOW-{{N}}-{{NAME}}-TRACE.md

Contents:
- Expected behavior (from architecture docs)
- Actual behavior (from console logs)
- Comparison table (expected vs actual, match y/n)
- If divergence: exact location in console logs
- Evidence: file + function + line (if found)
```

Example filenames:
- `PHASE-5H7-WORKFLOW-1-REGISTRATION-TRACE.md`
- `PHASE-5H7-WORKFLOW-2-SUBMISSION-TRACE.md`
- `PHASE-5H7-WORKFLOW-3-APPROVED-TRACE.md`
- `PHASE-5H7-WORKFLOW-4-DOCUMENTS-TRACE.md`

---

## FINAL REPORT (After All Workflows)

When all workflows are complete, create:

```
PHASE-5H7-FINAL-FORENSIC-REPORT.md

Contents:
- Executive Summary
- Workflows Executed (checklist)
- Evidence Collected (count of traces)
- Divergences Found (if any)
  - For each: expected vs actual, evidence, location
- Root Cause Analysis (table format)
- Repair Plan (ordered by risk/impact)
```

---

## SUCCESS CRITERIA

This phase is **COMPLETE ONLY WHEN:**

- [x] Forensic methodology documented
- [x] Expected architecture documented
- [x] Trace plan documented
- [x] Execution guide documented
- [ ] All workflows executed
- [ ] All console logs captured
- [ ] All evidence documented
- [ ] All divergences located
- [ ] Final report created

---

## NEXT PHASE

**Phase 5H.8: Targeted Repair**

Only after 5H.7 is complete can repairs begin:
- Fix only documented issues
- Use evidence from 5H.7
- No assumptions
- No architectural changes

---

## SUPPORT FILES

For quick reference:

**Architecture**: See `PHASE-5H7-EXPECTED-ARCHITECTURE.md` for:
- Communication registry entries
- Audience resolution logic
- Template selection logic
- Channel routing logic

**Execution**: See `PHASE-5H7-EXECUTION-GUIDE.md` for:
- Step-by-step workflow instructions
- Expected console output
- Verification checklists

**Methodology**: See `PHASE-5H7-FORENSIC-METHODOLOGY.md` for:
- Why forensic observation matters
- Evidence hierarchy
- What to watch for (red flags)
- When observation is complete

---

## BEGIN EXECUTION

When ready:

1. Open `PHASE-5H7-EXECUTION-GUIDE.md`
2. Follow Workflow 1: User Registration
3. Capture all console output
4. Document in `PHASE-5H7-WORKFLOW-1-REGISTRATION-TRACE.md`
5. Continue to Workflow 2, 3, 4
6. Create final report

**Good luck. Observe carefully. Document thoroughly. Assume nothing.**

