# PHASE 5F Quick Start

One-page guide to get started immediately.

---

## What Is Phase 5F?

Trace one notification from registration → NotificationLog.

Prove every value is preserved at each stage.

---

## Files Already Created

✓ `lib/notifications/runtime/trace-recorder.ts` — Trace utilities
✓ `tests/phase-5f-certification.test.ts` — Certification test
✓ `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` — Full guide
✓ `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` — Event ownership rules
✓ `.kiro/PHASE-5F-PIPELINE-MAP.md` — Component documentation
✓ `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` — Day-by-day tasks
✓ `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` — Executive overview

---

## To Run the Test Right Now

```bash
# Install deps (if needed)
npm install

# Set environment
export NOTIFICATION_RUNTIME_TRACE=true
export DATABASE_URL="postgresql://..." # from .env

# Run test
npm run test -- tests/phase-5f-certification.test.ts

# Expected output:
# PASS  tests/phase-5f-certification.test.ts

# View trace output:
cat tests/.phase-5f-trace-output.json | jq
```

---

## What the Test Does

1. **Seed test data:**
   - User: john-phase5f@example.com
   - Template: applicant.user_registration.email
   - Mock Resend API

2. **Call notify():**
   - Send user_registration email

3. **Trace all stages:**
   - initial_request
   - audience_resolution
   - communication_planning
   - template_resolution
   - dispatcher
   - provider_adapter (Resend)
   - notification_log

4. **Verify checklist:**
   - ✓ Event name preserved
   - ✓ Organization ID preserved
   - ✓ Audience preserved
   - ✓ Recipient preserved
   - ✓ Sender preserved
   - ✓ Template preserved
   - ✓ Channel preserved
   - ✓ Correlation ID preserved

5. **Generate report:**
   - `.tests/.phase-5f-trace-output.json`

---

## What Success Looks Like

```
✓ user_registration: trace and certify end-to-end (1234ms)

═══════════════════════════════════════════════════════════════
RUNTIME CERTIFICATION REPORT
═══════════════════════════════════════════════════════════════

EVENT: user_registration
TRACE_ID: trace-1722954321-abc123def

✓ Event name preserved
✓ Organization ID preserved
✓ Audience preserved
✓ Recipient preserved
✓ Sender preserved
✓ Template preserved
✓ Channel preserved
✓ Correlation ID preserved
✓ No unexpected mutations
✓ Provider response logged
✓ Audit trail complete

CERTIFICATION RESULT: ✓ PASSED
```

---

## What Happens If It Fails

If a checklist item fails:

```
✗ Sender preserved
  Expected: support@heloci.us
  Got: noreply@test.com
```

This means:

1. **Identify the stage** where sender changed
2. **Look at code** at that stage
3. **Add debug logging**
4. **Rerun test** with `NOTIFICATION_RUNTIME_TRACE=true`
5. **File ticket** with evidence

---

## Key Files to Understand

| File | Purpose |
|------|---------|
| `lib/notifications/runtime/trace-recorder.ts` | Records each stage |
| `lib/notifications/runtime/runtime-orchestrator.ts` | Orchestrates pipeline |
| `tests/phase-5f-certification.test.ts` | Certification test |
| `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` | Who owns each event |
| `.kiro/PHASE-5F-PIPELINE-MAP.md` | Component responsibilities |

---

## Next Steps

### Option A: Run Test Immediately
```bash
npm run test -- tests/phase-5f-certification.test.ts
```

### Option B: Read Full Guide First
```bash
# Read in this order:
1. .kiro/PHASE-5F-EXECUTIVE-SUMMARY.md
2. .kiro/PHASE-5F-RUNTIME-CERTIFICATION.md
3. .kiro/PHASE-5F-PIPELINE-MAP.md
4. .kiro/PHASE-5F-OWNERSHIP-MATRIX.md
```

### Option C: Step Through Checklist
```bash
# Follow day-by-day tasks:
cat .kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md
```

---

## Success Criteria

✓ Certification test passes
✓ Trace output generated (`.phase-5f-trace-output.json`)
✓ All checklist items pass
✓ No mutations detected
✓ Report signed off
✓ Ready for Phase 6

---

## Questions?

**If test fails:**
1. Check database connection
2. Check environment variables
3. Read error message carefully
4. Add debug logging
5. Rerun with NOTIFICATION_RUNTIME_TRACE=true

**If you have questions:**
1. Read `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` (section "How to Run PHASE 5F")
2. Check `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` (troubleshooting section)
3. File an issue with trace output

---

## That's It

Run the test. See if it passes. If it does, you're ready for Phase 6.

If it doesn't, the trace will tell you exactly where to look.

```bash
npm run test -- tests/phase-5f-certification.test.ts
```

Go.
