# HELOCI COMMUNICATION INTENT ARCHITECTURE

**Version:** 2.0 (Refined)  
**Status:** Phase A - Final Refinement  
**Date:** 2026-07-28

---

## CORE PRINCIPLE: SEPARATE BUSINESS EVENTS FROM COMMUNICATION INTENTS

### The Architecture Hierarchy

```
BUSINESS LAYER
  ↓
  publishDomainEvent("application.approved")
  ↓
EVENT BUS
  ↓
COMMUNICATION INTENT LAYER (NEW)
  ↓
  Translate: "application.approved" → "notify.application.approved"
  Translate: "application.approved" → "analytics.application.approved"
  Translate: "application.approved" → "webhook.application.approved"
  ↓
COMMUNICATION REGISTRY
  ↓
  Stores: intent name, channels, audiences, policies
  Does NOT store: provider names, retry logic details
  ↓
POLICY LAYERS
  ├─ Audience Policy: Who receives this intent?
  ├─ Channel Policy: Which channels per audience?
  ├─ Template Policy: Which templates per channel?
  └─ Retry Policy: How to retry failures?
  ↓
RUNTIME ORCHESTRATOR
  ↓
DISPATCHER
  ↓
PROVIDER ADAPTERS
  ↓
DELIVERY
```

---

## WHY THIS MATTERS

### Today's Problem

```typescript
// Business event published
publishDomainEvent("application.approved", {...})

// Currently maps directly to:
notificationService.notify("application_approved", {...})

// Tomorrow, if we want analytics:
// We'd have to modify the business code or add another publish call
```

### Tomorrow's Solution

```typescript
// Business event published (unchanged)
publishDomainEvent("application.approved", {...})

// Communication Intent Translator sees it and publishes:
publish("notify.application.approved", {...})    // → Notification system
publish("analytics.application.approved", {...}) // → Analytics system
publish("webhook.application.approved", {...})   // → Webhook system

// Each subscriber handles its own domain
// Business code never changes
```

---

## LAYER 1: COMMUNICATION INTENT DEFINITIONS

### What is a Communication Intent?

A **communication intent** is a business event that has triggered a communication need.

**Key Distinction:**
- **Domain Event** (business): "Something happened in the application domain"
- **Communication Intent** (platform): "Because of that event, we need to send a communication"

### Naming Convention

**Domain Events** (from business):
```
{domain}.{action}
application.approved
eligibility.assessed
staff.invited
```

**Communication Intents** (for platform):
```
{channel}.{domain}.{action}

notify.application.approved        → Send notification
analytics.application.approved     → Track metric
webhook.application.approved       → Call webhook
email.application.approved         → Send email (explicit)
sms.application.approved          → Send SMS (future)
push.application.approved         → Send push (future)
```

### Communication Intent Registry

```typescript
export interface CommunicationIntent {
  // Identity
  intentName: string;                    // "notify.application.approved"
  triggerDomainEvent: string;            // "application.approved"
  channel: string;                       // "email", "telegram", "webhook", "analytics"
  
  // Versioning & Lifecycle
  version: number;                       // Allows migration
  registryVersion: 1;                    // Registry format version
  status: 'ACTIVE' | 'DEPRECATED' | 'REMOVED'; // Lifecycle
  
  // Ownership & Metadata
  owner: string;                         // "Application Team"
  description: string;                   // "User-facing notification"
  createdAt: string;                     // ISO 8601
  deprecatedAt?: string;                 // When deprecated
  removedAt?: string;                    // When removed
  
  // Configuration
  deliveryType: 'synchronous' | 'asynchronous'; // Almost always async
  allowedAudiences: string[];            // ["applicant", "org_admin"]
  allowedChannels: string[];             // ["email", "telegram"] - channels for THIS intent
  
  // Policies (references, not values)
  audiencePolicyRef: string;             // Reference to audience policy
  channelPolicyRef: string;              // Reference to channel policy
  templatePolicyRef: string;             // Reference to template policy
  retryPolicyRef: string;                // Reference to retry policy
}
```

### Example Intent Entries

```typescript
const intentRegistry = {
  'notify.application.approved': {
    intentName: 'notify.application.approved',
    triggerDomainEvent: 'application.approved',
    channel: 'notification',
    version: 1,
    registryVersion: 1,
    status: 'ACTIVE',
    owner: 'Application Team',
    description: 'Notify applicant and staff when application is approved',
    createdAt: '2026-07-28',
    deliveryType: 'asynchronous',
    allowedAudiences: ['applicant', 'org_admin', 'reviewer'],
    allowedChannels: ['email', 'telegram', 'internal'],
    audiencePolicyRef: 'application-approval-audiences',
    channelPolicyRef: 'application-approval-channels',
    templatePolicyRef: 'application-approval-templates',
    retryPolicyRef: 'notification-standard-retry'
  },
  
  'analytics.application.approved': {
    intentName: 'analytics.application.approved',
    triggerDomainEvent: 'application.approved',
    channel: 'analytics',
    version: 1,
    registryVersion: 1,
    status: 'ACTIVE',
    owner: 'Analytics Team',
    description: 'Track application approval metrics',
    createdAt: '2026-07-28',
    deliveryType: 'asynchronous',
    allowedAudiences: ['system'],
    allowedChannels: ['analytics-service'],
    audiencePolicyRef: 'analytics-audiences',
    channelPolicyRef: 'analytics-channels',
    templatePolicyRef: 'analytics-templates',
    retryPolicyRef: 'analytics-retry'
  },
  
  'webhook.application.approved': {
    intentName: 'webhook.application.approved',
    triggerDomainEvent: 'application.approved',
    channel: 'webhook',
    version: 1,
    registryVersion: 1,
    status: 'ACTIVE',
    owner: 'Integration Team',
    description: 'POST to external webhook when application approved',
    createdAt: '2026-07-28',
    deliveryType: 'asynchronous',
    allowedAudiences: ['system'],
    allowedChannels: ['webhook'],
    audiencePolicyRef: 'webhook-audiences',
    channelPolicyRef: 'webhook-channels',
    templatePolicyRef: 'webhook-templates',
    retryPolicyRef: 'webhook-retry'
  }
};
```

---

## LAYER 2: COMMUNICATION INTENT TRANSLATOR

### What It Does

Subscribes to ALL domain events and translates them to communication intents.

```typescript
// Subscriber for domain events
function handleDomainEvent(event: DomainEvent) {
  // Look up all communication intents for this domain event
  const intents = getIntentsForDomainEvent(event.eventName);
  
  for (const intent of intents) {
    // Publish each intent separately
    publishCommunicationIntent(intent.intentName, {
      ...event.payload,
      sourceIntent: intent
    });
  }
}

// This handles:
// 1. One domain event → Multiple intents (notify + analytics + webhook)
// 2. Intent versioning (ACTIVE vs DEPRECATED)
// 3. Filtering (skip REMOVED intents)
// 4. Auditing (log all translations)
```

### Result

**Before (current):**
```
application.approved
  ↓
notificationService.notify() [ONLY NOTIFICATIONS]
```

**After (intent layer):**
```
application.approved
  ↓ [Communication Intent Translator]
  ├─ notify.application.approved → Notification system
  ├─ analytics.application.approved → Analytics system
  └─ webhook.application.approved → Webhook system
```

---

## LAYER 3: COMMUNICATION REGISTRY (REFINED)

### What's In It

```typescript
export interface CommunicationRegistryEntry {
  // Identity
  communicationEventName: string;        // "notify.application.approved"
  
  // Source
  triggerIntent: string;                 // "notify.application.approved"
  
  // Metadata
  version: number;
  status: 'ACTIVE' | 'DEPRECATED' | 'REMOVED';
  owner: string;
  
  // Configuration (references only, no details)
  allowedChannels: string[];             // ["email", "telegram", "internal"]
  allowedAudiences: string[];            // ["applicant", "org_admin", "reviewer"]
  
  // Policy References
  policyRefs: {
    audience: string;                    // "application-approval-audiences"
    channel: string;                     // "application-approval-channels"
    template: string;                    // "application-approval-templates"
    retry: string;                       // "notification-standard-retry"
  }
}
```

### What's NOT In It

❌ Removed: Provider names (infrastructure)
❌ Removed: Detailed retry logic (in policy)
❌ Removed: Channel mappings per audience (in policy)
❌ Removed: Template keys (in policy)

### Example Entry

```typescript
const registryEntry = {
  communicationEventName: 'notify.application.approved',
  triggerIntent: 'notify.application.approved',
  version: 1,
  status: 'ACTIVE',
  owner: 'Application Team',
  allowedChannels: ['email', 'telegram', 'internal'],
  allowedAudiences: ['applicant', 'org_admin', 'reviewer'],
  policyRefs: {
    audience: 'application-approval-audiences',
    channel: 'application-approval-channels',
    template: 'application-approval-templates',
    retry: 'notification-standard-retry'
  }
};
```

---

## LAYER 4: POLICY LAYERS

### Audience Policy

**Responsible for:** Which audiences receive this intent?

```typescript
export interface AudiencePolicy {
  policyId: string;                      // "application-approval-audiences"
  version: number;
  for: string;                           // Which intent? "notify.application.approved"
  
  audiences: {
    applicant: boolean;                  // Should applicant receive it?
    org_admin: boolean;
    reviewer: boolean;
    case_worker: boolean;
    support: boolean;
  };
  
  audienceRoles: {
    applicant: {
      resolveFrom: 'context.userId' | 'context.userEmail' | 'db.lookup';
      canOpt: boolean;                   // Can applicant opt out?
    };
    org_admin: {
      resolveFrom: 'context.organizationId';
      canOpt: boolean;
    };
    // etc
  };
}

// Example
const audiencePolicy = {
  policyId: 'application-approval-audiences',
  version: 1,
  for: 'notify.application.approved',
  audiences: {
    applicant: true,
    org_admin: true,
    reviewer: true,
    case_worker: false,
    support: false
  },
  audienceRoles: {
    applicant: { resolveFrom: 'context.userId', canOpt: true },
    org_admin: { resolveFrom: 'context.organizationId', canOpt: false },
    reviewer: { resolveFrom: 'context.reviewerId', canOpt: false }
  }
};
```

### Channel Policy

**Responsible for:** Which channels per audience?

```typescript
export interface ChannelPolicy {
  policyId: string;                      // "application-approval-channels"
  version: number;
  for: string;                           // "notify.application.approved"
  
  channelsByAudience: {
    applicant: ['email', 'internal'];
    org_admin: ['telegram', 'internal'];
    reviewer: ['internal'];
  };
  
  channelPriority: {
    applicant: {
      primary: 'email';
      fallback: 'internal';
    };
    org_admin: {
      primary: 'telegram';
      fallback: 'internal';
    };
    // etc
  };
}
```

### Template Policy

**Responsible for:** Which template per intent + audience + channel?

```typescript
export interface TemplatePolicy {
  policyId: string;                      // "application-approval-templates"
  version: number;
  for: string;                           // "notify.application.approved"
  locale: string;                        // "en", "es", etc
  
  templates: {
    applicant: {
      email: { templateId: 'app-approved-email-en', version: 1 };
      internal: { templateId: 'app-approved-internal-en', version: 1 };
    };
    org_admin: {
      telegram: { templateId: 'app-approved-telegram-en', version: 1 };
      internal: { templateId: 'app-approved-internal-admin-en', version: 1 };
    };
    // etc
  };
}
```

### Retry Policy

**Responsible for:** How to retry on failure?

```typescript
export interface RetryPolicy {
  policyId: string;                      // "notification-standard-retry"
  version: number;
  
  maxAttempts: number;                   // 5
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelayMs: number;                // 1000
  maxDelayMs: number;                    // 60000
  
  deadLetterQueue: {
    enabled: boolean;
    retentionDays: number;               // Keep for analysis
  };
  
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;            // 5 failures
    resetWindowMs: number;               // After 1 minute
  };
}
```

---

## LAYER 5: COMMUNICATION INTENT TRANSLATOR IMPLEMENTATION

### What It Reads

```typescript
const intentRegistry = {
  'notify.application.approved': { ... },
  'analytics.application.approved': { ... },
  'webhook.application.approved': { ... }
};
```

### What It Does

```typescript
export class CommunicationIntentTranslator implements DomainEventSubscriber {
  async handle(domainEvent: DomainEvent): Promise<void> {
    // Step 1: Look up all intents for this domain event
    const intents = this.getIntentsForDomainEvent(domainEvent.eventName);
    
    // Step 2: Filter out deprecated/removed
    const activeIntents = intents.filter(i => i.status === 'ACTIVE');
    
    // Step 3: Publish each as separate communication intent
    for (const intent of activeIntents) {
      await this.publishCommunicationIntent(intent.intentName, {
        sourceIntent: intent,
        triggerEvent: domainEvent,
        payload: domainEvent.payload,
        occurredAt: domainEvent.occurredAt,
        correlationId: domainEvent.correlationId
      });
    }
  }
  
  private async publishCommunicationIntent(
    intentName: string,
    payload: any
  ): Promise<void> {
    // Each intent gets its own subscriber
    // notify.* → goes to NotificationIntentHandler
    // analytics.* → goes to AnalyticsHandler
    // webhook.* → goes to WebhookHandler
    
    emit('communication-intent', {
      intentName,
      ...payload
    });
  }
}
```

---

## LAYER 6: INTENT-SPECIFIC HANDLERS

### Notification Intent Handler

```typescript
export class NotificationIntentHandler {
  async handle(intent: CommunicationIntentEvent): Promise<void> {
    // Only handles "notify.*" intents
    if (!intent.intentName.startsWith('notify.')) return;
    
    // Read registry entry
    const registryEntry = COMMUNICATION_REGISTRY[intent.intentName];
    
    // Read policies
    const audiencePolicy = AUDIENCE_POLICIES[registryEntry.policyRefs.audience];
    const channelPolicy = CHANNEL_POLICIES[registryEntry.policyRefs.channel];
    const templatePolicy = TEMPLATE_POLICIES[registryEntry.policyRefs.template];
    const retryPolicy = RETRY_POLICIES[registryEntry.policyRefs.retry];
    
    // Now: RuntimeOrchestrator runs with these policies
    // (AudienceResolver, CommunicationPlanner, TemplateResolver, Dispatcher)
  }
}

// Similar for:
// - AnalyticsIntentHandler
// - WebhookIntentHandler
// - (future) SMSIntentHandler, PushIntentHandler, etc.
```

---

## COMPLETE REFINED ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│ BUSINESS LAYER                                                       │
│                                                                      │
│  Application submitted  →  publishDomainEvent("application.submitted")
└──────────────────────────────────────────────────────────────────────┘
                                   ↓
┌──────────────────────────────────────────────────────────────────────┐
│ EVENT BUS                                                            │
│                                                                      │
│  Route to all subscribers                                           │
└──────────────────────────────────────────────────────────────────────┘
                                   ↓
        ┌──────────────────────────┼──────────────────────────┐
        ↓                          ↓                          ↓
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Communication    │    │ Other Subscriber │    │ Other Subscriber │
│ Intent           │    │ (Analytics)      │    │ (Audit Log)      │
│ Translator       │    │                  │    │                  │
│                  │    │ [Not shown]      │    │ [Not shown]      │
└──────────────────┘    └──────────────────┘    └──────────────────┘
        ↓
   Publishes 3 intents:
   - notify.application.submitted
   - analytics.application.submitted
   - webhook.application.submitted
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│ COMMUNICATION INTENT EVENT BUS                                       │
│                                                                      │
│  Route to intent-specific handlers                                  │
└──────────────────────────────────────────────────────────────────────┘
        ↓
   ┌────────────────────────┬────────────────────────┬─────────────────┐
   ↓                        ↓                        ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Notification     │  │ Analytics        │  │ Webhook          │
│ Intent Handler   │  │ Handler          │  │ Handler          │
│                  │  │                  │  │                  │
│ • Read registry  │  │ • Track metrics  │  │ • POST to URL    │
│ • Read policies  │  │ • Store data     │  │ • Sign & verify  │
│ • Call runtime   │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│ RUNTIME ORCHESTRATOR (Notification flow only)                        │
│                                                                      │
│ • AudienceResolver → uses audience policy                           │
│ • CommunicationPlanner → uses channel policy                        │
│ • TemplateResolver → uses template policy                           │
│ • Dispatcher → creates dispatch requests                            │
└──────────────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│ PROVIDER ADAPTERS (Email, Telegram, Internal, etc.)                 │
│                                                                      │
│ No provider knowledge in registry or policies                        │
│ Providers handle delivery mechanics                                 │
└──────────────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────────────┐
│ AUDIT LOG & RETRY QUEUE                                             │
│                                                                      │
│ All delivery tracked with correlationId                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## MIGRATION PATH

### Current State
```
Domain Event → NotificationService.notify() → Provider
```

### Phase A.5 (NEW - Before Phase B)
Create Communication Intent layer:
```
Domain Event → Intent Translator → Communication Intent → Handler → Provider
```

### After Phase A.5
All phases become cleaner:
- **Phase B**: Add missing intent subscriptions
- **Phase C**: Complete policies (audience, channel, template)
- **Phase D**: Remove direct notify() bypasses
- **Phase E**: Remove legacy routing

---

## VERSIONING STRATEGY

### Registry Versions
```typescript
intent.registryVersion = 1;  // Current format

// Future: registryVersion = 2
// Could add new fields without breaking existing entries
```

### Intent Versions
```typescript
// Version 1 is active
const intent_v1 = {
  intentName: 'notify.application.approved',
  version: 1,
  status: 'ACTIVE',
  // configuration...
};

// Tomorrow: need to change audience?
const intent_v2 = {
  intentName: 'notify.application.approved',
  version: 2,
  status: 'ACTIVE',
  // new configuration...
};

// Can keep v1 as 'DEPRECATED' for gradual migration
const intent_v1_deprecated = {
  intentName: 'notify.application.approved',
  version: 1,
  status: 'DEPRECATED',
  migratedTo: 'notify.application.approved_v2',
  removalDate: '2026-08-28' // 30-day sunset
};
```

---

## FUTURE-PROOFING

With this architecture, adding future channels is trivial:

### Future: SMS/Twilio
```typescript
const intent = {
  intentName: 'sms.application.approved',
  triggerDomainEvent: 'application.approved',
  channel: 'sms',
  // ... rest of intent config
};

// Create SMSIntentHandler that subscribes to 'sms.*' intents
// No changes to business logic, notification system, or existing intents
```

### Future: Push Notifications
```typescript
const intent = {
  intentName: 'push.application.approved',
  triggerDomainEvent: 'application.approved',
  channel: 'push',
  // ... rest of intent config
};

// Create PushIntentHandler
// Everything else unchanged
```

### Future: AI Summarization
```typescript
const intent = {
  intentName: 'ai.application.approved',
  triggerDomainEvent: 'application.approved',
  channel: 'ai-summary',
  // configuration...
};

// Create AIIntentHandler
// Generate summaries from notifications for admin digest
// Still same architecture
```

---

## BENEFITS OF THIS DESIGN

1. **Decoupling**: Business doesn't know about communication
2. **Extensibility**: New intents/channels without touching existing code
3. **Versioning**: Migrate gradually between intent versions
4. **Multi-use**: One domain event → multiple intents (notify + analytics + webhook)
5. **Clear Ownership**: Each intent has an owner
6. **Lifecycle Management**: ACTIVE/DEPRECATED/REMOVED states
7. **Testability**: Each handler testable independently
8. **Auditability**: Full trail from business event to delivery
9. **Provider-Agnostic**: Registry doesn't mention providers
10. **Policy-Driven**: All configuration in policy layer, not code

---

## NEXT STEP

Once this architecture is approved, proceed to:

**Phase A.5 (New):** Create Communication Intent layer
- Implement CommunicationIntentTranslator
- Create intent registry (separate from communication registry)
- Set up intent-specific handlers (NotificationIntentHandler, etc.)
- Wire intent event bus

**Then Phase B:** Add missing subscribers (now much simpler)

