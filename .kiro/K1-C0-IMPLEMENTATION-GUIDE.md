# K1.C0 — IMPLEMENTATION GUIDE
## How to Use the Communication Contract in Phase C

---

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Builder Pattern](#builder-pattern)
3. [Enrichment Pattern](#enrichment-pattern)
4. [Validation](#validation)
5. [Serialization](#serialization)
6. [Testing](#testing)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## QUICK START

### Creating a CommunicationRequest

```typescript
import {
  CommunicationRequestBuilder,
  CommunicationRequestFactory,
  RecipientFactory,
  ChannelPlanFactory,
  RenderedTemplateFactory,
} from "@/lib/communications/contracts";
import { v4 as uuidv4 } from "uuid";

// Step 1: Create recipients
const applicant = RecipientFactory.create({
  id: "user123",
  email: "applicant@example.com",
  name: "John Doe",
  role: "applicant",
  organizationId: "org456",
  preferences: {
    enabledChannels: ["email", "telegram"],
    language: "en",
  },
});

// Step 2: Create channel plan
const channelPlan = ChannelPlanFactory.create({
  recipientId: "user123",
  primary: "email",
  fallbacks: ["internal"],
  priority: "high",
});

// Step 3: Create template
const template = {
  id: "tmpl-welcome-001",
  name: "welcome-email",
  version: "1.0.0",
  language: "en",
  channel: "email" as const,
  variables: ["name", "organizationName"],
  status: "PUBLISHED" as const,
};

// Step 4: Create rendered content
const rendered = RenderedTemplateFactory.create({
  templateId: "tmpl-welcome-001",
  subject: "Welcome to Heloci!",
  body: "Hello John, welcome to Heloci housing program",
  html: "<h1>Welcome</h1><p>Hello John, welcome</p>",
  channel: "email",
  variables: {
    substituted: { name: "John", organizationName: "Heloci" },
    missing: [],
  },
});

// Step 5: Build request (validates all required fields)
const result = CommunicationRequestFactory.createFromBuilder((builder) => {
  builder
    .withTraceId(uuidv4())
    .withOrganizationId("org456")
    .withUserId("admin789")
    .withEvent("user.registration")
    .withEventPayload({ userId: "user123" })
    .withAudiences(["applicant"])
    .withRecipients([applicant])
    .withChannels(["email", "internal"])
    .withChannelPlan([channelPlan])
    .withTemplate(template)
    .withRendered(rendered);
});

// Now you have an immutable, frozen CommunicationRequest
const request = result;

// Use it
console.log(request.traceId);    // UUID
console.log(request.recipients.length);  // 1
console.log(request.event);      // "user.registration"
```

---

## BUILDER PATTERN

### Full Builder Example

```typescript
import { CommunicationRequestBuilder } from "@/lib/communications/contracts";
import { v4 as uuidv4 } from "uuid";

const builder = new CommunicationRequestBuilder()
  // Required: Tracing
  .withTraceId(uuidv4())
  .withOrganizationId("org123")
  
  // Optional: Audit
  .withUserId("admin456")
  
  // Required: Event context
  .withEvent("application.submitted")
  .withEventPayload({
    applicationId: "app789",
    userId: "user123",
    programName: "Housing First",
  })
  
  // Required: Audiences
  .withAudiences(["applicant", "org_admin"])
  
  // Required: Recipients (resolved by audience)
  .withRecipients([
    applicant,
    orgAdmin1,
    orgAdmin2,
  ])
  
  // Required: Channels
  .withChannels(["email", "telegram", "internal"])
  
  // Required: Channel plan (how each recipient receives it)
  .withChannelPlan([
    channelPlanApplicant,
    channelPlanAdmin1,
    channelPlanAdmin2,
  ])
  
  // Required: Template
  .withTemplate(selectedTemplate)
  
  // Required: Rendered content
  .withRendered(renderedContent)
  
  // Optional: Metadata
  .withMetadata({
    priority: "critical",
    source: "domain_event",
  })
  
  // Optional: Tags for filtering
  .withTags(["sla-critical", "escalation"])
  
  // Optional: Link to parent
  .withCorrelationId("parent-trace-123");

// Build (validates all required fields)
const result = builder.build();

if (result.success) {
  const request = result.request!;
  // Use request...
} else {
  console.error("Build failed:", result.errors);
}
```

### Builder Validation

The builder validates:
- ✅ All required fields present
- ✅ Recipients valid (email, role, org)
- ✅ Channel plans cover all recipients
- ✅ Template and rendered exist
- ✅ No empty arrays

---

## ENRICHMENT PATTERN

### How Layers Enrich the Contract

Each layer receives the contract, enriches it, and returns a NEW immutable object.

```typescript
// ============================================
// PHASE C.1: AUDIENCE RESOLVER
// ============================================

async function resolveAudiences(
  event: string,
  eventPayload: Record<string, unknown>,
  organizationId: string
): Promise<CommunicationRequest> {
  // Query registry for audiences
  const audiences = registry.getAudiencesForEvent(event);
  
  // Resolve recipients from database
  const recipients: Recipient[] = [];
  
  if (audiences.includes("applicant")) {
    const user = await db.user.findUnique({
      where: { id: eventPayload.userId },
    });
    recipients.push(RecipientFactory.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: "applicant",
      organizationId,
    }));
  }
  
  if (audiences.includes("org_admin")) {
    const admins = await db.organizationMember.findMany({
      where: { organizationId, role: "org_admin" },
      include: { user: true },
    });
    for (const admin of admins) {
      recipients.push(RecipientFactory.create({
        id: admin.user.id,
        email: admin.user.email,
        name: admin.user.name,
        role: "org_admin",
        organizationId,
      }));
    }
  }
  
  // Create initial request
  return CommunicationRequestFactory.createFromBuilder((builder) => {
    builder
      .withTraceId(crypto.randomUUID())
      .withOrganizationId(organizationId)
      .withEvent(event)
      .withEventPayload(eventPayload)
      .withAudiences(audiences)
      .withRecipients(recipients)
      .withChannels([])        // Will be filled by C.2
      .withChannelPlan([])     // Will be filled by C.2
      .withTemplate({} as any) // Will be filled by C.3
      .withRendered({} as any);// Will be filled by C.3
  });
}

// ============================================
// PHASE C.2: COMMUNICATION PLANNER
// ============================================

async function planChannels(
  request: CommunicationRequest
): Promise<CommunicationRequest> {
  // Query registry for channels
  const channelsForAudiences = registry.getChannelsForEvent(request.event);
  
  // Gather all unique channels
  const channels = new Set<CommunicationChannel>();
  const channelPlans: ChannelPlan[] = [];
  
  for (const recipient of request.recipients) {
    // Query user preferences
    const prefs = await db.userPreference.findFirst({
      where: { userId: recipient.id },
    });
    
    // Get channel config from registry
    const channelConfig = channelsForAudiences[recipient.role];
    
    // Apply preferences override
    let channels_for_recipient = channelConfig.channels;
    if (prefs?.enabledChannels) {
      channels_for_recipient = channels_for_recipient.filter(
        (c) => prefs.enabledChannels.includes(c)
      );
    }
    
    // Create channel plan
    const plan = ChannelPlanFactory.create({
      recipientId: recipient.id,
      primary: channels_for_recipient[0],
      fallbacks: channels_for_recipient.slice(1),
      priority: "normal",
    });
    
    channelPlans.push(plan);
    channels_for_recipient.forEach((c) => channels.add(c));
  }
  
  // Enrich request immutably
  return CommunicationRequestFactory.enrich(request, {
    channels: Array.from(channels),
    channelPlan: channelPlans,
  });
}

// ============================================
// PHASE C.3: TEMPLATE RESOLVER
// ============================================

async function resolveTemplate(
  request: CommunicationRequest
): Promise<CommunicationRequest> {
  // Query template database
  const template = await db.template.findFirst({
    where: {
      event: request.event,
      channel: request.channels[0],
      language: "en",
      status: "PUBLISHED",
    },
  });
  
  if (!template) {
    throw new Error(`No template for ${request.event} / ${request.channels[0]}`);
  }
  
  // Render template with variables
  const rendered = RenderedTemplateFactory.create({
    templateId: template.id,
    subject: template.subject,
    body: template.body,
    html: template.html,
    channel: request.channels[0],
    variables: {
      substituted: {
        name: request.recipients[0].name,
        applicationId: request.eventPayload.applicationId,
      },
      missing: [],
    },
  });
  
  // Enrich request
  return CommunicationRequestFactory.enrich(request, {
    template: {
      id: template.id,
      name: template.name,
      version: template.version,
      language: "en",
      channel: template.channel,
      variables: template.variables,
      status: "PUBLISHED",
    },
    rendered,
  });
}

// ============================================
// PHASE C.4: DISPATCHER
// ============================================

async function dispatch(
  request: CommunicationRequest
): Promise<void> {
  // Dispatcher knows NOTHING about applications, users, organizations
  // It only knows:
  // - Who to send to (recipients)
  // - Which channel (channels)
  // - What to send (rendered)
  
  for (const plan of request.channelPlan) {
    try {
      const result = await dispatchToProvider({
        channel: plan.primary,
        recipient: request.recipients.find((r) => r.id === plan.recipientId)!,
        content: request.rendered,
        metadata: { traceId: request.traceId },
      });
      
      // Log delivery
      await db.notificationLog.create({
        traceId: request.traceId,
        event: request.event,
        recipient: result.recipient.email,
        channel: result.channel,
        status: result.status,
      });
    } catch (error) {
      // Retry with fallback channel
      for (const fallback of plan.fallbacks) {
        try {
          const result = await dispatchToProvider({
            channel: fallback,
            recipient: request.recipients.find((r) => r.id === plan.recipientId)!,
            content: request.rendered,
            metadata: { traceId: request.traceId },
          });
          
          await db.notificationLog.create({
            traceId: request.traceId,
            event: request.event,
            recipient: result.recipient.email,
            channel: fallback,
            status: result.status,
          });
          break;
        } catch {
          continue;
        }
      }
    }
  }
}
```

---

## VALIDATION

### Validate a Request

```typescript
import { CommunicationRequestValidator } from "@/lib/communications/contracts";

const validation = CommunicationRequestValidator.validate(request);

if (!validation.valid) {
  console.error("Invalid request:", validation.errors);
  // errors: ["traceId is required", "recipients is empty", ...]
}
```

### Validate for Logging

```typescript
const loggingValidation = CommunicationRequestValidator.validateForLogging(request);

if (!loggingValidation.valid) {
  console.error("Cannot log this request:", loggingValidation.errors);
}
```

---

## SERIALIZATION

### Save to Database

```typescript
import { CommunicationRequestSerializer } from "@/lib/communications/contracts";

const serialized = CommunicationRequestSerializer.serialize(request);

await db.communicationRequest.create({
  data: {
    traceId: serialized.traceId,
    event: serialized.event,
    organizationId: serialized.organizationId,
    payload: JSON.stringify(serialized),
    createdAt: new Date(serialized.createdAt),
  },
});
```

### Restore from Database

```typescript
const stored = await db.communicationRequest.findUnique({
  where: { traceId: "..." },
});

const deserialized = CommunicationRequestSerializer.deserialize(
  JSON.parse(stored.payload)
);

// deserialized is automatically frozen and validated
```

### JSON String Serialization

```typescript
// Convert to JSON
const json = CommunicationRequestSerializer.toJSON(request);

// Send over HTTP, store in S3, etc.
await s3.putObject({
  Body: json,
  Key: `communications/${request.traceId}.json`,
});

// Later: Restore from JSON
const json2 = await s3.getObject({
  Key: `communications/${request.traceId}.json`,
});
const restoredRequest = CommunicationRequestSerializer.fromJSON(
  json2.Body.toString()
);
```

### Extract for Logging

```typescript
const loggingData = CommunicationRequestSerializer.extractForLogging(request);
// {
//   traceId: "...",
//   event: "user.registration",
//   organizationId: "org123",
//   recipientCount: 2,
//   channels: ["email", "telegram"],
//   createdAt: "2026-07-29T..."
// }

logger.info("Communication dispatched", loggingData);
```

---

## TESTING

### Testing in Phase C Layers

```typescript
import { describe, it, expect } from "vitest";
import {
  CommunicationRequestBuilder,
  CommunicationRequestFactory,
  RecipientFactory,
  ChannelPlanFactory,
  RenderedTemplateFactory,
} from "@/lib/communications/contracts";

describe("AudienceResolver", () => {
  it("should resolve applicant audience", async () => {
    // Arrange
    const request = CommunicationRequestFactory.createFromBuilder((b) => {
      b.withTraceId("test-trace")
        .withOrganizationId("org123")
        .withEvent("user.registration")
        .withEventPayload({ userId: "user123" })
        .withAudiences([])
        .withRecipients([])
        .withChannels([])
        .withChannelPlan([])
        .withTemplate({} as any)
        .withRendered({} as any);
    });
    
    // Act
    const enriched = await resolveAudiences(
      "user.registration",
      { userId: "user123" },
      "org123"
    );
    
    // Assert
    expect(enriched.audiences).toContain("applicant");
    expect(enriched.recipients).toHaveLength(1);
    expect(enriched.recipients[0].email).toBe("applicant@example.com");
    
    // Verify immutability
    expect(Object.isFrozen(enriched)).toBe(true);
    expect(Object.isFrozen(enriched.recipients)).toBe(true);
  });
});
```

---

## COMMON PATTERNS

### Pattern 1: Handling Missing Recipients

```typescript
// Don't throw - enrich with empty recipients
if (recipients.length === 0) {
  logger.warn(`No recipients for event ${event}`);
  // Continue with empty recipients
  // Dispatcher will handle gracefully
}
```

### Pattern 2: Graceful Template Fallback

```typescript
let template = await findTemplate(event, channel, language);

if (!template) {
  // Fallback to English
  template = await findTemplate(event, channel, "en");
}

if (!template) {
  throw new Error(`No template for ${event}`);
}
```

### Pattern 3: Multi-Language Support

```typescript
// Get user language preference
const language = user.preferences?.language || "en";

// Resolve template in requested language
const template = await findTemplate(event, channel, language);

// If not found, fallback to English
if (!template) {
  const enTemplate = await findTemplate(event, channel, "en");
  logger.warn(`Fallback to English for ${language}`);
  return enTemplate;
}
```

### Pattern 4: Filtering Channels by Org Settings

```typescript
// Get org settings
const orgSettings = await db.organizationSettings.findUnique({
  where: { organizationId },
});

// Filter disabled channels
const availableChannels = channelsFromRegistry.filter((ch) => {
  if (ch === "telegram" && orgSettings.telegramDisabled) return false;
  if (ch === "sms" && orgSettings.smsDisabled) return false;
  return true;
});
```

### Pattern 5: Deduplicating Recipients

```typescript
import { RecipientFactory } from "@/lib/communications/contracts";

// Get recipients by role
const recipients = [admin1, admin2, admin1]; // Duplicate

// Deduplicate by email
const unique = RecipientFactory.deduplicateByEmail(recipients);
// → [admin1, admin2]

// Or by ID
const uniqueById = RecipientFactory.deduplicateById(recipients);
// → [admin1, admin2]
```

---

## TROUBLESHOOTING

### Error: "Builder build failed: recipients is empty"

**Cause:** No recipients resolved for event

**Solution:**
```typescript
// Check if audience resolution found any recipients
const recipients = await resolveRecipientsForAudience(audience);
if (recipients.length === 0) {
  logger.warn(`No recipients for audience ${audience}`);
  // Handle gracefully - use empty array or throw
}
```

### Error: "Channel plan coverage failed: No channel plan for recipient X"

**Cause:** Recipient missing from channel plan

**Solution:**
```typescript
// Ensure every recipient has a channel plan
const recipientIds = new Set(recipients.map((r) => r.id));
for (const id of recipientIds) {
  const plan = ChannelPlanFactory.create({
    recipientId: id,
    primary: "email",
    fallbacks: ["internal"],
  });
  channelPlans.push(plan);
}
```

### Error: "Cannot modify frozen object"

**Cause:** Trying to modify immutable request

**Solution:**
```typescript
// ❌ WRONG
request.event = "different.event";

// ✅ RIGHT
const updated = CommunicationRequestFactory.enrich(request, {
  event: "different.event",
});
```

### Error: "Deserialization failed: Incompatible version"

**Cause:** Stored request has different contract version

**Solution:**
```typescript
// Check version before deserializing
if (stored.version !== "1.0.0") {
  // Implement migration if needed
  const migrated = migrateFromOldVersion(stored);
  return CommunicationRequestSerializer.deserialize(migrated);
}
```

---

## NEXT STEPS

The contract is complete and frozen. You can now:

1. **Implement C.1 (Audience Resolver)** - Uses this guide to resolve recipients
2. **Implement C.2 (Communication Planner)** - Uses enrichment pattern
3. **Implement C.3 (Template Resolver)** - Uses enrichment pattern
4. **Implement C.4 (Dispatcher)** - Consumes complete request
5. **Write tests** - Follow test patterns in testing section

**All layers follow the same enrichment pattern:**
- Receive immutable request
- Query databases/registries
- Enrich request with `CommunicationRequestFactory.enrich()`
- Return new immutable request
- Pass to next layer

**Immutability ensures:**
- No accidental mutations
- Audit trail (original never changes)
- Thread-safe
- Cache-friendly
