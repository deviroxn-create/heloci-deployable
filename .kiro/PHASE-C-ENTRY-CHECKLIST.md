# PHASE C - ENTRY CHECKLIST
## Audience Resolution, Communication Planning, Template Resolution

**Status:** ⏳ Ready for implementation (DO NOT START YET)  
**Entry Requirements:** All Phase B frozen items verified  
**Implementation Scope:** Exactly these 3 layers only

---

## PHASE C OVERVIEW

Phase C will implement the three runtime orchestration layers that were left as stubs in Phase B:

```
Phase B (LOCKED)                Phase C (TO IMPLEMENT)
──────────────────────────────────────────────────────
DomainEventBus                  
    ↓
NotificationDomainSubscriber
    ↓
RuntimeOrchestrator.run()  ←────→ AudienceResolver (NEW)
    ↓                            ↓
RuntimeOrchestrator calls:       CommunicationPlanner (NEW)
    ↓                            ↓
    Dispatcher.send()    ←────   TemplateResolver (NEW)
```

---

## BEFORE PHASE C STARTS - VERIFICATION CHECKLIST

### Pre-Implementation Verification (Run These):

- [ ] Read PHASE-B-FROZEN-CERTIFICATION.md
- [ ] Verify all Phase B tests pass: `npm run test`
- [ ] Verify TypeScript compiles: `npm run build`
- [ ] Verify no uncommitted changes to Phase B code
- [ ] Review domain event ownership matrix
- [ ] Review communication registry (all 25 entries)
- [ ] Confirm RuntimeOrchestrator exists and is ready for extension

---

## WORK ITEM #1: AUDIENCE RESOLVER

**File to Create:** `lib/runtime/audience-resolver.ts`

### Objective
Determine WHO receives each communication intent based on:
- Domain event payload
- Communication intent definition
- User roles and permissions
- Organization settings

### Input
```typescript
{
  communicationEventName: string;          // From registry
  domainEvent: DomainEvent;                // Business context
  organizationId?: string;
  userId?: string;
  applicationId?: string;
}
```

### Output
```typescript
{
  recipients: [
    {
      type: 'user' | 'staff' | 'organization';
      id: string;
      email?: string;
      name?: string;
    }
  ];
  channels: CommunicationChannel[]; // Email, telegram, internal, etc.
  preferences?: UserPreferences;
}
```

### Required Implementation

#### 1.1 User Audience Resolution
**Location:** Resolve individual users as recipients
- [ ] Find user by ID if provided
- [ ] Look up user email address
- [ ] Check user preferences (notification opt-ins)
- [ ] Verify user is active (not deleted)

```typescript
// Example: application.approved event
// Recipients: applicant (from domain event) + org_admin (from registry)
// Find applicant user, find all org_admin members
```

#### 1.2 Staff Audience Resolution
**Location:** Resolve staff members as recipients
- [ ] Find staff member by ID
- [ ] Look up staff email
- [ ] Check staff role (org_admin, reviewer, case_worker, support)
- [ ] Verify staff is active

```typescript
// Example: application.submitted event
// Recipients: org_admin (all org admins of this org)
// Find all active organization members with org_admin role
```

#### 1.3 Organization Audience Resolution
**Location:** Resolve organization members as recipients
- [ ] Determine which organization (from event context)
- [ ] Find all members with specific role
- [ ] Filter by active status
- [ ] Apply organization-wide settings

```typescript
// Example: program.published event
// Recipients: All org_admin members of that organization
```

#### 1.4 Permission-Aware Resolution
**Location:** Filter recipients based on permissions
- [ ] Check user has permission to receive this communication type
- [ ] Check organization settings allow this communication
- [ ] Check if communication type is enabled for this audience
- [ ] Handle "admin only" communications

```typescript
// Some communications (alerts, warnings) might be admin-only
// Some might be blocked by organization settings
// Permission check before including in recipients
```

### Database Queries Needed
- User lookup and validation
- Organization member lookup
- Staff role lookups
- User preference checks

### Test Coverage Required
- [ ] Test user audience resolution
- [ ] Test staff audience resolution
- [ ] Test organization audience resolution
- [ ] Test permission filtering
- [ ] Test inactive user filtering
- [ ] Test missing recipients (graceful failure)

---

## WORK ITEM #2: COMMUNICATION PLANNER

**File to Create:** `lib/runtime/communication-planner.ts`

### Objective
Determine WHICH CHANNELS each recipient receives the communication via:
- Audience role (applicant, staff, admin)
- Registry channel configuration
- User preferences
- Organization preferences
- Fallback rules

### Input
```typescript
{
  communicationEventName: string;
  recipients: AudienceResolution['recipients'];
  organizationId?: string;
  userPreferences?: Record<string, string[]>;  // Per user channel preferences
  organizationPreferences?: Record<string, string[]>;  // Per channel settings
}
```

### Output
```typescript
{
  plans: [
    {
      recipientId: string;
      channels: CommunicationChannel[];  // Ordered by priority
      primary: CommunicationChannel;
      fallbacks: CommunicationChannel[];
      organization Settings?: any;
    }
  ];
}
```

### Required Implementation

#### 2.1 Registry-Based Channel Selection
**Location:** Use registry to determine channels per audience
- [ ] Look up communication intent in registry
- [ ] Get channelsByAudience mapping
- [ ] Find channels for recipient's audience role
- [ ] Build list of valid channels

```typescript
// From registry: application_submitted has channels:
// applicant: ['email', 'internal']
// org_admin: ['telegram', 'internal']
// Return: applicant gets email+internal, admin gets telegram+internal
```

#### 2.2 User Preference Filtering
**Location:** Filter channels by individual user preferences
- [ ] Load user communication preferences from database
- [ ] Check which channels user has opted into
- [ ] Respect user's do-not-contact settings
- [ ] Apply "contact via preferred channel only" if set

```typescript
// User may have: only_email=true or disabled_telegram=true
// Filter out disabled channels
// Or if user set "preferred_only", use only their choice
```

#### 2.3 Organization Preference Filtering
**Location:** Filter channels by organization settings
- [ ] Check organization settings for communication preferences
- [ ] Respect "requi[REDACTED-RESEND-KEY]" or similar
- [ ] Check if channel is enabled for this organization
- [ ] Apply organization-wide blocking rules

```typescript
// Organization might have: telegram_disabled=true
// Or: email_must_be_approved_first=true
// Filter out or mark as needing approval
```

#### 2.4 Fallback Rules
**Location:** Define fallback if primary channel unavailable
- [ ] Define primary channel per audience
- [ ] Define fallback channels (order matters)
- [ ] Handle case where all channels disabled
- [ ] Decide: skip communication or use emergency channel?

```typescript
// Primary: telegram (for org_admin)
// Fallback 1: email
// Fallback 2: internal
// If all blocked: raise alert or skip
```

#### 2.5 Channel Priority Ordering
**Location:** Order channels by delivery reliability/urgency
- [ ] Email: reliable, slower, required
- [ ] Telegram: fast, requires token, real-time
- [ ] Internal: instant, requires user to check
- [ ] WhatsApp: on-demand (future)

```typescript
// For urgent alerts: try telegram first, fallback to email
// For routine: try email first, fallback to internal
// Priority depends on communication intent
```

### Database Queries Needed
- User communication preferences
- Organization communication settings
- Channel availability status
- User do-not-contact lists

### Test Coverage Required
- [ ] Test registry channel selection
- [ ] Test user preference filtering
- [ ] Test organization preference filtering
- [ ] Test fallback chain
- [ ] Test all channels disabled (edge case)
- [ ] Test empty recipient list

---

## WORK ITEM #3: TEMPLATE RESOLVER

**File to Create:** `lib/runtime/template-resolver.ts`

### Objective
SELECT AND RENDER the appropriate template for each communication:
- Find template by communication event + channel
- Substitute variables from domain event payload
- Support multiple template versions
- Prepare for localization

### Input
```typescript
{
  communicationEventName: string;
  channel: CommunicationChannel;
  locale?: string;
  payload: Record<string, any>;  // Domain event payload
  recipient?: {
    id: string;
    name?: string;
    email?: string;
    language?: string;
  };
}
```

### Output
```typescript
{
  template: {
    id: string;
    name: string;
    version: string;
  };
  rendered: {
    subject?: string;
    body: string;
    html?: string;
    plainText?: string;
    metadata?: Record<string, any>;
  };
  variables: {
    substituted: string[];
    missing: string[];
  };
}
```

### Required Implementation

#### 3.1 Template Selection
**Location:** Find template by event + channel
- [ ] Query template database by communicationEventName + channel
- [ ] Filter by version (draft, active, archived)
- [ ] Select active template (latest version)
- [ ] Handle missing template (raise error or use default)

```typescript
// Query: Find template where:
// - eventName = "application_approved"
// - channel = "email"
// - status = "PUBLISHED"
// - version = latest
```

#### 3.2 Variable Substitution
**Location:** Replace {{variable}} with actual values
- [ ] Parse template for {{variable}} patterns
- [ ] Look up variable value from payload
- [ ] Handle missing variables (log warning, use default or null)
- [ ] Support nested variables: {{user.name}}

```typescript
// Template: "Hello {{applicantName}}, your application was {{decision}}!"
// Payload: { applicantName: "John", decision: "approved" }
// Result: "Hello John, your application was approved!"
```

#### 3.3 Template Versioning
**Location:** Support multiple template versions
- [ ] Store template versions in database
- [ ] Track version history
- [ ] Allow rollback if new version has issues
- [ ] Mark templates as draft/active/archived

```typescript
// Template evolution:
// v1: "Your application decision"
// v2: "Decision on {{programName}} application" (improved)
// v3: "DECISION: {{programName}} application {{decision}}" (current)
```

#### 3.4 Localization Readiness
**Location:** Prepare for multi-language support
- [ ] Accept locale parameter
- [ ] Store templates by locale (en, es, fr, etc.)
- [ ] Fall back to English if locale not available
- [ ] Mark strings as translation-ready

```typescript
// Template storage:
// template/application_approved/en/email.md
// template/application_approved/es/email.md
// Look up by locale, fall back to en if missing
```

#### 3.5 Multi-Format Support
**Location:** Generate different formats from same template
- [ ] Render HTML for email
- [ ] Render plain text for fallback
- [ ] Extract subject for email
- [ ] Generate preview for logs

```typescript
// From markdown template:
// # {{subject}}
// Hello {{name}}...
// Generate: subject, html body, plainText body
```

### Database Schema Needed
```sql
CREATE TABLE NotificationTemplate (
  id SERIAL PRIMARY KEY
  eventName VARCHAR  -- "application_approved"
  channel VARCHAR    -- "email", "telegram", "internal"
  version VARCHAR    -- "1.0", "1.1", "2.0"
  locale VARCHAR     -- "en", "es", "fr"
  status VARCHAR     -- "DRAFT", "PUBLISHED", "ARCHIVED"
  
  subject VARCHAR    -- For email
  body TEXT          -- Template with {{variables}}
  htmlBody TEXT      -- Rendered HTML
  
  createdAt TIMESTAMP
  publishedAt TIMESTAMP
  archivedAt TIMESTAMP
)
```

### Database Queries Needed
- Template lookup by event + channel + locale
- Template version history
- Variable extraction and validation
- Render result storage (for audit)

### Test Coverage Required
- [ ] Test template selection
- [ ] Test variable substitution (happy path)
- [ ] Test missing variables (graceful degradation)
- [ ] Test nested variable substitution
- [ ] Test template versioning
- [ ] Test locale fallback
- [ ] Test HTML + plain text rendering
- [ ] Test subject extraction
- [ ] Test template preview generation



---

## PHASE C CONSTRAINTS & RULES

### MUST DO (Phase C Implementation):
- ✅ Implement AudienceResolver in lib/runtime/
- ✅ Implement CommunicationPlanner in lib/runtime/
- ✅ Implement TemplateResolver in lib/runtime/
- ✅ Integrate with existing RuntimeOrchestrator
- ✅ Add comprehensive tests for all three layers
- ✅ Create database migrations for template storage
- ✅ Add user preference data model

### MUST NOT DO (Phase C Violations):
- ❌ Modify Phase B code (frozen)
- ❌ Change domain event publishing
- ❌ Modify EventBus or NotificationDomainSubscriber
- ❌ Call notificationService.notify() directly
- ❌ Call provider APIs directly (outside adapters)
- ❌ Add hardcoded event mappings
- ❌ Modify registry mapping logic

### CANNOT CHANGE (Phase C Locked):
- ❌ Domain events (only add new ones to registry)
- ❌ Communication Registry mappings
- ❌ Subscriber path
- ❌ Provider adapters interface
- ❌ NotificationLog schema (backward-compat extensions only)

---

## INTEGRATION POINTS WITH PHASE B

### AudienceResolver Integration
```typescript
// Called from: RuntimeOrchestrator.run()
// Input: communicationEventName + domain event payload
// Output: List of recipients per channel
// Must respect: Registry audience definitions
```

### CommunicationPlanner Integration
```typescript
// Called from: RuntimeOrchestrator.run()
// Input: Recipients from AudienceResolver
// Output: Channels per recipient (with priority/fallbacks)
// Must respect: Registry channel definitions + user/org preferences
```

### TemplateResolver Integration
```typescript
// Called from: RuntimeOrchestrator.run()
// Input: Communication event + channel + recipient
// Output: Rendered template with variables substituted
// Must respect: Template database + locale + versioning
```

### Dispatcher Integration (Existing)
```typescript
// Called from: RuntimeOrchestrator.run()
// Input: Recipient + channel + rendered template
// Output: Calls provider adapter
// Already exists, Phase C only provides data
```

---

## SUCCESS CRITERIA FOR PHASE C

Phase C is successful when:

### Audience Resolution
- [ ] 100% of domain events produce correct recipient list
- [ ] All audience types (user, staff, organization) resolved
- [ ] Permissions filter invalid recipients
- [ ] All registry audience mappings honored

### Communication Planning
- [ ] 100% of recipients have channel plan
- [ ] Registry channel mappings followed
- [ ] User preferences respected and override registry
- [ ] Organization preferences respected and override user
- [ ] Fallback chains work correctly
- [ ] All-disabled case handled gracefully

### Template Resolution
- [ ] Template found for every event + channel combination
- [ ] All variables substituted correctly
- [ ] Missing variables logged with warning
- [ ] Template versions work (draft, active, archived)
- [ ] Localization fallback works (en if locale not available)
- [ ] Multiple formats rendered (HTML, plain text, subject)

### Integration
- [ ] End-to-end flow works (event → recipients → channels → templates)
- [ ] NotificationLog contains audience resolution details
- [ ] NotificationLog contains channel selection details
- [ ] NotificationLog contains template version used
- [ ] All Phase B tests still pass
- [ ] New Phase C tests pass
- [ ] Zero architectural violations introduced

---

## PHASE C TECHNICAL DEBT ITEMS

These can be addressed in Phase D (not blocking Phase C):

- [ ] Template optimization (caching)
- [ ] Recipient resolution caching
- [ ] Channel availability monitoring
- [ ] Template rendering performance profiling
- [ ] Localization complexity (translate tools integration)
- [ ] A/B testing of templates
- [ ] Template analytics/metrics

---

## ESTIMATED PHASE C EFFORT

| Work Item | Complexity | Estimated Hours | Dependencies |
|-----------|-----------|---|---|
| Audience Resolver | Medium | 8-12 | Database queries |
| Communication Planner | Medium | 8-12 | User/org preferences |
| Template Resolver | High | 12-16 | Template DB + rendering |
| Integration & Testing | High | 12-16 | All three layers |
| **Total** | **High** | **40-56 hours** | **Phase B complete** |

---

## NEXT STEPS

### 1. Get Approval to Proceed (DO NOT START YET)
- [ ] Review this checklist
- [ ] Review PHASE-B-FROZEN-CERTIFICATION.md
- [ ] Confirm Phase B is frozen
- [ ] Confirm all Phase B tests pass
- [ ] Decision: Proceed to Phase C?

### 2. If Approved, Create Phase C Task Breakdown
- [ ] Create task for Audience Resolver
- [ ] Create task for Communication Planner
- [ ] Create task for Template Resolver
- [ ] Create task for integration & testing
- [ ] Assign to implementation team

### 3. Phase C Implementation
- [ ] Implement Audience Resolver
- [ ] Implement Communication Planner
- [ ] Implement Template Resolver
- [ ] Integration testing
- [ ] Production readiness audit

### 4. Phase C Completion
- [ ] All work items complete
- [ ] All tests passing
- [ ] Production readiness 95+/100
- [ ] Prepare for Phase D

---

**Phase C Status:** ⏳ READY FOR IMPLEMENTATION (AWAITING APPROVAL)  
**Phase B Status:** ✅ FROZEN - NO CHANGES PERMITTED  
**Prerequisite:** All Phase B frozen items verified passing

