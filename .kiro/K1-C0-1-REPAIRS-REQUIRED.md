# K1.C0.1 — REPAIRS REQUIRED BEFORE PHASE C

**Date:** July 29, 2026  
**Status:** Audit Complete - Violations Documented  
**Required Work:** 6 hours to fix all violations  

---

## EXACT REPAIR LIST

### REPAIR #1: sendMixedEmailAction

**Severity:** 🔴 CRITICAL  
**Violation:** Rule 4 - Actions may not directly send communications  
**Current File:** `actions/email-compose.actions.ts` (lines 96-175)  

**What's Wrong:**
```typescript
export async function sendMixedEmailAction(payload: EmailComposePayload) {
  for (const recipient of payload.recipients) {
    const domainEventResult = await publishDomainEvent(  // ❌ Direct publish
      'admin.action',
      { recipientEmail: recipient.email, ... }
    );
  }
}
```

**What Must Change:**

1. Create new file: `lib/communications/email-compose.service.ts`
   - Move email sending logic here
   - This service publishes the domain event
   - Actions call the service

2. Update action: `actions/email-compose.actions.ts`
   - Call new service instead of publishDomainEvent
   - Service handles all business logic

**Pseudocode:**
```typescript
// NEW SERVICE
export async function sendMixedEmails(payload: EmailComposePayload) {
  for (const recipient of payload.recipients) {
    // Business logic here
    // Then publish event
    publishDomainEvent('admin.action', {...});
  }
}

// UPDATED ACTION
export async function sendMixedEmailAction(payload: EmailComposePayload) {
  return sendMixedEmails(payload);  // Just delegates
}
```

**Estimated Effort:** 2 hours  
**Related Files:**
- `lib/communications/email-compose.service.ts` (create new)
- `actions/email-compose.actions.ts` (update)

**Test Verification:**
- Action still works from UI
- Service can be called independently
- Event is published with correct payload

---

### REPAIR #2: /send-message Route (Organization Emails)

**Severity:** 🔴 CRITICAL  
**Violation:** Rule 5 - API routes must publish domain events  
**Current File:** `app/api/communications/send-message/route.ts` (~lines 100-220)  

**What's Wrong:**
```typescript
export async function POST(request: NextRequest) {
  if (applicationId) {
    // Application conversation
    publishDomainEvent("message.created", {...});  // ✓ Event published
  } else {
    // Organization email
    // ❌ NO EVENT PUBLISHED - notification never generated
    await createOrganizationEmailRecord(...);
  }
}
```

**What Must Change:**

1. Add registry entry for `communication_manual_send`
   - Domain event name: `admin.action` or create new `communication.manual_send`
   - Audiences: org_admin, staff_admin
   - Channels: email, internal

2. Publish event for organization emails
   ```typescript
   publishDomainEvent("admin.action", {
     recipientEmail: recipient.email,
     organizationId,
     eventType: "manual_send",
     ...
   });
   ```

3. Ensure NotificationLog entry is created
   - Should happen automatically via event → subscriber → notify()

**Estimated Effort:** 1 hour  

**Related Files:**
- `app/api/communications/send-message/route.ts` (update)
- `lib/communications/communication-registry.ts` (add entry)

**Test Verification:**
- Organization email creates NotificationLog entry
- NotificationDomainSubscriber receives event
- Event is registered in registry

---

### REPAIR #3: sendTestNotificationAction

**Severity:** 🔴 CRITICAL  
**Violation:** Rule 4 - Actions may not directly send communications  
**Current File:** `actions/notifications.actions.ts` (lines 29-42)  

**What's Wrong:**
```typescript
export async function sendTestNotificationAction(settings?: NotificationSettings) {
  publishDomainEvent("admin.action", {  // ❌ Test action directly publishes
    name: "Admin",
    userEmail: settings?.senderEmail || "support@heloci.ngo",
  });
}
```

**What Must Change:**

Option A: Create test service
```typescript
// NEW: lib/admin/test-notification.service.ts
export async function sendTestNotification(settings?: NotificationSettings) {
  publishDomainEvent("admin.test", {  // New test event
    ...
  });
}

// UPDATED: actions/notifications.actions.ts
export async function sendTestNotificationAction(settings?) {
  return sendTestNotification(settings);  // Delegate to service
}
```

Option B: Restrict to test mode
```typescript
export async function sendTestNotificationAction() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Test notifications only in development");
  }
  // Continue with test event...
}
```

**Recommended:** Option A (cleaner separation)

**Estimated Effort:** 1 hour  

**Related Files:**
- `actions/notifications.actions.ts` (update)
- `lib/admin/test-notification.service.ts` (create new)
- `lib/communications/communication-registry.ts` (add `admin.test` entry)

**Test Verification:**
- Test notification works in development
- Blocked in production (if using Option B)
- Service can be called independently

---

### REPAIR #4: Consolidate API Routes

**Severity:** 🟡 HIGH  
**Violation:** Rule 5 - Inconsistent event publishing patterns  
**Current Files:**
- `app/api/communications/send-message/route.ts`
- `app/api/communications/messages` (alternative endpoint)
- `app/api/communications/document-requests`  

**What's Wrong:**
- Multiple endpoints for messaging
- Different event patterns in each
- Hard to audit all paths
- Easy to miss one and create bypass

**What Must Change:**

1. Primary endpoint: `app/api/communications/send-message/route.ts`
   - For all message types (application, organization)
   - Consistent event publishing
   - Clear request/response format

2. Deprecate or remove:
   - `app/api/communications/messages` (merge into send-message)
   - Alternative patterns (use only primary endpoint)

3. Document-specific: `app/api/communications/document-requests`
   - OK to keep if publishes consistent events
   - Verify event is in registry

**Estimated Effort:** 2 hours  

**Related Files:**
- `app/api/communications/send-message/route.ts` (update to handle all types)
- `app/api/communications/messages` (deprecate)
- `app/api/communications/document-requests` (verify/update)

**Test Verification:**
- All message types work through primary endpoint
- All domain events are published
- All NotificationLogs are created
- No silent failures in any path

---

### REPAIR #5: Verify Direct notify() Calls

**Severity:** 🟡 MEDIUM  
**Violation:** Rule 7 - Only subscriber may invoke notify()  
**Current Status:** Phase B.6 claims to have fixed this  

**What's Wrong:**
Possible remaining direct calls to `notificationService.notify()` outside:
- `notification-domain-subscriber.ts` (allowed)
- Test files (OK for tests)
- Legacy paths marked for deprecation

**What Must Change:**

1. Search for all remaining direct `notify()` calls:
   ```bash
   grep -r "notificationService\.notify(" --include="*.ts" --exclude-dir=tests --exclude-dir=node_modules
   ```

2. For each found:
   - Verify it's in expected location (subscriber or tests)
   - If elsewhere, move to service layer
   - Ensure event is published before notify call

3. Example fix (if found):
   ```typescript
   // WRONG (direct call)
   export async function sendManualEmail() {
     await notificationService.notify("custom_email", {...});  // ❌
   }

   // RIGHT (via event)
   export async function sendManualEmail() {
     publishDomainEvent("custom.email.sent", {...});  // Event triggers subscriber
   }
   ```

**Estimated Effort:** 1 hour  

**Related Files:**
- Various (search results will identify)
- `lib/communications/message-template.service.ts` (suspicious)
- `lib/email/send.ts` (appears fixed, verify)

**Test Verification:**
- No direct notify() calls found outside allowed locations
- All notifications come from subscriber path
- Event audit script runs cleanly

---

### REPAIR #6: Add Registry Validation

**Severity:** 🟡 MEDIUM  
**Violation:** Unknown events are silently dropped  

**What's Wrong:**
```typescript
// If event not in registry, this just logs a warning (line 75 in subscriber)
if (!communicationEventName) {
  console.warn(`UNREGISTERED DOMAIN EVENT: ${event.eventName}`);  // Silent drop
  return;
}
```

**What Must Change:**

1. Change from warning to error in production:
   ```typescript
   if (!communicationEventName) {
     if (process.env.NODE_ENV === "production") {
       throw new Error(`Unregistered domain event: ${event.eventName}`);  // Block
     }
     console.warn(`Unregistered: ${event.eventName}`);  // Warn in dev
     return;
   }
   ```

2. Add validation function in registry:
   ```typescript
   export function validateAllPublishedEventsRegistered() {
     // Compare all publishDomainEvent() calls in codebase
     // Against getAllDomainEvents() from registry
     // List any mismatches
   }
   ```

3. Run before deploy:
   ```bash
   npm run validate:events
   ```

**Estimated Effort:** 1 hour  

**Related Files:**
- `lib/notifications/notification-domain-subscriber.ts` (update validation)
- `lib/communications/communication-registry.ts` (add validation function)
- `package.json` (add script)

**Test Verification:**
- Unknown events throw error (production)
- Validation script passes before deploy
- All published events are registered

---

## REPAIR CHECKLIST

- [ ] REPAIR #1: Create email-compose.service.ts and update action
- [ ] REPAIR #2: Add org email event publishing to /send-message
- [ ] REPAIR #3: Create test-notification.service.ts and update action
- [ ] REPAIR #4: Consolidate API routes
- [ ] REPAIR #5: Verify no direct notify() calls remain
- [ ] REPAIR #6: Add registry validation with error throwing
- [ ] Run full event audit script: `scripts/phase-b-event-audit.ts`
- [ ] Run integration tests for all communication paths
- [ ] Verify EventLog for consistency
- [ ] Update documentation with consolidated patterns

---

## VERIFICATION CHECKLIST

After all repairs, verify:

1. **Event Flow**
   - [ ] All publishDomainEvent() calls logged and working
   - [ ] All events in registry
   - [ ] NotificationDomainSubscriber receives all events
   - [ ] notificationService.notify() called exactly once per event

2. **Audit Trail**
   - [ ] NotificationLog entries for all communications
   - [ ] AuditLog entries for all decisions
   - [ ] Timestamps consistent across all three
   - [ ] No silent failures

3. **API Consistency**
   - [ ] Single endpoint for messages (/send-message)
   - [ ] All paths publish events
   - [ ] All paths create NotificationLog
   - [ ] No duplicate notifications

4. **Type Safety**
   - [ ] TypeScript compilation clean
   - [ ] No `any` types introduced
   - [ ] All events in registry have types

5. **Testing**
   - [ ] Unit tests pass for services
   - [ ] Integration tests pass for full flow
   - [ ] Event audit script runs cleanly
   - [ ] No unregistered events in logs

---

## TOTAL EFFORT ESTIMATE

| Repair | Effort | Priority |
|--------|--------|----------|
| #1: sendMixedEmailAction | 2h | CRITICAL |
| #2: /send-message org emails | 1h | CRITICAL |
| #3: sendTestNotificationAction | 1h | CRITICAL |
| #4: Consolidate API routes | 2h | HIGH |
| #5: Verify direct notify() | 1h | MEDIUM |
| #6: Registry validation | 1h | MEDIUM |
| **Subtotal** | **~8 hours** | |
| Testing & verification | 2h | |
| **TOTAL** | **~10 hours** | |

---

## TIMELINE

**Recommended Schedule:**
- Day 1 (4 hours): Repairs #1-3 (critical path)
- Day 2 (4 hours): Repairs #4-6, verification
- Day 3 (2 hours): Testing, documentation updates

**After Repairs:** Platform score increases from 74 → ~90  
**Then:** Proceed to Phase C.1 implementation

---

## POST-REPAIR VALIDATION

Run these commands after all repairs:

```bash
# 1. Event audit
npm run phase-b:audit-events

# 2. TypeScript check
npx tsc --noEmit

# 3. Event coverage test
npm run test -- tests/phase-b-subscriber-coverage.test.ts

# 4. Integration test
npm run test -- lib/notifications/integration.notification.flow.test.ts

# 5. Search for remaining violations
grep -r "notificationService.notify(" lib/ --include="*.ts" --exclude-dir=tests

# 6. Registry validation
npm run validate:events
```

---

**All repairs documented and ready for implementation.**

**Next Steps:**
1. Read this document and understand each repair
2. Apply repairs in priority order
3. Verify with checklist above
4. Run validation commands
5. Proceed to Phase C.1

**DO NOT BEGIN PHASE C.1 UNTIL ALL REPAIRS COMPLETE.**
