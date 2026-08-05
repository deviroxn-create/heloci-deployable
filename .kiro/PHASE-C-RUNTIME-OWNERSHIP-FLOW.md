# PHASE C: RUNTIME OWNERSHIP FLOW DIAGRAM

**Date:** 2026-07-30  
**Status:** ✅ Complete

---

## ORGANIZATION OWNERSHIP FLOW THROUGH THE PIPELINE

### Complete Flow with Verification Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DOMAIN EVENT PUBLISHED                             │
│                  (event.payload → AudienceContext)                      │
│  Payload includes: organizationId, userId, eventData, etc.             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION DOMAIN SUBSCRIBER                         │
│                   lib/notifications/runtime-subscriber.ts              │
│  - Subscribe to domain event (e.g., "application.submitted")           │
│  - Convert event.payload → AudienceResolutionContext                   │
│  - Normalize event name: "application.submitted" → "application_submitted"
│  - Call RuntimeOrchestrator.run(eventName, context)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                      [organizationId flow] ✅
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               RUNTIME ORCHESTRATOR - STAGE 1: INITIAL                   │
│              lib/notifications/runtime/runtime-orchestrator.ts         │
│                                                                         │
│  Input: eventName, context { organizationId, userId, ... }             │
│                                                                         │
│  ✓ CHECKPOINT 1: Validate organizationId is provided                  │
│    if (!context?.organizationId) {                                      │
│      console.error("AUTHORIZATION VIOLATION: organizationId missing")   │
│      return { dispatchRequests: [] }  // FAIL SAFE                     │
│    }                                                                    │
│                                                                         │
│  Create CommunicationRequest (stage 1):                                │
│  {                                                                      │
│    context: {                                                           │
│      traceId: "trace-${timestamp}-${random}",                          │
│      organizationId: context.organizationId,  // ✅ NO DEFAULT         │
│      userId: context.userId,                                           │
│      createdAt: now()                                                   │
│    },                                                                   │
│    event: eventName,                                                    │
│    eventPayload: freeze(context),                                      │
│    __stage: "initial"                                                   │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                      [organizationId preserved] ✅
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         RUNTIME ORCHESTRATOR - STAGE 2: AUDIENCE RESOLUTION (C.1)       │
│                                                                         │
│  Call: C1AudienceResolver.resolve(CommunicationRequest)                │
│                                                                         │
│  CRITICAL AUTHORIZATION LAYER:                                          │
│  ═════════════════════════════════════════════════════════════════     │
│                                                                         │
│  ✓ CHECKPOINT 2: Verify organizationId is mandatory                   │
│    if (!request.context.organizationId) {                               │
│      throw new InvalidPayloadError("organizationId required")           │
│    }                                                                    │
│                                                                         │
│  ✓ CHECKPOINT 3: Query organization from database                     │
│    const org = await prisma.organization.findUnique({                  │
│      where: { id: organizationId },  // ✅ EXACT MATCH                │
│      select: { id, isActive, name }                                    │
│    });                                                                  │
│    if (!org) throw OrganizationNotFoundError()                          │
│    if (!org.isActive) throw OrganizationInactiveError()                 │
│                                                                         │
│  ✓ CHECKPOINT 4: Get registry entry (defines valid audiences)         │
│    const registryEntry = await getRegistryEntry(event)                 │
│    const audiences = registryEntry.audiences  // e.g., ["org_admin", "applicant"]
│                                                                         │
│  ✓ CHECKPOINT 5: Resolve recipients per audience                      │
│    For each audience in registryEntry.audiences:                       │
│                                                                         │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ Resolve Org Admin Audience:                                  │   │
│    │                                                               │   │
│    │ const admins = await prisma.organizationMember.findMany({   │   │
│    │   where: {                                                   │   │
│    │     organizationId,  // ✅ HARDCODED ORG FILTER              │   │
│    │     role: "org_admin"                                        │   │
│    │   }                                                           │   │
│    │ });                                                           │   │
│    │                                                               │   │
│    │ return admins.map(m => RecipientFactory.create({            │   │
│    │   id: m.user.id,                                             │   │
│    │   email: m.user.email,                                       │   │
│    │   name: m.user.name,                                         │   │
│    │   role: "org_admin"                                          │   │
│    │ }));                                                          │   │
│    └──────────────────────────────────────────────────────────────┘   │
│                                                                         │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ Resolve Applicant Audience (Cross-org Protection):          │   │
│    │                                                               │   │
│    │ const userId = eventPayload.userId || eventPayload.applicantId
│    │ if (!userId) return []                                       │   │
│    │                                                               │   │
│    │ const user = await prisma.user.findUnique({                 │   │
│    │   where: { id: userId }                                      │   │
│    │ });                                                           │   │
│    │                                                               │   │
│    │ // ✅ CROSS-ORG CHECK:                                      │   │
│    │ if (user.organizationId && user.organizationId !== organizationId) {
│    │   return []  // DIFFERENT ORG - SKIP SILENTLY              │   │
│    │ }                                                             │   │
│    │                                                               │   │
│    │ return [RecipientFactory.create({                            │   │
│    │   id: user.id,                                               │   │
│    │   email: user.email,                                         │   │
│    │   name: user.name,                                           │   │
│    │   role: "applicant"                                          │   │
│    │ })];                                                          │   │
│    └──────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ✓ CHECKPOINT 6: Deduplicate recipients by email                      │
│    const seenEmails = new Set();                                       │
│    recipients = recipients.filter(r => {                              │
│      if (seenEmails.has(r.email)) return false;                       │
│      seenEmails.add(r.email);                                         │
│      return true;                                                      │
│    });                                                                  │
│                                                                         │
│  ✓ CHECKPOINT 7: Return immutable result                              │
│    const resolvedRequest = Object.freeze({                            │
│      context: request.context,  // organizationId preserved ✅        │
│      event: request.event,                                             │
│      eventPayload: request.eventPayload,                               │
│      audiences: Object.freeze([...audiences]),                         │
│      recipients: Object.freeze([...recipients]),  // ✅ LOCKED        │
│      __stage: "audience_resolved"                                      │
│    });                                                                  │
│                                                                         │
│    return resolvedRequest;                                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                      [organizationId preserved] ✅
                      [recipients locked] ✅
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         RUNTIME ORCHESTRATOR - STAGE 3: COMMUNICATION PLANNING          │
│                              (C.2 Legacy)                               │
│                                                                         │
│  Input: resolved audiences (already authorized from C.1) ✅            │
│                                                                         │
│  CommunicationPlanner.plan(eventName, audiences)                       │
│  ├─ For each audience, determine preferred channel                     │
│  └─ Create CommunicationPlan objects                                   │
│                                                                         │
│  No authorization needed - input is pre-authorized                     │
│  organizationId not used (already filtered in C.1)                     │
│                                                                         │
│  Output: CommunicationPlan[] (channels selected)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         RUNTIME ORCHESTRATOR - STAGE 4: TEMPLATE RESOLUTION             │
│                              (C.3 Legacy)                               │
│                                                                         │
│  Input: CommunicationPlan[] (already authorized) ✅                    │
│                                                                         │
│  For each plan:                                                         │
│    TemplateResolver.resolve(plan)                                      │
│    ├─ Map (event, audience, channel) → template key                    │
│    └─ e.g., "applicant.application-submitted.email"                   │
│                                                                         │
│  No authorization needed                                               │
│  organizationId not used                                               │
│                                                                         │
│  Output: TemplateResolution[] (templates selected)                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         RUNTIME ORCHESTRATOR - STAGE 5: DISPATCH REQUEST GENERATION     │
│                              (C.4 Legacy)                               │
│                                                                         │
│  Input: TemplateResolution[] (already authorized) ✅                   │
│                                                                         │
│  Dispatcher.dispatch(resolution)                                       │
│  ├─ Create DispatchRequest for each resolution                         │
│  └─ Ready for provider delivery                                        │
│                                                                         │
│  No authorization needed                                               │
│  organizationId not passed to dispatcher                               │
│                                                                         │
│  Output: DispatchRequest[] (ready to send)                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                      [recipients pre-authorized] ✅
                      [organizationId not exposed] ✅
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PROVIDER ADAPTER DELIVERY                           │
│                   lib/notifications/provider-adapters.ts              │
│                                                                         │
│  Input: ProviderSendContext {                                          │
│    channel: "email" | "telegram" | "internal",                        │
│    recipient: "user@email.com",  // Email or chat ID                 │
│    subject: string,                                                    │
│    message: string,                                                    │
│    html?: string,                                                      │
│    payload: NotificationPayload,                                       │
│    // NO organizationId passed! ✅                                     │
│  }                                                                      │
│                                                                         │
│  Provider actions:                                                      │
│  - EmailProvider: Send via Resend API                                  │
│  - TelegramProvider: Send via Telegram API                             │
│  - InternalProvider: Write to prisma.notification table                │
│  - WhatsAppProvider: Queue for WhatsApp                                │
│                                                                         │
│  Provider has NO access to:                                            │
│  ✅ organizationId (not in context)                                    │
│  ✅ event name (not needed)                                            │
│  ✅ authentication context (already resolved)                          │
│                                                                         │
│  Provider ONLY knows:                                                   │
│  ✓ Recipient email/ID (pre-authorized) ✅                            │
│  ✓ Message content (from template)                                    │
│  ✓ Channel (from planner)                                             │
│                                                                         │
│  Output: NotificationDeliveryResult                                    │
│  { status: "SENT" | "FAILED" | "DELIVERED", ... }                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    [message delivered safely] ✅
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DELIVERY COMPLETE                                  │
│  Recipient received message from correct organization                  │
│  organizationId never exposed to provider layer                        │
│  Cross-org users filtered out in C.1 stage                            │
│  All authorization checks completed before any send                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ORGANIZATION OWNERSHIP PRESERVATION CHECKPOINTS

### Entry Point
```
Domain Event
  └─ organizationId MUST be in payload
     └─ Used to initialize AudienceResolutionContext
```

### Stage 1: Initial Request
```
CommunicationRequest.context
  └─ organizationId: MANDATORY
     └─ Fails if missing: "AUTHORIZATION VIOLATION"
```

### Stage 2: Audience Resolution ✅ CRITICAL
```
AudienceResolver.resolve(request)
  ├─ organizationId.exists & isActive? YES/NO
  │   └─ Organization must exist and be active
  ├─ Resolve recipients with hardcoded org filter
  │   ├─ org_admin: where { organizationId } ✅
  │   ├─ applicant: cross-org check (skip if different) ✅
  │   ├─ case_worker: cross-org check (skip if different) ✅
  │   └─ All other roles: org-scoped lookup ✅
  ├─ Deduplicate by email
  └─ Return frozen recipients
     └─ organizationId preserved in context ✅
```

### Stage 3-5: Planning, Templates, Dispatch
```
CommunicationPlanner → TemplateResolver → Dispatcher
  └─ Uses already-authorized recipients
     └─ NO new organization checks needed
        └─ organizationId not passed downstream
```

### Stage 5: Provider Delivery
```
ProviderAdapter.send(ProviderSendContext)
  └─ Receives: recipient email (pre-authorized)
     └─ NO organizationId in context
        └─ Provider cannot access org data
           └─ Provider ONLY sends to authorized recipient ✅
```

---

## CROSS-ORGANIZATION PROTECTION SCENARIOS

### Scenario 1: Attempt to Send to User from Different Organization
```
Event: application_submitted
Event Payload:
  organizationId: "org-acme"
  applicantId: "user-bob"

AudienceResolver Logic:
  ├─ Get user "user-bob" from database
  ├─ Check: user.organizationId vs event organizationId
  │   └─ user.organizationId = "org-globex" (different!)
  └─ Action: SKIP SILENTLY
     └─ Recipient is NOT included
        └─ User from org-globex never notified about org-acme event
```

### Scenario 2: Manual Email Compose Cross-Org Attack
```
Attack Attempt:
  organizationId: "org-acme"
  senderId: "sender-from-org-globex"
  recipients: ["admin@org-acme.com"]

Defense:
  await authorizeSenderIdentityAccess("org-acme")
  const sender = await getSenderIdentityForCompose(senderId, "org-acme")
  // Query: findFirst({
  //   where: {
  //     id: senderId,
  //     organizationId: "org-acme"  ✅ HARDCODED ORG CHECK
  //   }
  // })
  if (!sender) throw new Error("Sender identity not found")
  
  Result: Attack FAILS - sender from different org cannot send
```

### Scenario 3: Platform Super Admin Global Scope
```
Platform Super Admin:
  ├─ role: "SUPER_ADMIN"
  ├─ organizationId: null (intentional!)
  └─ canAccessAllOrganizations: true

Safe Usage:
  ├─ Must pass selectedOrgId in request parameters
  ├─ Scope resolves to: { selectedOrganizationId: "org-acme" }
  └─ Query filters to: organizationId = "org-acme"

Result: Platform admin explicitly selected org, no implicit access
```

---

## ORGANIZATION OWNERSHIP FLOW SUMMARY

| Stage | Component | Ownership Check | Status |
|-------|-----------|-----------------|--------|
| Entry | Domain Event | organizationId required | ✅ |
| 1 | RuntimeOrchestrator | organizationId mandatory (no default) | ✅ |
| 2 | AudienceResolver | Organization exists & active | ✅ |
| 2 | AudienceResolver | Recipients resolved with org filter | ✅ |
| 2 | AudienceResolver | Cross-org users filtered | ✅ |
| 2 | AudienceResolver | Result immutable | ✅ |
| 3-4 | Planner/Template | Uses pre-authorized recipients | ✅ |
| 5 | Dispatcher | Creates requests from authorized recipients | ✅ |
| 6 | Provider | Sends only to authorized recipients | ✅ |

**Complete Flow:** ✅ **ORGANIZATION OWNERSHIP PRESERVED END-TO-END**

---

**END OF PHASE C RUNTIME OWNERSHIP FLOW DIAGRAM**
