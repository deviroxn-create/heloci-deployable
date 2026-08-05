# PHASE A: COMPLETE ARCHITECTURE SPECIFICATION

**Status:** ✅ FINAL  
**Date:** 2026-07-28  
**Version:** 2.0 (Enterprise Grade)

---

## WHAT WAS DELIVERED

### 1. Communication Intent Catalog (`.kiro/communication-intent-catalog.md`)
- 26 communication intents defined (notification + analytics + alerts + future)
- Each intent has: version, status, owner, domain event, audiences, subscribers
- Extensibility demonstrated (SMS, webhook, AI, future channels)
- Ownership matrix established (which team manages which intent)
- Versioning strategy documented (how to evolve intents without breaking)

### 2. Communication Policies (`.kiro/communication-policies.md`)
- **Audience Policy**: WHO receives each intent (independent layer)
- **Channel Policy**: WHICH CHANNELS per audience (independent layer)
- **Template Policy**: WHAT CONTENT for each delivery (independent layer)
- **Retry Policy**: ERROR HANDLING and recovery (independent layer)
- Each policy layer is queryable and modifiable independently

### 3. Communication Registry (`lib/communications/communication-registry.ts`)
- Programmatic representation of intents and policies
- TypeScript types for type safety
- Query functions: `getAudiencesForIntent()`, `getChannelForIntent()`, etc.
- Validation function to ensure consistency

### 4. Implementation Guide (`.kiro/registry-implementation-guide.md`)
- Step-by-step approach for Phase B through E
- Verification scripts and checklists
- Anti-patterns to avoid
- Testing strategy for each phase

### 5. Summary Document (`.kiro/communication-registry-summary.txt`)
- Executive summary
- Statistics and metrics
- Key decisions
- Next steps

---

## ARCHITECTURE DIAGRAM (FINAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUSINESS LAYER                            │
│  Services publish domain events when business actions occur      │
│  Example: application.approved, staff.invited, eligibility.assessed
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT BUS (SINGLETON)                      │
│  In-memory pub/sub routes events to all subscribers              │
└─────────────┬──────────────────────┬──────────────────────────────┘
              │                      │
              ↓                      ↓
   ┌──────────────────────┐  ┌──────────────────────┐
   │ Notification         │  │ Analytics            │
   │ Subscriber           │  │ Subscriber           │
   │                      │  │                      │
   │ Translates to        │  │ Translates to        │
   │ Communication Intent │  │ Analytics Intent     │
   │ (notify.app_approved)│  │ (analyze.lifecycle)  │
   └──────────┬───────────┘  └──────────┬───────────┘
              │                      │
              ↓                      ↓
   ┌──────────────────────────────┐  ┌──────────────────┐
   │ COMMUNICATION INTENT CATALOG │  │ ANALYTICS SERVICE│
   │                              │  │ (separate flow)  │
   │ Defines business intents:    │  │                  │
   │ - notify.app_approved        │  │ (No notification)│
   │ - notify.documents_requested │  │                  │
   │ - etc. (26 total)            │  │                  │
   └──────────┬───────────────────┘  └──────────────────┘
              │
              ↓
   ┌──────────────────────────────────────────┐
   │ POLICY LAYERS (Independent & Queryable) │
   ├──────────────────────────────────────────┤
   │ 1. AUDIENCE POLICY                       │
   │    "Who gets notify.app_approved?"       │
   │    → applicant, org_admin, reviewer      │
   │                                          │
   │ 2. CHANNEL POLICY                        │
   │    "How does applicant receive it?"      │
   │    → primary: email, fallback: internal  │
   │                                          │
   │ 3. TEMPLATE POLICY                       │
   │    "What template for applicant/email?"  │
   │    → application-approved-applicant-email│
   │                                          │
   │ 4. RETRY POLICY                          │
   │    "How many retry attempts?"            │
   │    → critical: max 5, exponential        │
   └──────────┬───────────────────────────────┘
              │
              ↓
   ┌──────────────────────────────────────────┐
   │ RUNTIME ORCHESTRATOR                    │
   ├──────────────────────────────────────────┤
   │ AudienceResolver  (reads Audience Policy)│
   │ CommunicationPlanner (reads Channel Policy)
   │ TemplateResolver  (reads Template Policy)│
   │ Dispatcher        (creates dispatch req) │
   └──────────┬───────────────────────────────┘
              │
              ↓
   ┌──────────────────────────────────────────┐
   │ PROVIDER ADAPTER (reads Retry Policy)   │
   │                                          │
   │ Selects provider by channel:             │
   │ - email    → Resend Provider             │
   │ - telegram → Telegram Provider           │
   │ - internal → Internal DB Provider        │
   │                                          │
   │ Never calls provider directly            │
   │ All providers behind abstraction         │
   └──────────┬───────────────────────────────┘
              │
              ↓
   ┌──────────────────────────────────────────┐
   │ AUDIT & PERSISTENCE                     │
   │                                          │
   │ notificationLog record:                   │
   │ - event, channel, recipient, status      │
   │ - provider response, retry count         │
   │ - full delivery history                  │
   │                                          │
   │ communicationTimelineEntry:              │
   │ - user-facing timeline of comms          │
   └──────────────────────────────────────────┘
```

---

## KEY ARCHITECTURAL DECISIONS (LOCKED IN)

### Decision 1: Communication Intent ≠ Notification
**Before:** Domain event → Notification (tightly coupled)
**After:** Domain event → Intent → Subscriber (decoupled)

**Benefit:** Different subscribers can fulfill same intent differently
- Notification subscriber: Send via email/telegram/SMS
- Analytics subscriber: Record metrics (no send)
- Webhook subscriber: POST to external system (no send)
- AI subscriber: Generate summary (no send)

### Decision 2: Policies are Independent Layers
**Before:** Registry mixed audience, channel, template, retry (monolithic)
**After:** Four separate policy layers (composable)

**Benefit:** Change one layer without affecting others
- Add SMS channel: Update Channel Policy only
- Change retry strategy: Update Retry Policy only
- Update template: Update Template Policy only
- Add audience: Update Audience Policy only

### Decision 3: Registry Has No Provider Knowledge
**Before:** Registry knew about "Email", "Telegram", "Internal" providers
**After:** Registry only knows about channels "email", "telegram", "internal"

**Benefit:** Swap Resend ↔ SES without touching registry
- Registry: "email channel is allowed"
- Provider adapter: "email channel uses Resend"
- Later: "email channel now uses SES"
- Registry unchanged

### Decision 4: Versioning at Intent Level
**Before:** All intents versioned together (v1.0, v2.0 of everything)
**After:** Each intent versioned independently

**Benefit:** Evolve intents at different rates
- `notify.app_approved` v1.0 stable for years
- `notify.documents_requested` v2.0 ready (new SMS channel)
- Old v1.0 continues working (backward compat)
- New subscribers use v2.0

### Decision 5: Ownership Assigned to Teams
**Before:** No clear ownership of communications
**After:** Each intent has owner (Application Team, Auth Team, etc.)

**Benefit:** Accountability and governance
- Applicant Team owns `notify.app_*` intents
- Org Team owns `notify.staff_*` intents
- Owner approves changes to their intents
- Owner coordinates cross-team changes

---

## WHAT THIS ENABLES (FUTURE EXTENSIBILITY)

### SMS Support (Zero Registry Changes)
1. Add SMS provider adapter → Provider layer only
2. Add SMS channel entries → Channel Policy only
3. Create SMS templates → Template Policy only
4. Done (no registry changes!)

### Webhook Integration (One New Intent)
1. Add `webhook.application_state_changed` intent → Intent Catalog
2. Define which domain events → Intent Catalog
3. Webhook subscriber subscribes to intent
4. Webhook service gets called with dispatch request
5. Done (registry knows nothing about webhooks!)

### AI Summarization (One New Intent)
1. Add `ai.generate_summary` intent → Intent Catalog
2. AI subscriber subscribes to intent
3. AI service generates summary from payload
4. Summary stored for staff access
5. Done (no notification involved!)

### Push Notifications (Minor Changes)
1. Add push provider adapter → Provider layer only
2. Add 'push' as new channel → Channel Policy
3. Create push templates → Template Policy
4. Done (registry untouched!)

### Scheduled Notifications (Registry Enhancement)
1. Add `scheduled: boolean` field to intent catalog
2. Scheduler service reads intents with `scheduled: true`
3. Scheduler system determines send time
4. Dispatcher invoked at scheduled time
5. Done (other systems unaffected!)

---

## VALIDATION CHECKLIST (PHASE A COMPLETE)

### Intent Catalog ✅
- [x] 26 communication intents defined
- [x] Each intent has: version, status, owner, domain event
- [x] Audiences assigned
- [x] Subscribers identified
- [x] Extensibility documented (SMS, webhook, AI, push)
- [x] Ownership matrix created
- [x] Lifecycle states documented (ACTIVE, DEPRECATED, PLANNED, REMOVED)

### Policies ✅
- [x] Audience Policy: 26 intents × audiences complete
- [x] Channel Policy: All (intent, audience) → channels mapped
- [x] Template Policy: All (intent, audience, channel) → template defined
- [x] Retry Policy: All intents have priority, retries, backoff
- [x] Each policy layer independent
- [x] Query functions work
- [x] Modification procedures documented

### Registry ✅
- [x] TypeScript implementation created
- [x] Types defined for all components
- [x] Query functions implemented
- [x] Validation function created
- [x] No provider knowledge in registry
- [x] Programmatic access ready

### Architecture ✅
- [x] Domain events separate from communication intents
- [x] Intent layer decouples business from delivery
- [x] Four policy layers independent
- [x] No mixed concerns
- [x] Provider adapter abstraction
- [x] Extensible for future channels

### Documentation ✅
- [x] Communication Intent Catalog (full spec)
- [x] Communication Policies (all four layers)
- [x] Implementation Guide (Phase B-E)
- [x] Registry Summary (overview)
- [x] This completion document (architecture locked)

---

## FILES CREATED

| File | Purpose | Status |
|------|---------|--------|
| `.kiro/communication-intent-catalog.md` | Full specification of intents | ✅ Complete |
| `.kiro/communication-policies.md` | All four policy layers | ✅ Complete |
| `.kiro/registry-implementation-guide.md` | Phase B-E implementation guide | ✅ Complete |
| `.kiro/communication-registry-summary.txt` | Executive summary | ✅ Complete |
| `lib/communications/communication-registry.ts` | Programmatic registry + types | ✅ Complete |
| `.kiro/PHASE-A-FINAL.md` | This document | ✅ Complete |

---

## READY FOR PHASE BC: INTENT TRANSLATOR

**What Phase BC does (NEW, between B and C):**

Builds the Intent Translator that converts domain events to communication intents.

```typescript
// IntentTranslator (NEW)
function translateDomainEventToIntent(domainEvent: DomainEvent): CommunicationIntent[] {
  const intent = INTENT_CATALOG[domainEvent.eventName];
  if (!intent) {
    throw new Error(`No intent for domain event: ${domainEvent.eventName}`);
  }
  
  return [{
    intentName: intent.communicationEventName,
    version: intent.version,
    domainEvent: domainEvent.eventName,
    payload: domainEvent.payload,
    // Intent is now decoupled from delivery
  }];
}
```

This makes the system:
1. **Explicit**: Intent catalog governs all translations
2. **Audit-friendly**: Track which intent was fired for which business event
3. **Extensible**: New subscribers added without changing translator

---

## READY FOR PHASE C: SUBSCRIBER COMPLETION

**What Phase C does (ORIGINAL, now more focused):**

Adds subscribers for all 26 intents to `NotificationDomainSubscriber`.

But now it's **much cleaner** because:
- Intent catalog defines exactly which intents need subscribers
- Translator produces intents (not directly calling notificationService)
- Subscriber just routes intents to appropriate services
- Registry drives all behavior (not hardcoded switch statements)

---

## ENTERPRISE READINESS CRITERIA

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Single source of truth | ✅ | Communication Intent Catalog |
| Separated concerns | ✅ | Four independent policy layers |
| Provider abstraction | ✅ | No provider knowledge in registry |
| Extensible architecture | ✅ | SMS, webhook, AI examples documented |
| Versioning strategy | ✅ | Intent-level versioning with backward compat |
| Ownership governance | ✅ | Each intent has team owner |
| Audit trail | ✅ | Full notification log with all metadata |
| Error handling | ✅ | Retry policies per intent |
| Multi-tenant support | ✅ | Scope and organization isolation in policies |
| Documented | ✅ | Complete specs + implementation guide |
| Type-safe | ✅ | Full TypeScript implementation |
| Validated | ✅ | Consistency checks and validation functions |

---

## RECOMMENDATION: PROCEED TO PHASE BC

**This architecture is ready for production implementation.**

The intent catalog + policies + registry provide:
- ✅ Clear separation of concerns
- ✅ Single source of truth
- ✅ Extensibility for future features
- ✅ Enterprise-grade governance
- ✅ Full auditability
- ✅ Zero provider coupling

**Next steps:**
1. Review and approve Phase A (this document)
2. Begin Phase BC: Intent Translator
3. Continue Phase C: Subscriber Completion
4. Phase D: Remove Bypasses
5. Phase E: Legacy Removal

**Estimated timeline:**
- Phase BC: 2-3 days
- Phase C: 3-4 days
- Phase D: 2-3 days
- Phase E: 1-2 days
- Total: ~1 week for complete unification

---

## SUCCESS LOOKS LIKE

After all phases are complete:

```typescript
// Business layer publishes domain event
publishDomainEvent('application.approved', {
  userId: 'user-123',
  applicationId: 'app-456',
  programId: 'prog-789'
});

// System flow (all automatic):
// 1. Event published to bus
// 2. Subscriber receives it
// 3. Translator converts to: notify.application_approved (v2.0)
// 4. Runtime queries Intent Catalog:
//    - Audiences: applicant, org_admin, reviewer
// 5. Runtime queries Audience Policy:
//    - applicant gets this intent
//    - org_admin gets this intent
//    - reviewer gets this intent
// 6. Runtime queries Channel Policy:
//    - applicant via email (primary) or internal (fallback)
//    - org_admin via telegram (primary) or internal (fallback)
//    - reviewer via internal only
// 7. Runtime queries Template Policy:
//    - applicant/email → application-approved-applicant-email
//    - org_admin/telegram → application-approved-admin-telegram
//    - reviewer/internal → application-approved-reviewer-internal
// 8. Runtime queries Retry Policy:
//    - critical: max 5 attempts, exponential backoff
// 9. Dispatcher creates dispatch requests
// 10. Providers send via their channels
// 11. All results logged to notificationLog
// 12. Timeline entries created for users
// 13. Full audit trail complete

// Result: Applicant gets email, admin gets telegram, reviewer gets internal
// All logged, all audited, all retried if needed, all in one canonical path
```

---

## FINAL THOUGHTS

This architecture transforms the communication subsystem from a **notification system** (focused on sending emails) into an **event-driven communication platform** (focused on fulfilling business intents through multiple channels and subscribers).

The separation of intent from delivery, combined with independent policy layers, creates an architecture that:
- Works today (notification delivery)
- Scales tomorrow (analytics, webhooks, AI, SMS)
- Maintains backward compatibility (versioning)
- Enables governance (ownership, policies)
- Provides auditability (full logging)
- Stays maintainable (no mixed concerns)

This is the foundation for a truly enterprise-grade communication system.

