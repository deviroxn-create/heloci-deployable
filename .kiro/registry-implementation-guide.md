# COMMUNICATION REGISTRY IMPLEMENTATION GUIDE

**Purpose:** Instructions for how to use the registry to drive implementation across all phases.

**Core Principle:** Every component reads from the registry. No hardcoding. No scattered switch statements.

---

## PHASE A: REGISTRY VALIDATION (COMPLETE)

### Checklist
- ✅ All published domain events in codebase are in registry
- ✅ No duplicate communication event names
- ✅ All audience/channel combinations are valid
- ✅ All template keys follow naming convention
- ✅ Migration status captures current state

### Current Validation Results
- **Total Entries:** 26 communication events
- **Complete (all phases):** 11 events
- **Phase B Ready (subscriber mapped):** 15 events  
- **Phase C Ready (runtime complete):** 11 events
- **Phase D Ready (no bypasses):** 11 events
- **Phase E Ready (legacy removed):** 11 events

---

## PHASE B: SUBSCRIBER COMPLETION

### What This Means
Every domain event published must be picked up by exactly one subscriber and translated to a communication event.

### Implementation Pattern

**File:** `lib/notifications/notification-domain-subscriber.ts`

Current state:
```typescript
const DEFAULT_SUBSCRIBED_EVENTS = [
  "user.registration",
  "user.login",
  "application.submitted",
  "application.review.completed",
  "application.approved",
  "application.rejected",
  "application.waitlisted",
  "documents.requested",
  "message.created",
  "admin.action"
];

const eventMapping = {
  "user.registration": "user_registration",
  "user.login": "user_login",
  "application.submitted": "application_submitted",
  // ... etc
};
```

### To Add Registry Support

Create a new function that reads from registry:

```typescript
function getRegistrySubscriptions(): string[] {
  // Instead of hardcoded array, read from registry
  // Return all domain event names that have communication events
  // This becomes the source of truth
}

function getEventNameMapping(domainEventName: string): string | undefined {
  // Look up domain event in registry
  // Return its communication event name
  // If not found, log error: "Domain event has no subscriber mapping"
}
```

### Validation for Phase B

For each entry in registry:
1. ✅ Domain event is in `DEFAULT_SUBSCRIBED_EVENTS`
2. ✅ Event name mapping exists in `eventMapping`
3. ✅ Mapping is one-to-one (not duplicate)
4. ✅ No domain event lacks subscriber
5. ✅ No communication event lacks domain source

### Missing Mappings to Add

From registry analysis:
- `eligibility.assessed` → `eligibility_assessment_completed`
- `recommendation.available` → `recommendation_available`
- `program.matched` → `program_matched`
- `program.published` → `program_published`
- `document.approved` → `document_approved`
- `document.rejected` → `document_rejected`
- `document.replacement.requested` → `document_replacement_requested`
- `staff.invited` → `staff_invited`
- `staff.invitation.accepted` → `staff_invitation_accepted`
- `staff.role.changed` → `staff_role_changed`
- `staff.removed` → `staff_removed`

### Verification Script

```bash
# After Phase B completion:
# 1. List all publishDomainEvent() calls in codebase
# 2. Check each domain event against subscriber map
# 3. Verify no silent drops

grep -r "publishDomainEvent(" lib/ actions/ --include="*.ts" \
  | grep -oP "publishDomainEvent\(['\"]?\K[^'\"()]+(?=['\"]?\))" \
  | sort | uniq > published_events.txt

# Check each is in subscriber
for event in $(cat published_events.txt); do
  grep -q "\"$event\"" lib/notifications/notification-domain-subscriber.ts \
    || echo "MISSING SUBSCRIBER: $event"
done
```

---

## PHASE C: RUNTIME COMPLETION

### What This Means
Every communication event in the registry must have complete coverage in:
1. **AudienceResolver:** Knows which audiences receive it
2. **CommunicationPlanner:** Knows which channels per audience
3. **TemplateResolver:** Knows which template per audience+channel

### Implementation Pattern

**Current State (scattered):**
```typescript
// In AudienceResolver:
switch (eventName) {
  case "user_registration":
    return [ applicant, org_admin ];
  case "application_submitted":
    return [ applicant, org_admin, reviewer, case_worker, support ];
  // ... more cases
}

// In CommunicationPlanner:
switch (eventName) {
  case "user_registration":
    return [
      { audience: "applicant", channels: ["email"] },
      { audience: "org_admin", channels: ["email", "internal"] }
    ];
  // ... more cases
}

// In TemplateResolver:
// Similar switch statements
```

**Target State (registry-driven):**
```typescript
// Create helper function:
function getRegistryEntry(eventName: string): CommunicationRegistryEntry | undefined {
  return COMMUNICATION_REGISTRY[eventName];
}

// In AudienceResolver.buildAudiences():
const entry = getRegistryEntry(eventName);
if (!entry) return [];
return entry.audiences.map(audienceName => ({
  role: audienceName,
  name: formatAudienceName(audienceName),
  recipient: await resolveRecipient(context, audienceName)
}));

// In CommunicationPlanner.plan():
const entry = getRegistryEntry(eventName);
if (!entry) return [];
return entry.audiences.map(audienceName => ({
  audienceRole: audienceName,
  preferredChannel: entry.channels[audienceName][0] // primary channel
}));

// In TemplateResolver.resolve():
const entry = getRegistryEntry(eventName);
const templateKey = `${audienceRole}.${eventName}.${channel}`;
// Look up template by key
```

### What's Currently Missing

From registry, these events need runtime coverage:
- `eligibility_assessment_completed` → 2 audiences, 2 channels
- `recommendation_available` → 2 audiences, 2 channels
- `program_matched` → 2 audiences, 2 channels
- `program_published` → 1 audience, 2 channels
- `document_approved` → 3 audiences, 2 channels
- `document_rejected` → 3 audiences, 2 channels
- `document_replacement_requested` → 2 audiences, 2 channels
- `staff_invited` → 1 audience, 1 channel
- `staff_invitation_accepted` → 1 audience, 3 channels
- `staff_role_changed` → 2 audiences, 3 channels
- `staff_removed` → 2 audiences, 3 channels
- `communication_manual_send` → 2 audiences, 3 channels
- `admin_alert_*` → 2 audiences, 2 channels

### Verification for Phase C

For each communication event in registry:
1. ✅ AudienceResolver has switch case or registry lookup
2. ✅ CommunicationPlanner has mapping for all audiences
3. ✅ TemplateResolver can resolve all template keys
4. ✅ No template missing (test with dummy templates)
5. ✅ No partially supported events

### Test Strategy

```typescript
// For each registry entry, run:
const event = "eligibility_assessment_completed";
const context = { userId: "test-user", organizationId: "test-org" };

const audiences = await AudienceResolver.resolve(event, context);
assert(audiences.length > 0, "No audiences for event");

const plans = CommunicationPlanner.plan(event, audiences);
assert(plans.length > 0, "No plans for event");

for (const plan of plans) {
  for (const channel of plan.channels) {
    const resolution = await TemplateResolver.resolve(plan, channel);
    assert(resolution.templateKey, `No template for ${plan.audienceRole}.${event}.${channel}`);
  }
}
```

---

## PHASE D: REMOVE BYPASSES

### What This Means
Every place that calls `notificationService.notify()` directly (outside subscriber) gets replaced with a domain event.

### Bypass Locations to Fix

**1. `actions/communication-dashboard.actions.ts`**

Current:
```typescript
export async function quickSendEmailAction(input) {
  const result = await notificationService.notify('admin_action', {...});
}
```

Target:
```typescript
export async function quickSendEmailAction(input) {
  // Step 1: Create domain event for this business action
  publishDomainEvent('communication.manual_send', {
    organizationId: input.organizationId,
    senderId: input.senderId,
    recipientEmail: input.recipientEmail,
    subject: input.subject,
    body: input.body,
    messageType: 'email',
    senderIdentityId: input.senderIdentityId
  });
  
  // Step 2: notificationService.notify() is called by subscriber
  // Step 3: Notification flows through canonical pipeline
  // Step 4: Everything is audited
}
```

**2. `lib/email/email.service.ts`**

Current:
```typescript
export async function sendEmail(request: EmailSendRequest) {
  const result = await notificationService.notify("admin_action", {...});
}
```

Target:
```typescript
export async function sendEmail(request: EmailSendRequest) {
  publishDomainEvent('communication.manual_send', {
    organizationId: request.organizationId,
    senderId: request.userId,
    recipientEmail: request.recipientEmail,
    subject: request.subject,
    body: request.body,
    messageType: 'email',
    senderIdentityId: request.senderIdentityId,
    templateId: request.templateId
  });
}
```

**3. `lib/telegram/alert-service.ts` (CRITICAL)**

Current:
```typescript
export async function queueTelegramAlert(event) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    // Direct API call - COMPLETELY BYPASSES PIPELINE
  });
}
```

Target:
```typescript
export async function queueTelegramAlert(event) {
  // Step 1: Publish domain event
  publishDomainEvent('admin.alert.application_submitted', {
    type: event.type,
    level: event.level,
    organizationId: event.organizationId,
    userId: getCurrentAdminId(), // Who triggered this alert
    metadata: event.data
  });
  
  // Step 2: Flows through canonical pipeline:
  // → Subscriber picks up
  // → Runtime resolves audience (org_admin)
  // → Planner selects channel (telegram)
  // → Resolver finds template (org_admin.admin_alert_application_submitted.telegram)
  // → TelegramProvider.send() called via provider adapter
  // → Logged to notificationLog
  // → Full audit trail
}
```

### New Registry Entries for Bypasses

For Phase D, add to registry:
- `communication.manual_send` - for composed emails
- `admin.alert.application_submitted` - for telegram alerts
- `admin.alert.sla_breach` - for SLA violation alerts
- etc. (one per alert type)

### Verification for Phase D

```bash
# After Phase D, these should have zero results:
grep -r "notificationService\.notify" lib/ actions/ \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | grep -v "notification-domain-subscriber.ts" \
  | grep -v "notification.service.ts" \
  | wc -l
# Result should be: 0
```

Also verify Telegram:
```bash
# Direct Telegram API calls should not exist:
grep -r "api.telegram.org" lib/ actions/ \
  --exclude-dir=node_modules \
  | wc -l
# Result should be: 0
```

---

## PHASE E: LEGACY REMOVAL

### What This Means
Once runtime has complete coverage, remove the legacy routing code that was kept for backward compatibility.

### Code to Remove

**In `notification.service.ts`:**

Remove:
```typescript
function resolveNotificationRoutingPlan(eventName, payload, settings) {
  // 80+ lines of hardcoded routing logic
  // DELETE THIS ENTIRE FUNCTION
}

function isRuntimeEnabledForEvent(eventName) {
  // Check if should use runtime or legacy
  // Once all events use runtime, this can check 'always runtime'
  // Eventually DELETE THIS TOO
}

// The shadow comparison code:
void runShadowRuntimeObservation(...);
// DELETE THIS
```

Keep only:
```typescript
export async function notify(eventName, payload, senderIdentityId?) {
  // Load settings
  // Call RuntimeOrchestrator.run() - ALWAYS
  // That's it
}
```

### Timeline for Phase E
- **Prerequisite:** Phase D complete (no bypasses)
- **Prerequisite:** Phase C complete (runtime has all events)
- **Prerequisite:** Runtime verified in production for 2+ weeks
- **Action:** Remove legacy code
- **Verification:** All tests pass, all events still work

---

## IMPLEMENTATION CHECKLIST

### Phase A (Registry Definition)
- [x] Communication Registry created
- [x] All 26 events registered
- [x] All audiences defined
- [x] All channels listed
- [x] Template naming convention established
- [x] Retry policies defined
- [x] Validation rules documented
- [x] Migration status table created

### Phase B (Subscriber Completion)
- [ ] Add 11 missing subscriber mappings
- [ ] Validate no silent drops
- [ ] Add verification script to CI/CD
- [ ] Test each mapping with domain event
- [ ] Document each addition

### Phase C (Runtime Completion)
- [ ] Add 13 missing events to AudienceResolver
- [ ] Add 13 missing events to CommunicationPlanner
- [ ] Create templates for all audience+channel combinations
- [ ] Add 13 missing events to TemplateResolver
- [ ] Create integration tests for each event type

### Phase D (Remove Bypasses)
- [ ] Replace `quickSendEmailAction()` with domain event
- [ ] Replace `sendEmailWithInternalMessageAction()` with domain event
- [ ] Replace `sendEmail()` with domain event
- [ ] Rearchitect `queueTelegramAlert()` to use provider adapter
- [ ] Add `communication.manual_send` event to registry
- [ ] Add `admin.alert.*` events to registry
- [ ] Verify zero direct notify() calls
- [ ] Verify zero direct Telegram API calls

### Phase E (Legacy Removal)
- [ ] Wait for production verification (2 weeks)
- [ ] Remove legacy routing function
- [ ] Remove shadow comparison code
- [ ] Remove legacy path from notification.service.ts
- [ ] Remove isRuntimeEnabledForEvent() gate (make always true)
- [ ] Update tests to verify runtime only
- [ ] Final comprehensive regression test

---

## REGISTRY AS SOURCE OF TRUTH

Once Phase C is complete, the registry becomes the authoritative source for:

### For AudienceResolver
```typescript
registry[eventName].audiences → List of possible audiences
```

### For CommunicationPlanner
```typescript
registry[eventName].audiences[audience].channels → Allowed channels
```

### For TemplateResolver
```typescript
registry[eventName].templateKeys → All valid template key patterns
```

### For Dispatcher
```typescript
registry[eventName].priority → How urgently to send
registry[eventName].retry → Max attempts and backoff
```

### For Notifications API
```typescript
registry[eventName].type → user-facing vs staff vs system
registry[eventName].audiences → Who can query this
```

### For Admin Dashboard
```typescript
registry.all → List all possible communications
registry[eventName].priority → Show urgency
registry[eventName].channels → Show delivery methods
```

---

## ANTI-PATTERNS TO AVOID

### ❌ DON'T: Hardcode routing logic
```typescript
// Bad
if (eventName === "user_registration") {
  channels = ["email", "internal"];
} else if (eventName === "application_submitted") {
  channels = ["email", "telegram", "internal"];
}
```

### ✅ DO: Read from registry
```typescript
// Good
const entry = REGISTRY[eventName];
const channels = entry?.channels || [];
```

### ❌ DON'T: Create new events without registry entry
```typescript
// Bad - event exists but not in registry
publishDomainEvent("some.random.event", {...});
```

### ✅ DO: Add registry entry first
```typescript
// Good - registry first, then event, then subscriber
// 1. Add to COMMUNICATION_REGISTRY
// 2. publishDomainEvent("registered.event", {...});
```

### ❌ DON'T: Bypass the pipeline
```typescript
// Bad
await telegramAPI.sendMessage(...);
await emailAPI.send(...);
```

### ✅ DO: Use provider adapters
```typescript
// Good
publishDomainEvent("something.happened", {...});
// Provider adapter handles delivery
```

---

## SUCCESS CRITERIA

**Registry is complete when:**
1. ✅ All published domain events are in registry
2. ✅ No duplicate event names
3. ✅ All audience/channel combos are valid
4. ✅ Template key naming is consistent
5. ✅ Validation rules are documented
6. ✅ No conflicting mappings

**Subscriber phase is complete when:**
1. ✅ Every domain event has subscriber
2. ✅ No silent drops (all published → notification triggered)
3. ✅ Mappings are one-to-one
4. ✅ Verification script passes
5. ✅ Integration tests pass

**Runtime phase is complete when:**
1. ✅ All audiences resolvable
2. ✅ All channels plannable
3. ✅ All templates resolvable
4. ✅ No partial coverage
5. ✅ Full end-to-end tests pass

**Bypass removal is complete when:**
1. ✅ Zero direct `notify()` calls outside subscriber
2. ✅ Zero direct Telegram API calls
3. ✅ All manual emails flow through domain events
4. ✅ All alerts flow through canonical pipeline
5. ✅ Grep verification passes

**Legacy removal is complete when:**
1. ✅ Legacy routing code deleted
2. ✅ Shadow comparison removed
3. ✅ Runtime-only pipeline
4. ✅ All tests pass
5. ✅ Production verification complete

