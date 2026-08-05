# PHASE C - SIX CERTIFICATION MODEL
## Rigorous Layer-by-Layer Architecture with Universal CommunicationRequest Contract

**Status:** ⏳ Ready for implementation  
**Model:** 6 sequential certifications with immutable contract  
**Production Rule:** All communications through CommunicationRequest contract only

---

## THE UNIVERSAL COMMUNICATION REQUEST CONTRACT

**This is the immutable contract that every communication passes through:**

```typescript
interface CommunicationRequest {
  // Identity & Tracing
  traceId: string;                    // Unique trace for this communication
  organizationId: string;             // Which organization (for isolation)
  userId?: string;                    // Who triggered this (audit)

  // Event Context
  event: string;                      // Domain event name: "application.submitted"
  eventPayload: Record<string, any>; // Business data from domain event

  // Recipients
  audience: AudienceRole[];           // "applicant" | "org_admin" | etc.
  recipients: Recipient[];            // [{id, email, channels, preferences}]
                                      // Produced by AudienceResolver

  // Channels & Planning
  channels: CommunicationChannel[];   // ["email", "telegram", "internal"]
  channelPlan: ChannelPlan[];         // [{channel, priority, fallback}]
                                      // Enriched by CommunicationPlanner

  // Template & Rendering
  template: {
    id: string;
    name: string;
    version: string;
    language: string;
  };
  rendered: {
    subject?: string;
    body: string;
    html?: string;
    plainText?: string;
  };
  variables: {
    substituted: Record<string, any>;
    missing: string[];
  };                                  // Produced by TemplateResolver

  // Metadata
  metadata?: Record<string, any>;     // Custom data for this communication
  priority?: "critical" | "high" | "normal" | "low";
  sendAt?: Date;                      // Scheduled send time (if delayed)
}
```

### CONTRACT RULES (IMMUTABLE):
- ✅ **Immutability:** Once created, only enriched (never modified)
- ✅ **Data Origin:** All data comes from registry or Heloci domain
- ✅ **No Payload Mutation:** Domain event payload is read-only
- ✅ **Traceability:** Every field traceable to its source
- ✅ **Provider Agnostic:** No provider-specific fields

---

## PHASE C.1 — AUDIENCE RESOLUTION CERTIFICATION

**Objective:** Verify every event correctly identifies WHO receives it

### Input to Certification
```typescript
{
  event: string;              // Domain event name
  eventPayload: object;       // Business data (read-only)
  organizationId: string;
  userId?: string;
}
```

### Output (into CommunicationRequest)
```typescript
{
  audience: AudienceRole[];   // Determined roles
  recipients: [
    {
      id: string;
      email: string;
      name?: string;
      role: AudienceRole;
      preferences: UserPreferences;
    }
  ];
}
```

### Certification Requirements

#### C.1.1: Applicant Resolution
- [ ] Applicant always resolved from eventPayload.userId
- [ ] Must find user in database
- [ ] Must include email address
- [ ] Test: application.submitted → finds applicant

#### C.1.2: Organization Admin Resolution
- [ ] Find all org_admin members for the organization
- [ ] Must find all active admins
- [ ] Handle org with no admins (graceful fail)
- [ ] Test: program.published → finds all org admins

#### C.1.3: Assigned Case Worker Resolution
- [ ] Find case worker assigned to application (if exists)
- [ ] Must read from application.assignedToId
- [ ] Handle unassigned case (no recipient)
- [ ] Test: documents.requested → finds assigned case worker

#### C.1.4: Assigned Reviewer Resolution
- [ ] Find reviewer assigned to review (if exists)
- [ ] Must read from review.reviewerId
- [ ] Handle no reviewer (graceful fail)
- [ ] Test: application.review.completed → finds assigned reviewer

#### C.1.5: Staff Role Resolution
- [ ] Find all staff members with specific role
- [ ] Support: org_admin, reviewer, case_worker, support
- [ ] Only active staff included
- [ ] Test: staff.invited → finds all recipients by role

#### C.1.6: Multiple Recipients Handling
- [ ] Applicant + org_admin (multiple roles)
- [ ] Deduplication (same person, multiple roles)
- [ ] Email deduplication (same person, different systems)
- [ ] Test: application.approved → applicant + org_admin + reviewer

#### C.1.7: No Payload-Driven Recipients
- ❌ NO dynamic recipient lists from eventPayload
- ❌ NO "recipient_email": "test@example.com" in payload
- ✅ Only hardcoded mappings: "applicant" → lookup user
- ✅ Only registry-defined audiences
- Test: Reject any event with recipient_list in payload

#### C.1.8: Heloci Domain Only
- ✅ All recipients from Heloci database
- ✅ All IDs are application/user/staff IDs
- ❌ NO external email lists
- ❌ NO third-party recipient sources
- Test: Verify all recipient IDs exist in database

### Certification Pass Criteria
- [ ] All 8 recipient types resolve correctly
- [ ] No hardcoded email addresses
- [ ] All recipients verified in database
- [ ] Deduplication working
- [ ] Handles missing recipients gracefully
- [ ] Zero external data sources
- [ ] Audit trail captures recipient resolution
- [ ] NotificationLog shows recipients

---

## PHASE C.2 — COMMUNICATION PLANNING CERTIFICATION

**Objective:** Verify every audience gets correct CHANNELS

### Input to Certification
```typescript
{
  event: string;
  audience: AudienceRole[];
  recipients: Recipient[];
  organizationId: string;
}
```

### Output (into CommunicationRequest)
```typescript
{
  channels: CommunicationChannel[];
  channelPlan: [
    {
      recipient: Recipient;
      primary: CommunicationChannel;
      fallbacks: CommunicationChannel[];
      disabled: CommunicationChannel[];
    }
  ];
}
```

### Certification Requirements

#### C.2.1: Registry-Based Channel Selection
- [ ] Look up event in Communication Registry
- [ ] Get channelsByAudience mapping
- [ ] Select channels for each recipient role
- [ ] Test: application.submitted → applicant: [email, internal], admin: [telegram, internal]

#### C.2.2: Organization Preference Filtering
- [ ] Load organization communication settings
- [ ] Respect org-level channel disabling
- [ ] Handle "telegram_disabled_for_org": true
- [ ] Test: Org disables telegram → no telegram channel

#### C.2.3: User Preference Override
- [ ] Load user communication preferences
- [ ] User can enable/disable channels
- [ ] User "preferred_channel_only" = true respects choice
- [ ] Test: User opts into email only → only email channel

#### C.2.4: Fallback Chain Definition
- [ ] Primary channel specified
- [ ] Fallback #1, #2, #3 in order
- [ ] Fallback triggers on primary failure
- [ ] Test: Primary telegram fails → try email → try internal

#### C.2.5: Channel Availability Check
- [ ] Email: Check provider API available
- [ ] Telegram: Check token configured
- [ ] Internal: Always available
- [ ] WhatsApp: Check implementation readiness
- [ ] Test: Telegram disabled → skip from plan

#### C.2.6: Multi-Channel Per Recipient
- [ ] Recipient may get email + internal + telegram
- [ ] Channels ordered by delivery priority
- [ ] No duplicate channels per recipient
- [ ] Test: application.approved → admin gets all 3 channels

#### C.2.7: No Hardcoded Channel Rules
- ❌ NO switch statements mapping recipients to channels
- ❌ NO hardcoded "if admin then telegram"
- ✅ ONLY registry channelsByAudience
- Test: All channels come from registry

#### C.2.8: Complete Channel Plan
- [ ] Every recipient has channel plan
- [ ] Every channel has primary + fallbacks
- [ ] No recipient without channels (graceful fail or error)
- [ ] Audit trail shows channel selection reason

### Certification Pass Criteria
- [ ] 100% of recipients have valid channel plan
- [ ] All channels from registry (no hardcoding)
- [ ] Organization preferences respected
- [ ] User preferences override registry
- [ ] Fallback chains complete
- [ ] Channel availability verified
- [ ] Zero payload-driven channel decisions
- [ ] NotificationLog captures channel plan



---

## PHASE C.3 — TEMPLATE RESOLUTION CERTIFICATION

**Objective:** Verify correct TEMPLATE selection, versioning, and rendering

### Input to Certification
```typescript
{
  event: string;
  channel: CommunicationChannel;
  language?: string;
  eventPayload: object;  // Read-only
}
```

### Output (into CommunicationRequest)
```typescript
{
  template: {
    id: string;
    name: string;
    version: string;
    language: string;
  };
  rendered: {
    subject?: string;
    body: string;
    html?: string;
    plainText?: string;
  };
  variables: {
    substituted: Record<string, any>;
    missing: string[];
  };
}
```

### Certification Requirements

#### C.3.1: Template Selection by Event + Channel
- [ ] Query: SELECT * WHERE event = "application_approved" AND channel = "email"
- [ ] Must find exactly one active template
- [ ] Must select latest version (status = PUBLISHED)
- [ ] Test: application.approved + email → correct template

#### C.3.2: Template Versioning
- [ ] Templates have versions (1.0, 1.1, 2.0, etc.)
- [ ] Track draft → active → archived lifecycle
- [ ] Can rollback to previous version if needed
- [ ] Test: Can deploy v2.0 and rollback to v1.5

#### C.3.3: Localization/Language Support
- [ ] Templates stored per language (en, es, fr, etc.)
- [ ] Accept language parameter
- [ ] Fall back to English (en) if language not available
- [ ] Test: French user → fr template or fallback to en

#### C.3.4: Variable Substitution
- [ ] Parse template for {{variableName}} patterns
- [ ] Look up value from eventPayload
- [ ] Handle missing variables (log warning, substitute empty or default)
- [ ] Support nested: {{user.name}}, {{application.programName}}
- [ ] Test: "Hello {{applicantName}}" + {applicantName: "Jane"} = "Hello Jane"

#### C.3.5: Missing Variables Handling
- [ ] Track substituted vs missing variables
- [ ] Log warning for each missing variable
- [ ] Decide: render empty, use default, or fail?
- [ ] Test: Template uses {{unknown}} → logs warning, renders empty

#### C.3.6: Multiple Format Rendering
- [ ] Email: Generate HTML, plain text, subject
- [ ] Telegram: Generate plain text only
- [ ] Internal: Generate HTML (can render rich UI)
- [ ] WhatsApp: Generate plain text only
- [ ] Test: One template → email (HTML + plaintext), telegram (plaintext)

#### C.3.7: No Hardcoded HTML
- ❌ NO inline HTML in code: `"<html><body>..."`
- ❌ NO string concatenation to build emails
- ✅ ONLY templates from database
- ✅ ONLY variable substitution
- Test: Reject any hardcoded HTML strings

#### C.3.8: Template Fallback
- [ ] If primary template missing → use fallback
- [ ] If all templates missing → raise error or use generic
- [ ] Decision: send with generic template or skip?
- [ ] Test: Missing template → use fallback or clear error

### Certification Pass Criteria
- [ ] 100% of events have active templates
- [ ] All templates follow naming convention
- [ ] Versioning system works (draft→active→archive)
- [ ] Localization fallback works
- [ ] All variables substituted or logged as missing
- [ ] Multiple formats rendered correctly
- [ ] Zero hardcoded HTML in application code
- [ ] Template fallback strategy defined
- [ ] NotificationLog shows template version used



---

## PHASE C.4 — DISPATCHER CERTIFICATION

**Objective:** Verify dispatcher is PROVIDER-AGNOSTIC (knows nothing about business domain)

### Input to Certification
```typescript
{
  recipient: {
    id: string;
    email: string;
    telegramChatId?: string;
  };
  channel: CommunicationChannel;
  rendered: {
    subject?: string;
    body: string;
    html?: string;
    plainText?: string;
  };
  metadata?: Record<string, any>;
}
```

### Output (to Provider Adapter)
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryTime: number;  // ms
  provider: string;
}
```

### Certification Requirements

#### C.4.1: Provider-Agnostic Input
- [ ] Dispatcher receives ONLY: recipient + channel + rendered content
- [ ] NO application context (app IDs, loan details, etc.)
- [ ] NO business logic (decisions, calculations)
- [ ] NO organization context
- [ ] Test: Pass dispatcher {channel: "email", body: "...", recipient: {email: "..."}}

#### C.4.2: Channel-to-Provider Routing
- [ ] Email channel → Email provider
- [ ] Telegram channel → Telegram provider
- [ ] Internal channel → Internal provider
- [ ] WhatsApp channel → WhatsApp provider
- [ ] Test: {channel: "email"} routes to email provider

#### C.4.3: No Provider SDK Calls
- ❌ NO direct Resend.emails.send()
- ❌ NO direct fetch() to Telegram API
- ✅ ONLY call provider adapter interface
- ✅ Provider adapter handles SDK calls
- Test: Reject direct SDK usage, require adapter abstraction

#### C.4.4: Idempotency Key Generation
- [ ] Generate unique idempotency key for each send attempt
- [ ] Use for deduplication if retry occurs
- [ ] Store in NotificationLog for tracking
- [ ] Test: Same message sent twice → idempotency prevents duplicate

#### C.4.5: Error Handling & Logging
- [ ] Catch provider errors
- [ ] Log error with context (recipient, channel, provider)
- [ ] Return structured error response
- [ ] Update NotificationLog with error
- [ ] Test: Provider fails → error logged, status = FAILED

#### C.4.6: Delivery Status Tracking
- [ ] Wait for provider response
- [ ] Capture delivery status (SENT, PENDING, FAILED)
- [ ] Record timestamp
- [ ] Store messageId from provider
- [ ] Test: Email sent → capture messageId, set status = SENT

#### C.4.7: No Business Logic
- ❌ NO application decision logic
- ❌ NO user permission checks
- ❌ NO organization filtering
- ❌ NO retry logic (delegates to caller)
- ✅ ONLY route and send
- Test: Reject any business logic in dispatcher

#### C.4.8: Metrics & Observability
- [ ] Track send time per provider
- [ ] Track success rate per provider
- [ ] Track error types per provider
- [ ] Expose metrics for monitoring
- [ ] Test: Metrics available for 100 emails sent

### Certification Pass Criteria
- [ ] Dispatcher accepts ONLY transport-level data
- [ ] No business domain knowledge
- [ ] All routing correct per channel
- [ ] Only calls provider adapters (no direct SDKs)
- [ ] Idempotency working
- [ ] Error handling comprehensive
- [ ] Delivery status tracked
- [ ] Metrics available
- [ ] NotificationLog captures all details



---

## PHASE C.5 — PROVIDER CERTIFICATION

**Objective:** Each provider independently tested and verified

### Providers to Certify
1. Email Provider (Resend)
2. Telegram Provider
3. Internal Provider
4. WhatsApp Provider (stub or ready)

### Per-Provider Certification Template

#### C.5.X.1: Provider Isolation
- [ ] Provider code in lib/notifications/provider-adapters.ts only
- [ ] No provider SDK calls elsewhere in codebase
- [ ] All calls go through provider adapter interface
- [ ] Test: Search codebase for direct provider SDK usage → 0 results

#### C.5.X.2: Required Input Validation
- [ ] Provider validates recipient (email/id/chat_id)
- [ ] Provider validates content (not empty)
- [ ] Provider rejects invalid input with clear error
- [ ] Test: Empty email → error, not sent

#### C.5.X.3: API Configuration
- [ ] API key/token from environment variables
- [ ] Never hardcoded in code
- [ ] Validated at startup
- [ ] Graceful failure if misconfigured
- [ ] Test: Missing RESEND_API_KEY → clear error

#### C.5.X.4: Error Handling
- [ ] Network errors caught and logged
- [ ] Provider API errors parsed and returned
- [ ] Timeout handling (define timeout value)
- [ ] Rate limit handling
- [ ] Test: Simulate API error → correct error returned

#### C.5.X.5: Retry Strategy
- [ ] Exponential backoff configured
- [ ] Max retry attempts defined
- [ ] Transient errors retried (network, timeout)
- [ ] Permanent errors not retried (invalid email)
- [ ] Test: Network timeout → retried, invalid email → not retried

#### C.5.X.6: Success Verification
- [ ] Provider returns unique message ID
- [ ] Message ID stored in NotificationLog
- [ ] Can use for tracking/auditing
- [ ] Test: Resend returns message ID → captured

#### C.5.X.7: Idempotency
- [ ] Accept idempotency key
- [ ] Pass to provider API
- [ ] Duplicate sends prevented
- [ ] Test: Send same message twice with same key → 1 delivered

#### C.5.X.8: Logging & Metrics
- [ ] Log every send attempt
- [ ] Log success/failure
- [ ] Track response time
- [ ] Track error types
- [ ] Expose metrics
- [ ] Test: 100 emails sent → metrics show 100 attempts, success rate

#### C.5.X.9: Independently Testable
- [ ] Can test provider in isolation (unit test)
- [ ] Mock provider for integration tests
- [ ] Provider tests don't require other layers
- [ ] Test: Run provider tests without RuntimeOrchestrator

### Email Provider Specific (C.5.1)
- [ ] Subject required (if channel = email)
- [ ] Body required
- [ ] HTML body supported
- [ ] Plain text body supported
- [ ] CC/BCC supported (if included in CommunicationRequest)
- [ ] Reply-to supported
- [ ] Sender identity respected
- [ ] Test: Send email with all features → success

### Telegram Provider Specific (C.5.2)
- [ ] Chat ID required
- [ ] Message text required
- [ ] Markdown formatting supported
- [ ] HTML formatting NOT supported (Telegram API limitation)
- [ ] Parse mode specified correctly
- [ ] Message limit respected (4096 chars)
- [ ] Test: Send Telegram message → success

### Internal Provider Specific (C.5.3)
- [ ] Create notification in-app (no external send)
- [ ] Store in notifications table
- [ ] Mark as read/unread
- [ ] Retrievable by user
- [ ] Always succeeds (no external dependency)
- [ ] Test: Send internal → stored, retrievable

### WhatsApp Provider Specific (C.5.4)
- [ ] Placeholder for future implementation
- [ ] Clear interface defined
- [ ] Returns PENDING status for now
- [ ] Can be implemented in Phase D
- [ ] Test: Send WhatsApp → PENDING status

### Certification Pass Criteria
- [ ] Each provider independently testable
- [ ] All required inputs validated
- [ ] API configuration correct
- [ ] Error handling comprehensive
- [ ] Retry strategy defined
- [ ] Success verified with message ID
- [ ] Idempotency working
- [ ] Logging & metrics complete
- [ ] 100% unit test coverage per provider
- [ ] Zero provider SDK calls outside adapters



---

## PHASE C.6 — END-TO-END CERTIFICATION

**Objective:** Verify all 5 layers work together in real scenarios

### Integration Test Flow
```
Domain Event Published
  ↓
NotificationDomainSubscriber receives it
  ↓
RuntimeOrchestrator.run()
  ├─ AudienceResolver → Recipient list
  ├─ CommunicationPlanner → Channel plan
  └─ TemplateResolver → Rendered content
  ↓
Dispatcher routes to providers
  ├─ Email Provider sends
  ├─ Telegram Provider sends
  ├─ Internal Provider stores
  └─ WhatsApp Provider returns PENDING
  ↓
NotificationLog records everything
  ↓
Audit trail complete
```

### Scenario 1: User Registration Flow
**Test:** Register new user → applicant gets welcome email + internal notification

- [ ] **Setup:** No user in system
- [ ] **Trigger:** POST /auth/register
- [ ] **Event Published:** user.registration domain event
- [ ] **Audience Resolution:** Find new user → applicant
- [ ] **Channel Planning:** applicant gets email + internal
- [ ] **Template Resolution:** Welcome template (en) + substitution
- [ ] **Dispatch:** Email sent (Resend) + internal stored
- [ ] **Verification:**
  - [ ] Email delivered (check Resend logs)
  - [ ] Internal notification created
  - [ ] NotificationLog shows user.registration → user_registration
  - [ ] NotificationLog shows recipients, channels, template version
  - [ ] Audit trail complete

### Scenario 2: Application Submitted Flow
**Test:** Applicant submits application → applicant gets email, admin gets telegram + internal

- [ ] **Setup:** Applicant logged in, application draft saved
- [ ] **Trigger:** POST /api/applications/submit
- [ ] **Event Published:** application.submitted domain event
- [ ] **Audience Resolution:**
  - [ ] Applicant = current user
  - [ ] All org_admin members of organization
- [ ] **Channel Planning:**
  - [ ] Applicant: email + internal
  - [ ] org_admin: telegram + internal
- [ ] **Template Resolution:**
  - [ ] Two templates (applicant vs admin)
  - [ ] Variables substituted (programName, applicationId, etc.)
- [ ] **Dispatch:**
  - [ ] Email to applicant
  - [ ] Telegram to each admin
  - [ ] Internal to each admin
- [ ] **Verification:**
  - [ ] 1 email sent (applicant)
  - [ ] N telegrams sent (admins)
  - [ ] N internal notifications (admins)
  - [ ] NotificationLog shows all 1+2N records
  - [ ] Deduplication: same admin doesn't get duplicate

### Scenario 3: Application Approved Flow
**Test:** Admin approves application → applicant gets email, admin gets confirmation, case worker gets assignment

- [ ] **Setup:** Application submitted, case assigned to case worker
- [ ] **Trigger:** Admin clicks "Approve"
- [ ] **Event Published:** application.approved domain event
- [ ] **Audience Resolution:**
  - [ ] Applicant (from application.userId)
  - [ ] org_admin (all admins of organization)
  - [ ] Assigned reviewer
  - [ ] Assigned case worker
- [ ] **Channel Planning:**
  - [ ] Applicant: email + internal
  - [ ] Admins: telegram + internal
  - [ ] Reviewer: internal
  - [ ] Case worker: email + internal
- [ ] **Template Resolution:**
  - [ ] 4 different templates (applicant, admin, reviewer, case worker)
  - [ ] Personalized variables (recipient name, program, etc.)
- [ ] **Dispatch:**
  - [ ] Email to applicant, case worker
  - [ ] Telegram to admins
  - [ ] Internal to all
- [ ] **Verification:**
  - [ ] Total N messages across all recipients
  - [ ] NotificationLog captures all
  - [ ] Audit shows decision timeline
  - [ ] No duplicate notifications

### Scenario 4: Organization Preference Override
**Test:** Org disables telegram → no telegram messages sent

- [ ] **Setup:** Organization has telegram_disabled = true
- [ ] **Trigger:** Application submitted (same as Scenario 2)
- [ ] **Audience Resolution:** Same as Scenario 2
- [ ] **Channel Planning:**
  - [ ] Applicant: email + internal (telegram never in registry)
  - [ ] org_admin: internal only (telegram filtered by org setting)
- [ ] **Dispatch:**
  - [ ] Email to applicant
  - [ ] NO telegram (filtered)
  - [ ] Internal to admins
- [ ] **Verification:**
  - [ ] Zero telegram messages sent
  - [ ] NotificationLog shows channels: email, internal (no telegram)

### Scenario 5: User Preference Override
**Test:** User opts into email only → gets email not telegram

- [ ] **Setup:** Admin sets preference "channels: ['email']"
- [ ] **Trigger:** Application submitted
- [ ] **Audience Resolution:** All admins (this admin included)
- [ ] **Channel Planning:**
  - [ ] Other admins: email + telegram + internal (registry defaults)
  - [ ] This admin: email only (user preference override)
- [ ] **Dispatch:**
  - [ ] This admin gets email only
  - [ ] Other admins get email + telegram + internal
- [ ] **Verification:**
  - [ ] NotificationLog shows different channels per admin
  - [ ] Preference-based routing working

### Scenario 6: Missing Recipient Graceful Failure
**Test:** Case worker not assigned → communication continues without them

- [ ] **Setup:** Application submitted, no case worker assigned
- [ ] **Trigger:** Apply action that expects case worker
- [ ] **Audience Resolution:**
  - [ ] Applicant found
  - [ ] Admins found
  - [ ] Case worker NOT found (empty)
- [ ] **Channel Planning:** Only applicant + admins get channels
- [ ] **Dispatch:** Sends to applicant + admins, skips case worker
- [ ] **Verification:**
  - [ ] Communication succeeds (partial)
  - [ ] NotificationLog shows: attempted for 2, succeeded for 2, 0 skipped
  - [ ] Log warning: "Case worker not found for application X"

### Scenario 7: Template Variable Substitution
**Test:** All variables substituted, missing variables logged

- [ ] **Setup:** Template: "Hello {{userName}}, your {{action}} for {{programName}} is {{status}}"
- [ ] **Trigger:** Render template with payload
- [ ] **Variables:**
  - [ ] {{userName}}: "Jane" (found)
  - [ ] {{action}}: "application" (found)
  - [ ] {{programName}}: "Housing First" (found)
  - [ ] {{status}}: "approved" (found)
  - [ ] {{unknownVariable}}: NOT in payload (missing)
- [ ] **Result:**
  - [ ] Rendered: "Hello Jane, your application for Housing First is approved"
  - [ ] NotificationLog shows: substituted: [userName, action, programName, status], missing: [unknownVariable]
- [ ] **Verification:**
  - [ ] All found variables substituted
  - [ ] Missing variables logged (don't break)

### Scenario 8: Localization Fallback
**Test:** Request French template → fallback to English if missing

- [ ] **Setup:** Spanish user, es template missing for application.approved
- [ ] **Trigger:** Render application.approved for Spanish user
- [ ] **Resolution:**
  - [ ] Look for es template → NOT found
  - [ ] Fallback to en template → found
- [ ] **Result:**
  - [ ] English template rendered
  - [ ] NotificationLog shows: language: "en", fallback_from: "es"
- [ ] **Verification:**
  - [ ] Fallback works
  - [ ] Message still sent (graceful degradation)
  - [ ] Logged for monitoring

### Certification Pass Criteria
All 8 scenarios pass:
- [ ] User registration flow (simple, 1 recipient, 2 channels)
- [ ] Application submitted (multiple recipients, multi-channel)
- [ ] Application approved (4 different audiences, templates)
- [ ] Org preference override (org-level rules)
- [ ] User preference override (user-level personalization)
- [ ] Graceful failure (missing recipient, continues)
- [ ] Variable substitution (templates rendered correctly)
- [ ] Localization (fallback working)

**Additional Criteria:**
- [ ] Zero architectural violations introduced
- [ ] All Phase B tests still passing
- [ ] All 5 layer tests passing
- [ ] All provider tests passing
- [ ] NotificationLog captures full audit trail
- [ ] All scenarios achieve 100% success rate
- [ ] Performance acceptable (< 5s end-to-end per communication)
- [ ] Ready for production deployment



---

## THE IMMUTABLE COMMUNICATION REQUEST CONTRACT

**This contract is the line in the sand. Once Phase C implements it, every future feature must use it.**

### Rule 1: All Communications Through Contract Only
```typescript
// ✅ ALLOWED: 
await send(CommunicationRequest);

// ❌ FORBIDDEN: 
await sendEmail(recipient, subject, body);
await sendTelegram(chatId, message);
await createNotification(userId, title);
// These are all violations of Phase C.4 (Dispatcher contract)
```

### Rule 2: Contract Is Immutable in Transit
```typescript
// ✅ ALLOWED:
request.rendered.body = renderTemplate(request.template, request.variables);

// ❌ FORBIDDEN:
request.eventPayload.userId = "different-user";  // Mutating business context
request.recipients = [...]; // Modifying resolved recipients
request.event = "different.event"; // Changing the domain event
```

### Rule 3: AudienceResolver Produces Initial Contract
```typescript
// Input: Domain event
// Output: CommunicationRequest with:
//   - audience: [resolved roles]
//   - recipients: [{id, email, channels}]
//   - All other fields from domain event context
```

### Rule 4: CommunicationPlanner Enriches Contract
```typescript
// Input: CommunicationRequest (from AudienceResolver)
// Adds: channels, channelPlan, applies preferences
// Output: Same request, enriched
```

### Rule 5: TemplateResolver Completes Contract
```typescript
// Input: CommunicationRequest (from CommunicationPlanner)
// Adds: template, rendered, variables
// Output: Complete, ready-to-send request
```

### Rule 6: Dispatcher Knows Nothing Else
```typescript
// Input: CommunicationRequest (complete)
// Knows: recipient, channel, rendered content, metadata
// Does NOT know: application, user role, organization, business context
// Output: Delivery status
```

---

## PHASE C SUMMARY & CRITICAL PATH

### Work Breakdown

| Phase | Work | Complexity | Hours | Depends On |
|-------|------|-----------|-------|-----------|
| C.1 | AudienceResolver | Medium | 12-16 | Phase B frozen |
| C.2 | CommunicationPlanner | Medium | 12-16 | C.1 complete |
| C.3 | TemplateResolver | High | 16-20 | C.2 complete |
| C.4 | Dispatcher | Medium | 8-12 | C.3 complete |
| C.5 | Provider Certs | High | 20-24 | C.4 complete |
| C.6 | E2E Certs | High | 16-20 | C.1-C.5 complete |
| **Total** | | **High** | **84-108 hours** | |

### Critical Success Factors

1. **CommunicationRequest Contract**
   - Must be defined BEFORE any implementation
   - All 6 certifications must use it
   - Once locked, becomes immutable for future features

2. **Layer Independence**
   - Each layer must be independently testable
   - Unit tests per layer, integration tests across

3. **Zero Payload-Driven Logic**
   - No recipient lists from eventPayload
   - No channel rules from eventPayload
   - All logic from registry + database

4. **Registry Authority**
   - All audience mappings from registry
   - All channel mappings from registry
   - No hardcoded logic anywhere

5. **Audit Trail Completeness**
   - NotificationLog captures every decision point
   - Traceability from event → recipient → channel → template → provider

---

## PHASE C SUCCESS CRITERIA

Phase C is complete and ready for production when:

✅ **C.1 Passed:** 100% of events produce correct recipients  
✅ **C.2 Passed:** 100% of recipients have correct channels  
✅ **C.3 Passed:** 100% of communications have rendered templates  
✅ **C.4 Passed:** Dispatcher is provider-agnostic  
✅ **C.5 Passed:** Each provider independently tested  
✅ **C.6 Passed:** All 8 scenarios succeed end-to-end  

**Additional Criteria:**
✅ Zero architectural violations  
✅ All Phase B tests still passing  
✅ CommunicationRequest contract locked  
✅ Production readiness: 95+/100  
✅ Ready for Phase D (new features building on this foundation)

---

**Phase C Model:** 6 Certifications with Universal CommunicationRequest Contract  
**Status:** Ready for implementation  
**Awaiting:** Explicit approval to begin

