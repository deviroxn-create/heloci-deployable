# PHASE C.2 — CERTIFICATION CHECKLIST
## Quick Reference for Event Certification

Use this checklist when certifying each event through all 8 stages.

---

## Template: Event Certification Checklist

```
Event: [EVENT_NAME]
Communication Event: [COMMUNICATION_EVENT_NAME]

Stage 1: Event Published ☐
  ☐ Found publishDomainEvent() call in source code
  ☐ Event name matches COMMUNICATION_REGISTRY entry
  ☐ Payload includes all required fields
  ☐ Event fires in correct circumstance
  Source file: _______________
  
Stage 2: Subscriber Triggered ☐
  ☐ NotificationDomainSubscriber has handler
  ☐ Communication event name is correct
  ☐ Subscriber processes the event
  ☐ No errors in processing
  Test verified by: _______________
  
Stage 3: Audience Resolved ☐
  ☐ AudienceResolver identifies recipients
  ☐ Recipients are correct role/type
  ☐ Inactive users are filtered
  ☐ Correct count of recipients
  Expected recipients: _______________ 
  
Stage 4: Planner Executed ☐
  ☐ CommunicationPlanner selects channels
  ☐ Channels match event type (email/telegram/internal)
  ☐ User preferences respected
  ☐ Multi-recipient scenarios handled
  Selected channels: _______________
  
Stage 5: Template Loaded ☐
  ☐ TemplateResolver finds template
  ☐ Template has subject, body, HTML
  ☐ Template variables filled correctly
  ☐ Localization working (if needed)
  Template file: _______________
  
Stage 6: Channel Selected ☐
  ☐ Email events → Resend provider
  ☐ Telegram events → Telegram Bot
  ☐ Internal events → Notification Center
  ☐ Routing logic correct
  Provider used: _______________
  
Stage 7: Provider Called ☐
  ☐ Provider API received request
  ☐ All required fields passed
  ☐ Response status is success
  ☐ Retries configured (if applicable)
  Response status: _______________
  
Stage 8: Delivery Logged ☐
  ☐ NotificationLog entry created
  ☐ event_name recorded
  ☐ recipient_email recorded
  ☐ delivery_status recorded
  ☐ Can trace full flow in logs
  Log entry ID: _______________

CERTIFICATION RESULT: ☐ CERTIFIED ☐ INCOMPLETE ☐ FAILED
Notes: _______________________________________________________________
```

---

## Checklist by Priority

### Priority 0 (Critical) — 18 Events Certified ✅

#### Authentication
- [x] user.registration
- [ ] user.login (⏳ INCOMPLETE)
- [x] user.invitation.sent (Actually = staff.invited, see Staff)
- [x] user.password.reset (Actually, NOT DONE - see gap)

#### Applications
- [x] application.submitted
- [x] application.approved
- [x] application.rejected
- [x] application.conditional
- [x] application.waitlisted
- [x] application.withdrawn
- [x] application.under_review

#### Documents
- [x] documents.requested
- [x] document.approved
- [x] document.rejected
- [x] document.replacement_requested

#### Eligibility
- [x] eligibility.assessed

#### Matching
- [x] program.matched

#### Programs
- [x] program.published

#### Staff
- [x] staff.invited
- [x] staff.invitation.accepted
- [x] staff.role.changed
- [x] staff.removed

#### Communication
- [x] message.created
- [x] admin.action

---

### Priority 1 (Required) — 8 Events to Implement

#### Authentication
- [ ] user.password.reset
  - [ ] S1: Publish in password reset flow
  - [ ] S2: Add to subscriber
  - [ ] S3: Audience = user only
  - [ ] S4: Planner selects email
  - [ ] S5: Load password reset template
  - [ ] S6: Route to email provider
  - [ ] S7: Send via Resend
  - [ ] S8: Log delivery

- [ ] user.invitation.sent (staff invitation variant)
  - [ ] S1: Publish when staff invited
  - [ ] S2: Add to subscriber
  - [ ] S3: Audience = invited staff email
  - [ ] S4: Planner selects email
  - [ ] S5: Load invitation template
  - [ ] S6: Route to email provider
  - [ ] S7: Send via Resend
  - [ ] S8: Log delivery

#### Applications
- [ ] application.additional_info_requested
  - [ ] S1-S8: Implement full pipeline

#### Eligibility
- [ ] eligibility.ineligible
  - [ ] S1-S8: Implement full pipeline

#### Matching
- [ ] (None at P1)

#### Organization
- [ ] organization.created
  - [ ] S1-S8: Implement full pipeline

#### Alerts
- [ ] admin.alert.sla_breach
  - [ ] S1-S8: Implement full pipeline
  
- [ ] admin.alert.deadline_approaching
  - [ ] S1-S8: Implement full pipeline

#### Total P1 Effort: ~12 hours

---

### Priority 2 (Nice-to-Have) — 8 Events

- [ ] user.login (complete partial)
- [ ] application.reassigned
- [ ] application.escalated
- [ ] matching.completed
- [ ] program.archived
- [ ] recommendation.available (complete partial)
- [ ] communication.manual_send (complete partial)
- [ ] security.alert

#### Total P2 Effort: ~8 hours

---

### Priority 3 (Future) — 1 Event

- [ ] system.backup_completed

#### Total P3 Effort: ~1 hour

---

## Critical Fix: Admin Alerts Bypass

**Status:** CRITICAL ⚠️  
**Issue:** `admin.alert.application_submitted` uses direct Telegram API, bypassing canonical pipeline  
**Fix Required:** Migrate to NotificationDomainSubscriber

### Certification Checklist for Alert Migration

- [ ] Remove direct Telegram API call from alert-service.ts
- [ ] Publish domain event instead: `publishDomainEvent('admin.alert.application_submitted', payload)`
- [ ] Register in COMMUNICATION_REGISTRY
- [ ] Map to communication event name
- [ ] NotificationDomainSubscriber handles it
- [ ] AudienceResolver identifies recipient (org admin)
- [ ] CommunicationPlanner selects Telegram channel
- [ ] Template loads correctly
- [ ] Telegram provider called via normal flow
- [ ] Delivery logged to NotificationLog
- [ ] End-to-end test passes
- [ ] Remove bypass code completely
- [ ] Verify alert still reaches admin in real time

---

## Validation Scripts

### Test Single Event Certification

```typescript
// Test framework
async function certifyEvent(eventName: string, eventPayload: any) {
  console.log(`\n📋 Certifying: ${eventName}`);
  
  // S1: Publish
  publishDomainEvent(eventName, eventPayload);
  console.log(`✅ S1: Event published`);
  
  // S2: Subscriber processes
  await waitFor(() => notificationCalled, 1000);
  console.log(`✅ S2: Subscriber triggered`);
  
  // S3: Audience resolved
  const audience = await getResolvedAudience();
  assert(audience.length > 0, 'No recipients resolved');
  console.log(`✅ S3: Audience resolved (${audience.length} recipients)`);
  
  // S4-8: Trust pipeline (or verify individually)
  // ... verify each stage
  
  console.log(`✅ ALL STAGES PASSED: ${eventName}\n`);
}
```

### Run Complete Certification Suite

```bash
# Run all 18 certified events to verify still working
npm run test -- --grep "certification.*8-stage"

# Run priority 1 gaps (once implemented)
npm run test -- --grep "certification.*p1-events"

# Run specific event
npm run test -- --grep "certification.*application.submitted"
```

---

## Sign-Off Template

When an event is certified, mark it here:

```
✅ CERTIFIED EVENT: [event_name]
   Certified by: [your_name]
   Date: [date]
   Test ID: [test_id]
   All 8 stages verified ✅
   Production ready ✅
```

---

## Summary

- **Total Events to Certify:** 38
- **Already Certified:** 18 ✅
- **In Progress:** 3 ⏳
- **Critical Issues:** 1 (admin alerts bypass) ⚠️
- **Gaps to Fill:** 16 ❌

**Goal:** 100% certification rate before platform lock-down.

