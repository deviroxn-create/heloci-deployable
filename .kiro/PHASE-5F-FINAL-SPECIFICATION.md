# PHASE 5F — Runtime Verification (Final Specification)

**Status:** Ready to execute  
**Duration:** 1-2 weeks  
**Architecture Budget:** Complete (Phase 1 ✓, Phase 2 now, Phase 3 next)

---

## Current Goal

Verify that the existing communication system behaves correctly without introducing new architectural layers, frameworks, or abstractions.

This is **verification only** — no refactoring, no new tools, no redesign.

---

## Why It Matters

Heloci's notification system is the backbone of user engagement. Before scaling or building new tools, you need certainty the current system is sound and production-ready.

---

## What "Done" Looks Like

✅ All six verification tests pass  
✅ Each test proves three things (expected output, tenant isolation, audit evidence)  
✅ Verification report generated with runtime evidence  
✅ Any genuine defects documented  
✅ Communication subsystem cleared for Phase 6 (Freeze)  
✅ Stop Rule enforced (subsystem enters Maintenance Mode)

---

## Scope

### Exactly What Is Included

**Six Runtime Verifications:**
1. Audience Resolution
2. Template Resolution
3. Sender Resolution
4. NotificationLog Persistence
5. End-to-End: user_registration
6. End-to-End: application_approved

**Each verification must prove three things:**
- Expected Output (does it work correctly?)
- Tenant Isolation (no data leaks?)
- Audit Evidence (does the log agree?)

### Exactly What Is NOT Included

❌ Do NOT:
- Build a runtime inspector tool
- Build a certification engine
- Introduce new abstractions
- Refactor working components
- Create trace-recorder utilities
- Design new contracts
- Implement queuing or retry logic

**Keep this simple.** Test what you have. Verify it works. Document findings. Move on.

---

## Deliverables

### 1. Verification Tests
Create self-contained test directory:

```
tests/phase-5f-runtime-verification/
├── audience.test.ts
├── template.test.ts
├── sender.test.ts
├── persistence.test.ts
├── user-registration.e2e.test.ts
└── application-approved.e2e.test.ts
```

Each test proves three things (see Exit Criteria for details).

### 2. Verification Report
File: `.kiro/PHASE-5F-VERIFICATION-REPORT.md`

Contents:
- Summary (pass/fail for each verification)
- Runtime evidence (what happened in each test)
- Tenant isolation verification results
- Audit evidence collected
- Any defects discovered (with impact level)
- Confidence level for moving to Phase 6

### 3. Defect Report (if any)
File: `.kiro/PHASE-5F-DEFECTS.md`

Only created if defects found:
- Specific, reproducible issue
- Location in code
- Impact (critical, high, low)
- Whether it blocks Phase 6

---

## Exit Criteria

### All Verification Tests Must Pass

**Audience Resolution Test:**
✓ Correct recipients selected for event  
✓ No data leaks between organizations  
✓ NotificationLog would record correct recipients

**Template Resolution Test:**
✓ Correct template selected (platform or org)  
✓ All variables would be rendered  
✓ NotificationLog would store template key

**Sender Resolution Test:**
✓ Correct sender (platform or org)  
✓ Verified domain confirmed  
✓ NotificationLog would agree

**Persistence Test:**
✓ Log stores exactly what was sent  
✓ Provider ID captured (Resend email ID)  
✓ Status correct (SENT or FAILED)

**End-to-End: user_registration:**
✓ Complete flow executes  
✓ No tenant data leaks  
✓ Log matches dispatch exactly

**End-to-End: application_approved:**
✓ Multiple audiences handled correctly  
✓ Organization isolation verified  
✓ All logs recorded with correct values

### No Blocking Defects

- Defects found are documented
- Blocking defects fixed before Phase 6
- Non-blocking defects can be fixed later

### Tests Pass Without Warnings

- No console errors
- No unexpected mutations
- No data integrity issues

---

## Stop Rule

**When all verification tests pass:**

The Communication subsystem enters **MAINTENANCE MODE**.

**Until another phase explicitly reopens the subsystem:**

- ❌ NO new notification features
- ❌ NO runtime inspector
- ❌ NO tracing framework
- ❌ NO certification framework
- ❌ NO architecture redesign
- ✅ Only production bug fixes permitted

**To reopen requires:** A genuine production defect + explicit decision + new phase

This prevents endless iteration. Verification complete = subsystem frozen.

---

## Architecture Budget Status

Communication subsystem budget:

| Phase | Status | What |
|-------|--------|------|
| Phase 1: Architecture | ✅ Complete | Design and build |
| Phase 2: Verification | ⏳ Now (5F) | Test and validate |
| Phase 3: Freeze | 🔜 Next (6) | Document and close |
| Budget Exhausted | 🔒 After Phase 6 | Maintenance only |

---

## How to Run

### Run All Tests
```bash
npm run test -- tests/phase-5f-runtime-verification/
```

### Run Individual Verification
```bash
npm run test -- tests/phase-5f-runtime-verification/audience.test.ts
```

### Generate Report
After all tests pass:
1. Document findings in `.kiro/PHASE-5F-VERIFICATION-REPORT.md`
2. List any defects in `.kiro/PHASE-5F-DEFECTS.md`
3. Confirm exit criteria met
4. Mark communication subsystem for Phase 6 Freeze

---

## Timeline

- **Day 1:** Audience resolution test
- **Day 2:** Template resolution test
- **Day 3:** Sender resolution test
- **Day 4:** Persistence test
- **Day 5:** user_registration E2E test
- **Day 6:** application_approved E2E test
- **Day 7:** Generate report and sign off

**Total: 1-2 weeks**

---

## Success Looks Like

```
PHASE 5F VERIFICATION RESULTS
═════════════════════════════════════════

✅ Audience Resolution
   ✓ Expected Output
   ✓ Tenant Isolation
   ✓ Audit Evidence

✅ Template Resolution
   ✓ Expected Output
   ✓ Variables Rendered
   ✓ Audit Evidence

✅ Sender Resolution
   ✓ Correct Sender
   ✓ Verified Domain
   ✓ Audit Evidence

✅ Persistence
   ✓ Exact Match
   ✓ Provider Captured
   ✓ Status Correct

✅ E2E: user_registration
   ✓ Expected Output
   ✓ Tenant Isolation
   ✓ Audit Evidence

✅ E2E: application_approved
   ✓ Expected Output
   ✓ Tenant Isolation
   ✓ Audit Evidence

VERIFICATION COMPLETE ✅
Communication system production-ready.
Entering Maintenance Mode.
```

---

## Notes

- This is verification, not refactoring. Don't be tempted to "fix" things.
- Document defects, don't fix them unless they're blocking.
- Keep tests focused and isolated.
- Don't build infrastructure (queues, retries, inspectors).
- Prove three things in each test: output, isolation, evidence.

---

# NEXT PROMPT

```
PHASE 6 — Communication System Freeze

Goal:
Freeze the communication subsystem and prepare for production.
Finalize all documentation and officially close development.

Scope:
Only:
- Remove temporary debugging code and test artifacts
- Organize documentation
- Produce final Communication Architecture document
- Create communication maintenance guide
- Mark subsystem as frozen (maintenance mode only)

Do not:
- Refactor code
- Add features
- Change behavior
- Build new tools

Deliverables:
- Communication System Architecture document
- Communication API reference
- Communication maintenance guide
- Production checklist
- Verification that all Phase 5F tests still pass
- Communication subsystem marked FROZEN

Exit Criteria:
- No outstanding notification defects
- Documentation complete and accurate
- All tests passing
- Communication subsystem officially closed for feature development
- Ready to begin core product features (Eligibility Engine, Application Workflow, etc.)

Architecture Budget Rule Applied:
- Communication subsystem budget exhausted (3 phases complete)
- Maintenance Mode enforced (bug fixes only, no new development)
- Next phase does NOT return to communication system

Next Prompt:
[Will be provided at end of Phase 6 — begins core product roadmap]
```
