# HELOCI COMMUNICATION POLICIES

**Version:** 2.0 (Phase A Refined)  
**Status:** Enterprise Architecture  
**Last Updated:** 2026-07-28

---

## POLICY SEPARATION PRINCIPLE

Communication happens across four independent policy layers:

```
Audience Policy         "WHO gets notified?"
         ↓
Channel Policy          "THROUGH WHICH CHANNELS?"
         ↓
Template Policy         "WITH WHAT CONTENT?"
         ↓
Retry Policy            "IF IT FAILS, HOW DO WE RECOVER?"
```

Each policy layer is **queryable independently** and **changeable independently**.

Example: Adding SMS channel requires changes only to **Channel Policy**, not to Audience or Template policies.

---

## LAYER 1: AUDIENCE POLICY

**Responsibility:** Define WHO should receive each communication intent.

**Source:** Business policy, RBAC, access control.

**Never changes:** Channel preferences, templates, retry strategies.

### Audience Policy Registry Format

```typescript
audience_policy: {
  [intentName]: {
    audiences: AudienceRole[];
    scope?: 'global' | 'organization' | 'program' | 'personal';
    condition?: string; // Optional business logic
  }
}
```

### Audience Policy Entries

| Intent | Audiences | Scope | Condition | Notes |
|--------|-----------|-------|-----------|-------|
| `notify.user_registered` | applicant, org_admin | global | always | Always send to both |
| `notify.user_login` | applicant, org_admin | personal | optional | Can be suppressed |
| `notify.application_submitted` | applicant, org_admin, reviewer, case_worker, support | organization | always | Org-scoped visibility |
| `notify.application_approved` | applicant, org_admin, reviewer | organization | always | Org-scoped visibility |
| `notify.application_rejected` | applicant, org_admin, reviewer | organization | always | Org-scoped visibility |
| `notify.application_conditional` | applicant, org_admin, reviewer | organization | always | Conditional approval |
| `notify.application_waitlisted` | applicant, org_admin, reviewer | organization | always | Added to waitlist |
| `notify.application_withdrawn` | applicant, org_admin, reviewer | organization | always | Applicant withdrew |
| `notify.application_under_review` | applicant, reviewer | organization | optional | Status update only |
| `notify.documents_requested` | applicant, reviewer | program | always | Deadline-tracked |
| `notify.document_approved` | applicant, org_admin, reviewer | program | always | Status update |
| `notify.document_rejected` | applicant, org_admin, reviewer | program | always | Rejection reason included |
| `notify.document_replacement_requested` | applicant, reviewer | program | always | With new deadline |
| `notify.eligibility_assessment_completed` | applicant, org_admin | program | optional | May suppress if no matches |
| `notify.recommendation_available` | applicant, org_admin | program | optional | Optional notification |
| `notify.program_matched` | applicant, org_admin | program | always | New match available |
| `notify.program_published` | org_admin | organization | always | New program live |
| `notify.staff_invited` | staff_member | global | always | Invitation sent |
| `notify.staff_invitation_accepted` | org_admin | organization | always | New staff available |
| `notify.staff_role_changed` | staff_member, org_admin | organization | always | Role updated |
| `notify.staff_removed` | staff_member, org_admin | organization | always | Removed from org |
| `notify.message_created` | applicant, org_admin | organization | optional | Per recipient preference |
| `notify.admin_action` | applicant, org_admin, reviewer, case_worker | organization | varies | Catch-all event |
| `notify.communication_sent_manually` | recipients, org_admin | organization | always | Full audit trail |
| `alert.admin_application_submitted` | org_admin, staff_admin | organization | always | Urgent alert |
| `alert.admin_sla_breach` | org_admin, staff_admin | organization | always | SLA violation |

---

## LAYER 2: CHANNEL POLICY

**Responsibility:** Define WHICH CHANNELS each audience prefers for each intent.

**Source:** User preferences, role-based defaults, infrastructure capabilities.

**Never changes:** Who gets it, what it says, retry strategy.

### Channel Policy Registry Format

```typescript
channel_policy: {
  [intentName]: {
    [audience]: {
      primary: CommunicationChannel;
      fallback: CommunicationChannel[];
      blocked?: CommunicationChannel[];
      disabled?: boolean;
    }
  }
}
```

### Channel Policy Entries

| Intent | Audience | Primary | Fallback | Blocked | Notes |
|--------|----------|---------|----------|---------|-------|
| `notify.user_registered` | applicant | email | internal | - | Welcome email |
| `notify.user_registered` | org_admin | email | internal | - | Compliance audit |
| `notify.user_login` | applicant | email | internal | - | Optional security |
| `notify.user_login` | org_admin | internal | - | - | Staff only |
| `notify.application_submitted` | applicant | email | internal | - | Confirmation |
| `notify.application_submitted` | org_admin | telegram | internal | - | Urgent alert |
| `notify.application_submitted` | reviewer | internal | - | telegram | Staff only |
| `notify.application_submitted` | case_worker | internal | - | telegram | Staff only |
| `notify.application_submitted` | support | email | - | - | Support inbox |
| `notify.application_approved` | applicant | email | internal | - | User outcome |
| `notify.application_approved` | org_admin | telegram | internal | - | Alert |
| `notify.application_approved` | reviewer | internal | - | - | Staff only |
| `notify.application_rejected` | applicant | email | internal | - | User outcome |
| `notify.application_rejected` | org_admin | telegram | internal | - | Alert |
| `notify.application_rejected` | reviewer | internal | - | - | Staff only |
| `notify.documents_requested` | applicant | email | internal | - | User action required |
| `notify.documents_requested` | reviewer | internal | - | - | Staff only |
| `notify.document_approved` | applicant | email | internal | - | Status update |
| `notify.document_approved` | org_admin | internal | - | - | Internal tracking |
| `notify.document_approved` | reviewer | internal | - | - | Staff only |
| `notify.program_matched` | applicant | email | internal | - | User action available |
| `notify.program_matched` | org_admin | internal | - | - | Internal tracking |
| `notify.program_published` | org_admin | telegram | internal | - | Alert |
| `notify.staff_invited` | staff_member | email | - | - | External invitee |
| `notify.staff_invitation_accepted` | org_admin | telegram | internal | - | Alert |
| `notify.staff_role_changed` | staff_member | email | telegram, internal | - | Personal notice |
| `notify.staff_role_changed` | org_admin | telegram | internal | - | Alert |
| `notify.staff_removed` | staff_member | email | telegram, internal | - | Personal notice |
| `notify.staff_removed` | org_admin | telegram | internal | - | Alert |
| `notify.message_created` | applicant | email | internal | - | User action |
| `notify.message_created` | org_admin | internal | - | - | Internal |
| `notify.admin_action` | applicant | email | internal | - | Varies by action |
| `notify.admin_action` | org_admin | telegram | internal | - | Alert |
| `notify.communication_sent_manually` | org_admin | internal | - | - | Audit trail |
| `alert.admin_application_submitted` | org_admin | telegram | internal | - | Critical |
| `alert.admin_application_submitted` | staff_admin | telegram | internal | - | Critical |
| `alert.admin_sla_breach` | org_admin | telegram | internal | - | Critical |
| `alert.admin_sla_breach` | staff_admin | telegram | internal | - | Critical |

---

## LAYER 3: TEMPLATE POLICY

**Responsibility:** Define WHAT CONTENT is delivered for each (intent, audience, channel) combination.

**Source:** Content team, UX, compliance.

**Never changes:** Who gets it, which channels, retry strategy.

### Template Policy Registry Format

```typescript
template_policy: {
  [intentName]: {
    [audience]: {
      [channel]: {
        template_key: string;
        subject_key?: string;
        variables: string[];
        locale?: string;
        format?: 'html' | 'plain' | 'markdown';
      }
    }
  }
}
```

### Template Policy Structure

For each (intent, audience, channel) combination, define:
- **template_key**: Identifier for template lookup
- **subject_key**: For email, which subject line
- **variables**: Data placeholders needed
- **locale**: Language (default: en)
- **format**: HTML, plain text, markdown

### Example Entries

#### `notify.application_approved` / applicant / email

| Field | Value |
|-------|-------|
| **template_key** | `application-approved-applicant-email` |
| **subject_key** | `email.subject.application_approved` |
| **variables** | `[firstName, applicationStatus, nextSteps, caseWorkerId, caseWorkerContact, supportLink]` |
| **format** | html |
| **locale** | en, es (planned) |

**Template Content (referenced):**
- Subject: "Your Application Has Been Approved"
- Body: "Congratulations, {firstName}! Your application for {programName} has been approved. Next steps: {nextSteps}. Your case worker {caseWorkerName} ({caseWorkerContact}) will contact you within 24 hours."
- HTML: Formatted version with logo, colors, etc.

---

#### `notify.application_submitted` / org_admin / telegram

| Field | Value |
|-------|-------|
| **template_key** | `application-submitted-admin-telegram` |
| **subject_key** | - |
| **variables** | `[applicantName, programName, applicationId, submittedAt, applicantContact]` |
| **format** | plain |
| **locale** | en |

**Template Content (referenced):**
- Body: "🔔 New Application: {applicantName} applied for {programName} (#{applicationId}) at {submittedAt}. Contact: {applicantContact}. Review: [link]"

---

#### `notify.documents_requested` / applicant / email

| Field | Value |
|-------|-------|
| **template_key** | `documents-requested-applicant-email` |
| **subject_key** | `email.subject.documents_requested` |
| **variables** | `[firstName, documentList, dueDate, daysRemaining, uploadLink, supportLink]` |
| **format** | html |
| **locale** | en, es (planned) |

**Template Content (referenced):**
- Subject: "Action Required: Submit Documents by {dueDate}"
- Body: Formatted list of documents needed, deadline, upload instructions

---

### Template Registry Composition

The actual templates are stored separately (database or i18n files):
- `notificationTemplate` table: `{key, channel, subject, html, plainText, variables, locale, version}`
- Or i18n files: `locales/en/templates.json`

**This policy layer just defines:** "For this intent+audience+channel, use template X with these variables."

---

## LAYER 4: RETRY POLICY

**Responsibility:** Define ERROR HANDLING and recovery strategy.

**Source:** Reliability requirements, SLA compliance, business criticality.

**Never changes:** Who gets it, channels, content.

### Retry Policy Registry Format

```typescript
retry_policy: {
  [intentName]: {
    priority: 'critical' | 'high' | 'normal' | 'low';
    maxAttempts: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    initialDelayMs: number;
    maxDelayMs: number;
    allowDLQ: boolean; // Dead letter queue for final failures
  }
}
```

### Retry Policy Entries

| Intent | Priority | Max Attempts | Backoff | Initial Delay | Max Delay | DLQ | Notes |
|--------|----------|--------------|---------|---------------|-----------|-----|-------|
| `notify.user_registered` | high | 5 | exponential | 1min | 1hour | yes | Critical for onboarding |
| `notify.user_login` | normal | 3 | exponential | 30sec | 30min | no | Optional security |
| `notify.application_submitted` | critical | 5 | exponential | 1min | 1hour | yes | SLA-bound |
| `notify.application_approved` | critical | 5 | exponential | 1min | 1hour | yes | User-facing outcome |
| `notify.application_rejected` | critical | 5 | exponential | 1min | 1hour | yes | User-facing outcome |
| `notify.application_conditional` | high | 5 | exponential | 1min | 1hour | yes | Approval conditions |
| `notify.application_waitlisted` | high | 5 | exponential | 1min | 1hour | yes | User-facing outcome |
| `notify.application_withdrawn` | normal | 3 | exponential | 30sec | 30min | no | Applicant initiated |
| `notify.application_under_review` | normal | 3 | exponential | 30sec | 30min | no | Optional status |
| `notify.documents_requested` | critical | 5 | exponential | 1min | 1hour | yes | SLA-bound |
| `notify.document_approved` | normal | 3 | exponential | 30sec | 30min | no | Status update |
| `notify.document_rejected` | high | 5 | exponential | 1min | 1hour | yes | Requires action |
| `notify.document_replacement_requested` | high | 5 | exponential | 1min | 1hour | yes | Requires action |
| `notify.eligibility_assessment_completed` | normal | 3 | exponential | 30sec | 30min | no | Informational |
| `notify.recommendation_available` | normal | 3 | exponential | 30sec | 30min | no | Optional |
| `notify.program_matched` | high | 3 | exponential | 30sec | 30min | no | User action available |
| `notify.program_published` | normal | 3 | exponential | 30sec | 30min | no | Internal |
| `notify.staff_invited` | critical | 5 | exponential | 1min | 1hour | yes | External invitation |
| `notify.staff_invitation_accepted` | normal | 3 | exponential | 30sec | 30min | no | Internal notification |
| `notify.staff_role_changed` | high | 5 | exponential | 1min | 1hour | yes | Access impact |
| `notify.staff_removed` | high | 5 | exponential | 1min | 1hour | yes | Access impact |
| `notify.message_created` | high | 5 | exponential | 1min | 1hour | yes | User communication |
| `notify.admin_action` | normal | 5 | exponential | 1min | 1hour | no | Varies by action |
| `notify.communication_sent_manually` | high | 5 | exponential | 1min | 1hour | yes | Manual action |
| `alert.admin_application_submitted` | critical | 3 | exponential | 10sec | 5min | yes | Urgent alert |
| `alert.admin_sla_breach` | critical | 3 | exponential | 10sec | 5min | yes | Escalation required |

---

## POLICY QUERY PATTERNS

### Pattern 1: "Who gets this intent?"

```typescript
function getAudiencesForIntent(intent: string): Audience[] {
  return AUDIENCE_POLICY[intent]?.audiences || [];
}

// Usage
getAudiencesForIntent('notify.application_approved')
// → ['applicant', 'org_admin', 'reviewer']
```

### Pattern 2: "How does this audience receive this intent?"

```typescript
function getChannelForIntent(intent: string, audience: Audience): Channel {
  return CHANNEL_POLICY[intent]?.[audience]?.primary || 'email';
}

// Usage
getChannelForIntent('notify.application_approved', 'org_admin')
// → 'telegram'
```

### Pattern 3: "What template for this delivery?"

```typescript
function getTemplateForDelivery(intent: string, audience: Audience, channel: Channel): TemplateConfig {
  return TEMPLATE_POLICY[intent]?.[audience]?.[channel];
}

// Usage
getTemplateForDelivery('notify.application_approved', 'applicant', 'email')
// → { template_key: 'application-approved-applicant-email', subject_key: '...', variables: [...] }
```

### Pattern 4: "How do we retry this intent?"

```typescript
function getRetryStrategy(intent: string): RetryConfig {
  return RETRY_POLICY[intent];
}

// Usage
getRetryStrategy('notify.application_submitted')
// → { priority: 'critical', maxAttempts: 5, backoffStrategy: 'exponential', ... }
```

---

## POLICY MODIFICATION PROCESS

### Adding a New Channel (e.g., SMS)

1. **Audience Policy**: No change (audiences don't care about SMS existence)
2. **Channel Policy**: Add new entries where SMS is appropriate
   ```
   notify.documents_requested / applicant:
     primary: email → email (unchanged)
     fallback: [internal, sms] (add sms as option)
   ```
3. **Template Policy**: Create SMS templates for affected intents
   ```
   notify.documents_requested / applicant / sms:
     template_key: documents-requested-applicant-sms
     variables: [firstName, documentList, dueDate, uploadLink]
   ```
4. **Retry Policy**: No change (same intent, same retry strategy)

### Adding a New Audience (e.g., program_director)

1. **Audience Policy**: Add new audience to relevant intents
   ```
   notify.program_published:
     audiences: [org_admin, program_director] (add new)
   ```
2. **Channel Policy**: Define channels for new audience
   ```
   notify.program_published / program_director:
     primary: telegram
     fallback: [internal]
   ```
3. **Template Policy**: Decide if reuses existing template or creates new one
4. **Retry Policy**: No change (intent unchanged)

### Deprecating an Intent

1. **Mark in Intent Catalog**: Status → DEPRECATED
2. **Audience Policy**: Move to archive section, document sunset date
3. **Create migration path**: If replacing with new intent
4. **Notify teams**: Intent owner communicates timeline

---

## SUCCESS CRITERIA FOR POLICIES

- ✅ All policies separated into independent layers
- ✅ No channel knowledge in audience policy
- ✅ No audience knowledge in channel policy
- ✅ No provider knowledge in any policy
- ✅ All (intent, audience, channel) combinations mapped
- ✅ Query functions work for all patterns
- ✅ Modification procedures documented
- ✅ Changes to one policy don't require changes to others

---

## NEXT STEP: IMPLEMENTATION

These policies are **read-only configuration** that drives behavior.

Downstream components query policies, never hardcode logic:

```typescript
// WRONG (hardcoded)
if (eventName === 'application_approved' && audience === 'org_admin') {
  channel = 'telegram';
}

// RIGHT (from policy)
const channel = getChannelForIntent('notify.application_approved', 'org_admin');
```

This ensures:
- Single source of truth
- Easy to audit
- Easy to change
- Easy to test

