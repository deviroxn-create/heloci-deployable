# HELOCI COMMUNICATION INTENT CATALOG

**Version:** 2.0 (Phase A Refined)  
**Status:** Enterprise Architecture  
**Last Updated:** 2026-07-28

---

## ARCHITECTURE PRINCIPLE

```
Business Domain              Communication Domain
     ↓                              ↓
Domain Event             Communication Intent
(application.approved)   (notify.application_approved)
     ↓                              ↓
     └──→ Event Bus ←─→ Intent Router
                              ↓
                         Intent fulfilled by:
                         - Notification Subscriber
                         - Analytics Subscriber
                         - Webhook Subscriber
                         - AI Summary Subscriber
                         - Future subscribers
```

**Key insight:** Same business event, multiple subscribers, each translating to their own intent.

---

## COMMUNICATION INTENTS (NOT NOTIFICATIONS)

A Communication Intent is a **business-level request** that can be fulfilled in multiple ways.

**Not:** "send an email"  
**Yes:** "notify applicant of approval" (can be email, SMS, push, internal, etc.)

### Catalog Structure

Each intent defines:
- **Intent Name**: `notify.*` or `analyze.*` or `webhook.*`
- **Domain Event**: What business event triggers it
- **Version**: Registry version (for migrations)
- **Status**: ACTIVE, DEPRECATED, REMOVED
- **Owner**: Which team maintains this
- **Description**: What should happen
- **Audiences**: Who should be aware
- **Subscribers**: Which systems can fulfill it

---

## CATEGORY 1: NOTIFICATION INTENTS

These intents request notification delivery to users/staff.

### `notify.user_registered`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.user_registered` |
| **Domain Event** | `user.registration` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Authentication Team |
| **Description** | Notify new user they've registered; provide onboarding info |
| **Audiences** | applicant (primary), org_admin (compliance) |
| **Subscribers** | notification-service, analytics-service, audit-logger |
| **Created** | 2026-01-15 |
| **Modified** | 2026-07-28 |

**Notes:**
- Welcome email should include onboarding link
- Org admin notified for compliance audit trail
- May be suppressed by user preference
- Used by: Registration flow

---

### `notify.user_logged_in`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.user_logged_in` |
| **Domain Event** | `user.login` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Authentication Team |
| **Description** | Notify user of login from new device/location (optional) |
| **Audiences** | applicant (optional), org_admin |
| **Subscribers** | notification-service, security-service, analytics-service |
| **Created** | 2026-01-15 |
| **Modified** | 2026-07-28 |

**Notes:**
- May be suppressed if same device/location pattern
- Used for security alerts
- Optional based on user preferences

---

### `notify.application_submitted`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.application_submitted` |
| **Domain Event** | `application.submitted` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Application Team |
| **Description** | Alert all stakeholders that application was submitted |
| **Audiences** | applicant, org_admin, reviewer, case_worker, support |
| **Subscribers** | notification-service, workflow-engine, analytics-service, audit-logger |
| **Created** | 2026-02-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Triggers workflow engine (different subscriber)
- Sends notifications to multiple audiences via different channels
- Critical path - SLA tracking begins
- Triggers admin telegram alert

---

### `notify.application_approved`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.application_approved` |
| **Domain Event** | `application.approved` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Application Team |
| **Description** | Notify applicant and staff that application was approved |
| **Audiences** | applicant (primary), org_admin, reviewer |
| **Subscribers** | notification-service, case-management-service, analytics-service |
| **Created** | 2026-02-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- May trigger next steps (lease signing, etc.)
- User-facing outcome - critical to send
- Case management service may create next tasks

---

### `notify.documents_requested`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.documents_requested` |
| **Domain Event** | `documents.requested` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Document Management Team |
| **Description** | Request missing documents from applicant with deadline |
| **Audiences** | applicant, reviewer |
| **Subscribers** | notification-service, deadline-tracking-service, analytics-service |
| **Created** | 2026-03-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Deadline tracking begins
- May send reminder notifications
- Document request deadline is SLA-tracked

---

### `notify.staff_invited`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.staff_invited` |
| **Domain Event** | `staff.invited` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Organization Team |
| **Description** | Invite staff member to join organization |
| **Audiences** | staff_member |
| **Subscribers** | notification-service, identity-service, analytics-service |
| **Created** | 2026-04-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Includes acceptance link and expiration
- Can be resent via admin UI
- Identity service tracks invitation state

---

### `notify.message_created`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.message_created` |
| **Domain Event** | `message.created` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Communication Team |
| **Description** | Notify recipient(s) of new message |
| **Audiences** | applicant, org_admin |
| **Subscribers** | notification-service, analytics-service, audit-logger |
| **Created** | 2026-03-15 |
| **Modified** | 2026-07-28 |

**Notes:**
- Includes message preview
- Can be suppressed per recipient preference
- Read receipts tracked separately

---

### `notify.communication_sent_manually`

| Field | Value |
|-------|-------|
| **Intent Name** | `notify.communication_sent_manually` |
| **Domain Event** | `communication.manual_send` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Communication Team |
| **Description** | Staff composed and sent communication via dashboard |
| **Audiences** | recipients (dynamic), org_admin (audit) |
| **Subscribers** | notification-service, analytics-service, audit-logger |
| **Created** | 2026-07-28 |
| **Modified** | 2026-07-28 |

**Notes:**
- NEW INTENT - enables audit trail for manual comms
- Replaces direct notify() calls
- Provides full traceability

---

## CATEGORY 2: ANALYTICS INTENTS

These intents request tracking/metrics without notification delivery.

### `analyze.application_lifecycle`

| Field | Value |
|-------|-------|
| **Intent Name** | `analyze.application_lifecycle` |
| **Domain Event** | `application.submitted`, `application.approved`, `application.rejected`, `application.waitlisted` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Analytics Team |
| **Description** | Track application state changes for metrics and dashboards |
| **Audiences** | (none - system only) |
| **Subscribers** | analytics-service, metrics-aggregator |
| **Created** | 2026-02-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Single subscriber (analytics) receives multiple domain events
- No notification involved
- Feeds dashboard, reporting, AI recommendations

---

### `analyze.system_performance`

| Field | Value |
|-------|-------|
| **Intent Name** | `analyze.system_performance` |
| **Domain Event** | All domain events |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Platform Team |
| **Description** | Track system performance metrics, SLA compliance, error rates |
| **Audiences** | (none - system only) |
| **Subscribers** | metrics-service, alerting-service |
| **Created** | 2026-06-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Monitors all events for SLA compliance
- Triggers alerts if thresholds breached

---

## CATEGORY 3: ADMIN ALERT INTENTS

These intents request immediate attention from staff.

### `alert.admin_application_submitted`

| Field | Value |
|-------|-------|
| **Intent Name** | `alert.admin_application_submitted` |
| **Domain Event** | `application.submitted` |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Admin Team |
| **Description** | Send Telegram alert to org admin when application submitted |
| **Audiences** | org_admin, staff_admin |
| **Subscribers** | notification-service (via provider adapter) |
| **Created** | 2026-02-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- NEW - migrated from direct Telegram API call
- Now flows through canonical pipeline
- Uses provider adapter (not direct API)
- Full audit trail

---

### `alert.admin_sla_breach`

| Field | Value |
|-------|-------|
| **Intent Name** | `alert.admin_sla_breach` |
| **Domain Event** | `application.review_deadline_exceeded` (implicit from metrics) |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Owner** | Compliance Team |
| **Description** | Alert staff when SLA deadline breached |
| **Audiences** | org_admin, staff_admin |
| **Subscribers** | notification-service, escalation-service |
| **Created** | 2026-03-01 |
| **Modified** | 2026-07-28 |

**Notes:**
- Triggered by time-based event (not domain event)
- Escalation service may trigger higher alerts

---

## CATEGORY 4: FUTURE INTENTS (EXTENSIBILITY)

These intents demonstrate how the architecture scales.

### `webhook.application_state_changed`

| Field | Value |
|-------|-------|
| **Intent Name** | `webhook.application_state_changed` |
| **Domain Event** | `application.submitted`, `application.approved`, `application.rejected` |
| **Version** | 2.0 |
| **Status** | PLANNED |
| **Owner** | Integration Team |
| **Description** | POST to external webhook when application changes state |
| **Audiences** | (external systems) |
| **Subscribers** | webhook-service |
| **Created** | 2026-07-28 |
| **Modified** | 2026-07-28 |

**Notes:**
- Not yet implemented
- Will be added when webhook service is ready
- Same domain event, new subscriber, new intent

---

### `sms.urgent_notification`

| Field | Value |
|-------|-------|
| **Intent Name** | `sms.urgent_notification` |
| **Domain Event** | `documents.requested` (with urgency flag) |
| **Version** | 2.0 |
| **Status** | PLANNED |
| **Owner** | Communication Team |
| **Description** | Send SMS to applicant for urgent deadline document requests |
| **Audiences** | applicant |
| **Subscribers** | sms-service |
| **Created** | 2026-07-28 |
| **Modified** | 2026-07-28 |

**Notes:**
- When SMS provider ready, add SMS channel to notification service
- No registry changes needed (channel-agnostic)

---

### `ai.generate_summary`

| Field | Value |
|-------|-------|
| **Intent Name** | `ai.generate_summary` |
| **Domain Event** | `application.submitted` |
| **Version** | 2.0 |
| **Status** | PLANNED |
| **Owner** | AI Team |
| **Description** | Generate AI summary of application for staff preview |
| **Audiences** | (AI system only) |
| **Subscribers** | ai-service |
| **Created** | 2026-07-28 |
| **Modified** | 2026-07-28 |

**Notes:**
- AI processes application without notification
- Results stored for staff access
- Same business event, new subscriber, new workflow

---

## INTENT LIFECYCLE STATES

### ACTIVE
- Intent is currently used
- New subscribers can be added
- Existing subscribers cannot be removed (backward compatibility)
- Example: `notify.user_registered`

### DEPRECATED
- Intent still works but phase-out in progress
- New code should not create new subscribers
- Existing subscribers continue to function
- Planned removal date documented
- Example: (none yet - for future use)

### REMOVED
- Intent no longer active
- All subscribers migrated away
- May be revived in new version if needed
- Archived for historical reference
- Example: (none yet - for future use)

### PLANNED
- Intent designed but not yet active
- Placeholder for future feature
- No subscribers yet
- Example: `webhook.application_state_changed`, `sms.urgent_notification`

---

## VERSIONING STRATEGY

### Intent Versioning

When the communication intent changes (new audiences, different audiences):
- Increment version: `notify.application_approved` → v1.0 → v2.0
- Old version continues working (backward compatibility)
- New subscribers must use new version
- Document migration path

### Example: Adding SMS Channel

**Before (v1.0):**
```
notify.documents_requested [v1.0]
  Audiences: applicant, reviewer
  Channels: email, internal
```

**After (v2.0):**
```
notify.documents_requested [v1.0] DEPRECATED
  Audiences: applicant, reviewer
  Channels: email, internal

notify.documents_requested [v2.0] ACTIVE
  Audiences: applicant (can now receive SMS), reviewer
  Channels: email, sms, internal
```

**Migration:** Templates for SMS channel created, subscribers migrated gradually.

---

## OWNERSHIP MATRIX

| Intent | Owner | Team | Contact |
|--------|-------|------|---------|
| `notify.user_registered` | Authentication Team | Auth | @auth-lead |
| `notify.application_*` | Application Team | Applications | @app-lead |
| `notify.documents_*` | Document Team | Documents | @doc-lead |
| `notify.eligibility_*` | Eligibility Team | Eligibility | @eligibility-lead |
| `notify.staff_*` | Organization Team | Org | @org-lead |
| `analyze.*` | Analytics Team | Analytics | @analytics-lead |
| `alert.admin_*` | Admin Team | Admin | @admin-lead |
| `webhook.*` | Integration Team | Integration | @integration-lead |

**Process:**
- Intent owner approves changes to their intents
- Cross-team changes require coordination
- All changes go through intent catalog (not scattered in code)

---

## REGISTRY RELATIONSHIP

| Layer | Responsibility | Examples |
|-------|---|---|
| **Communication Intent** | WHAT to do (business-level) | `notify.application_approved` |
| **Audience Policy** | WHO receives it | applicant, org_admin, reviewer |
| **Channel Policy** | HOW they receive it | email, telegram, internal |
| **Template Policy** | WHAT they receive | subject, body, html, variables |
| **Retry Policy** | ERROR handling | max attempts, backoff |

**Key Separation:**
- Intent: Business concern (approving app means notify people)
- Audience: Business policy (who cares about approvals)
- Channel: Infrastructure policy (how do we reach them)
- Template: UX concern (what should it say)
- Retry: Delivery concern (what if it fails)

---

## VALIDATION & CONSISTENCY RULES

### Rule 1: Intent Has Exactly One Domain Event
- One intent may respond to multiple domain events
- One domain event may trigger multiple intents
- But mapping is explicit and documented

### Rule 2: Ownership is Clear
- Every intent has an owner
- Owner approves changes to that intent
- Owner is responsible for version migration

### Rule 3: Version is Immutable
- Once intent v1.0 is published, it never changes
- Changes create new version (v2.0, v3.0)
- Old versions continue working

### Rule 4: Status is Explicit
- Every intent is ACTIVE, DEPRECATED, REMOVED, or PLANNED
- Status changes require migration plan
- Deprecation includes timeline

### Rule 5: Intent is Domain-Agnostic
- Intent never specifies: email, telegram, SMS, webhook
- Intent only specifies: audience and business purpose
- Channels are configured separately

---

## NEXT PHASE: POLICIES

Once intents are defined, each policy layer becomes simple:

**Audience Policy Registry:**
```
notify.application_approved:
  audiences:
    - applicant
    - org_admin
    - reviewer
```

**Channel Policy Registry:**
```
notify.application_approved / applicant:
  channels:
    - email (primary)
    - internal (fallback)

notify.application_approved / org_admin:
  channels:
    - telegram (primary)
    - internal (fallback)
```

**Template Policy Registry:**
```
notify.application_approved / applicant / email:
  template_key: application-approved-applicant-email.html
  subject_key: application-approved-subject
  variables: [status, nextSteps, caseWorkerId]
```

**Retry Policy Registry:**
```
notify.application_approved:
  priority: critical
  maxAttempts: 5
  backoffStrategy: exponential
```

---

## SUCCESS CRITERIA FOR INTENT CATALOG

- ✅ All 26 communications described as intents
- ✅ Intents separated from delivery mechanisms
- ✅ Version numbers assigned to all intents
- ✅ Status (ACTIVE/DEPRECATED/PLANNED) assigned
- ✅ Ownership assigned to teams
- ✅ Future extensibility documented (SMS, webhook, AI, etc.)
- ✅ No provider knowledge in intent definitions
- ✅ One-to-one domain event to intent mapping verified

---

## PHASE A COMPLETION CHECKLIST (REVISED)

- ✅ Communication Intent Catalog (this document)
- ✅ Audience Policy Registry (separate document)
- ✅ Channel Policy Registry (separate document)
- ✅ Template Policy Registry (separate document)
- ✅ Retry Policy Registry (separate document)
- ✅ Ownership matrix
- ✅ Versioning strategy
- ✅ Validation rules
- ⏳ Phase BC: Intent Translator (maps domain → intent)
- ⏳ Phase C: Subscriber Completion (uses intent catalog)

