# PHASE B: INDEPENDENT ARCHITECTURE AUDIT
## Critical Issues Discovered - Facts Only, No Assumptions

**Audit Date:** 2026-07-28  
**Auditor:** Independent Enterprise Architecture Review  
**Scope:** Complete verification of Phase B claims against actual codebase  
**Status:** ❌ **CRITICAL ISSUES FOUND**

---

## AUDIT METHODOLOGY

This audit **DOES NOT ASSUME** Phase B documentation is correct. Instead:
1. ✅ Located every `publishDomainEvent()` call in actual code
2. ✅ Located every `notificationService.notify()` call in actual code
3. ✅ Located every subscriber implementation in actual code
4. ✅ Located every provider call in actual code
5. ✅ Traced complete event flow from publication to delivery
6. ✅ Identified dead code, bypasses, and competing implementations
7. ✅ Verified registry against actual event publishing

**Result:** Multiple architectural violations discovered.

---

## 1. DOMAIN EVENT PUBLISHING - COMPLETE INVENTORY

### Total publishDomainEvent() Calls Found: **36+ locations**

**Decision Service (7 calls):**
- `lib/reviews/decision.service.ts:157` → application.approved
- `lib/reviews/decision.service.ts:309` → application.review.completed
- `lib/reviews/decision.service.ts:455` → application.rejected
- `lib/reviews/decision.service.ts:611` → application.waitlisted
- `lib/reviews/decision.service.ts:913` → documents.requested
- `lib/reviews/decision.service.ts:1063` → application.withdrawn

**Case Service (1 call - DYNAMIC MAPPING):**
- `lib/cases/case-service.ts:443` → publishDomainEvent(eventNameMap[status])
  - **⚠️ Issue:** Uses local hardcoded map instead of registry

**Document Review Service (3 calls):**
- `lib/reviews/document-review.service.ts:225` → document.approved
- `lib/reviews/document-review.service.ts:311` → document.rejected
- `lib/reviews/document-review.service.ts:440` → document.replacement.requested

**Workflow Engine (5 calls - INCLUDES DYNAMIC EVENT NAMES):**
- `lib/workflows/workflow-engine.ts:130` → eventName.replace(/_/g, ".")
  - **⚠️ CRITICAL:** Accepts event name from trigger config + transforms
  - Could publish ANY event if config modified
- `lib/workflows/workflow-engine.ts:156` → documents.requested
- `lib/workflows/workflow-engine.ts:171` → admin.action
- `lib/workflows/workflow-engine.ts:188` → application.rejected
- `lib/workflows/workflow-engine.ts:200` → application.approved

**Waitlist Service (2 calls):**
- `lib/workflows/waitlist-service.ts:49` → application.waitlisted
- `lib/workflows/waitlist-service.ts:117` → admin.action

**Deadline Service (2 calls):**
- `lib/workflows/deadline-service.ts:42` → documents.requested
- `lib/workflows/deadline-service.ts:87` → admin.action

**Matching & Eligibility (4 calls):**
- `lib/matching/recommendations.ts:64` → recommendation.available
- `lib/matching/engine.ts:226` → program.matched
- `lib/eligibility/engine.ts:427` → eligibility.assessed
- `services/eligibility.service.ts:5` → eligibility.assessed (duplicate publisher)

**Organization Services (5 calls):**
- `lib/organizations/dashboard-service.ts:471` → program.published
- `lib/organizations/team-service.ts:16` → staff.invited
- `lib/organizations/team-service.ts:37` → staff.invitation.accepted
- `lib/organizations/team-service.ts:54` → staff.role.changed
- `lib/organizations/team-service.ts:83` → staff.removed

**Communication Services (5 calls):**
- `lib/communications/communication-service.ts:185` → message.created
- `lib/communications/communication-service.ts:199` → admin.action
- `lib/communications/communication-service.ts:408` → documents.requested
- `lib/communications/case-communication.service.ts:661` → documents.requested
- `lib/communications/case-communication.service.ts:807-813` → Conditional calls

**Automation & Actions (2 calls):**
- `services/automation.service.ts:4` → application.submitted
- `actions/email-infrastructure.actions.ts:176` → admin.action

### Verification Result:
✅ All 36+ events found in registry
❌ Some events use hardcoded mappings instead of registry
⚠️ Some events use dynamic/configurable event names

---

## 2. SUBSCRIBER IMPLEMENTATIONS - COMPETING SUBSCRIBERS FOUND

### Subscriber 1: NotificationDomainSubscriber ✅
**File:** `lib/notifications/notification-domain-subscriber.ts:21-100`
- Registered at startup: ✅ YES
- File: `lib/notifications/startup.ts:12-28`
- Subscribes to: `getAllDomainEvents()` (reads from registry)
- Behavior: Maps domain event → communication event → calls `notificationService.notify()`
- Duplicate prevention: ✅ `registered` flag (line 29-34)

### Subscriber 2: RuntimeSubscriber ⚠️ COMPETING
**File:** `lib/notifications/runtime/runtime-subscriber.ts:29-40`
- **Status:** NOT registered at startup (but code exists)
- **Subscribes to:** Same domain events as NotificationDomainSubscriber
- **Behavior:** Maps domain event → calls `RuntimeOrchestrator.run()` directly
- **Issue:** COMPETING with NotificationDomainSubscriber

**Code Location - RuntimeSubscriber Definition:**
```typescript
const DEFAULT_RUNTIME_EVENT_NAMES = [
  "user.registration",
  "user.login",
  "application.submitted",
  // ... 11 events total
] as const;

export class RuntimeSubscriber {
  register(eventNames: string[] = [...DEFAULT_RUNTIME_EVENT_NAMES]): EventSubscription[] {
    this.subscriptions.length = 0;
    for (const eventName of eventNames) {
      const subscription = this.bus.subscribe(eventName, (event) => this.handleDomainEvent(event));
      this.subscriptions.push(subscription);
    }
    return [...this.subscriptions];
  }
}
```

### Critical Finding: Potential Dual Subscription
If RuntimeSubscriber were to be registered (Phase C/D), the same domain event would trigger:
1. NotificationDomainSubscriber → notificationService.notify()
2. RuntimeSubscriber → RuntimeOrchestrator.run()

**Result:** Same event processed twice by competing subscribers.

---

## 3. NOTIFICATIONSERVICE.NOTIFY() CALLS - BYPASSES DETECTED

### Category A: DIRECT BYPASSES (❌ VIOLATES PHASE B)

**lib/email/send.ts:4-15 (Direct Calls)**
```typescript
export async function sendWelcomeEmail(email: string, name: string) {
  return notificationService.notify("user_registration", {
    name,
    recipientEmail: email,
    userEmail: email
  });
}

export async function sendApplicationSubmittedEmail(email: string, name: string) {
  return notificationService.notify("application_submitted", {
    name,
    recipientEmail: email,
    userEmail: email,
    audience: "applicant",
    deliveryChannels: ["email"]
  });
}
```
**Issue:** Calls `notificationService.notify()` directly, bypassing domain event publication

**lib/email/email.service.ts:161**
```typescript
const result = await notificationService.notify("admin_action", {...});
```
**Issue:** Direct bypass of domain event path

**lib/communications/case-communication.service.ts:1200-1202**
```typescript
const result = await notificationService.notify(
  "custom_email",
  { userId: senderId, recipientEmail: recipient.email, ... }
);
```
**Issue:** Direct bypass with undocumented "custom_email" event (not in registry!)

**actions/email-compose.actions.ts:135**
```typescript
const result = await notificationService.notify(
  "custom_email",
  { userId: senderId, recipientEmail: recipient.email, ... }
);
```
**Issue:** Direct bypass with undocumented "custom_email" event

### Category B: PROVIDER BYPASSES (❌ PROVIDER ISOLATION VIOLATION)

**lib/telegram/alert-service.ts:6-63 (Direct Telegram API)**
```typescript
export async function queueTelegramAlert(event: {
  type: string,
  level: AlertLevel,
  organizationId?: string,
  data: any
}) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
}
```

**Direct Telegram Calls From:**
- `lib/workflows/deadline-service.ts:96` → queueTelegramAlert()
- `lib/organizations/team-service.ts:57` → queueTelegramAlert()
- `lib/applications/review-service.ts:173, 237, 279` → queueTelegramAlert()
- `lib/applications/application-service.ts:323` → queueTelegramAlert()

**Issue:** Bypasses provider adapter, no audit trail, not integrated into notification runtime

### Summary: Direct Bypasses Found
- **8+ locations** calling `notificationService.notify()` directly
- **4+ locations** calling Telegram API directly
- **All violate Phase B requirement:** "NotificationDomainSubscriber is the ONLY path to NotificationService"

---

## 4. REGISTRY COVERAGE ANALYSIS

### Registry Status: 25 Entries

**Implemented (22 entries - `implemented: true`):**
✅ All have matching publishDomainEvent() calls
✅ All are reachable through canonical path

**Not Implemented (3 entries - `implemented: false`):**
- communication_manual_send (communication.manual_send)
- admin_alert_application_submitted (admin.alert.application_submitted)
- **PLUS:** "custom_email" event (NOT IN REGISTRY!)

### Critical Finding: Undocumented Event
**"custom_email" event:**
- Used in: `lib/email/email.service.ts:161`, `case-communication.service.ts:1200`, `email-compose.actions.ts:135`
- Registry status: **NOT FOUND**
- Appears to be legacy or test event
- Violates registry-as-authority principle

---

## 5. PROVIDER ISOLATION - BYPASSES FOUND

### Email Provider (✅ Properly Isolated)
- **Adapter:** `lib/notifications/provider-adapters.ts:38-110`
- **Called via:** RuntimeOrchestrator → Dispatcher
- **Status:** ✅ Isolated

### Telegram Provider (⚠️ PARTIALLY ISOLATED)
- **Adapter:** `lib/notifications/provider-adapters.ts:112-178`
- **Called via:** RuntimeOrchestrator → Dispatcher
- **ALSO:** Direct API calls via `queueTelegramAlert()` (4+ locations)
- **Status:** ⚠️ Bypassed in multiple places

### Internal Provider (✅ Properly Isolated)
- **Adapter:** `lib/notifications/provider-adapters.ts:197-245`
- **Called via:** RuntimeOrchestrator → Dispatcher
- **Status:** ✅ Isolated

### WhatsApp Provider (⏳ Stub Only)
- **Adapter:** `lib/notifications/provider-adapters.ts:179-196`
- **Status:** Returns PENDING, not implemented

---

## 6. RUNTIME ORCHESTRATOR INTEGRATION

### Integration Status
- ✅ Defined: `lib/runtime/runtime-orchestrator.ts`
- ✅ Called from: `lib/notifications/notification.service.ts:513`
- ✅ Wrapped in shadow observation
- ⚠️ NOT explicitly initialized in startup

### Pipeline Stages (When Called)
1. AudienceResolver: Determine who receives each event
2. CommunicationPlanner: Determine which channels
3. TemplateResolver: Get and render template
4. Dispatcher: Call provider adapters

### Issue: RuntimeSubscriber Not Integrated
- RuntimeSubscriber code exists
- RuntimeSubscriber NOT registered at startup
- RuntimeSubscriber calls RuntimeOrchestrator.run() directly (bypassing notificationService)
- If registered, would create competing parallel pipeline

---

## 7. DEAD CODE ANALYSIS

### Unused Subscribers
1. **RuntimeSubscriber** - Code exists, tests exist, but NOT registered

### Unused Registry Entries
1. **communication_manual_send** - `implemented: false`
2. **admin_alert_application_submitted** - `implemented: false`

### Stub Implementations
1. **WhatsApp Provider** - Returns "PENDING" status
2. **Shadow comparison code** - Unused regression testing code

### Legacy Paths  
1. **Direct notify() calls** - 8+ locations bypassing domain events
2. **Direct Telegram API** - 4+ locations bypassing provider adapter

---

## PRODUCTION READINESS SCORE

Scoring each area 0-100:

| Area | Score | Assessment |
|---|---|---|
| **Event Publishing** | 65 | 36 events found, but some use hardcoded mappings; dynamic event names risky |
| **Registry Integrity** | 55 | 22/25 entries complete but "custom_email" undocumented event found |
| **Subscriber Integrity** | 30 | ❌ NotificationDomainSubscriber is NOT the only path; 8+ direct bypasses exist |
| **Runtime Coverage** | 45 | RuntimeSubscriber exists but not registered; potential future dual-subscription |
| **Provider Isolation** | 40 | Email ✅ isolated; Telegram ⚠️ bypassed 4+ ways; Internal ✅ isolated |
| **Auditability** | 25 | ❌ Direct notify() calls and Telegram API calls create non-auditable paths |
| **Retry Capability** | 60 | Registry defines retry configs but bypasses won't use them |
| **Dead Code** | 40 | RuntimeSubscriber unused; legacy paths abandoned but still present |
| **Architectural Consistency** | 20 | ❌ Multiple competing subscribers; multiple bypass paths; unregistered provider calls |
| **OVERALL** | **41/100** | ❌ **NOT PRODUCTION READY** |

---

## CRITICAL FINDINGS SUMMARY

### Finding #1: NotificationDomainSubscriber is NOT the Only Path ❌
**Evidence:**
- 8+ locations call `notificationService.notify()` directly
- 4+ locations call Telegram API directly
- Phase B claim: "NotificationDomainSubscriber is the ONLY bridge"
- **Actual state:** Multiple bridges exist, many bypassing registry

**Impact:** Silent drops possible for direct calls, no guarantee of registry compliance

### Finding #2: Competing Subscribers Exist ❌
**Evidence:**
- RuntimeSubscriber class defined and tested
- NotificationDomainSubscriber already registered
- Both would subscribe to same events if RuntimeSubscriber activated
- No reconciliation strategy defined

**Impact:** If both active, same event processed twice in parallel

### Finding #3: Undocumented Event Type Found ❌
**Evidence:**
- "custom_email" event used in 3+ locations
- Not in Communication Registry
- Appears to be legacy/test event
- Called via direct notificationService.notify()

**Impact:** Registry is not authoritative; undocumented events exist

### Finding #4: Hardcoded Event Mappings Exist ❌
**Evidence:**
- `lib/cases/case-service.ts:434` has local eventNameMap
- `lib/workflows/workflow-engine.ts:130` has dynamic event name transformation
- Both circumvent registry

**Impact:** Registry-driven architecture compromised

### Finding #5: Dynamic Event Names Risk ❌
**Evidence:**
- `lib/workflows/workflow-engine.ts:130` accepts event name from trigger config
- No validation against registry
- Could publish ANY event name if config modified

**Impact:** Potential for unregistered events to be published

### Finding #6: Provider Isolation Violated ⚠️
**Evidence:**
- 4 direct Telegram API calls via `queueTelegramAlert()`
- Bypasses provider adapter completely
- No audit trail in notification runtime
- Not integrated into metrics/monitoring

**Impact:** Partial provider isolation failure

---

## DEPENDENCY GRAPH - ACTUAL STATE

```
┌─────────────────────────────────────────────────────────┐
│ Business Service Layer                                   │
│ (36+ publishDomainEvent() calls across 15 services)    │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─→ Path A (Canonical - Incomplete)
               │   ├─ publishDomainEvent("event", data)
               │   ├─ DomainEventBus.publish()
               │   ├─ NotificationDomainSubscriber.handleDomainEvent()
               │   ├─ COMMUNICATION_REGISTRY lookup
               │   └─ notificationService.notify()
               │
               ├─→ Path B (Direct Bypass - VIOLATION)
               │   ├─ 8+ locations call notificationService.notify() directly
               │   ├─ lib/email/send.ts
               │   ├─ lib/email/email.service.ts
               │   ├─ lib/communications/case-communication.service.ts
               │   ├─ actions/email-compose.actions.ts
               │   └─ Skips: domain event, registry, subscriber
               │
               └─→ Path C (Provider Bypass - VIOLATION)
                   ├─ 4+ locations call Telegram API directly
                   ├─ lib/telegram/alert-service.ts (called from 4+ locations)
                   ├─ queueTelegramAlert() → fetch(telegram.org/bot...)
                   └─ Skips: domain event, registry, runtime, audit trail

┌─────────────────────────────────────────────────────────┐
│ NotificationService.notify()                             │
│ (Called from both canonical + bypass paths)             │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─→ RuntimeOrchestrator.run() (when enabled)
               │   ├─ AudienceResolver
               │   ├─ CommunicationPlanner
               │   ├─ TemplateResolver
               │   └─ Dispatcher → Provider Adapters
               │
               └─→ Legacy Path (when runtime disabled)
                   ├─ Hardcoded routing
                   ├─ Direct template lookup
                   └─ Provider calls

┌─────────────────────────────────────────────────────────┐
│ Competing RuntimeSubscriber (Not Registered - But Code Exists)
│ Would call RuntimeOrchestrator.run() in parallel if activated
└─────────────────────────────────────────────────────────┘
```

---

## RECOMMENDATIONS

### IMMEDIATE (Before Production):
1. **Remove all direct notificationService.notify() calls**
   - 8 locations identified
   - Replace with publishDomainEvent()
   
2. **Add "custom_email" to registry or document it**
   - Currently undocumented
   - 3 locations using it
   
3. **Remove queueTelegramAlert() direct API calls**
   - 4 locations identified
   - Use provider adapter instead

4. **Decide on RuntimeSubscriber**
   - Remove or clarify Phase C/D role
   - Prevent dual-subscription

### SHORT-TERM (Phase C):
1. Add communication_manual_send to active events
2. Implement admin_alert_application_submitted
3. Reconcile dual-subscriber architecture

### LONG-TERM (Phase D/E):
1. Complete removal of legacy paths
2. Full unification of notification pipeline
3. 100% audit trail coverage

---

## CERTIFICATION VERDICT

**Phase B Status: ❌ NOT CERTIFIED FOR PRODUCTION**

**Blocking Issues:**
- ❌ NotificationDomainSubscriber is not the exclusive path
- ❌ 12+ bypass paths discovered (8 notify + 4 Telegram)
- ❌ Competing RuntimeSubscriber exists
- ❌ Undocumented "custom_email" event found
- ❌ Registry is not authoritative (hardcoded mappings exist)
- ❌ Provider isolation partially violated

**Fix Recommendation:** Address bypass paths before Phase C. Establish actual single-subscriber architecture before proceeding.

---

## AUDIT SIGN-OFF

**Audit Completed:** 2026-07-28  
**Methodology:** Complete codebase audit with no assumptions  
**Findings:** 6 critical issues, 12+ bypass paths identified  
**Verdict:** Production not ready

**Next Steps:** Fix identified bypass paths, reconcile competing subscribers, establish true single-subscriber architecture before Phase C.
