# PHASE 5F — Runtime Pipeline Certification Index

Complete guide to Heloci's notification system certification.

---

## Overview

**Goal:** Trace one notification end-to-end and prove data integrity.

**Duration:** 9-12 hours (1-2 days)

**Status:** ✓ Ready to run

---

## Document Map

### For Decision Makers
Start here to understand the why and what.

1. **`.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md`** (5 min read)
   - What problem does this solve?
   - What will you get?
   - Why is this important before Phase 6?
   - Recommendation

### For Developers (Getting Started)
Quick on-ramp to running the test.

2. **`.kiro/PHASE-5F-QUICKSTART.md`** (5 min read)
   - Run test in 3 commands
   - What success looks like
   - Troubleshooting quick links

### For Developers (Building)
Day-by-day task list.

3. **`.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md`** (reference)
   - Phase-by-phase breakdown
   - Specific tasks with checkboxes
   - Time estimates
   - Rollback instructions

### For Understanding the System
Deep dives into how it works.

4. **`.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md`** (30 min read)
   - What we're proving
   - Deliverable 1: Runtime Trace (example)
   - Deliverable 2: Notification Pipeline Map (structure)
   - Deliverable 3: Ownership Matrix (event rules)
   - Deliverable 4: Certification Report (evidence)
   - How to run Phase 5F (detailed instructions)

5. **`.kiro/PHASE-5F-PIPELINE-MAP.md`** (reference)
   - Component-by-component breakdown
   - Inputs and outputs for each
   - Responsibilities and dependencies
   - Data flow example (application_approved)
   - Invariants (must always be true)

6. **`.kiro/PHASE-5F-OWNERSHIP-MATRIX.md`** (reference)
   - Platform-owned events (40+ events)
   - Organization-owned events (40+ events)
   - Sender resolution priority
   - Template resolution priority
   - Audience mapping
   - Channel selection
   - Retry policies
   - Testing checklist

### For Code Implementation
Where the code lives.

7. **`lib/notifications/runtime/trace-recorder.ts`** (utility)
   - `TraceRecorder` class
   - `recordStep()` method
   - `getReport()`, `printReport()`, `toJSON()`
   - `valueChanged()`, `arrayChanged()` helpers
   - Used by: `RuntimeOrchestrator`, tests

8. **`tests/phase-5f-certification.test.ts`** (test)
   - `user_registration` test (fully implemented)
   - `application_approved` test (stub)
   - `documents_requested` test (stub)
   - Test data seeding
   - Mock Resend API
   - Assertions and checklist verification

---

## Quick Navigation by Role

### I'm a Project Manager
→ Read `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` (decide to run it or not)

### I'm a Developer (First Time)
→ Read `.kiro/PHASE-5F-QUICKSTART.md` (get running fast)
→ Then `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` (understand what's happening)

### I'm a Developer (Implementing)
→ Open `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` (follow checklist)
→ Reference `.kiro/PHASE-5F-PIPELINE-MAP.md` (component details)
→ Reference `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` (event rules)

### I'm a Developer (Debugging)
→ Look at test output
→ Check `.kiro/phase-5f-traces/` for trace JSON
→ Read `.kiro/PHASE-5F-PIPELINE-MAP.md` (find failing stage)
→ Add logging at that stage
→ Rerun with `NOTIFICATION_RUNTIME_TRACE=true`

### I'm a Code Reviewer
→ Review `tests/phase-5f-certification.test.ts` (test implementation)
→ Review `lib/notifications/runtime/trace-recorder.ts` (utility code)
→ Verify traces are being recorded in `RuntimeOrchestrator`
→ Check for any mutations in the instrumentation code

---

## The Certification Path

### Step 1: Understand (30 min)
- [ ] Read `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md`
- [ ] Skim `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md`
- [ ] Understand: "We're tracing one notification through 7 stages"

### Step 2: Prepare (1 hour)
- [ ] Ensure test DB is running
- [ ] Check `.env` has DATABASE_URL
- [ ] Review `tests/phase-5f-certification.test.ts`
- [ ] Understand: "Test seeds data, calls notify(), verifies results"

### Step 3: Run (5 min)
```bash
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts
```

### Step 4: Verify (15 min)
- [ ] Test passes or shows clear failure
- [ ] Trace output at `.tests/.phase-5f-trace-output.json`
- [ ] Review trace: Did all values persist?

### Step 5: Debug or Proceed (1-4 hours)

**If test passed:**
- [ ] Generate certification report
- [ ] Verify NotificationLog in database
- [ ] Run second event (application_approved)
- [ ] Sign off: Create `.kiro/PHASE-5F-CERTIFICATION-REPORT.md`
- [ ] → Ready for Phase 6

**If test failed:**
- [ ] Read error message
- [ ] Check which stage failed
- [ ] Add debug logging
- [ ] Rerun test
- [ ] File ticket with blocker
- [ ] Fix blocker
- [ ] Rerun until passes

### Step 6: Archive & Sign Off (30 min)
- [ ] Copy trace to `.kiro/phase-5f-traces/`
- [ ] Create `PHASE-5F-CERTIFICATION-REPORT.md`
- [ ] Update project README
- [ ] Commit to git
- [ ] Schedule Phase 6 planning

---

## Key Concepts

### Runtime Trace
Structured record of what happened at each stage:
```
STAGE: audience_resolution
  Input:  { recipientId: 'user-123' }
  Output: { recipients: [{ email: 'john@ex.com', role: 'applicant' }] }
  Mutations: []
  Status: ✓ PASS
```

### Certification Checklist
8 critical assertions:
- ✓ Event name preserved
- ✓ Organization ID preserved
- ✓ Audience preserved
- ✓ Recipient preserved
- ✓ Sender preserved
- ✓ Template preserved
- ✓ Channel preserved
- ✓ Correlation ID preserved

### Ownership Matrix
Rulebook for every event (40+ events):
- Who owns it (Platform or Organization)
- What sender to use
- Where template comes from
- How many retries
- Which audiences get it

### Pipeline Map
7-component architecture:
1. notify() — Entry point
2. RuntimeOrchestrator — Orchestrate stages
3. AudienceResolver — Who receives this?
4. CommunicationPlanner — What channels?
5. TemplateResolver — Which template?
6. Dispatcher — Create dispatch request
7. ProviderAdapter — Send via Resend
8. NotificationLog — Audit trail

---

## Success Metrics

✓ Phase 5F is complete when all are true:

- [ ] Test passes: `npm run test -- phase-5f-certification.test.ts`
- [ ] Trace generated: `.phase-5f-trace-output.json` exists
- [ ] All checklist items pass (no ✗)
- [ ] No mutations detected
- [ ] No multi-tenant leaks
- [ ] Both events certified (user_registration + application_approved)
- [ ] Certification report signed off
- [ ] Ready to proceed to Phase 6

---

## Files Created

### Documentation (7 files)
- `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` — Why this matters
- `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` — Complete guide
- `.kiro/PHASE-5F-PIPELINE-MAP.md` — Component architecture
- `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` — Event ownership rules
- `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` — Day-by-day tasks
- `.kiro/PHASE-5F-QUICKSTART.md` — 5-minute on-ramp
- `.kiro/PHASE-5F-INDEX.md` — This file

### Code (2 files)
- `lib/notifications/runtime/trace-recorder.ts` — Tracing utility
- `tests/phase-5f-certification.test.ts` — Certification test

### Generated (during run)
- `.tests/.phase-5f-trace-output.json` — Trace output
- `.kiro/phase-5f-traces/` — Archive of traces
- `.kiro/PHASE-5F-CERTIFICATION-REPORT.md` — Final report (you create this)

---

## Command Cheat Sheet

```bash
# Run test with tracing
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts

# View trace output
cat tests/.phase-5f-trace-output.json | jq

# View NotificationLog in DB
psql $DATABASE_URL -c "SELECT * FROM NotificationLog ORDER BY createdAt DESC LIMIT 1;"

# Archive traces
mkdir -p .kiro/phase-5f-traces
cp tests/.phase-5f-trace-output.json .kiro/phase-5f-traces/

# Commit results
git add .kiro/phase-5f-*
git commit -m "chore: PHASE 5F Runtime Certification complete"

# Clean up test data
npm run db:reset # (if you have this command)
```

---

## Next Phase

Once Phase 5F is signed off:

**→ PHASE 6 — Async Notification Infrastructure**

Phase 6 will add:
1. Job queue (Inngest or Trigger.dev)
2. Retry logic (3x for low-priority, 5x for high-priority)
3. Dead letter queue (for failed notifications)
4. Scheduled sends (send in user's timezone)
5. Background workers (scale to 10k+ emails/day)

All built on top of a **certified pipeline**.

---

## Support

If you get stuck:

1. **Test fails?** → Check troubleshooting in `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md`
2. **Don't understand a stage?** → Read detailed explanation in `.kiro/PHASE-5F-PIPELINE-MAP.md`
3. **Not sure about event rules?** → Look it up in `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md`
4. **Quick overview needed?** → Read `.kiro/PHASE-5F-QUICKSTART.md`

---

## Start Here

👉 **Read this first:** `.kiro/PHASE-5F-EXECUTIVE-SUMMARY.md` (5 min)

👉 **Then run this:** `NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts`

👉 **Then follow:** `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` (day-by-day)

---

**Ready? Let's certify the pipeline.**
