# PHASE 5F — Runtime Pipeline Certification

**Status:** ✓ Ready to execute

**Goal:** Trace one notification from user registration → NotificationLog delivery

**Duration:** 9-12 hours (1-2 days)

**Decision:** Freeze feature work for this milestone and prove notification system reliability before building async infrastructure

---

## Why This Phase?

Your notification system is sophisticated:
- 40+ event types (user_registration, application_approved, documents_requested, etc.)
- Multi-tenant support (org-specific senders, templates, customization)
- Multiple channels (email via Resend, Telegram, internal dashboard)
- Complex runtime (audience resolution → planning → template → dispatch → provider)

**But:** You have no visibility into what actually happens during a single notification.

**Risk:** You could ship Phase 6 (queuing, retries, background jobs) and still not know if basic data integrity is maintained. You could have organization isolation bugs lurking. You could have sender domain issues.

**Solution:** Trace one notification end-to-end and prove everything works before adding infrastructure.

---

## What You'll Get

### 1. Certification Proof
Evidence that each stage of the pipeline preserves critical data:

```
✓ Event name preserved
✓ Organization ID preserved (or null for platform events)
✓ Audience role preserved
✓ Recipient email preserved
✓ Sender domain preserved
✓ Template key preserved
✓ Channel preserved
✓ Correlation ID preserved
```

### 2. Runtime Trace
Structured JSON output showing exactly what happened:

```json
{
  "traceId": "trace-1722954321-abc123def",
  "eventName": "user_registration",
  "stages": [
    {
      "stage": "initial_request",
      "input": { "organizationId": null },
      "output": { "organizationId": null },
      "mutations": [],
      "status": "pass"
    },
    ...
  ],
  "passed": true
}
```

### 3. Ownership Matrix
Rulebook for every notification:

| Event | Owner | Sender | Template | Retry |
|-------|-------|--------|----------|-------|
| user_registration | Platform | support@heloci.us | Platform | 3x |
| application_approved | Organization | Org Sender | Org/Platform | 5x |
| documents_requested | Organization | Org Sender | Org/Platform | 5x |

### 4. Pipeline Architecture Documentation
Component-by-component breakdown (inputs, outputs, responsibilities)

---

## How to Execute

### Quick Start (5 minutes)
```bash
npm run test -- tests/phase-5f-certification.test.ts
```

### With Tracing (see all details)
```bash
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts
```

### Expected Result
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

## Files Included

### Documentation (7 files, all in `.kiro/`)
1. **`PHASE-5F-INDEX.md`** — Navigation guide (start here)
2. **`PHASE-5F-QUICKSTART.md`** — 5-minute on-ramp
3. **`PHASE-5F-EXECUTIVE-SUMMARY.md`** — Why this matters (for stakeholders)
4. **`PHASE-5F-RUNTIME-CERTIFICATION.md`** — Complete implementation guide
5. **`PHASE-5F-PIPELINE-MAP.md`** — Component architecture (reference)
6. **`PHASE-5F-OWNERSHIP-MATRIX.md`** — Event ownership rules (reference)
7. **`PHASE-5F-IMPLEMENTATION-CHECKLIST.md`** — Day-by-day tasks

### Code (2 files)
1. **`lib/notifications/runtime/trace-recorder.ts`** — Tracing utility (production code)
2. **`tests/phase-5f-certification.test.ts`** — Certification test (test code)

### Generated (during execution)
1. **`.tests/.phase-5f-trace-output.json`** — Trace data (one per test run)
2. **`.kiro/phase-5f-traces/`** — Archive of all traces
3. **`.kiro/PHASE-5F-CERTIFICATION-REPORT.md`** — Final report (you create this)

---

## The 7 Stages

When you run the test, it traces through these stages:

```
1. Initial Request
   └─ Build C.1 CommunicationRequest with context

2. Audience Resolution
   └─ Resolve who should receive this notification

3. Communication Planning
   └─ Select channels for each audience

4. Template Resolution
   └─ Load email/telegram/internal template

5. Dispatcher
   └─ Create dispatch request with recipient + sender + template

6. Provider Adapter (Resend)
   └─ Actually send via email provider

7. NotificationLog
   └─ Record in database for audit trail
```

If any value mutates unexpectedly between stages, you'll see it in the trace.

---

## Certification Checklist

Before proceeding to Phase 6, verify:

- [ ] Test passes: `npm run test -- phase-5f-certification.test.ts`
- [ ] Trace generated: JSON output exists
- [ ] All 8 checklist items marked ✓ (event, org, audience, recipient, sender, template, channel, correlation)
- [ ] No mutations detected
- [ ] No multi-tenant isolation leaks
- [ ] Both platform event (user_registration) and org event (application_approved) certified
- [ ] Certification report created and signed off
- [ ] Ready for Phase 6 async infrastructure

---

## Timeline

| Phase | Task | Duration | Day |
|-------|------|----------|-----|
| 1 | Setup (trace recorder, test, docs) | 2 hours | Day 1 (morning) |
| 2 | Infrastructure (DB, seeds, mocks) | 1 hour | Day 1 (afternoon) |
| 3 | Instrumentation (add tracing to runtime) | 3 hours | Day 1-2 |
| 4 | Test execution (user_registration) | 1 hour | Day 2 (morning) |
| 5 | Debug (if needed) or second event | 2-4 hours | Day 2 (afternoon) |
| 6 | Documentation & sign-off | 1 hour | Day 3 (morning) |
| **Total** | **Execute full certification** | **9-12 hours** | **1-2 days** |

---

## Decision Tree

### If test passes ✓
1. Verify trace output looks correct
2. Certify second event (application_approved)
3. Create certification report
4. → Proceed to Phase 6 (async infrastructure)

### If test fails ✗
1. Read error message
2. Identify which stage failed
3. Add debug logging at that stage
4. Rerun with `NOTIFICATION_RUNTIME_TRACE=true`
5. Fix defect
6. Rerun until passes

### If mutations detected ✗
1. Identify which value changed
2. Find stage where mutation occurred
3. Investigate root cause
4. File ticket [DEFECT] with evidence
5. Fix before proceeding to Phase 6

---

## Success Criteria

✓ Phase 5F is successful when:

1. **Evidence collected:** Trace shows all stages executed
2. **Data integrity proven:** No unexpected mutations
3. **Multi-tenant verified:** Org isolation confirmed
4. **Components documented:** Ownership matrix complete
5. **Pipeline mapped:** Component responsibilities clear
6. **Report signed off:** Certification complete
7. **Ready for Phase 6:** Foundation proven trustworthy

---

## Next Phase

Only after Phase 5F is complete and signed off:

**→ PHASE 6 — Async Notification Infrastructure**

Phase 6 will build on this certified pipeline:
1. Job queue (Inngest or Trigger.dev)
2. Retry logic (3x for low, 5x for high priority)
3. Dead letter queue (for failed notifications)
4. Scheduled sends (send in user's timezone)
5. Background workers (scale to production)

Because you've already certified the pipeline, Phase 6 becomes straightforward.

---

## Start Here

1. **First:** Read `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` (understand why)
2. **Then:** Read `.kiro/PHASE-5F-QUICKSTART.md` (5-minute run guide)
3. **Then:** Follow `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` (day-by-day tasks)
4. **Finally:** Run `NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts`

---

## Key Documents by Role

| Role | Start With |
|------|-----------|
| **Project Manager** | `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` |
| **Developer (Quick)** | `.kiro/PHASE-5F-QUICKSTART.md` |
| **Developer (Building)** | `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` |
| **Developer (Deep Dive)** | `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` |
| **Code Reviewer** | `tests/phase-5f-certification.test.ts` + `lib/notifications/runtime/trace-recorder.ts` |
| **Navigation Help** | `.kiro/PHASE-5F-INDEX.md` |

---

## Questions?

**Q: Why trace one notification instead of 100?**
A: One notification, well-understood and fully traced, proves the system works. A hundred notifications in production testing proves nothing if you don't understand what's happening at each stage.

**Q: How long will this take?**
A: 9-12 hours of focused work (1-2 days). If you hit blockers, 2-3 days. Worth it because Phase 6 becomes simple.

**Q: What if the test fails?**
A: The trace will tell you exactly which stage failed. Fix that stage. Rerun. That's the point of tracing.

**Q: Can we skip this and go straight to Phase 6?**
A: You *can*, but you'll be adding queuing, retries, and background jobs on top of an unverified pipeline. If data integrity issues exist, you'll have to debug through all those layers. Not recommended.

**Q: What if we find a defect?**
A: Document it in the trace. File a ticket. Fix it. Rerun until trace passes. Then proceed to Phase 6 with confidence.

---

## Recommendation

**If I were Heloci's lead architect:**

Freeze feature development for one milestone.

Make the goal: **"Runtime Pipeline Certification: One notification, zero assumptions."**

This establishes **trust** in the system before adding infrastructure.

Once certified, Phase 6 (queuing, retries, async workers) becomes straightforward.

---

## Ready?

```bash
# Let's certify the pipeline
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts
```

**Go.**
