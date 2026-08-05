# PHASE 5F — Runtime Pipeline Certification

## Goal
Certify one notification from start to finish.

Not hundreds. Not production traffic. Not historical logs. 

**One notification.**

---

## What We're Proving

When a user registers, we answer these questions with **evidence**:

```
User registers
       ↓
    notify(...)
       ↓
RuntimeOrchestrator
       ↓
AudienceResolver
       ↓
CommunicationPlanner
       ↓
TemplateResolver
       ↓
Dispatcher
       ↓
ProviderAdapter (Resend)
       ↓
NotificationLog
```

At **every stage**, we verify:
- ✓ Event name
- ✓ Organization ID
- ✓ Audience
- ✓ Recipient
- ✓ Sender
- ✓ Template
- ✓ Channel
- ✓ Correlation ID

**If one value changes unexpectedly, we've found the defect.**

---

## Deliverable 1: Runtime Trace

For a single `user_registration` event, we produce a structured trace:

```yaml
TRACE_ID: trace-1722954321-abc123def

EVENT: user_registration
STAGE: initial
  Input:
    context:
      organizationId: null (platform-level event)
      userId: user-123
      traceId: trace-1722954321-abc123def

STAGE: audience_resolved
  Output:
    recipients: 
      - id: user-123
        email: john@example.com
        role: applicant
        name: John Doe

STAGE: planned
  Output:
    plans:
      - audience: applicant
        channel: email
        priority: 1

STAGE: templates_resolved
  Output:
    templates:
      - key: applicant.user_registration.email
        channel: email
        subject: Welcome to Heloci
        html: <div>...</div>

STAGE: dispatcher
  Output:
    dispatchRequests:
      - audienceRole: applicant
        channel: email
        recipientId: user-123
        recipient: john@example.com
        templateKey: applicant.user_registration.email
        sender: support@heloci.us
        senderName: Heloci

STAGE: provider_adapter
  Output:
    providerName: resend
    requestPayload:
      from: "Heloci <support@heloci.us>"
      to: "john@example.com"
      subject: "Welcome to Heloci"
      html: "<div>...</div>"

STAGE: notification_log
  Output:
    logId: log-456
    eventName: user_registration
    channel: email
    recipient: john@example.com
    sender: support@heloci.us
    subject: "Welcome to Heloci"
    templateUsed: applicant.user_registration.email
    deliveryStatus: SENT
    createdAt: 2024-01-10T14:35:21Z
    sentAt: 2024-01-10T14:35:25Z
```

### Why This Matters

Each stage's **output becomes the next stage's input**. If a value mutates or disappears, we know:
- What changed
- At which stage
- Root cause location

Example: If recipient mutates from `john@example.com` → `admin@example.com` between AudienceResolver and Dispatcher, we know the defect is in CommunicationPlanner or TemplateResolver.

---

## Deliverable 2: Notification Pipeline Map

**Component-by-component responsibility matrix:**

### notify()
**File:** `lib/notifications/notification.service.ts`
**Role:** Entry point, settings resolution, legacy routing
**Input:**
- `eventName: NotificationEventName`
- `payload: NotificationPayload` (user data, context)
- `senderIdentityId?: string` (optional override)

**Output:**
- `NotificationResult` with channels and delivery results

**Responsibilities:**
1. Load notification settings
2. Resolve sender identity from database (if senderIdentityId provided)
3. Branch: use RuntimeOrchestrator (new) OR legacy routing (old)
4. Return delivery results

**Dependencies:**
- `RuntimeOrchestrator`
- `getNotificationSettings()`
- `resolveSender()` (from sender-identity.service)
- Database (Prisma)
- Provider adapters (Resend, Telegram, Internal)

**Can mutate data?** YES
- Writes to `NotificationLog`
- Writes to `CommunicationTimelineEntry`

**Mutation guards:**
- ✓ All writes use `Prisma.create()`, not update
- ✓ No deletes or updates to existing records
- ⚠ Timeline entries logged AFTER delivery, not before (order matters for audit)

---

### RuntimeOrchestrator
**File:** `lib/notifications/runtime/runtime-orchestrator.ts`
**Role:** Orchestrate 4-stage pipeline (audience → plan → template → dispatch)
**Input:**
- `eventName: string`
- `context?: AudienceResolutionContext` (org, user, recipient IDs)

**Output:**
- `RuntimeTrace` with audiences, plans, resolutions, dispatchRequests
- **OR** `DispatchRequest[]` (via `run()` method)

**Responsibilities:**
1. Generate trace ID
2. Build C.1 `CommunicationRequest` (stage 1: initial)
3. Call `AudienceResolver.resolve()` → stage 2
4. Adapt recipients to legacy Audience format (temporary)
5. Call `CommunicationPlanner.plan()` → stage 3
6. Call `TemplateResolver.resolve()` → stage 4
7. Call `Dispatcher.dispatch()` → dispatch requests
8. Return trace with all stages

**Dependencies:**
- `AudienceResolver` (from C.1 contracts)
- `CommunicationPlanner`
- `TemplateResolver`
- `Dispatcher`

**Can mutate data?** NO (pure function, returns new objects)

**Authorization checks:**
- ⚠ Requires `organizationId` in context (EXCEPT for user-only events)
- ⚠ User-only events: `user_registration`, `user_login`, `user_password_reset`

---

### AudienceResolver
**File:** `lib/communications/runtime/AudienceResolver.ts`
**Role:** Resolve recipient list from event context
**Input:**
- `request: CommunicationRequest` (stage 1 initial request)

**Output:**
- `AudienceResolvedRequest` with `recipients: Recipient[]`

**Responsibilities:**
1. Extract event from request
2. Load event definition from registry
3. Resolve recipients based on event type and context
4. Validate each recipient (email, ID, role)
5. Return recipients frozen (immutable)

**Dependencies:**
- Communication registry (`communication-registry.md`)
- Database (for lookups: user email, org admins, staff)
- Event definitions

**Can mutate data?** NO (reads only, returns frozen objects)

**Critical Path:**
- `user_registration` event → Recipient is user being registered (no org yet)
- `application_submitted` event → Recipients: applicant + org admins
- `application_approved` event → Recipients: applicant + case worker + org admins

---

### CommunicationPlanner
**File:** `lib/notifications/runtime/communication-planner.ts`
**Role:** Select channel(s) for each audience
**Input:**
- `eventName: string`
- `audiences: Audience[]` (from AudienceResolver)

**Output:**
- `CommunicationPlan[]` with audience, channel, priority

**Responsibilities:**
1. For each audience, select appropriate channel
2. Apply preferences (email for applicants, telegram for admins)
3. Return plans in priority order

**Dependencies:**
- Event definitions (what channels are valid per event)
- Notification preferences (org/user overrides)

**Can mutate data?** NO (pure function)

**Channel Selection Logic:**
```
if event is "application_approved":
  if audience is "applicant":
    channel = "email" (high priority)
  if audience is "org_admin":
    channel = "telegram" (low priority)
    OR fallback to "email" if telegram unconfigured
```

---

### TemplateResolver
**File:** `lib/notifications/runtime/template-resolver.ts`
**Role:** Load template for audience + event + channel
**Input:**
- `plan: CommunicationPlan` (audience, channel, event)

**Output:**
- `TemplateResolution` with templateKey, subject, html, plainText

**Responsibilities:**
1. Resolve template key: `${audience}.${event}.${channel}`
2. Query database for template
3. If not found, use hardcoded fallback
4. Return template (NOT rendered yet, raw variables intact)

**Dependencies:**
- Database (`NotificationTemplate`)
- Fallback templates (in code)

**Can mutate data?** NO (reads only)

**Template Priority:**
1. Org-specific template: `organizationId == context.org AND eventName AND channel AND active`
2. Platform template: `organizationId == null AND eventName AND channel AND active`
3. Hardcoded fallback (defined in code)

---

### Dispatcher
**File:** `lib/notifications/runtime/dispatcher.ts`
**Role:** Create dispatch request (almost-ready-to-send)
**Input:**
- `resolution: TemplateResolution` (template + audience + channel)

**Output:**
- `DispatchRequest` with recipient, sender, template, channel

**Responsibilities:**
1. Resolve actual recipient email/ID (from template resolution audience)
2. Resolve sender email/identity (from org or platform)
3. Create dispatch request with all needed info
4. Return request ready for provider

**Dependencies:**
- Sender identity resolution (SenderIdentity table)

**Can mutate data?** NO (pure function)

**Critical Rule:**
- Recipient MUST match audience from AudienceResolver
- Sender MUST be verified with Resend (or fallback to support@heloci.us)

---

### ProviderAdapter (Resend)
**File:** `lib/notifications/provider-adapters.ts` (createEmailProvider)
**Role:** Actually send email via Resend API
**Input:**
- `context: ProviderSendContext` with recipient, subject, html, sender

**Output:**
- `NotificationDeliveryResult` with status (SENT, FAILED, PENDING)

**Responsibilities:**
1. Validate Resend API key configured
2. Validate sender email verified
3. Build Resend request payload
4. Call Resend API
5. Parse response (success or error)
6. Return result

**Dependencies:**
- `RESEND_API_KEY` environment variable
- Resend SDK (`npm install resend`)

**Can mutate data?** NO (external API call, returns status)

**Sender Resolution Priority:**
1. `context.sender` (from Dispatcher, highest priority)
2. `settings.senderEmail` (from org config)
3. `support@heloci.us` (fallback verified domain)
4. **NEVER** use `COMMUNICATION_SENDER_EMAIL` env var directly

---

### NotificationLog
**File:** `prisma/schema.prisma` model
**Role:** Persistent audit trail of every notification attempt
**Input:**
- Event name, channel, recipient, sender, template, payload, provider response

**Output:**
- Database record with ID and timestamps

**Responsibilities:**
1. Store every send attempt (success or fail)
2. Record provider response (Resend ID or error)
3. Enable audit trail (who, what, when)

**Dependencies:**
- Prisma ORM

**Can mutate data?** YES
- Creates new `NotificationLog` records
- Later updates status (QUEUED → SENT or FAILED)

**Mutation guards:**
- ✓ Always creates, never deletes historical records
- ✓ Updates only status/providerResponse/sentAt, not core data
- ⚠ Future: Cannot update after created (append-only log)

---

## Deliverable 3: Ownership Matrix

This is the rulebook for every future notification.

| Event | Owner | Sender | Template | Retry | Audience |
|-------|-------|--------|----------|--------|----------|
| `user_registration` | Platform | `support@heloci.us` | Platform | Yes (3x) | Applicant |
| `user_login` | Platform | `support@heloci.us` | Platform | No | None (internal only) |
| `password_reset` | Platform | `support@heloci.us` | Platform | Yes (3x) | User |
| `application_submitted` | Organization | Org sender | Organization | Yes (5x) | Applicant + Org Admins |
| `application_approved` | Organization | Org sender | Organization | Yes (5x) | Applicant + Case Worker + Org Admins |
| `application_rejected` | Organization | Org sender | Organization | Yes (5x) | Applicant |
| `application_under_review` | Organization | Org sender | Organization | No | Applicant |
| `documents_requested` | Organization | Org sender | Organization | Yes (5x) | Applicant |
| `document_approved` | Organization | Org sender | Organization | Yes (5x) | Applicant |
| `staff_invited` | Organization | Platform `support@heloci.us` | Platform | Yes (3x) | Staff User |
| `staff_removed` | Organization | Platform | Platform | No | Staff User |
| `program_published` | Organization | Org sender | Organization | No | Eligible Applicants (batch) |
| `case_note_added` | Organization | Org sender | Organization | No | Assigned Staff |

### Rules

**Owner = Platform:**
- No organizationId needed in context
- Sender is always `support@heloci.us`
- Template is hardcoded or global platform template

**Owner = Organization:**
- organizationId MUST be in context (authorization)
- Sender resolves from SenderIdentity of organization
- Template can be org-specific or platform fallback

**Retry Policy:**
- `Yes (3x)` = Retry up to 3 times on transient failure (Phase 6)
- `Yes (5x)` = Retry up to 5 times (higher importance)
- `No` = Don't retry (informational only)

**Audience:**
- Defines who receives the notification
- CommunicationPlanner selects channel(s) for each audience
- Can be organization-specific (e.g., org admins) or universal (applicant)

---

## Deliverable 4: Runtime Certification Report

After running the pipeline with tracing enabled, we generate a report like:

```
═════════════════════════════════════════════════════════════════
RUNTIME CERTIFICATION REPORT
═════════════════════════════════════════════════════════════════

EVENT: user_registration
TRACE_ID: trace-1722954321-abc123def
TIMESTAMP: 2024-01-10T14:35:21Z

───────────────────────────────────────────────────────────────

STAGE 1: INITIAL REQUEST
Input: 
  organizationId: null
  userId: user-123
  traceId: trace-1722954321-abc123def
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 2: AUDIENCE RESOLUTION
Input Recipients:
  - user-123 (applicant, john@example.com)
Output Recipients:
  - user-123 (applicant, john@example.com)
Mutations: NONE
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 3: COMMUNICATION PLANNING
Input Audiences:
  - applicant
Output Plans:
  - audience: applicant
    channel: email
    priority: 1
Mutations: NONE
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 4: TEMPLATE RESOLUTION
Input Template Key: applicant.user_registration.email
Database Query: 
  SELECT * FROM NotificationTemplate 
  WHERE eventName='user_registration' 
    AND channel='email' 
    AND (organizationId IS NULL OR organizationId='...')
    AND active=true
Found Template:
  - id: template-789
  - subject: "Welcome to Heloci"
  - html: "<div>Welcome {{name}}!</div>"
  - organizationId: null (platform)
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 5: DISPATCHER
Input Dispatch Plan:
  - audience: applicant
    recipient: john@example.com
    template: template-789
Output Dispatch Request:
  - audienceRole: applicant
    recipientId: user-123
    recipient: john@example.com
    templateKey: applicant.user_registration.email
    sender: support@heloci.us
    channel: email
Mutations: NONE
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 6: PROVIDER ADAPTER (RESEND)
Input:
  recipient: john@example.com
  sender: support@heloci.us
  subject: "Welcome to Heloci"
  html: "<div>Welcome John!</div>"
Resend API Call:
  POST https://api.resend.com/emails
  Payload: {...}
Resend Response:
  Status: 200
  Data: { id: "email-123-abc", email: "john@example.com" }
Output:
  - status: SENT
  - providerResponse: { id: "email-123-abc" }
Mutations: NONE (external API)
Status: ✓ PASS

───────────────────────────────────────────────────────────────

STAGE 7: NOTIFICATION LOG
Input: 
  eventName: user_registration
  channel: email
  recipient: john@example.com
  sender: support@heloci.us
  templateUsed: applicant.user_registration.email
  deliveryStatus: SENT
Database Write:
  INSERT INTO NotificationLog (...)
  Result: logId = log-456
Output:
  - logId: log-456
  - sentAt: 2024-01-10T14:35:25Z
Mutations: YES (expected)
Status: ✓ PASS

═════════════════════════════════════════════════════════════════

FINAL CERTIFICATION CHECKLIST
═════════════════════════════════════════════════════════════════

✓ Event name preserved           (user_registration → user_registration)
✓ Organization ID preserved      (null → null, user-only event)
✓ Audience preserved             (applicant → applicant)
✓ Recipient preserved            (user-123 → john@example.com)
✓ Sender preserved               (support@heloci.us → support@heloci.us)
✓ Template preserved             (applicant.user_registration.email)
✓ Channel preserved              (email → email)
✓ Correlation ID preserved       (trace-123... → trace-123...)
✓ No unexpected mutations         (only NotificationLog write)
✓ Provider response logged        (resendId recorded)
✓ Audit trail complete           (all stages traced)

═════════════════════════════════════════════════════════════════

CERTIFICATION RESULT: ✓ PASSED

No defects detected in pipeline.

Next Steps:
1. Repeat for "application_approved" (org-owned, with org sender)
2. Repeat for "documents_requested" (org-owned, multiple audiences)
3. Update Ownership Matrix based on findings
4. Freeze notifications pending Phase 6 (async infrastructure)

═════════════════════════════════════════════════════════════════
```

---

## How to Run PHASE 5F

### Step 1: Add Trace Helper
Create `lib/notifications/runtime/trace-recorder.ts`:

```typescript
export interface TraceStep {
  stage: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number; // ms
  mutations: string[]; // what changed
  status: 'pass' | 'fail';
  errorMessage?: string;
}

export class TraceRecorder {
  private steps: TraceStep[] = [];
  private traceId: string;

  constructor(traceId: string) {
    this.traceId = traceId;
  }

  recordStep(step: TraceStep) {
    this.steps.push(step);
  }

  getReport() {
    return {
      traceId: this.traceId,
      timestamp: new Date().toISOString(),
      steps: this.steps,
      passed: this.steps.every(s => s.status === 'pass'),
    };
  }
}
```

### Step 2: Add Trace Instrumentation

Modify `RuntimeOrchestrator.runWithTrace()` to record each stage:

```typescript
recordAudienceResolution(tracer, input, output) {
  tracer.recordStep({
    stage: 'audience_resolution',
    input: { eventName: input.event, audiences: input.audiences?.length || 0 },
    output: { recipients: output.recipients.map(r => r.email) },
    duration: endTime - startTime,
    mutations: [],
    status: output.recipients.length > 0 ? 'pass' : 'fail',
  });
}
```

### Step 3: Test with One Event

Write integration test `tests/phase-5f-certification.test.ts`:

```typescript
import { notify } from '@/lib/notifications/notification.service';

describe('PHASE 5F — Runtime Certification', () => {
  it('user_registration: trace and certify', async () => {
    const payload = {
      userId: 'test-user-123',
      userEmail: 'john@example.com',
      name: 'John Doe',
    };

    const result = await notify('user_registration', payload);

    // Assertions
    expect(result.delivered).toBe(true);
    expect(result.channels).toContain('email');
    expect(result.deliveryResults[0].success).toBe(true);

    // Check NotificationLog
    const log = await prisma.notificationLog.findFirst({
      where: { eventName: 'user_registration' },
      orderBy: { createdAt: 'desc' },
    });

    expect(log).toBeDefined();
    expect(log.recipient).toBe('john@example.com');
    expect(log.deliveryStatus).toBe('SENT');
  });
});
```

### Step 4: Enable Trace Output

Set environment variable:

```bash
NOTIFICATION_RUNTIME_TRACE=true npm run test
```

This triggers all `console.log` statements in the pipeline to output structured traces.

### Step 5: Generate Report

Write report to file:

```bash
npm run test 2>&1 | tee tests/phase-5f-trace-output.txt
```

Parse the output and generate `PHASE-5F-CERTIFICATION-REPORT.md`.

---

## Success Criteria

✓ All 4 deliverables completed
✓ One event traced end-to-end
✓ No mutations outside expected points
✓ NotificationLog matches ProviderAdapter response
✓ Trace reproducible (same input → same trace)
✓ Report published as evidence

---

## Next: Phase 6

Only after certification passes:

1. Implement job queue (Inngest or Trigger.dev)
2. Add retry logic (3x for low-priority, 5x for high-priority)
3. Implement dead letter queue
4. Add rate limiting per organization
5. Implement scheduled notifications

Each of these becomes trivial because we're building on a **certified pipeline**.

---

## Files to Create / Modify

**Create:**
- `lib/notifications/runtime/trace-recorder.ts`
- `tests/phase-5f-certification.test.ts`
- `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` (this file)
- `.kiro/PHASE-5F-CERTIFICATION-REPORT.md` (after running test)
- `.kiro/PHASE-5F-PIPELINE-MAP.md` (pipeline component documentation)
- `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` (event ownership rules)

**Modify:**
- `lib/notifications/runtime/runtime-orchestrator.ts` (add tracing)
- `lib/notifications/notification.service.ts` (add tracing flags)
- Environment `.env.local` (add `NOTIFICATION_RUNTIME_TRACE=true`)

---

## Rationale

This phase doesn't ship features. It **proves correctness**.

By tracing a single notification:
- We understand the actual flow (vs. assumed flow)
- We find hidden mutations or data leaks
- We document responsibilities clearly
- We create an ownership matrix for governance
- We establish a baseline for Phase 6

Only then can we confidently add async infrastructure without debugging through layers.
