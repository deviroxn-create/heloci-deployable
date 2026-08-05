# PHASE 5F — Notification Pipeline Map

Complete component-by-component responsibility matrix and data flow.

---

## Pipeline Overview

```
Entry
  ↓
notify(eventName, payload, senderIdentityId?)
  ├─ Resolve settings (notification channels, sender, templates)
  ├─ Resolve sender identity (if provided)
  └─ Branch: RuntimeOrchestrator.run() (new) OR legacy routing
       ↓
    RuntimeOrchestrator.runWithTrace(eventName, context)
       ├─ Stage 1: Build C.1 CommunicationRequest (initial)
       ├─ Stage 2: Call AudienceResolver → recipients
       ├─ Stage 3: Call CommunicationPlanner → plans
       ├─ Stage 4: Call TemplateResolver → templates
       └─ Stage 5: Call Dispatcher → dispatch requests
              ↓
    ProviderAdapter.send(context)
       ├─ Resend (email)
       ├─ Telegram (admin alerts)
       ├─ Internal (in-app notifications)
       └─ WhatsApp (placeholder)
              ↓
    NotificationLog.create()
       └─ Record delivery status
              ↓
    Return NotificationResult
```

---

## Component Reference

### 1. notify() Entry Point

**File:** `lib/notifications/notification.service.ts`

**Signature:**
```typescript
async function notify(
  eventName: NotificationEventName,
  payload: NotificationPayload = {},
  senderIdentityId?: string
): Promise<NotificationResult>
```

**Inputs:**
- `eventName` — Event being triggered (e.g., "user_registration", "application_approved")
- `payload` — User/context data (user email, application ID, org ID, etc.)
- `senderIdentityId` — Optional override for sender identity

**Outputs:**
- `NotificationResult` with:
  - `delivered: boolean` — Did at least one channel succeed?
  - `channels: NotificationChannel[]` — Channels that were attempted
  - `deliveryResults: []` — Per-channel results (success/error)

**Responsibilities:**
1. **Load settings** — Fetch enabled channels, sender defaults, telegram config
2. **Resolve sender identity** — If senderIdentityId provided, look up in DB
3. **Branch on runtime flag:**
   - If `NOTIFICATION_RUNTIME_DISABLED=true` → return empty
   - If event is in runtime-enabled set AND not disabled → Call `RuntimeOrchestrator.runWithTrace()`
   - Else → Use legacy routing (backward compatibility)
4. **Return results** — Delivery status for all attempted channels

**Dependencies:**
- `RuntimeOrchestrator` (new runtime path)
- `getNotificationSettings()` → Load from DB + environment
- `resolveSender()` → Query SenderIdentity table
- Prisma (database client)
- Provider adapters (Resend, Telegram, Internal)

**Data Mutations:**
- **YES** — Writes to:
  - `NotificationLog` (one record per send attempt)
  - `CommunicationTimelineEntry` (if userId provided)
- **Mutation Guards:**
  - All writes use `create()`, never `update()`
  - No deletes
  - All timestamps are server-generated
  - Timeline entries logged AFTER delivery (order matters for audit)

**Error Handling:**
- If settings fail to load → Return `{ delivered: false, reason: 'settings_unavailable' }`
- If sender resolution fails → Use fallback sender
- If provider fails → Log error, continue to next channel
- If all channels fail → Return `{ delivered: false, deliveryResults: [{success: false, error: ...}] }`

---

### 2. RuntimeOrchestrator

**File:** `lib/notifications/runtime/runtime-orchestrator.ts`

**Signature:**
```typescript
class RuntimeOrchestrator {
  static async run(
    eventName: string,
    context?: AudienceResolutionContext
  ): Promise<DispatchRequest[]>

  static async runWithTrace(
    eventName: string,
    context?: AudienceResolutionContext
  ): Promise<RuntimeTrace>
}
```

**Input Context (`AudienceResolutionContext`):**
```typescript
{
  organizationId?: string;    // Required for org-owned events
  userId?: string;            // User performing/affected by event
  userEmail?: string;         // User email (for lookups)
  recipientId?: string;       // Explicit recipient ID
  recipientEmail?: string;    // Explicit recipient email
  // ... plus event-specific fields
}
```

**Output (`RuntimeTrace`):**
```typescript
{
  eventName: string;
  audiences: Audience[];
  plans: CommunicationPlan[];
  resolutions: (TemplateResolution | UnresolvedTemplateResolution)[];
  dispatchRequests: DispatchRequest[];
}
```

**Responsibilities:**
1. **Generate trace ID** — Unique ID for this execution (for audit trail)
2. **Build stage 1 request** — Create C.1 `CommunicationRequest` with context
3. **Call AudienceResolver** — Get list of recipients and their roles
4. **Adapt to legacy format** — Convert C.1 Recipient[] → legacy Audience[] (temporary)
5. **Call CommunicationPlanner** — Select channels for each audience
6. **Call TemplateResolver** — Load templates
7. **Call Dispatcher** — Create dispatch requests
8. **Collect trace** — Record inputs/outputs from all stages
9. **Return trace** — All stages and dispatch requests

**Dependencies:**
- `AudienceResolver` (from C.1 contracts layer)
- `CommunicationPlanner` (channel selection)
- `TemplateResolver` (template loading)
- `Dispatcher` (dispatch request creation)

**Data Mutations:**
- **NO** — Pure function, returns new objects only

**Authorization Checks:**
- ⚠ **CRITICAL:** Requires `organizationId` in context
- **Exception:** User-only events (`user_registration`, `user_login`, etc.) don't need org
- If org-required but missing → Log error + return empty dispatch requests → Notification fails

**Tracing (NOTIFICATION_RUNTIME_TRACE=true):**
```
========== Notification Runtime (C.1 Integrated) ==========
EVENT: application_approved
Audiences:
applicant
org_admin

Plans:
applicant: email
org_admin: telegram

Templates:
applicant.application_approved.email -> template-123
org_admin.application_approved.telegram -> template-456

Dispatch:
applicant: email
org_admin: telegram
========================================================
```

---

### 3. AudienceResolver

**File:** `lib/communications/runtime/AudienceResolver.ts`

**Signature:**
```typescript
class AudienceResolver {
  static async resolve(
    request: CommunicationRequest
  ): Promise<AudienceResolvedRequest>
}
```

**Input (`CommunicationRequest`):**
```typescript
{
  context: { traceId, organizationId, userId, createdAt },
  event: "application_approved",  // CommunicationEvent enum
  eventPayload: {...},            // Frozen context object
  __stage: "initial"
}
```

**Output (`AudienceResolvedRequest`):**
```typescript
{
  context: {...},
  event: "application_approved",
  eventPayload: {...},
  recipients: [
    { id: "user-123", email: "john@ex.com", role: "applicant", name: "John" },
    { id: "admin-456", email: "admin@org.com", role: "org_admin", name: "Org Admin" }
  ],
  __stage: "audience_resolved"
}
```

**Responsibilities:**
1. **Lookup event definition** — Get event from registry (who should receive this?)
2. **Resolve recipients** — Based on event + context:
   - For `application_approved`:
     - Recipient: Applicant (userId from context)
     - Recipients: Org admins (organizationId from context)
     - Optional: Case worker (if applicationId provided and case assigned)
3. **Query database** — Look up user emails, admin list, etc.
4. **Validate recipients** — Email format, not null, not duplicates
5. **Freeze recipients** — Make list immutable (Object.freeze)
6. **Return stage 2 request** — With recipients populated

**Dependencies:**
- Event registry (communication-registry.md)
- Database (Prisma) — User, Organization, OrganizationMember tables
- Recipient validator

**Data Mutations:**
- **NO** — Reads only

**Authorization Checks:**
- For org-owned events: Verify organizationId provided
- For user-owned events: User context optional

**Error Handling:**
- Missing required context → Return empty recipients (will fail downstream)
- DB query fails → Log error, return empty recipients
- Email validation fails → Filter out invalid recipient

---

### 4. CommunicationPlanner

**File:** `lib/notifications/runtime/communication-planner.ts`

**Signature:**
```typescript
class CommunicationPlanner {
  plan(
    eventName: string,
    audiences: Audience[]
  ): CommunicationPlan[]
}
```

**Input:**
- Event name (e.g., "application_approved")
- Audiences (e.g., [{ role: "applicant" }, { role: "org_admin" }])

**Output (`CommunicationPlan[]`):**
```typescript
[
  { audience: "applicant", channel: "email", priority: 1 },
  { audience: "org_admin", channel: "telegram", priority: 2 }
]
```

**Responsibilities:**
1. **Load event definition** — What channels are valid for this event?
2. **For each audience:**
   - Select primary channel (applicants → email, admins → telegram)
   - Check notification preferences (org/user overrides)
   - Determine priority
3. **Return plans** — Ordered by priority (email before telegram)

**Dependencies:**
- Event registry (defines valid channels per event)
- NotificationPreference table (user/org/global preferences)

**Data Mutations:**
- **NO** — Pure function

**Channel Selection Logic Example:**
```
event = "application_approved"
audience = "applicant"
  → Check NotificationPreference for (applicant, application_approved, *)
  → If preference exists: use preferred channels
  → Else: Default to ["email"]

audience = "org_admin"
  → Check NotificationPreference for (org_admin, application_approved, *)
  → If preference exists: use preferred channels
  → Else: Default to ["telegram", "email"] (fallback to email if telegram unconfigured)
```

---

### 5. TemplateResolver

**File:** `lib/notifications/runtime/template-resolver.ts`

**Signature:**
```typescript
class TemplateResolver {
  resolve(
    plan: CommunicationPlan
  ): TemplateResolution | UnresolvedTemplateResolution
}
```

**Input (`CommunicationPlan`):**
```typescript
{
  audience: "applicant",
  channel: "email",
  priority: 1
}
```

**Output (`TemplateResolution`):**
```typescript
{
  audience: "applicant",
  channel: "email",
  event: "application_approved",
  templateKey: "applicant.application_approved.email",
  subject: "Your application has been approved",
  html: "<div>Congratulations...</div>",
  plainText: "Congratulations..."
}
```

**Responsibilities:**
1. **Build template key** — `${audience}.${event}.${channel}`
2. **Query database:**
   ```sql
   SELECT * FROM NotificationTemplate
   WHERE eventName = ?
   AND channel = ?
   AND (organizationId = ? OR organizationId IS NULL)
   AND active = true
   ORDER BY organizationId DESC, version DESC
   LIMIT 1
   ```
3. **Template priority:**
   - Org-specific first (organizationId = given org)
   - Then platform (organizationId = null)
   - Then hardcoded fallback
4. **Return template** — Raw (not yet rendered with variables)

**Dependencies:**
- Database (NotificationTemplate)
- Fallback templates (hardcoded in code)

**Data Mutations:**
- **NO** — Reads only

**Example Queries:**
```
Event: application_approved
Organization: org-housing-authority
Audience: applicant
Channel: email

Query 1: organizationId='org-housing-authority', eventName='application_approved', channel='email'
  → Found: Org-specific template
  → Return (stop searching)

Query 2 (if Query 1 fails): organizationId=NULL, eventName='application_approved', channel='email'
  → Found: Platform template
  → Return

Query 3 (if Query 2 fails): Use hardcoded template
  ```

---

### 6. Dispatcher

**File:** `lib/notifications/runtime/dispatcher.ts`

**Signature:**
```typescript
class Dispatcher {
  dispatch(
    resolution: TemplateResolution
  ): DispatchRequest
}
```

**Input (`TemplateResolution`):**
```typescript
{
  audience: "applicant",
  channel: "email",
  event: "application_approved",
  templateKey: "applicant.application_approved.email",
  subject: "...",
  html: "...",
  plainText: "..."
}
```

**Output (`DispatchRequest`):**
```typescript
{
  audienceRole: "applicant",
  channel: "email",
  recipientId: "user-123",
  recipient: "john@example.com",
  templateKey: "applicant.application_approved.email",
  sender: "noreply@housing-org.gov",
  senderName: "Housing Authority",
  replyTo: "support@housing-org.gov"
}
```

**Responsibilities:**
1. **Resolve recipient email** — From template resolution's audience
2. **Resolve sender email** — From organization or platform config
3. **Validate sender** — Must be verified with email provider
4. **Create dispatch request** — Ready to pass to provider
5. **Return request** — All info needed to send

**Dependencies:**
- Sender identity resolution (SenderIdentity table)
- Template resolution (has audience/recipient info)

**Data Mutations:**
- **NO** — Pure function

**Sender Resolution:**
1. Get audience recipient email
2. Query organization for default SenderIdentity
3. If not set: Use platform fallback `support@heloci.us`
4. Validate sender verified with Resend (check SenderIdentity.isVerified)
5. If not verified: Use fallback `support@heloci.us`

---

### 7. ProviderAdapter (Resend Example)

**File:** `lib/notifications/provider-adapters.ts` → `createEmailProvider()`

**Signature:**
```typescript
interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(context: ProviderSendContext): Promise<NotificationDeliveryResult>;
  validate?(): Promise<boolean>;
  health?(): Promise<{ healthy: boolean; detail?: string }>;
  test?(context: ProviderSendContext): Promise<NotificationDeliveryResult>;
}

async function send(context: ProviderSendContext): Promise<NotificationDeliveryResult>
```

**Input (`ProviderSendContext`):**
```typescript
{
  channel: "email",
  eventName: "application_approved",
  recipient: "john@example.com",
  sender: "noreply@housing-org.gov",
  senderName: "Housing Authority",
  replyTo: "support@housing-org.gov",
  subject: "Your application has been approved",
  message: "Congratulations...",
  html: "<div>Congratulations...</div>",
  payload: {...} // Full event payload for provider-specific logic
}
```

**Output (`NotificationDeliveryResult`):**
```typescript
{
  status: "SENT" | "FAILED" | "PENDING",
  providerResponse?: { id: "email-123-abc", ... },
  errorMessage?: "Resend API key missing"
}
```

**Responsibilities (Resend):**
1. **Validate configuration:**
   - `RESEND_API_KEY` set?
   - `context.sender` verified with Resend?
2. **Build Resend request:**
   ```json
   {
     "from": "Housing Authority <noreply@housing-org.gov>",
     "to": "john@example.com",
     "replyTo": "support@housing-org.gov",
     "subject": "Your application has been approved",
     "html": "<div>...</div>"
   }
   ```
3. **Call Resend API:**
   ```
   POST https://api.resend.com/emails
   ```
4. **Parse response:**
   - Success: `{ data: { id: "..." }, error: null }` → Return `{ status: "SENT", providerResponse: {...} }`
   - Error: `{ data: null, error: { message: "..." } }` → Return `{ status: "FAILED", errorMessage: "..." }`
5. **Return result** — Status and provider response

**Dependencies:**
- `RESEND_API_KEY` environment variable
- Resend SDK (`npm install resend`)

**Data Mutations:**
- **NO** — External API call only

**Sender Resolution Priority:**
```
1. context.sender (from Dispatcher, highest priority) ✓
2. settings.senderEmail (from organization config) ✓
3. support@heloci.us (verified Heloci domain) ✓
4. NEVER: COMMUNICATION_SENDER_EMAIL env var (unverified) ✗
```

**Error Scenarios:**
- API key missing → `{ status: "FAILED", errorMessage: "Resend is not configured..." }`
- Sender not verified → `{ status: "FAILED", errorMessage: "No verified email sender..." }`
- Recipient invalid → `{ status: "FAILED", errorMessage: "Invalid recipient..." }`
- Network timeout → `{ status: "FAILED", errorMessage: "Request timeout..." }`
- Rate limited → `{ status: "FAILED", errorMessage: "Rate limited..." }` (retryable)

---

### 8. NotificationLog (Database)

**File:** `prisma/schema.prisma`

**Schema:**
```prisma
model NotificationLog {
  id                String                     @id @default(cuid())
  eventName         String                     // Event that triggered this notification
  channel           String                     // "email", "telegram", "internal"
  recipient         String?                    // Recipient email/ID
  sender            String?                    // Sender email
  subject           String?                    // Email subject
  messagePreview    String?                    // First 200 chars of message
  templateUsed      String?                    // Template ID used
  payload           Json?                      // Full event payload
  provider          String?                    // "resend", "telegram", etc.
  providerResponse  Json?                      // Response from provider
  deliveryStatus    NotificationDeliveryStatus // SENT, FAILED, PENDING, QUEUED
  retryCount        Int                        @default(0)
  errorMessage      String?
  createdAt         DateTime                   @default(now())
  sentAt            DateTime?
  deliveredAt       DateTime?
  readAt            DateTime?
  userId            String?
  senderIdentityId  String?
  user              User?                      @relation(fields: [userId], references: [id])
  senderIdentity    SenderIdentity?            @relation("NotificationSenders", fields: [senderIdentityId], references: [id], onDelete: SetNull)
}
```

**Responsibilities:**
1. **Record every send attempt** — Success or fail
2. **Store provider response** — For debugging
3. **Enable audit trail** — Who, what, when
4. **Support retry tracking** — retryCount + nextRetryAt
5. **Enable dashboard queries** — Delivery status per org/event

**Data Mutations:**
- **YES** — Writes new records (creates only, no deletes)
- **Mutation Guards:**
  - Always uses `create()`, never `update()`
  - Once created, data is immutable (append-only log)
  - Future: Implement immutable log pattern (no updates after created)

**Queries (Phase 5F Certification):**
```sql
-- Find latest notification log for event
SELECT * FROM NotificationLog
WHERE eventName = 'user_registration'
ORDER BY createdAt DESC
LIMIT 1

-- Check delivery status
SELECT deliveryStatus, COUNT(*) as count
FROM NotificationLog
WHERE eventName = 'application_approved'
AND createdAt > now() - interval '24 hours'
GROUP BY deliveryStatus

-- Audit trail for org
SELECT id, eventName, channel, recipient, deliveryStatus, createdAt
FROM NotificationLog
WHERE senderIdentityId IN (
  SELECT id FROM SenderIdentity WHERE organizationId = 'org-123'
)
ORDER BY createdAt DESC
```

---

## Data Flow Example: application_approved

```
Context (input to notify()):
{
  userId: "user-123",
  applicationId: "app-456",
  organizationId: "org-housing-authority",
  applicationStatus: "approved"
}

↓ notify()

Stage 1: Initial Request
{
  context: { organizationId: "org-housing-authority", userId: "user-123", ... },
  event: "application_approved",
  eventPayload: {...},
  __stage: "initial"
}

↓ AudienceResolver.resolve()

Stage 2: Audience Resolved
recipients: [
  { id: "user-123", email: "john@example.com", role: "applicant" },
  { id: "admin-456", email: "admin@org.gov", role: "org_admin" }
]

↓ CommunicationPlanner.plan()

Stage 3: Plans
[
  { audience: "applicant", channel: "email", priority: 1 },
  { audience: "org_admin", channel: "telegram", priority: 2 }
]

↓ TemplateResolver.resolve() (for each plan)

Stage 4: Templates
[
  { templateKey: "applicant.application_approved.email", subject: "Approved!", html: "..." },
  { templateKey: "org_admin.application_approved.telegram", template: "..." }
]

↓ Dispatcher.dispatch() (for each template)

Stage 5: Dispatch Requests
[
  { recipientId: "user-123", recipient: "john@example.com", channel: "email", sender: "noreply@org.gov" },
  { recipientId: "admin-456", recipient: "admin@org.gov", channel: "telegram", sender: "Org Admin Bot" }
]

↓ ProviderAdapter.send() (for each dispatch request)

Stage 6: Provider Calls
[
  { status: "SENT", providerResponse: { id: "email-123" } },
  { status: "SENT", providerResponse: { ok: true } }
]

↓ NotificationLog.create() (for each send)

Stage 7: Audit Trail
[
  { id: "log-111", eventName: "application_approved", recipient: "john@example.com", deliveryStatus: "SENT" },
  { id: "log-222", eventName: "application_approved", recipient: "admin@org.gov", deliveryStatus: "SENT" }
]

↓ Return NotificationResult

{
  delivered: true,
  channels: ["email", "telegram"],
  deliveryResults: [
    { channel: "email", success: true, recipient: "j***@ex.com" },
    { channel: "telegram", success: true, recipient: "a***@org.gov" }
  ]
}
```

---

## Invariants (Must Always Be True)

1. **Immutability:** No stage mutates its input
2. **Isolation:** Organization data never leaks between orgs
3. **Sender verification:** Only verified senders used
4. **Audit trail:** Every send logged in NotificationLog
5. **Idempotency:** Sending same request twice produces same result (modulo IDs)
6. **Failure handling:** Partial failures don't crash entire pipeline

---

## Related Documents

- `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` — Certification guide
- `.kiro/PHASE-5F-OWNERSHIP-MATRIX.md` — Event ownership rules
- `.kiro/communication-registry.md` — Event definitions
- `prisma/schema.prisma` — Database schema
