# PHASE 5F — Executive Summary

## The Problem

Your notification system has grown sophisticated:
- 40+ event types
- Multi-tenant isolation (org-specific senders, templates)
- Multiple channels (email, telegram, internal)
- Complex runtime orchestration (audience → plan → template → dispatch)

But you lack **visibility into what actually happens during a single notification**.

**Risk:** You could ship features, add retries, scale to production—and still not know if basic data (organization ID, recipient email, sender domain) is being preserved correctly at each stage.

---

## The Solution

**PHASE 5F — Runtime Pipeline Certification**

Trace one notification from registration to delivery log.

Answer these questions with **evidence**:

```
✓ Is the event name preserved?           (user_registration → user_registration)
✓ Is the organization ID preserved?      (null → null for platform, org-id → org-id for orgs)
✓ Is the audience role preserved?        (applicant → applicant)
✓ Is the recipient email preserved?      (john@ex.com → john@ex.com)
✓ Is the sender preserved?               (support@heloci.us → support@heloci.us)
✓ Is the template key preserved?         (applicant.user_registration.email → ...)
✓ Is the channel preserved?              (email → email)
✓ Is the correlation ID preserved?       (trace-123 → trace-123)
✓ Are there unexpected mutations?        (No)
```

If any value changes unexpectedly, you've found the defect. **At which stage did it break?**

---

## What You Get

### 1. Runtime Trace
Structured evidence showing what happened at each stage:

```
STAGE: audience_resolution
  Input:  { eventName: 'user_registration', recipientId: 'user-123' }
  Output: { recipients: [{ id: 'user-123', email: 'john@ex.com', role: 'applicant' }] }
  Duration: 15ms
  Mutations: []
  Status: ✓ PASS

STAGE: communication_planner
  Input:  { audiences: [{ role: 'applicant' }] }
  Output: { plans: [{ audience: 'applicant', channel: 'email' }] }
  Duration: 2ms
  Mutations: []
  Status: ✓ PASS

... (continues for all stages)
```

### 2. Ownership Matrix
Rulebook for every notification:

| Event | Owner | Sender | Template | Retry |
|-------|-------|--------|----------|-------|
| user_registration | Platform | support@heloci.us | Platform | 3x |
| application_approved | Organization | Org Sender | Org/Platform | 5x |
| documents_requested | Organization | Org Sender | Org/Platform | 5x |

### 3. Pipeline Map
Component-by-component responsibility:

- **notify()** — Entry point, settings resolution, branching
- **RuntimeOrchestrator** — Orchestrate 4-stage pipeline
- **AudienceResolver** — Who should receive this?
- **CommunicationPlanner** — What channels?
- **TemplateResolver** — Which template?
- **Dispatcher** — Create dispatch request
- **ProviderAdapter** — Send via Resend/Telegram
- **NotificationLog** — Record audit trail

### 4. Certification Report
Evidence that the system works:

```
✓ Sender preserved
✓ Recipient preserved
✓ Audience preserved
✓ Template preserved
✓ Channel preserved
✓ Correlation ID preserved
✓ NotificationLog matches ProviderAdapter
✓ No mutations detected

CERTIFICATION RESULT: ✓ PASSED
```

---

## Why This Matters (Before Moving to Phase 6)

Once you implement queuing, retries, and async infrastructure in Phase 6, you'll have **layers of complexity**:

1. Job queue (Inngest / Trigger.dev)
2. Retry logic (exponential backoff)
3. Dead letter queue (failed jobs)
4. Rate limiting (per org)
5. Background workers (scaling)

If the underlying notification pipeline has defects, debugging through all these layers is **impossible**.

But if you've already certified the pipeline (Phase 5F), Phase 6 becomes simple:
- "Does the job reach the provider?"
- "Is the retry logic working?"
- "Are failed jobs in the DLQ?"

You know the answer: **"Yes, because we traced and certified each stage."**

---

## What You Need to Do

### Step 1: Run the Certification Test
```bash
NOTIFICATION_RUNTIME_TRACE=true npm run test -- tests/phase-5f-certification.test.ts
```

### Step 2: Verify All Checklist Items Pass
```
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
```

### Step 3: Generate Certification Report
Test automatically generates `.kiro/phase-5f-traces/trace-output.json`

### Step 4: Repeat for Second Event
Certify an organization-owned event (e.g., `application_approved`) to verify:
- organizationId is preserved
- Organization sender is used (not platform sender)
- org-specific templates are prioritized

### Step 5: Sign Off
Update `.kiro/PHASE-5F-CERTIFICATION-REPORT.md` with findings.

---

## Time & Effort

- **Setup:** 2-3 hours
- **Infrastructure:** 1 hour
- **Instrumentation:** 3 hours
- **Testing & Debug:** 2-3 hours
- **Documentation:** 1 hour
- **Total:** 9-12 hours (1-2 days of focused work)

---

## Defects Phase 5F Will Find

This phase is designed to catch:

1. **Multi-tenant isolation breaks**
   - Org A's data appearing in Org B's notification
   - organizationId not preserved through pipeline

2. **Sender domain issues**
   - Wrong sender used (unverified or platform default instead of org-specific)
   - Sender email mutating mid-pipeline

3. **Template mismatches**
   - Wrong template loaded (org template priority not respected)
   - Template key changed between stages

4. **Audience / recipient problems**
   - Wrong recipient receiving notification
   - Applicant receiving admin template (or vice versa)

5. **Correlation ID loss**
   - Trace ID dropped (can't audit the flow)

If Phase 5F finds zero defects, you're ready for Phase 6.

If Phase 5F finds defects, **they're easy to fix** because you know exactly which stage broke.

---

## Success Criteria

✓ Phase 5F is successful when:

1. **Certification test passes:** All assertions green
2. **Trace evidence generated:** Trace output JSON file created
3. **No mutations detected:** All values preserved through pipeline
4. **No multi-tenant leaks:** Org isolation verified
5. **Ownership matrix accurate:** Event ownership documented
6. **Pipeline map complete:** Component responsibilities clear
7. **Report signed off:** Certification report generated

---

## Next: Phase 6

Only after Phase 5F is complete:

**→ PHASE 6 — Async Notification Infrastructure**

Phase 6 adds:
1. Job queue (Inngest or Trigger.dev)
2. Retry logic (3x/5x based on priority)
3. Dead letter queue (failed notifications)
4. Scheduled sends (send in user's timezone)
5. Background workers (scale to 10k+ emails/day)

All of these become straightforward because you're building on a **certified, trusted pipeline**.

---

## Key Documents

1. **`.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md`** — Complete guide
2. **`.kiro/PHASE-5F-OWNERSHIP-MATRIX.md`** — Event ownership rules
3. **`.kiro/PHASE-5F-PIPELINE-MAP.md`** — Component documentation
4. **`.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md`** — Day-by-day tasks
5. **`tests/phase-5f-certification.test.ts`** — Actual test code
6. **`lib/notifications/runtime/trace-recorder.ts`** — Trace utilities

---

## Decision

**My Recommendation (if I were acting as Heloci's lead architect):**

Freeze feature development for one milestone.

Make the next goal: **"Runtime Pipeline Certification: One notification, zero assumptions."**

Once that's complete, you'll have proven:
- ✓ Data integrity (no mutations)
- ✓ Multi-tenant isolation (no leaks)
- ✓ Audit trail (every stage traced)
- ✓ Component responsibilities (clear ownership)

Then Phase 6 can be built with confidence instead of debugging through layers.

This is the highest-value next step for Heloci because it doesn't add features, but it establishes a **trusted foundation** for everything that comes after.

---

## Ready?

To get started:

1. Review this summary
2. Read `.kiro/PHASE-5F-IMPLEMENTATION-CHECKLIST.md` (day-by-day tasks)
3. Run the certification test
4. Let me know if you hit any blockers

I'm ready to help with debugging, refactoring, or adapting the certification to your specific needs.
