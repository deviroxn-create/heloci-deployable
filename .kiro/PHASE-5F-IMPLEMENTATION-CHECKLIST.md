# PHASE 5F Implementation Checklist

## Overview

This checklist guides you through implementing Runtime Pipeline Certification.

**Goal:** Trace one notification end-to-end and prove all values are preserved.

**Duration:** 3-5 days (depending on test infrastructure)

**Deliverables:**
1. ✓ Runtime Trace helper (`trace-recorder.ts`)
2. ✓ Certification test (`phase-5f-certification.test.ts`)
3. ✓ Ownership Matrix (documentation)
4. ✓ Pipeline Map (documentation)

---

## Phase 5F.1 — Setup (Day 1)

### Task 1.1: Create Trace Recorder
- [x] File: `lib/notifications/runtime/trace-recorder.ts`
- [x] Implements: `TraceRecorder` class
- [x] Provides: `recordStep()`, `getReport()`, `printReport()`, `toJSON()`
- [x] Helpers: `valueChanged()`, `arrayChanged()`

**Verification:**
```bash
npx tsc --noEmit lib/notifications/runtime/trace-recorder.ts
# Should compile without errors
```

### Task 1.2: Create Test File
- [x] File: `tests/phase-5f-certification.test.ts`
- [x] Implements: Vitest test suite
- [x] Test case: `user_registration: trace and certify end-to-end`
- [x] TODO stubs: `application_approved`, `documents_requested`

**Verification:**
```bash
npx vitest run tests/phase-5f-certification.test.ts
# Should fail initially (no test data, etc.)
```

### Task 1.3: Create Documentation
- [x] `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` — Main guide
- [x] `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` — Event ownership rules
- [x] `.kiro/PHASE-5F-PIPELINE-MAP.md` — Component documentation

---

## Phase 5F.2 — Infrastructure (Day 2)

### Task 2.1: Verify Test Database
- [ ] PostgreSQL connection working locally
- [ ] `npx prisma db push` succeeds
- [ ] Test fixtures can be created/destroyed

**Commands:**
```bash
npm run db:push
npm run test -- tests/phase-5f-certification.test.ts
# Check for DB connection errors
```

### Task 2.2: Seed Test Data
Modify `tests/phase-5f-certification.test.ts` to seed:
- [ ] Test user (john-phase5f@example.com)
- [ ] Platform template (applicant.user_registration.email)
- [ ] Mock Resend API response

**Code snippet already in test file**

### Task 2.3: Mock External Dependencies
- [ ] Mock Resend API call
- [ ] Mock Telegram API (if testing admin notifications)
- [ ] Return predictable responses

**Code already prepared in test file**

---

## Phase 5F.3 — Instrumentation (Day 2-3)

### Task 3.1: Add Tracing to RuntimeOrchestrator
**File:** `lib/notifications/runtime/runtime-orchestrator.ts`

Changes:
```typescript
// Add at top
import { TraceRecorder, valueChanged, arrayChanged } from './trace-recorder';

// In runWithTrace(), create tracer
const tracer = new TraceRecorder(traceId, eventName);

// After each stage, record:
tracer.recordStep({
  stage: 'audience_resolution',
  input: { eventCount: audiences?.length || 0 },
  output: { recipientCount: audienceResolved.recipients.length },
  duration: endTime - startTime,
  mutations: [],
  status: 'pass',
});
```

Tasks:
- [ ] Add tracing to stage 1 (initial request)
- [ ] Add tracing to stage 2 (audience resolution)
- [ ] Add tracing to stage 3 (communication planning)
- [ ] Add tracing to stage 4 (template resolution)
- [ ] Add tracing to stage 5 (dispatcher)
- [ ] Add tracing to stage 6 (provider adapter)
- [ ] Collect final trace at end of runWithTrace()

### Task 3.2: Add Tracing to ProviderAdapter
**File:** `lib/notifications/provider-adapters.ts`

Changes:
- [ ] Log Resend request payload (if NOTIFICATION_RUNTIME_TRACE=true)
- [ ] Log Resend response payload
- [ ] Capture any sender/recipient mutations

### Task 3.3: Add Tracing to NotificationLog
**File:** `lib/notifications/notification.service.ts`

Changes:
- [ ] Before creating log: Verify recipient preserved from context
- [ ] Before creating log: Verify sender preserved from provider response
- [ ] Before creating log: Verify template used matches expectations

---

## Phase 5F.4 — Test Execution (Day 3-4)

### Task 4.1: Run Certification Test (User Registration)

**Command:**
```bash
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts
```

**Expected Output:**
```
PASS  tests/phase-5f-certification.test.ts (2.3s)

  PHASE 5F — Runtime Certification
    ✓ user_registration: trace and certify end-to-end (1234ms)

═══════════════════════════════════════════════════════════════
RUNTIME CERTIFICATION REPORT
═══════════════════════════════════════════════════════════════

EVENT: user_registration
TRACE_ID: trace-1722954321-abc123def

...

CERTIFICATION RESULT: ✓ PASSED
```

**Success Criteria:**
- [ ] Test passes
- [ ] All checklist items marked ✓
- [ ] No blockers listed
- [ ] Report shows all stages passed

**If Test Fails:**
- [ ] Read blocker message
- [ ] Check which stage failed
- [ ] Add debug logging at that stage
- [ ] Rerun with NOTIFICATION_RUNTIME_TRACE=true
- [ ] File ticket with evidence

### Task 4.2: Generate Trace Report
The test automatically writes to `.tests/.phase-5f-trace-output.json`

**Commands:**
```bash
cat tests/.phase-5f-trace-output.json | jq
```

**Review Report For:**
- [ ] Event name correct: `user_registration`
- [ ] Organization ID correct: `null` (platform event)
- [ ] Audience correct: `applicant`
- [ ] Recipient correct: `john-phase5f@example.com`
- [ ] Sender correct: `support@heloci.us`
- [ ] Template correct: `applicant.user_registration.email`
- [ ] Channel correct: `email`
- [ ] Correlation ID preserved: same traceId throughout

### Task 4.3: Verify NotificationLog
**Command:**
```sql
SELECT id, eventName, channel, recipient, sender, deliveryStatus, createdAt
FROM NotificationLog
WHERE eventName = 'user_registration'
ORDER BY createdAt DESC
LIMIT 1;
```

**Checks:**
- [ ] `eventName` = `user_registration`
- [ ] `channel` = `email`
- [ ] `recipient` = `john-phase5f@example.com`
- [ ] `sender` = `support@heloci.us`
- [ ] `deliveryStatus` = `SENT` (if Resend mock succeeded)
- [ ] `createdAt` = recent

---

## Phase 5F.5 — Second Event (Day 4)

### Task 5.1: Certify application_approved (Organization-Owned)

**Goal:** Verify org-owned events preserve organizationId and use org sender.

**Modifications to test file:**
```typescript
it('application_approved: org-owned event with org sender', async () => {
  // Seed test org + sender identity
  const org = await prisma.organization.create({
    data: {
      name: 'Test Housing Authority',
      slug: 'test-housing-phase5f',
      createdBy: 'system',
    },
  });

  const senderIdentity = await prisma.senderIdentity.create({
    data: {
      organizationId: org.id,
      emailAddress: 'noreply@test-housing.gov',
      displayName: 'Test Housing',
      isVerified: true,
      isDefault: true,
      createdBy: 'system',
    },
  });

  // Call notify() with org context
  const result = await notify('application_approved', {
    organizationId: org.id,
    applicationId: 'app-456',
    userId: 'applicant-123',
    userEmail: 'applicant@example.com',
  });

  // Verify org sender used (not platform sender)
  expect(result.deliveryResults[0].recipient).toBe('a***@example.com');

  // Verify NotificationLog has org context
  const log = await prisma.notificationLog.findFirst({
    where: { eventName: 'application_approved' },
    orderBy: { createdAt: 'desc' },
  });
  expect(log.sender).toBe('noreply@test-housing.gov');
});
```

Tasks:
- [ ] Create test org
- [ ] Create SenderIdentity for test org
- [ ] Call notify() with org context
- [ ] Verify sender is org's domain (not support@heloci.us)
- [ ] Verify organizationId preserved in trace
- [ ] Document findings in `.kiro/PHASE-5F-CERTIFICATION-REPORT.md`

---

## Phase 5F.6 — Defect Investigation (Day 5)

### Task 6.1: Identify Any Mutations

If trace shows unexpected mutations:
- [ ] Document the mutation (value changed from X to Y)
- [ ] Identify the stage where mutation occurred
- [ ] File a ticket with title: `[DEFECT] Mutation in {stage}: {field} changed from {before} to {after}`
- [ ] Add blocker to this phase (don't move to Phase 6 until fixed)

**Example Defect:**
```
Stage: CommunicationPlanner
Mutation: audience changed from "applicant" to "admin"
Root Cause: TBD
Ticket: #123 [DEFECT] CommunicationPlanner mutating audience
```

### Task 6.2: Fix Any Authorization Failures

If trace shows org isolation issues (org A's data leaking to org B):
- [ ] Document the leak (org A's user email appeared in org B's notification)
- [ ] Identify the stage where leak occurred
- [ ] File ticket: `[CRITICAL] Multi-tenant isolation failure in {stage}`
- [ ] HALT Phase 6 until fixed

---

## Phase 5F.7 — Documentation & Sign-Off (Day 5)

### Task 7.1: Create Certification Report

**File:** `.kiro/PHASE-5F-CERTIFICATION-REPORT.md`

**Content:**
```markdown
# PHASE 5F Certification Report

## Summary
- Date: 2024-01-10
- Events Certified: user_registration, application_approved
- Tests Passed: 2/2
- Defects Found: 0
- Blockers: None

## User Registration (Platform Event)
✓ Event name preserved
✓ Organization ID preserved (null)
✓ Audience preserved (applicant)
✓ Recipient preserved (john@ex.com)
✓ Sender preserved (support@heloci.us)
✓ Template preserved (applicant.user_registration.email)
✓ Channel preserved (email)
✓ No unexpected mutations

Trace ID: trace-1722954321-abc123def

## Application Approved (Organization Event)
✓ Event name preserved
✓ Organization ID preserved (org-housing-authority)
✓ Audiences preserved (applicant, org_admin)
✓ Recipients preserved
✓ Sender preserved (noreply@test-housing.gov)
✓ Templates preserved per audience
✓ Channels preserved per audience
✓ No unexpected mutations

Trace ID: trace-1722954322-def456ghi

## Ownership Matrix Validation
All events in `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` reviewed and accurate.

## Next Steps
PROCEED to Phase 6 — Async Notification Infrastructure
```

### Task 7.2: Archive Trace Outputs

**Command:**
```bash
mkdir -p .kiro/phase-5f-traces
cp tests/.phase-5f-trace-output.json .kiro/phase-5f-traces/
git add .kiro/phase-5f-traces/
git commit -m "chore: archive Phase 5F trace outputs"
```

### Task 7.3: Update README

**File:** `.kiro/README.md` or project main README

**Add section:**
```markdown
## Notification System Certification

- Phase 5F: Runtime Pipeline Certification ✓
  - Trace ID: trace-1722954321-abc123def
  - Date: 2024-01-10
  - Status: PASSED
  - Report: `.kiro/PHASE-5F-CERTIFICATION-REPORT.md`
```

---

## Rollback / Cleanup

If Phase 5F needs to be undone:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Delete test files:**
   ```bash
   rm tests/phase-5f-certification.test.ts
   rm .kiro/phase-5f-traces/*
   ```

3. **Remove from main branch:**
   ```bash
   git branch -D phase-5f
   ```

---

## Success Metrics

✓ Phase 5F is complete when:

1. **Certification Test Passes**
   - [ ] `npm run test -- phase-5f-certification.test.ts` passes
   - [ ] No failed assertions

2. **Trace Evidence Collected**
   - [ ] `.kiro/phase-5f-traces/` contains trace outputs
   - [ ] All values preserved at each stage

3. **Documentation Complete**
   - [ ] `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` (this guide)
   - [ ] `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` (event ownership)
   - [ ] `.kiro/PHASE-5F-PIPELINE-MAP.md` (component details)
   - [ ] `.kiro/PHASE-5F-CERTIFICATION-REPORT.md` (results)

4. **No Defects / Mutations**
   - [ ] All checklist items pass
   - [ ] No unexpected mutations
   - [ ] No multi-tenant isolation issues

5. **Ready for Phase 6**
   - [ ] Notification pipeline understood
   - [ ] Trust established in data integrity
   - [ ] Foundation ready for queuing + retries

---

## Time Estimates

| Task | Duration | Critical Path |
|------|----------|---|
| 1. Setup (tracer, test, docs) | 2 hours | Yes |
| 2. Infrastructure (DB, seeds) | 1 hour | Yes |
| 3. Instrumentation (tracing) | 3 hours | Yes |
| 4. Test execution (user_registration) | 1 hour | Yes |
| 5. Second event (application_approved) | 1 hour | No (can iterate later) |
| 6. Defect investigation | 2-4 hours | If needed |
| 7. Documentation & sign-off | 1 hour | Yes |
| **Total** | **11-13 hours** | **3-5 days** |

---

## Related Issues / PRs

- Create PR: `[PHASE 5F] Runtime Pipeline Certification`
- Link to issue: `Notification reliability improvements`
- Review checklist:
  - [ ] All tests pass
  - [ ] No console errors
  - [ ] Trace outputs captured
  - [ ] Documentation complete
  - [ ] Ready for Phase 6

---

## Questions / Blockers

If you encounter issues:

1. **Test fails with DB error:**
   - Check: `DATABASE_URL` in `.env.local`
   - Run: `npx prisma db push`

2. **Resend mock not working:**
   - Check: Mock setup in test file
   - Verify: `RESEND_API_KEY` env var (for real testing)

3. **Trace output empty:**
   - Check: `NOTIFICATION_RUNTIME_TRACE=true` env var set
   - Verify: `console.log` statements in instrumentation code

4. **Multi-tenant isolation concern:**
   - Check: organizationId in context vs. payload
   - File: `[CRITICAL]` ticket immediately
   - Halt: Don't proceed to Phase 6

---

## Next Phase

Once Phase 5F is complete with all green checkmarks:

**→ PHASE 6 — Async Notification Infrastructure**

Phase 6 will implement:
1. Job queue (Inngest or Trigger.dev)
2. Retry logic (3x for low, 5x for high priority)
3. Dead letter queue (failed notifications)
4. Scheduled sends (send in user's timezone)
5. Background workers (scale to production)

All of these become simple because we're building on a **certified pipeline**.
