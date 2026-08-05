# Notification Contract Specification

This is the specification that every component must satisfy.

---

## Purpose

Each stage of the notification runtime has a contract:
- **Input:** What it receives
- **Output:** What it produces
- **Never Changes:** Values that must be preserved

If any "Never Changes" value mutates unexpectedly, you've found a defect.

---

## Layer 1: Event Integrity

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ eventName: string; payload: object; organizationId?: string }` |
| **Output** | `{ correlationId: string; timestamp: Date; organizationId?: string \| null }` |
| **Never Changes** | `correlationId`, `organizationId` (null for platform events) |

### Input Validation

```typescript
interface EventInput {
  eventName: NotificationEventName;
  payload: NotificationPayload;
  organizationId?: string; // Required for org events, null/undefined for platform
}

// Validate:
- eventName is in NotificationEventName enum
- payload is object (not null, not array)
- organizationId is either string or undefined (not empty string)
```

### Output Validation

```typescript
interface EventOutput {
  correlationId: string;
  timestamp: Date;
  organizationId: string | null; // Always explicit (string or null)
}

// Verify:
- correlationId is 32+ chars (UUID-like)
- correlationId is unique (check against log)
- timestamp is ISO datetime
- organizationId matches input (preserved)
```

### Immutability Rules
- correlationId must survive to NotificationLog
- organizationId must survive to NotificationLog (same value or null)
- No transformations at this stage

---

## Layer 2: Audience Resolution

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ correlationId: string; eventName: string; organizationId?: string \| null; context: object }` |
| **Output** | `{ audiences: Audience[]; correlationId: string; organizationId?: string \| null }` |
| **Never Changes** | `correlationId`, `organizationId`, `eventName` |

### Input Validation

```typescript
interface AudienceInput {
  correlationId: string;
  eventName: NotificationEventName;
  organizationId: string | null;
  context: {
    userId?: string;
    userEmail?: string;
    recipientId?: string;
    applicationId?: string;
    // ... event-specific context
  };
}

// Verify:
- correlationId exists and matches layer 1 output
- eventName matches layer 1
- organizationId matches layer 1 (type and value)
- context is object with expected keys for this event
```

### Output Validation

```typescript
interface Audience {
  role: 'applicant' | 'org_admin' | 'case_worker' | 'system' | 'staff';
  recipient: {
    email: string;
    userId?: string;
    name?: string;
  };
  organizationId?: string | null; // Must match input
}

interface AudienceOutput {
  audiences: Audience[];
  correlationId: string; // Exactly same as input
  organizationId: string | null; // Exactly same as input
  eventName: string; // Exactly same as input
}

// Verify:
- audiences is non-empty array
- each audience has role from enum
- each recipient has email (valid format)
- No duplicate recipients (by email)
- correlationId unchanged (byte-for-byte)
- organizationId unchanged (including null)
- eventName unchanged
```

### Immutability Rules
- Audiences can be added/removed, but values within existing audiences cannot change
- correlationId must survive unchanged
- organizationId must survive unchanged (including null value)
- eventName must survive unchanged

### Multi-Tenant Rules
- If organizationId = null (platform event): audiences can only be user-scoped (no org admins)
- If organizationId = "org-123": audiences can include org-123's admins, NOT other org's admins
- Verify: Query audiences for org-A doesn't include org-B's users

---

## Layer 3: Communication Planning

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ audiences: Audience[]; correlationId: string; eventName: string; organizationId?: string \| null }` |
| **Output** | `{ plans: CommunicationPlan[]; correlationId: string; eventName: string; organizationId?: string \| null }` |
| **Never Changes** | `correlationId`, `eventName`, `organizationId` |

### Input Validation

```typescript
interface PlannerInput {
  audiences: Audience[];
  correlationId: string;
  eventName: string;
  organizationId: string | null;
}

// Verify:
- audiences is non-empty
- correlationId exists (passed from layer 2)
- eventName exists
- organizationId matches (including null)
```

### Output Validation

```typescript
interface CommunicationPlan {
  audience: string; // Role from Audience
  channel: 'email' | 'telegram' | 'internal' | 'whatsapp';
  priority: number; // 1 (highest) to N
}

interface PlannerOutput {
  plans: CommunicationPlan[];
  correlationId: string; // Exactly same as input
  eventName: string; // Exactly same as input
  organizationId: string | null; // Exactly same as input
}

// Verify:
- One plan per audience role
- No duplicate (audience, channel) pairs
- Channel is valid enum value
- Priority is numeric (integer 1+)
- correlationId unchanged
- eventName unchanged
- organizationId unchanged
```

### Immutability Rules
- Plan values (audience, channel) cannot change
- correlationId must survive unchanged
- eventName must survive unchanged
- organizationId must survive unchanged

### Preference Override Verification
If preferences exist:
- Check: Organization preference overrides global default
- Check: User preference overrides organization preference
- Verify: Overrides are applied and auditable

---

## Layer 4: Template Resolution

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ plan: CommunicationPlan; correlationId: string; organizationId?: string \| null; eventName: string }` |
| **Output** | `{ template: Template; correlationId: string; organizationId?: string \| null; audienceRole: string }` |
| **Never Changes** | `correlationId`, `organizationId`, `audienceRole`, `eventName` |

### Input Validation

```typescript
interface TemplateInput {
  plan: CommunicationPlan;
  correlationId: string;
  organizationId: string | null;
  eventName: string;
}

// Verify:
- plan has audience, channel, priority
- correlationId exists
- organizationId matches (including null)
- eventName matches plan
```

### Output Validation

```typescript
interface Template {
  id: string;
  key: string; // e.g., "applicant.user_registration.email"
  subject: string;
  html: string;
  plainText: string;
  variables: string[]; // e.g., ["name", "email"]
  organizationId?: string | null; // Org template or platform (null)
}

interface TemplateOutput {
  template: Template;
  correlationId: string; // Exactly same as input
  organizationId: string | null; // Exactly same as input
  audienceRole: string; // Exactly same as plan.audience
  eventName: string; // Exactly same as input
}

// Verify:
- template has subject, html, plainText
- template key format: "{audience}.{event}.{channel}"
- template.subject is non-empty string
- template.html is non-empty string (no {{}} left uninterpreted)
- template.variables is array (possibly empty)
- template.organizationId matches input (org template or null for platform)
- correlationId unchanged
- organizationId unchanged
- audienceRole unchanged
- eventName unchanged
```

### Immutability Rules
- audienceRole cannot change (maps to audience from layer 2)
- correlationId must survive unchanged
- organizationId must survive unchanged
- eventName must survive unchanged
- Template selection cannot be overridden mid-layer

### Template Priority Rules
For organization-owned events:
1. Check for org-specific template (organizationId = given org)
2. If not found, check platform template (organizationId = null)
3. If not found, use hardcoded fallback

For platform-owned events:
1. Use platform template (organizationId = null) always
2. Never use org-specific template for platform events

Verify priority was respected by checking template.organizationId.

---

## Layer 5: Sender Resolution

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ organizationId?: string \| null; correlationId: string; eventName: string }` |
| **Output** | `{ sender: string; senderName?: string; replyTo?: string; correlationId: string; organizationId?: string \| null }` |
| **Never Changes** | `correlationId`, `organizationId`, `eventName` |

### Input Validation

```typescript
interface SenderInput {
  organizationId: string | null;
  correlationId: string;
  eventName: string;
}

// Verify:
- organizationId is string or null (not undefined for platform events)
- correlationId exists
- eventName is valid
```

### Output Validation

```typescript
interface SenderOutput {
  sender: string; // Email address (verified)
  senderName?: string; // Display name
  replyTo?: string; // Optional reply-to address
  correlationId: string; // Exactly same as input
  organizationId: string | null; // Exactly same as input
  verified: boolean; // Must be true
}

// Verify:
- sender is valid email format
- sender is verified with email provider (check SenderIdentity.isVerified)
- For platform events: sender = "support@heloci.us" always
- For org events: sender = org's SenderIdentity.emailAddress
- If org's sender unverified: fallback to "support@heloci.us"
- correlationId unchanged
- organizationId unchanged
- verified flag is true (never send from unverified domain)
```

### Immutability Rules
- correlationId must survive unchanged
- organizationId must survive unchanged
- eventName must survive unchanged
- sender is final (cannot be changed by downstream layers)

### Sender Resolution Priority
For platform events (organizationId = null):
1. Use "support@heloci.us" (hardcoded)

For organization events (organizationId = "org-123"):
1. Query SenderIdentity where organizationId="org-123" AND isDefault=true
2. If found and isVerified=true: use that
3. If not found or not verified: fallback to "support@heloci.us"
4. **NEVER** use environment variable COMMUNICATION_SENDER_EMAIL

Verify the resolution was correct by checking which branch was taken.

---

## Layer 6: Dispatch Creation

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ template: Template; sender: string; audience: Audience; correlationId: string; organizationId?: string \| null }` |
| **Output** | `{ dispatch: DispatchRequest; correlationId: string; organizationId?: string \| null; recipient: string; sender: string }` |
| **Never Changes** | `correlationId`, `organizationId`, `recipient`, `sender` |

### Input Validation

```typescript
interface DispatchInput {
  template: Template;
  sender: string;
  audience: Audience;
  correlationId: string;
  organizationId: string | null;
}

// Verify:
- template has all required fields
- sender is email address
- audience has recipient email
- correlationId exists
- organizationId matches (including null)
```

### Output Validation

```typescript
interface DispatchRequest {
  recipient: string; // Email address (matches audience)
  sender: string; // Email address (matches input)
  senderName?: string;
  replyTo?: string;
  subject: string; // Rendered (no {{}} left)
  html: string; // Rendered (no {{}} left)
  channel: string; // From template/audience
  templateKey: string; // From template
  correlationId: string; // Matches input
  organizationId?: string | null; // Matches input
  audienceRole: string; // Matches audience role
}

interface DispatchOutput {
  dispatch: DispatchRequest;
  correlationId: string; // Exactly same as input
  organizationId: string | null; // Exactly same as input
  recipient: string; // Exactly same as audience email
  sender: string; // Exactly same as input sender
}

// Verify:
- dispatch.recipient matches audience.recipient.email (byte-for-byte)
- dispatch.sender matches input sender (byte-for-byte)
- dispatch.subject is rendered (no {{}} symbols)
- dispatch.html is rendered (no {{}} symbols)
- dispatch.correlationId matches input
- dispatch.organizationId matches input
- dispatch.templateKey exists and is valid
```

### Immutability Rules
- correlationId must survive unchanged
- organizationId must survive unchanged
- recipient must survive unchanged (from audience)
- sender must survive unchanged
- Subject and HTML rendering is one-way (cannot unrender)

### Rendering Verification
- Count {{}} placeholders before and after rendering
- Before: Should have multiple (name, email, etc.)
- After: Should have zero (all filled in)
- If after has {{}} left: Defect found

---

## Layer 7: Persistence (NotificationLog)

### Contract

| Aspect | Details |
|--------|---------|
| **Input** | `{ dispatch: DispatchRequest; providerResponse: ProviderResponse; status: 'SENT' \| 'FAILED' }` |
| **Output** | `{ logId: string; log: NotificationLog }` |
| **Never Changes** | `event`, `recipient`, `sender`, `organizationId`, `correlationId` |

### Input Validation

```typescript
interface LoggerInput {
  dispatch: DispatchRequest;
  providerResponse: ProviderResponse;
  status: 'SENT' | 'FAILED';
}

interface ProviderResponse {
  success: boolean;
  providerId?: string; // From Resend: email ID
  error?: string;
  timestamp: Date;
}

// Verify:
- dispatch has all required fields
- providerResponse has success flag
- status matches providerResponse.success
- timestamp is ISO datetime
```

### Output Validation

```typescript
interface NotificationLog {
  id: string;
  eventName: string; // From dispatch
  channel: string; // From dispatch
  recipient: string; // From dispatch (exact match)
  sender: string; // From dispatch (exact match)
  subject: string; // From dispatch
  messagePreview: string; // First 200 chars of HTML
  templateUsed: string; // From dispatch templateKey
  payload: Json; // Original payload (for reference)
  provider: string; // "resend", "telegram", etc.
  providerResponse: Json; // Full provider response
  deliveryStatus: string; // "SENT", "FAILED", "PENDING"
  retryCount: number; // 0 for first attempt
  errorMessage?: string; // If failed
  createdAt: Date;
  sentAt?: Date; // If successful
  deliveredAt?: Date; // If confirmed delivered
  userId?: string; // If applicable
  organizationId?: string | null; // From dispatch
  correlationId: string; // From dispatch (trace ID)
}

interface LoggerOutput {
  logId: string;
  log: NotificationLog;
}

// Verify:
- log.eventName matches dispatch eventName
- log.channel matches dispatch channel
- log.recipient matches dispatch recipient (byte-for-byte)
- log.sender matches dispatch sender (byte-for-byte)
- log.organizationId matches dispatch organizationId (including null)
- log.correlationId matches dispatch correlationId (byte-for-byte)
- log.deliveryStatus is 'SENT' if successful
- log.providerResponse has provider ID (from Resend)
- log.createdAt is very recent (within 1 second)
- log.sentAt matches provider timestamp (approximately)
```

### Immutability Rules
- Once created, log is append-only (no updates)
- eventName, recipient, sender, organizationId, correlationId are final
- Cannot update log after created (enforce with DB constraints)

### Multi-Tenant Isolation
- Query logs for org-A returns only org-A's logs
- Query logs for org-B returns only org-B's logs
- Logs with organizationId=null (platform) appear separately
- Verify: No org can see another org's logs

---

## End-to-End: All Layers

### Complete Flow Contract

```
Layer 1 Output → Layer 2 Input
  ✓ correlationId preserved
  ✓ organizationId preserved

Layer 2 Output → Layer 3 Input
  ✓ correlationId preserved
  ✓ organizationId preserved
  ✓ eventName preserved

Layer 3 Output → Layer 4 Input
  ✓ correlationId preserved
  ✓ eventName preserved
  ✓ organizationId preserved

Layer 4 Output → Layer 5 Input
  ✓ correlationId preserved
  ✓ organizationId preserved
  ✓ eventName preserved

Layer 5 Output → Layer 6 Input
  ✓ correlationId preserved
  ✓ organizationId preserved
  ✓ sender preserved

Layer 6 Output → Layer 7 Input
  ✓ correlationId preserved
  ✓ organizationId preserved
  ✓ recipient preserved
  ✓ sender preserved

Layer 7 Output → Database
  ✓ correlationId in log
  ✓ organizationId in log
  ✓ recipient in log
  ✓ sender in log
  ✓ eventName in log
```

### Final Verification

After all layers complete:

```typescript
// Get final log from database
const finalLog = await prisma.notificationLog.findUnique({
  where: { id: logId }
});

// Verify against original event input
expect(finalLog.eventName).toBe(originalEvent.eventName);
expect(finalLog.organizationId).toBe(originalEvent.organizationId);
expect(finalLog.correlationId).toBe(traceId);
expect(finalLog.recipient).toBe(resolvedAudience.recipient.email);
expect(finalLog.sender).toBe(resolvedSender);
expect(finalLog.deliveryStatus).toBe('SENT' or 'FAILED');
```

---

## Using This Contract

### For Developers
1. Read the contract for your layer
2. Verify input matches expected shape
3. Produce output that matches specification
4. Ensure "Never Changes" values pass through

### For Testers
1. Read input validation section
2. Prepare test data matching input shape
3. Call component
4. Verify output matches output validation
5. Check "Never Changes" values

### For Debuggers
1. Read the layer's contract
2. Check: Did output match specification?
3. If no: Input wasn't shaped correctly (check previous layer)
4. If yes but value mutated: Defect in this layer

### For Code Reviewers
1. Does code enforce input validation?
2. Does code produce output matching specification?
3. Are "Never Changes" values protected?
4. Are there mutations outside defined transforms?

---

## Mutation Detection Rules

A value is **preserved** if:
- It enters the layer unchanged
- It exits the layer unchanged
- No bytes different

A value is **transformed** if:
- Input value transforms into output value
- Transform is intentional and documented
- Example: Template rendering ({{name}} → "John")

A value is **invalid** if:
- Input matches specification but output doesn't
- Or "Never Changes" value is different
- This signals a defect

---

## Testing Against This Contract

For each layer test:

```typescript
it('verifies contract input/output', async () => {
  // Setup: Prepare input matching InputSchema
  const input = { /* valid input */ };
  
  // Execute: Call component
  const output = await Component.execute(input);
  
  // Validate output schema
  expect(output).toMatchObject({
    field1: expect.any(String),
    field2: expect.any(Array),
    // ... all required fields
  });
  
  // Verify Never Changes
  expect(output.correlationId).toBe(input.correlationId);
  expect(output.organizationId).toBe(input.organizationId);
  
  // Check for unexpected mutations
  if (input.value !== output.value) {
    // Only ok if this mutation is documented
    expect(DOCUMENTED_MUTATIONS).toContain('value');
  }
});
```

---

## This Contract is Your Specification

Write code to pass this contract, not arbitrary requirements. The contract is the spec.

When issues arise in production, the contract lets you ask:
- "Which layer failed?"
- "What value changed?"
- "Why isn't it in the contract?"
- "Need to update contract?"

This turns debugging from guessing into precise diagnosis.
