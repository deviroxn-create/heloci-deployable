# PHASE C.2 KICKOFF — Communication Platform Certification
## The Path to Complete System Integrity

**Date:** July 30, 2026  
**Phase:** C.2 — Event Inventory & Certification  
**Duration:** 3-4 weeks to 100% certification  
**Team Impact:** Unlocks seamless feature development  

---

## What This Phase Is About

We are stopping all feature work and symptom-chasing to build a master inventory of every business event in Heloci and certify that each one flows through the communication pipeline completely and correctly.

**Why Now?**
- Weeks of audits revealed the architecture works, but events are hitting it inconsistently
- Some events bypass the pipeline entirely (admin alerts via direct API)
- New features keep uncovering the same gaps because we've never certified the whole system
- The platform is 47% complete (18 of 38 events fully certified)

**What Success Looks Like:**
- Every business event is documented
- Every event travels through the canonical pipeline (8 stages)
- No events bypass the system
- Every delivery is logged and traceable
- New features only publish events—the platform handles the rest

---

## The Inventory: 38+ Events Across 9 Domains

### Breakdown by Status

| Status | Count | Examples |
|--------|-------|----------|
| ✅ Fully Certified | 18 | user.registration, application.submitted, documents.requested |
| ⏳ Partially Implemented | 3 | user.login, recommendation.available, communication.manual_send |
| ⚠️ Bypassing Pipeline | 1 | admin.alert.application_submitted (direct Telegram) |
| ❌ Missing Implementation | 16 | user.password.reset, organization.created, security.alert |

### Event Domains

1. **Authentication (4):** Registration, Login, Password Reset, Invitations
2. **Applications (10):** Submit, Approve, Reject, Waitlist, Reassign, Escalate, etc.
3. **Documents (4):** Request, Approve, Reject, Replace
4. **Eligibility (2):** Assessment, Ineligibility notification
5. **Matching (3):** Program match, Recommendation, Completion
6. **Programs (2):** Published, Archived
7. **Staff/Organization (5):** Invite, Accept, Role change, Removal, Creation
8. **Communication (3):** Message, Manual send, Admin action
9. **Alerts/System (5):** SLA breach, Deadline, Backup, Security, System events

---

## The 8-Stage Pipeline

Every event must pass through all 8 stages without exception:

```
1. Event Published
   ↓ Where: Service layer publishes domain event
   ✓ Example: decision.service.ts → publishDomainEvent('application.approved')

2. Subscriber Triggered
   ↓ What: NotificationDomainSubscriber receives and routes
   ✓ Example: DomainSubscriber sees application.approved event

3. Audience Resolved
   ↓ Who: AudienceResolver determines all recipients
   ✓ Example: Applicant, Case Worker, Housing Manager

4. Planner Executed
   ↓ How: CommunicationPlanner selects communication channels
   ✓ Example: Email + Internal notification + Telegram for admin

5. Template Loaded
   ↓ What: TemplateResolver finds and prepares template
   ✓ Example: "Application Approved" template with applicant data

6. Channel Selected
   ↓ Which: Routing assigns to provider
   ✓ Example: Email → Resend, Telegram → Telegram Bot

7. Provider Called
   ↓ Send: Provider executes delivery
   ✓ Example: Resend API sends email, retries on failure

8. Delivery Logged
   ↓ Audit: NotificationLog records everything
   ✓ Example: event_name, recipient, channel, status, timestamp
```

If **any** stage fails, the event is not certified.

---

## Current Certification Status

### Fully Certified ✅ (18 Events)

These events work perfectly through all 8 stages:

**Authentication:**
- user.registration ✅

**Applications:**
- application.submitted ✅
- application.approved ✅
- application.rejected ✅
- application.conditional ✅
- application.waitlisted ✅
- application.withdrawn ✅
- application.under_review ✅

**Documents:**
- documents.requested ✅
- document.approved ✅
- document.rejected ✅
- document.replacement_requested ✅

**Eligibility:**
- eligibility.assessed ✅

**Matching:**
- program.matched ✅

**Programs:**
- program.published ✅

**Staff:**
- staff.invited ✅
- staff.invitation.accepted ✅
- staff.role.changed ✅
- staff.removed ✅

**Communication:**
- message.created ✅
- admin.action ✅

### Partially Implemented ⏳ (3 Events)

These events start the pipeline but don't complete all stages:

- **user.login** - Published but missing template and conditional logic
- **recommendation.available** - Published but needs full verification
- **communication.manual_send** - Published but incomplete pipeline

### Critical Issue ⚠️ (1 Event)

This event BYPASSES the canonical pipeline:

- **admin.alert.application_submitted** - Uses direct Telegram API instead of NotificationDomainSubscriber
  - **Why it's critical:** Sets bad precedent, breaks auditing, defeats entire system
  - **Fix:** Migrate to canonical pipeline (2 hours)

### Missing Implementation ❌ (16 Events)

These events don't exist in the pipeline:

**Priority 1 (Required for platform completion - 8 events):**
- user.password.reset
- user.invitation.sent (staff variant)
- application.additional_info_requested
- eligibility.ineligible
- organization.created
- admin.alert.sla_breach
- admin.alert.deadline_approaching
- (Estimate: 12 hours to implement)

**Priority 2 (Nice-to-have - 8 events):**
- application.reassigned
- application.escalated
- matching.completed
- program.archived
- security.alert
- (Other P2 events)
- (Estimate: 8 hours to implement)

**Priority 3 (Future - 1 event):**
- system.backup_completed
- (Estimate: 1 hour to implement)

---

## Implementation Timeline

### Week 1: Gaps & Fixes
- **Day 1-2:** Migrate admin alerts from direct API to canonical pipeline (CRITICAL) ⚠️
- **Day 3-5:** Complete 3 partial implementations (user.login, recommendation.available, manual_send)
- **Verification:** Re-run 18 certified events to confirm still working

**Effort:** ~6 hours  
**Outcome:** Pipeline integrity restored, no more bypasses

### Week 2: Priority 1 Events
- **Day 1-3:** Implement authentication events (password reset, invitation)
- **Day 4-5:** Implement application/eligibility/organization events
- **Day 6-7:** Implement alert events (SLA, deadline)

**Effort:** ~12 hours  
**Outcome:** All critical communication paths functional

### Week 3: Priority 2 Events
- **Day 1-4:** Implement optional events (reassign, escalate, matching, archive, security)

**Effort:** ~8 hours  
**Outcome:** Platform feature-complete for foreseeable needs

### Week 4: Testing & Lock-Down
- **Day 1-2:** Write end-to-end tests for all 38 events
- **Day 3-4:** Run certification suite against all events
- **Day 5:** Sign-off and platform lock-down

**Effort:** ~8 hours  
**Outcome:** 100% certification rate, platform locked

---

## What NOT to Do

❌ **Don't fix Registration issues**  
We've certified it. It works. We're moving on.

❌ **Don't start Workflow Automation**  
Wait until communication platform is complete. They're independent.

❌ **Don't add new features**  
Pause feature work. We're building the foundation.

❌ **Don't keep chasing notification bugs**  
Stop guessing. Use the certification checklist. Every gap has a systematic fix.

---

## What We SHOULD Do

✅ **Build the inventory** (DONE)  
38 events catalogued, gaps identified, status clear.

✅ **Fix the bypass** (NEXT - 2 hours)  
Admin alerts cannot use direct API. Migrate to pipeline.

✅ **Complete partial implementations** (THEN - 4 hours)  
3 events are halfway done. Finish them.

✅ **Implement Priority 1 gaps** (THEN - 12 hours)  
8 critical events. Full pipeline for each.

✅ **Test & certify everything** (FINALLY)  
End-to-end test every event. Lock the system.

---

## Success Criteria

**Phase C.2 is complete when:**

- [x] Inventory created (38 events documented)
- [ ] Admin alerts migrated from bypass to pipeline
- [ ] All 3 partial implementations completed
- [ ] All 18 already-certified events still pass certification
- [ ] All 8 Priority 1 events implemented and certified
- [ ] All 8 Priority 2 events implemented and certified (nice-to-have)
- [ ] 100% event coverage documented
- [ ] End-to-end test suite covers all events
- [ ] Zero events bypass the canonical pipeline
- [ ] Platform locked (no ad-hoc notifications allowed)

---

## Documents Created

This phase includes 3 key documents:

1. **PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md** (YOU JUST READ THIS)
   - Complete inventory of all 38+ events
   - Detailed certification status for each event
   - Full 8-stage pipeline breakdown for each event
   - Implementation roadmap

2. **PHASE-C.2-CERTIFICATION-CHECKLIST.md**
   - Quick reference for certifying individual events
   - Template for running through all 8 stages
   - Validation scripts and sign-off process

3. **PHASE-C.2-KICKOFF-SUMMARY.md** (THIS DOCUMENT)
   - Executive summary
   - Timeline and effort estimates
   - What to do / what not to do
   - Success criteria

---

## Why This Matters

The communication platform is the nervous system of Heloci. Every business event flows through it. If it's incomplete or inconsistent:

- New features break existing notifications
- Bugs hide in the gaps
- Auditing becomes impossible
- Trust erodes

By completing Phase C.2:

- Every event flows through one canonical pipeline
- New features only publish events
- The platform handles everything else
- Features become predictable and debuggable
- The system becomes trustworthy

---

## Next Immediate Action

**Start here:**

1. Read: `PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md` (complete)
2. Review: Current admin alerts bypass (find in lib/telegram/alert-service.ts)
3. Ticket: Create "Migrate admin alerts to canonical pipeline" (2-hour task)
4. Begin: Week 1, Day 1

---

## Questions?

Refer to the complete inventory document for details on any specific event or stage.

This is the foundation. Everything else in the communication platform depends on it being solid.

Let's lock this down.

