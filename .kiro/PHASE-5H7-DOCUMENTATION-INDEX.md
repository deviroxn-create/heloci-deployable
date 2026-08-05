# PHASE 5H.7 — Documentation Index

**Status**: DOCUMENTATION COMPLETE - READY FOR RUNTIME EXECUTION  
**Date**: August 5, 2026  
**Purpose**: Navigate Phase 5H.7 documentation

---

## PHASE 5H.7: FORENSIC RUNTIME FLOW VERIFICATION

### Mission
Determine the exact runtime behavior of Heloci's notification system before any code changes are made.

**Key Principle**: Observe only. No modifications. Every conclusion backed by runtime evidence.

---

## DOCUMENTATION HIERARCHY

### 1. START HERE: Executive Briefing
**File**: `PHASE-5H7-EXECUTIVE-BRIEFING.md`  
**Audience**: Team lead, decision makers, anyone wanting quick overview  
**Read Time**: 10 minutes  
**Contains**:
- Mission statement
- Current situation (what we know/don't know)
- Execution plan (high level)
- Expected outcomes (3 scenarios)
- Readiness check
- Timeline estimate

**Use This To**: Understand what Phase 5H.7 accomplishes and why

---

### 2. SYSTEM DESIGN: Expected Runtime Architecture
**File**: `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md`  
**Audience**: Developers, technical staff, architects  
**Read Time**: 30 minutes  
**Contains**:
- **Part A**: Expected System Design (8 workflows)
  - Workflow 1: User Registration
  - Workflow 2: User Login
  - Workflow 3: Application Draft Save
  - Workflow 4: Application Submit (CRITICAL)
  - Workflow 5: Application Approved
  - Workflow 6: Application Rejected
  - Workflow 7: Document Requested
  - Workflow 8: Document Uploaded
- **Part B**: Runtime Trace Execution Plan
- **Part C-E**: Pending runtime execution checklists

**Use This To**: Understand what SHOULD happen (expected behavior) for each workflow

---

### 3. EXECUTION GUIDE: How to Trace
**File**: `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`  
**Audience**: QA testers, engineers running the trace  
**Read Time**: 30 minutes  
**Contains**:
- Evidence hierarchy (4 levels)
- Instrumentation points (all 8 points)
- What evidence to collect at each point
- Critical verification points (4 key checks)
- Step-by-step trace execution
- Expected outputs for each workflow
- Divergence detection guide
- Success criteria

**Use This To**: Understand exactly HOW to run the trace and WHAT to look for

---

### 4. CURRENT STATE: What We Know vs. Don't Know
**File**: `PHASE-5H7-CURRENT-STATE-ANALYSIS.md`  
**Audience**: Technical staff, architects, code reviewers  
**Read Time**: 30 minutes  
**Contains**:
- **Part A**: What code inspection revealed
  - System architecture (CONFIRMED ✅)
  - Known issues (2 issues identified)
  - Communication registry (EXISTS ✅)
  - Audience resolver (EXISTS & INSTRUMENTED ✅)
  - Template service (EXISTS ✅)
  - Notification log (EXISTS ✅)
- **Part B**: What requires runtime evidence (8 gaps)
- **Part C**: Instrumentation status
- **Part D**: Execution readiness checklist
- **Part E**: Risk assessment
- **Part F**: Success definition

**Use This To**: Understand what has been verified through code inspection vs. what still needs runtime evidence

---

## READING PATHS

### Path A: Quick Overview
1. Read: `PHASE-5H7-EXECUTIVE-BRIEFING.md`
2. Skim: Workflow 4 in `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md`
3. **Time**: 15 minutes

---

### Path B: Complete Understanding
1. Read: `PHASE-5H7-EXECUTIVE-BRIEFING.md` (10 min)
2. Read: `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md` (30 min) - Focus on Part A
3. Read: `PHASE-5H7-CURRENT-STATE-ANALYSIS.md` (20 min) - Part A & B
4. **Time**: 60 minutes

---

### Path C: Execute the Trace (for QA/Testers)
1. Read: `PHASE-5H7-EXECUTIVE-BRIEFING.md` (10 min) - Understand mission
2. Read: `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md` (20 min) - Understand evidence points
3. Review: Workflow 4 in `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md` (10 min) - Know expected behavior
4. Execute: Follow step-by-step trace in `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`
5. **Time**: 40+ minutes (plus execution time)

---

### Path D: Fix Issues (for Phase 5H.8)
1. Read: `PHASE-5H7-CURRENT-STATE-ANALYSIS.md` (30 min)
2. Review: Expected vs. actual in trace results
3. Use: Root cause analysis to identify fix location
4. Reference: `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md` for divergence patterns
5. **Time**: 30+ minutes (plus Phase 5H.8 execution)

---

## KEY DOCUMENTS HIERARCHY

```
PHASE-5H7-DOCUMENTATION (Root Index - You Are Here)
├── PHASE-5H7-EXECUTIVE-BRIEFING.md
│   └── High-level overview for decision makers
│
├── PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md
│   ├── Part A: Expected system design
│   ├── Part B: Runtime trace plan
│   └── Parts C-E: Execution checklists
│
├── PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md
│   ├── Evidence hierarchy
│   ├── 8 instrumentation points
│   └── Step-by-step execution guide
│
└── PHASE-5H7-CURRENT-STATE-ANALYSIS.md
    ├── Part A: Code inspection findings
    ├── Part B: Gaps requiring runtime evidence
    └── Parts C-F: Analysis & readiness
```

---

## PREVIOUS PHASES & CONTEXT

### Related Documentation

**Phase 5G: Communication Runtime Certification**
- File: `PHASE-5G-MASTER-SPECIFICATION.md`
- Purpose: Overall communication subsystem audit
- Relationship: Phase 5H.7 is part of Phase 5G delivery

**Phase 5G.1 Status**: Database recovery complete, Phase 5G.1 (audit) ready
**Phase 5H.7 Purpose**: Forensic verification before repairs

**Earlier Analysis**:
- File: `APPLICATION-SUBMIT-ISSUE-ANALYSIS.md`
- Status: Issues identified (boolean conversion, recipient routing)
- Relationship: Those issues are what we verify in Phase 5H.7

---

## WORKFLOW DETAILS QUICK REFERENCE

### Critical Workflow: Application Submit (Workflow 4)

**Expected Behavior** (from `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md`):
- Actor: Admin (alice@heloci.ngo)
- Application Owner: Applicant (bob@example.com)
- Event published: YES
- Event payload userId: bob-xxx (applicant, NOT admin)
- Event payload email: bob@example.com (applicant, NOT admin)
- Applicant receives: Email
- Admin receives: Internal/Telegram

**Verification Steps** (from `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`):
1. Check: "📬 [Notification] Application submitted event publishing:" in logs
2. Verify: actor ≠ application.ownerId
3. Verify: recipient.email === applicant email
4. Check: Audience resolver identifies 2 audiences (applicant + admin)
5. Check: NotificationLog has 2 entries (email + internal/telegram)

**Why This Matters**: This workflow exposes both known issues (boolean conversion + recipient routing)

---

## EXECUTION TIMELINE

**Recommended Execution Schedule**:

```
| Time | Activity | Duration | Status |
|------|----------|----------|--------|
| T+0 | Read briefs | 20 min | Preparation |
| T+20 | Review code | 15 min | Preparation |
| T+35 | Start dev server | 5 min | Setup |
| T+40 | Workflow 1 (Registration) | 10 min | Trace |
| T+50 | Workflow 2 (Login) | 5 min | Trace |
| T+55 | Workflow 3 (Draft Save) | 5 min | Trace |
| T+60 | Workflow 4 (Application Submit) | 20 min | CRITICAL |
| T+80 | Workflow 5 (Application Approved) | 10 min | Trace |
| T+90 | Workflow 6 (Application Rejected) | 10 min | Trace |
| T+100 | Workflow 7 (Document Requested) | 10 min | Trace |
| T+110 | Workflow 8 (Document Uploaded) | 10 min | Trace |
| T+120 | Compile results | 20 min | Analysis |
| T+140 | Produce report | 20 min | Documentation |
| ---- | TOTAL | 140 min | 2h 20min |
```

**Estimated Total Time**: 2-3 hours

---

## EVIDENCE COLLECTION CHECKLIST

**For Each Workflow, Collect**:

- [ ] Console logs (copy-paste from terminal)
- [ ] Timestamps (when did request arrive/complete)
- [ ] Database query results (NotificationLog entries)
- [ ] Provider responses (if visible in logs)
- [ ] Any errors or divergences

**Final Deliverables**:

- [ ] Runtime Trace Report (all workflows traced)
- [ ] Recipient Verification Matrix (was correct person notified?)
- [ ] Template Verification Matrix (was template found and rendered?)
- [ ] Provider Verification Matrix (did API calls succeed?)
- [ ] Database Verification Matrix (were logs persisted?)
- [ ] Expected vs. Actual Comparison (any divergences?)
- [ ] Root Cause Analysis (if failures exist)

---

## RULES REMINDER

### DO ✅
- Collect evidence from runtime execution
- Monitor console logs
- Query database
- Document findings exactly as observed
- Add temporary logging (already done)

### DON'T ❌
- Modify business logic
- Change notification routing
- Alter audience resolver
- Modify templates
- Change database schema
- Commit any code changes

---

## NEXT PHASES

### After Phase 5H.7 Complete

**If all workflows match expected behavior**:
→ Phase 5G.3: Re-Audit (confirm)
→ Phase 5G.4: Regression Test Suite
→ Phase 5G.5: Production Certification

**If divergences found**:
→ Phase 5H.8: Targeted Repair (fix only confirmed issues)
→ Phase 5G.3: Re-Audit (retest)
→ Phase 5G.4: Regression Test Suite
→ Phase 5G.5: Production Certification

---

## CONTACT & ESCALATION

### Questions About Phase 5H.7?

**Understanding Mission/Scope**: Review `PHASE-5H7-EXECUTIVE-BRIEFING.md`

**Understanding Expected Behavior**: Review `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md` Part A

**Understanding How to Execute**: Review `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`

**Understanding Code Changes Needed**: Review `PHASE-5H7-CURRENT-STATE-ANALYSIS.md`

---

## VERSION HISTORY

| Version | Date | Status | Content |
|---------|------|--------|---------|
| 1.0 | Aug 5, 2026 | ACTIVE | Initial documentation for Phase 5H.7 |

---

**Phase 5H.7 is ready to execute.**

**Next Step**: Read `PHASE-5H7-EXECUTIVE-BRIEFING.md` to begin.

