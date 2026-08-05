# PHASE 5H.7 — Forensic Runtime Flow Verification

**Status**: ✅ DOCUMENTATION COMPLETE - READY TO EXECUTE  
**Date**: August 5, 2026  
**Authority**: Pre-remediation audit phase (NO CODE CHANGES)

---

## WHAT IS PHASE 5H.7?

A forensic audit of Heloci's notification system to determine the **exact runtime behavior** before any code changes are made.

**Key Rule**: Observe only. No modifications. Every conclusion backed by runtime evidence.

---

## QUICK START

### 1. For Team Leads & Decision Makers (10 min read)
→ Open: `PHASE-5H7-EXECUTIVE-BRIEFING.md`

### 2. For QA/Testers (Execute the trace)
→ Open: `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`
→ Then: `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md`

### 3. For Developers (Understand the system)
→ Open: `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md` (Part A)
→ Then: `PHASE-5H7-CURRENT-STATE-ANALYSIS.md`

### 4. For Navigation (Find anything)
→ Open: `PHASE-5H7-DOCUMENTATION-INDEX.md`

---

## DOCUMENTATION FILES

```
PHASE-5H7-DOCUMENTATION-INDEX.md
    ├─ QUICK REFERENCE for all files
    └─ Reading paths for different roles

PHASE-5H7-EXECUTIVE-BRIEFING.md
    ├─ Mission statement
    ├─ Current situation
    ├─ Execution plan
    ├─ Expected outcomes
    └─ Timeline estimate

PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md
    ├─ PART A: Expected system design (8 workflows)
    ├─ PART B: Runtime trace execution plan
    └─ PART C-E: Checklists & criteria

PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md
    ├─ Evidence hierarchy (4 levels)
    ├─ 8 instrumentation points
    ├─ Critical verification points
    ├─ Step-by-step execution guide
    └─ Divergence detection patterns

PHASE-5H7-CURRENT-STATE-ANALYSIS.md
    ├─ PART A: Code inspection findings
    ├─ PART B: Gaps requiring runtime evidence
    ├─ PART C: Instrumentation status
    ├─ PART D: Readiness checklist
    ├─ PART E: Risk assessment
    └─ PART F: Success definition
```

---

## 8 WORKFLOWS TO TRACE

| # | Workflow | Expected Recipients | Status |
|---|----------|-------------------|--------|
| 1 | User Registration | Applicant (email) | ❓ Pending |
| 2 | User Login | Applicant (email) | ❓ Pending |
| 3 | Application Draft Save | NONE (no event) | ❓ Pending |
| 4 | **Application Submit** | Applicant (email) + Admin (internal/telegram) | ❓ CRITICAL |
| 5 | Application Approved | Applicant (email) + Admin (internal) | ❓ Pending |
| 6 | Application Rejected | Applicant (email) + Admin (internal) | ❓ Pending |
| 7 | Document Requested | Applicant (email) | ❓ Pending |
| 8 | Document Uploaded | Admin/Reviewer (internal/telegram) | ❓ Pending |

---

## WHAT WE'RE VERIFYING

### ✅ ALREADY CONFIRMED (Code Inspection)

- Complete event flow path exists
- All services implemented and instrumented
- Two critical fixes applied:
  1. Boolean conversion (true/false → "true"/"false")
  2. Recipient routing (use applicant, not admin)
- Database schema supports logging
- All providers configured (Resend, Telegram, Internal)

### ❓ REQUIRES RUNTIME EVIDENCE

1. Do the fixes actually work?
2. Is applicant email correctly in event payload?
3. Does audience resolver identify correct recipients?
4. Are templates found and rendered?
5. Do emails reach Resend API successfully?
6. Do admin notifications reach Telegram/internal?
7. Are notification logs created accurately?
8. Are all 8 workflows functioning?

---

## EXECUTION TIMELINE

**Estimated Duration**: 2-3 hours

```
Phase 1: Preparation (25 min)
  ├─ Read briefs & understand mission
  ├─ Review code inspection findings
  └─ Start development server

Phase 2: Execute Workflows (100 min)
  ├─ Workflow 1: User Registration (10 min)
  ├─ Workflow 2: User Login (5 min)
  ├─ Workflow 3: Draft Save (5 min)
  ├─ Workflow 4: Application Submit (20 min) ← CRITICAL
  ├─ Workflow 5: Application Approved (10 min)
  ├─ Workflow 6: Application Rejected (10 min)
  ├─ Workflow 7: Document Requested (10 min)
  └─ Workflow 8: Document Uploaded (10 min)

Phase 3: Analysis & Reporting (40 min)
  ├─ Compile runtime traces
  ├─ Compare expected vs. actual
  ├─ Identify divergences (if any)
  └─ Produce final report
```

---

## EVIDENCE TO COLLECT

**For Each Workflow, Capture**:

1. **Console Logs** — Real-time traces from instrumentation points
2. **Database Records** — NotificationLog entries (recipient, status, template)
3. **Provider Responses** — API success/failure (Resend, Telegram)
4. **Timestamps** — When did each step occur?
5. **Any Divergences** — Did actual behavior match expected?

---

## SUCCESS CRITERIA

**Phase 5H.7 succeeds when:**

✅ All 8 workflows have been executed  
✅ Runtime traces captured for each  
✅ Expected vs. actual documented  
✅ Divergence points identified (if any)  
✅ Root causes pinpointed (if failures exist)  
✅ No production code modified  

---

## RULES

### ✅ DO
- Collect evidence from runtime execution
- Monitor console logs
- Query database
- Document findings exactly as observed
- Add temporary logging (already done in code)

### ❌ DON'T
- Modify business logic
- Change notification routing
- Alter audience resolver
- Modify templates
- Change database schema
- Commit any code changes

**Exception**: Only temporary logging is allowed (already in place).

---

## PHASE OUTCOMES

### Scenario A: All Workflows Match Expected ✅
→ Phase 5G.3 (Re-Audit)  
→ Phase 5G.4 (Regression Tests)  
→ Phase 5G.5 (Production Certification)

### Scenario B: Some Divergences Found ⚠️
→ Phase 5H.8 (Targeted Repair)  
→ Phase 5G.3 (Re-Audit)  
→ Phases 5G.4-5G.5

### Scenario C: Systematic Failures 🔴
→ Stop & diagnose root cause  
→ Then proceed to repair

---

## NEXT STEPS

**To Begin Phase 5H.7**:

1. **For Overview** (10 min):
   ```
   Read: PHASE-5H7-EXECUTIVE-BRIEFING.md
   ```

2. **To Execute** (2-3 hours):
   ```
   Read:    PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md
   Execute: Follow step-by-step instructions
   Collect: Console logs + database records
   Report:  Compile findings
   ```

3. **For Deep Dive** (60 min):
   ```
   Read: PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md (Part A)
   Read: PHASE-5H7-CURRENT-STATE-ANALYSIS.md (Parts A-B)
   ```

---

## CONTEXT

### Related Documentation

- **Phase 5G Master Specification**: `PHASE-5G-MASTER-SPECIFICATION.md`
- **Previous Issue Analysis**: `APPLICATION-SUBMIT-ISSUE-ANALYSIS.md`
- **Runtime Audit Plan**: `PHASE-5G-RUNTIME-AUDIT-PLAN.md`

### Known Issues (to verify during execution)

1. **Boolean Type Mismatch**: Frontend sends true/false, validator expects "true"/"false"
   - Status: FIX APPLIED in `application-service.ts` line 83-85
   - Verification: Does validation pass now?

2. **Wrong Recipient**: Event payload used admin's email instead of applicant's email
   - Status: FIX APPLIED in `application-service.ts` lines 237-248
   - Verification: Does applicant receive notification now?

---

## CONTACT

### Questions?

1. **"What is the mission?"** → Read `PHASE-5H7-EXECUTIVE-BRIEFING.md`
2. **"How do I execute?"** → Read `PHASE-5H7-EVIDENCE-COLLECTION-PROTOCOL.md`
3. **"What should happen?"** → Read `PHASE-5H7-RUNTIME-FLOW-VERIFICATION.md`
4. **"What's still unknown?"** → Read `PHASE-5H7-CURRENT-STATE-ANALYSIS.md`
5. **"How do I navigate?"** → Read `PHASE-5H7-DOCUMENTATION-INDEX.md`

---

## AUTHORITY

**Phase 5H.7 is authorized by:**
- Master Specification (Phase 5G)
- Forensic audit protocol
- Production readiness verification

**Phase 5H.7 must complete before Phase 5H.8 begins.**

---

**Ready to begin? Start with `PHASE-5H7-EXECUTIVE-BRIEFING.md`**

