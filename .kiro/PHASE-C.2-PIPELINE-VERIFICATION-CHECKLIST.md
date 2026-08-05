# PHASE C.2 — PIPELINE VERIFICATION CHECKLIST

**Purpose:** Step-by-step verification guide for the 8-stage communication pipeline  
**Date:** 2026-07-30  
**Methodology:** For each event, verify all 8 stages. If any stage fails, document the blocker.

---

## HOW TO USE THIS CHECKLIST

### Step 1: Select an Event
Choose an event from the certification matrix that shows ⏳ or ❓ status.

### Step 2: Verify Each Stage
Follow the checklist below for each of the 8 stages.

### Step 3: Document Results
- **✅ Complete** - Mark as done, note the source file/function
- **⏳ In Progress** - Note what's missing and what needs to be done
- **❓ Not Started** - Determine if event is needed and prioritize
- **🔴 Blocked** - Document the blocking issue

### Step 4: Update Matrix
Update PHASE-C.2-EVENT-CERTIFICATION-MATRIX.md with verification results.

---

## STAGE 1: EVENT PUBLISHED

**Question:** Is the event actually published in the source service?

### Verification Checklist

- [ ] Find the service that triggers this event
- [ ] Search for `publishDomainEvent('{event-name}', ...)`
- [ ] Confirm the event name matches registry format
- [ ] Verify event payload includes all required fields
- [ ] Check event metadata includes source and timestamp

### Example: `application.submitted`

```typescript
// Found in: lib/reviews/decision.service.ts (or during application submission)
publishDomainEvent("application.submitted", {
  applicationId: application.id,
  userId: application.user.id,
  email: application.user.email,
  organizationId: application.programApplication.program.organizationId
});
```

**Status:** ✅ Published

---

## STAGE 2: SUBSCRIBER TRIGGERED

**Question:** Is the event subscribed to in NotificationDomainSubscriber?

### Verification Checklist

- [ ] Open `lib/notifications/runtime/runtime-subscriber.ts`
- [ ] Find the SUBSCRIBED_DOMAIN_EVENTS array
- [ ] Search for the event name in the array
- [ ] If found: `✅ Subscribed`
- [ ] If NOT found: `⏳ Missing subscription` (ADD IT)
- [ ] If found, check the handler function exists
- [ ] Verify handler calls `notificationService.notify()`

### Example: `application.submitted`

```typescript
// In: lib/notifications/runtime/runtime-subscriber.ts
const SUBSCRIBED_DOMAIN_EVENTS = [
  "user.registration",
  "user.login",
  "application.submitted",  // ✅ Found here
  // ... more events
];

// In handler function:
if (eventName === "application.submitted") {
  await notificationService.notify("application_submitted", {
    // payload here
  });
}
```

**Status:** ✅ Subscribed

---

## STAGE 3: AUDIENCE RESOLVED

**Question:** Does AudienceResolver correctly identify all recipients for this event?

### Verification Checklist

- [ ] Open `lib/communications/runtime/AudienceResolver.ts`
- [ ] Search for the event name in the resolver
- [ ] Check if event has an entry in the registry
- [ ] Verify the entry maps to a communication event name
- [ ] Confirm audiences defined in registry
- [ ] Test audience resolution for at least 2 recipients
- [ ] Verify no cross-organization recipients

### Example: `application.submitted`

```typescript
// In registry: application.submitted → application_submitted
// Audiences: applicant, org_admin, reviewer, case_worker, support

// AudienceResolver should find:
// 1. The applicant (user)
// 2. The organization admin
// 3. The assigned reviewer
// 4. Any case workers
// 5. Support team (if configured)
```

**Status:** ✅ Resolved

---

## STAGE 4: PLANNER EXECUTED

**Question:** Does CommunicationPlanner execute and determine routing rules?

### Verification Checklist

- [ ] Open `lib/notifications/runtime/runtime-subscriber.ts`
- [ ] Find the CommunicationPlanner execution
- [ ] Verify planner receives AudienceResolvedRequest
- [ ] Check planner determines channels (email, telegram, internal, whatsapp)
- [ ] Verify planner respects audience preferences
- [ ] Ensure planner groups by channel efficiently
- [ ] Test planner for at least 1 audience

### Example: `application.submitted`

```typescript
// CommunicationPlanner should determine:
// Applicant → Email
// Org Admin → Telegram + Internal
// Reviewer → Internal
// Case Worker → Internal
// Support → Email
```

**Status:** ✅ Planned

---

## STAGE 5: TEMPLATE LOADED

**Question:** Does TemplateResolver select the correct template?

### Verification Checklist

- [ ] Find the template in the database (CommunicationTemplate table)
- [ ] Template key should follow format: `{audience}.{event}.{channel}`
- [ ] Example: `applicant.application_submitted.email`
- [ ] Verify template content is complete
- [ ] Test template rendering with sample data
- [ ] Ensure template includes all required fields
- [ ] Check template is published/active

### Example: `application.submitted`

```
Templates needed:
- applicant.application_submitted.email
- org_admin.application_submitted.telegram
- org_admin.application_submitted.internal
- reviewer.application_submitted.internal
- case_worker.application_submitted.internal
- support.application_submitted.email
```

**Status:** Check if all exist in database

---

## STAGE 6: CHANNEL SELECTED

**Question:** Is the correct provider selected for the channel?

### Verification Checklist

- [ ] For **email**: Verify Resend provider adapter invoked
- [ ] For **telegram**: Verify Telegram provider adapter invoked
- [ ] For **internal**: Verify notification center adapter invoked
- [ ] For **whatsapp**: Verify WhatsApp provider adapter invoked
- [ ] Check provider configuration exists
- [ ] Verify provider credentials are set
- [ ] Test provider adapter with sample message

### Example: `application.submitted`

```typescript
// Email channel → Resend provider
// Telegram channel → Telegram provider
// Internal channel → Notification service
// All providers should be configured and available
```

**Status:** Check provider-adapters.ts

---

## STAGE 7: PROVIDER CALLED

**Question:** Is the message actually sent to the provider?

### Verification Checklist

- [ ] Add temporary logging before provider call
- [ ] Run the event trigger manually
- [ ] Verify provider method called with correct parameters
- [ ] Check provider response is successful
- [ ] Verify message was actually delivered (check provider logs)
- [ ] Remove temporary logging after verification
- [ ] Test with each channel type

### Example: `application.submitted`

```typescript
// Log before each provider call:
console.log("Sending email to:", recipient.email);
console.log("Template:", templateKey);
console.log("Channel:", channel);

// Verify provider adapter executes
// Check provider API response
// Confirm message in provider logs
```

**Status:** Run test locally

---

## STAGE 8: DELIVERY LOGGED

**Question:** Is the delivery event recorded in the audit trail?

### Verification Checklist

- [ ] Check NotificationLog table for event record
- [ ] Verify AuditLog table has corresponding entry
- [ ] Confirm trace ID links both tables
- [ ] Check all required fields populated:
  - [ ] eventName
  - [ ] communicationEventName
  - [ ] recipientId
  - [ ] channel
  - [ ] status (sent/failed/pending)
  - [ ] provider
  - [ ] timestamp
  - [ ] traceId
  - [ ] organizationId
- [ ] Verify no PII in logs (only recipient IDs)

### Example: `application.submitted`

```sql
-- Query NotificationLog:
SELECT * FROM NotificationLog 
WHERE communicationEventName = 'application_submitted'
ORDER BY createdAt DESC LIMIT 1;

-- Verify fields:
- traceId: matches request
- recipientId: matches audience
- organizationId: matches application org
- channel: email/telegram/internal
- status: sent
```

**Status:** Query logs after event

---

## QUICK REFERENCE: FULLY COMPLETE EVENTS

These events have all 8 stages complete. Use them as reference:

1. ✅ **user.registration** - All stages complete
2. ✅ **application.submitted** - All stages complete
3. ✅ **application.approved** - All stages complete
4. ✅ **application.rejected** - All stages complete
5. ✅ **documents.requested** - All stages complete
6. ✅ **staff.invited** - All stages complete
7. ✅ **message.created** - All stages complete

For any incomplete event, compare against one of these to understand what's missing.

---

## INVESTIGATION TEMPLATE

Use this template for each event you investigate:

```markdown
### Event: {event-name}

**Stage 1 - Published:**
- Source: {file-path}
- Found at line: {line-number}
- Status: ✅/⏳/❓

**Stage 2 - Subscribed:**
- Location: {file-path}
- Handler exists: Yes/No
- Status: ✅/⏳/❓

**Stage 3 - Audience Resolved:**
- Registry entry: {yes/no}
- Audiences defined: {list}
- Status: ✅/⏳/❓

**Stage 4 - Planner Executed:**
- Planner mapping exists: {yes/no}
- Channels determined: {list}
- Status: ✅/⏳/❓

**Stage 5 - Template Loaded:**
- Templates found: {count}
- Template keys: {list}
- Status: ✅/⏳/❓

**Stage 6 - Channel Selected:**
- Providers configured: {yes/no}
- Status: ✅/⏳/❓

**Stage 7 - Provider Called:**
- Test result: {success/fail}
- Status: ✅/⏳/❓

**Stage 8 - Delivery Logged:**
- Log records found: {yes/no}
- Status: ✅/⏳/❓

**Blockers:** {list of issues preventing completion}
**Priority:** {high/medium/low}
**Recommended Action:** {next step}
```

---

## NEXT STEPS

1. Use this checklist to investigate each ⏳ and ❓ event
2. Document findings for each stage
3. Update PHASE-C.2-EVENT-CERTIFICATION-MATRIX.md
4. Create a PHASE-C.2-BLOCKING-ISSUES.md document listing all issues
5. Prioritize fixes by impact and dependencies
6. Execute fixes to complete each stage
7. Re-verify after each fix
8. Update matrix with completion status
