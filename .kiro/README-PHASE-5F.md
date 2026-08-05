# PHASE 5F — Runtime Verification (Entry Point)

## Start Here

**Read:** `.kiro/PHASE-5F-FINAL-SPECIFICATION.md`

This is the definitive specification with all three improvements:
1. Better test organization (self-contained directory)
2. Stronger verification evidence (prove 3 things per test)
3. Explicit Stop Rule (prevents scope creep)

---

## What We're Doing

Verifying the existing notification system works correctly without building new infrastructure.

**Not** refactoring. **Not** building new tools. Just testing what you have.

---

## Six Verifications (Each Proves Three Things)

1. **Audience Resolution** ✓ Output ✓ Isolation ✓ Evidence
2. **Template Resolution** ✓ Output ✓ Rendered ✓ Evidence
3. **Sender Resolution** ✓ Sender ✓ Verified ✓ Evidence
4. **Persistence** ✓ Match ✓ Provider ID ✓ Status
5. **E2E: user_registration** ✓ Output ✓ Isolation ✓ Evidence
6. **E2E: application_approved** ✓ Output ✓ Isolation ✓ Evidence

---

## Expected Outcome

✅ All verifications pass  
✅ Each proves three things (output, isolation, evidence)  
✅ Verification report generated  
✅ Any defects documented  
✅ Stop Rule enforced (subsystem enters Maintenance Mode)  
✅ System cleared for Phase 6 (Freeze)

---

## Timeline

1-2 weeks

---

## Test Organization

```
tests/phase-5f-runtime-verification/
├── audience.test.ts
├── template.test.ts
├── sender.test.ts
├── persistence.test.ts
├── user-registration.e2e.test.ts
└── application-approved.e2e.test.ts
```

Keep tests self-contained. Archive cleanly later.

---

## Files to Read

1. **`.kiro/PHASE-5F-FINAL-SPECIFICATION.md`** ← Main spec (read this first)
2. **`.kiro/PHASE-5F-CHANGES-SUMMARY.md`** ← What changed and why
3. **`.kiro/ARCHITECTURE-BUDGET-RULE.md`** ← New project rule

---

## Go

Open `.kiro/PHASE-5F-FINAL-SPECIFICATION.md`

Create tests in `tests/phase-5f-runtime-verification/`

Prove three things in each test.

Follow the Stop Rule when complete.
