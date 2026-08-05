# HELOCI CANONICAL COMMUNICATION REGISTRY

**Version:** 1.0  
**Status:** Blueprint (Phase A)  
**Last Updated:** 2026-07-28  
**Authority:** Single source of truth for all communication in Heloci

---

## REGISTRY FORMAT

Each entry defines:
- **Domain Event Name**: What business publishes (e.g., `application.approved`)
- **Communication Event**: What notification receives (e.g., `application_approved`)
- **Audiences**: Who receives it (applicant, org_admin, reviewer, case_worker, support, staff_member)
- **Channels**: How they receive it (email, telegram, internal)
- **Template Key**: `{audience}.{event}.{channel}` format
- **Type**: user-facing, staff-facing, system-facing, mixed
- **Priority**: critical, high, normal, low
- **Retry**: max attempts, backoff strategy
- **Async**: yes/no (always async for notifications)
- **Notes**: Special handling or dependencies

---

## AUTHENTICATION DOMAIN

### Entry: user.registration → user_registration

| Field | Value |
|-------|-------|
| **Domain Event** | `user.registration` |
| **Communication Event** | `user_registration` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.user_registration.email`, `applicant.user_registration.internal`, `org_admin.user_registration.email`, `org_admin.user_registration.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | New user account created via registration |
| **Notes** | Welcome email should include onboarding link. Org admin notified for compliance. |

### Entry: user.login → user_login

| Field | Value |
|-------|-------|
| **Domain Event** | `user.login` |
| **Communication Event** | `user_login` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.user_login.email`, `org_admin.user_login.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | User successfully authenticates |
| **Notes** | Optional security alert. Can be disabled per user preference. |

---

## APPLICATION DOMAIN

### Entry: application.submitted → application_submitted

| Field | Value |
|-------|-------|
| **Domain Event** | `application.submitted` |
| **Communication Event** | `application_submitted` |
| **Audiences** | applicant, org_admin, reviewer, case_worker, support |
| **Channels** | email, telegram, internal |
| **Template Keys** | `applicant.application_submitted.email`, `org_admin.application_submitted.telegram`, `reviewer.application_submitted.internal`, `case_worker.application_submitted.internal`, `support.application_submitted.email` |
| **Type** | user-facing, staff-facing |
| **Priority** | critical |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Applicant submits application |
| **Notes** | Notification triggers workflow engine. Also triggers Telegram admin alert (separate event). |

### Entry: application.approved → application_approved

| Field | Value |
|-------|-------|
| **Domain Event** | `application.approved` |
| **Communication Event** | `application_approved` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, telegram, internal |
| **Template Keys** | `applicant.application_approved.email`, `org_admin.application_approved.telegram`, `reviewer.application_approved.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | critical |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer approves application |
| **Notes** | May trigger next-step workflows (e.g., lease signing). User-facing outcome. |

### Entry: application.rejected → application_rejected

| Field | Value |
|-------|-------|
| **Domain Event** | `application.rejected` |
| **Communication Event** | `application_rejected` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, telegram, internal |
| **Template Keys** | `applicant.application_rejected.email`, `org_admin.application_rejected.telegram`, `reviewer.application_rejected.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | critical |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer rejects application |
| **Notes** | May include rejection reason. Consider follow-up actions. |

### Entry: application.review.completed → application_conditional

| Field | Value |
|-------|-------|
| **Domain Event** | `application.review.completed` |
| **Communication Event** | `application_conditional` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.application_conditional.email`, `org_admin.application_conditional.internal`, `reviewer.application_conditional.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer makes conditional approval |
| **Notes** | Includes conditions applicant must meet. May trigger follow-up workflows. |

### Entry: application.waitlisted → application_waitlisted

| Field | Value |
|-------|-------|
| **Domain Event** | `application.waitlisted` |
| **Communication Event** | `application_waitlisted` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, telegram, internal |
| **Template Keys** | `applicant.application_waitlisted.email`, `org_admin.application_waitlisted.telegram`, `reviewer.application_waitlisted.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Application added to waitlist |
| **Notes** | May include waitlist position and estimated timeline. |

### Entry: application.withdrawn → application_withdrawn

| Field | Value |
|-------|-------|
| **Domain Event** | `application.withdrawn` |
| **Communication Event** | `application_withdrawn` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.application_withdrawn.email`, `org_admin.application_withdrawn.internal`, `reviewer.application_withdrawn.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Applicant withdraws application |
| **Notes** | May trigger cleanup workflows. |

### Entry: application.under_review → application_under_review

| Field | Value |
|-------|-------|
| **Domain Event** | `application.review.completed` (or new: `application.under_review`) |
| **Communication Event** | `application_under_review` |
| **Audiences** | applicant, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.application_under_review.email`, `reviewer.application_under_review.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Application enters review state |
| **Notes** | Status update only. May be disabled if too noisy. |

---

## DOCUMENT DOMAIN

### Entry: documents.requested → documents_requested

| Field | Value |
|-------|-------|
| **Domain Event** | `documents.requested` |
| **Communication Event** | `documents_requested` |
| **Audiences** | applicant, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.documents_requested.email`, `reviewer.documents_requested.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | critical |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Staff requests missing documents |
| **Notes** | Includes document types and deadline. May trigger reminders. |

### Entry: document.approved → document_approved

| Field | Value |
|-------|-------|
| **Domain Event** | `document.approved` |
| **Communication Event** | `document_approved` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.document_approved.email`, `org_admin.document_approved.internal`, `reviewer.document_approved.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer approves submitted document |
| **Notes** | May include next steps. |

### Entry: document.rejected → document_rejected

| Field | Value |
|-------|-------|
| **Domain Event** | `document.rejected` |
| **Communication Event** | `document_rejected` |
| **Audiences** | applicant, org_admin, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.document_rejected.email`, `org_admin.document_rejected.internal`, `reviewer.document_rejected.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer rejects document submission |
| **Notes** | Includes rejection reason and resubmission instructions. |

### Entry: document.replacement.requested → document_replacement_requested

| Field | Value |
|-------|-------|
| **Domain Event** | `document.replacement.requested` |
| **Communication Event** | `document_replacement_requested` |
| **Audiences** | applicant, reviewer |
| **Channels** | email, internal |
| **Template Keys** | `applicant.document_replacement_requested.email`, `reviewer.document_replacement_requested.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Reviewer marks document as needing replacement |
| **Notes** | Includes replacement deadline. |

---

## ELIGIBILITY DOMAIN

### Entry: eligibility.assessed → eligibility_assessment_completed

| Field | Value |
|-------|-------|
| **Domain Event** | `eligibility.assessed` |
| **Communication Event** | `eligibility_assessment_completed` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.eligibility_assessment_completed.email`, `org_admin.eligibility_assessment_completed.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Eligibility engine completes assessment |
| **Notes** | May include matched programs. Often suppressed if no matches found. |

---

## MATCHING DOMAIN

### Entry: recommendation.available → recommendation_available

| Field | Value |
|-------|-------|
| **Domain Event** | `recommendation.available` |
| **Communication Event** | `recommendation_available` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.recommendation_available.email`, `org_admin.recommendation_available.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Recommendation engine creates new recommendation |
| **Notes** | May include recommendation details and next steps. |

### Entry: program.matched → program_matched

| Field | Value |
|-------|-------|
| **Domain Event** | `program.matched` |
| **Communication Event** | `program_matched` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.program_matched.email`, `org_admin.program_matched.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Applicant matches new program |
| **Notes** | Includes program details and application link. |

---

## PROGRAM DOMAIN

### Entry: program.published → program_published

| Field | Value |
|-------|-------|
| **Domain Event** | `program.published` |
| **Communication Event** | `program_published` |
| **Audiences** | org_admin |
| **Channels** | telegram, internal |
| **Template Keys** | `org_admin.program_published.telegram`, `org_admin.program_published.internal` |
| **Type** | staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Organization publishes new program |
| **Notes** | Internal notification only. Staff needs to know new program is live. |

---

## ORGANIZATION DOMAIN

### Entry: staff.invited → staff_invited

| Field | Value |
|-------|-------|
| **Domain Event** | `staff.invited` |
| **Communication Event** | `staff_invited` |
| **Audiences** | staff_member |
| **Channels** | email |
| **Template Keys** | `staff_member.staff_invited.email` |
| **Type** | user-facing |
| **Priority** | critical |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Staff member invited to organization |
| **Notes** | Includes acceptance link and expiration time. Resend manually if needed. |

### Entry: staff.invitation.accepted → staff_invitation_accepted

| Field | Value |
|-------|-------|
| **Domain Event** | `staff.invitation.accepted` |
| **Communication Event** | `staff_invitation_accepted` |
| **Audiences** | org_admin |
| **Channels** | email, telegram, internal |
| **Template Keys** | `org_admin.staff_invitation_accepted.email`, `org_admin.staff_invitation_accepted.telegram`, `org_admin.staff_invitation_accepted.internal` |
| **Type** | staff-facing |
| **Priority** | normal |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Staff member accepts invitation |
| **Notes** | Alerts org admin that new staff is available. |

### Entry: staff.role.changed → staff_role_changed

| Field | Value |
|-------|-------|
| **Domain Event** | `staff.role.changed` |
| **Communication Event** | `staff_role_changed` |
| **Audiences** | staff_member, org_admin |
| **Channels** | email, telegram, internal |
| **Template Keys** | `staff_member.staff_role_changed.email`, `org_admin.staff_role_changed.telegram`, `org_admin.staff_role_changed.internal` |
| **Type** | staff-facing |
| **Priority** | high |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Org admin changes staff role |
| **Notes** | May affect permissions and access. Notify both staff and admin. |

### Entry: staff.removed → staff_removed

| Field | Value |
|-------|-------|
| **Domain Event** | `staff.removed` |
| **Communication Event** | `staff_removed` |
| **Audiences** | staff_member, org_admin |
| **Channels** | email, telegram, internal |
| **Template Keys** | `staff_member.staff_removed.email`, `org_admin.staff_removed.telegram`, `org_admin.staff_removed.internal` |
| **Type** | staff-facing |
| **Priority** | high |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | Org admin removes staff member |
| **Notes** | May require offboarding workflow. |

---

## COMMUNICATION DOMAIN

### Entry: message.created → message_created

| Field | Value |
|-------|-------|
| **Domain Event** | `message.created` |
| **Communication Event** | `message_created` |
| **Audiences** | applicant, org_admin |
| **Channels** | email, internal |
| **Template Keys** | `applicant.message_created.email`, `org_admin.message_created.internal` |
| **Type** | user-facing, staff-facing |
| **Priority** | high |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | New message in case conversation |
| **Notes** | Can be suppressed per recipient preferences. Include message preview. |

### Entry: admin.action → admin_action

| Field | Value |
|-------|-------|
| **Domain Event** | `admin.action` |
| **Communication Event** | `admin_action` |
| **Audiences** | applicant, org_admin, reviewer, case_worker |
| **Channels** | email, telegram, internal |
| **Template Keys** | `{audience}.admin_action.{channel}` (generic) |
| **Type** | staff-facing |
| **Priority** | normal |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Staff takes administrative action |
| **Notes** | Catch-all event for workflow triggers. Template per action type. |

### Entry: communication.manual_send → communication_manual_send

| Field | Value |
|-------|-------|
| **Domain Event** | `communication.manual_send` (NEW) |
| **Communication Event** | `communication_manual_send` |
| **Audiences** | org_admin, staff |
| **Channels** | email, telegram, internal |
| **Template Keys** | `{audience}.communication_manual_send.{channel}` |
| **Type** | staff-facing |
| **Priority** | normal |
| **Retry** | max 5, exponential backoff |
| **Async** | yes |
| **Trigger** | Staff composes and sends manual communication via dashboard |
| **Notes** | Replaces direct `notificationService.notify()` calls. Provides full audit trail. |

---

## ADMIN ALERT DOMAIN (CURRENTLY BROKEN - BEING REARCHITECTED)

### Entry: admin.alert.* → admin_alert_*

| Field | Value |
|-------|-------|
| **Domain Event** | `admin.alert.application_submitted`, `admin.alert.sla_breach`, `admin.alert.deadline_approaching`, etc. (NEW) |
| **Communication Event** | `admin_alert_application_submitted`, `admin_alert_sla_breach`, etc. |
| **Audiences** | org_admin, staff_admin |
| **Channels** | telegram, internal (no email for alerts) |
| **Template Keys** | `org_admin.admin_alert_*.telegram` |
| **Type** | system-facing |
| **Priority** | critical (breach), high (deadline) |
| **Retry** | max 3, exponential backoff |
| **Async** | yes |
| **Trigger** | System detects event requiring immediate staff attention |
| **Notes** | Currently sent via direct Telegram API. Being migrated to canonical pipeline using `admin_alert_*` event pattern. |

---

## VALIDATION RULES

### Rule 1: No Duplicate Communication Events
- Each `communicationEventName` appears exactly once
- No two domain events map to same communication event (unless intentional aliasing)

### Rule 2: No Orphaned Events
- Every `domain_event_name` published in codebase exists in registry
- Every communication event in registry has at least one domain event source
- No missing subscriber mappings

### Rule 3: Audience Consistency
- Valid audiences: `applicant`, `org_admin`, `reviewer`, `case_worker`, `support`, `staff_member`, `staff_admin`, `system`
- Each audience receives the event via allowed channels for that event

### Rule 4: Template Naming
- Templates follow format: `{audience}.{event_name}.{channel}`
- All `{channel}` values must exist: `email`, `telegram`, `internal`, `whatsapp`
- All `{audience}` must match this registry

### Rule 5: Priority Consistency
- `critical`: Must have retry. SLA-bound. Examples: application_submitted, staff_invited
- `high`: Important but not SLA-bound. Examples: documents_requested, application_approved
- `normal`: Optional/informational. Examples: user_login, program_published
- `low`: Suppress-able system events (reserved for future)

### Rule 6: No Mixed Trigger Sources
- Each communication event triggered by exactly one domain event type (or defined aliases)
- No communication event receiving input from multiple unrelated domain events

### Rule 7: Async Always
- All notifications must be asynchronous
- No blocking sends
- No waiting for delivery confirmation in calling code

---

## AUDIENCE DEFINITIONS

### applicant
- User applying for housing programs
- Receives: user-facing outcomes, application decisions, document requests, messages
- Channels: email, internal

### org_admin
- Organization administrator
- Receives: staff-facing alerts, program updates, application summaries
- Channels: email, telegram, internal

### reviewer
- Staff member reviewing applications
- Receives: review assignments, application details, messaging
- Channels: email, internal

### case_worker
- Staff member managing case communications
- Receives: case updates, messaging, application changes
- Channels: email, internal

### support
- Support team
- Receives: critical alerts, escalations
- Channels: email, telegram

### staff_member
- Any staff member invited/onboarded
- Receives: invitations, role changes, organizational updates
- Channels: email, telegram, internal

### staff_admin
- Administrative staff only
- Receives: system alerts, SLA breaches, critical events
- Channels: telegram, internal (not email)

### system
- System-only events (not user-facing)
- Receives: audit events, health checks
- Channels: internal only

---

## MIGRATION STATUS

| Entry | Phase A Complete | Phase B (Subscriber) | Phase C (Runtime) | Phase D (Remove Bypass) | Phase E (Legacy) |
|-------|---|---|---|---|---|
| user.registration | ✅ | ✅ | ✅ | ✅ | ✅ |
| user.login | ✅ | ✅ | ✅ | ⏳ | ⏳ |
| application.submitted | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.approved | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.rejected | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.conditional | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.waitlisted | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.withdrawn | ✅ | ✅ | ✅ | ✅ | ✅ |
| application.under_review | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| documents.requested | ✅ | ✅ | ✅ | ✅ | ✅ |
| document.approved | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| document.rejected | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| document.replacement.requested | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| eligibility.assessed | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| recommendation.available | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| program.matched | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| program.published | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| staff.invited | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| staff.invitation.accepted | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| staff.role.changed | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| staff.removed | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| message.created | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin.action | ✅ | ✅ | ✅ | ✅ | ✅ |
| communication.manual_send | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| admin.alert.* | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## NEXT STEPS

**Phase A (This Document):** ✅ Complete
- Registry defined
- All events registered
- All domains covered
- Validation rules established

**Phase B (Subscriber Completion):** Ready
- Map all registry entries to NotificationDomainSubscriber
- Ensure every published domain event has subscriber mapping
- Verify no silent drops

**Phase C (Runtime Completion):** Ready  
- Implement AudienceResolver entries from registry
- Implement CommunicationPlanner entries from registry
- Implement TemplateResolver entries from registry

**Phase D (Remove Bypasses):** Ready
- Replace `quickSendEmailAction()` with domain event
- Replace `sendEmailWithInternalMessageAction()` with domain event
- Replace `sendEmail()` with domain event
- Route Telegram through provider adapter

**Phase E (Legacy Removal):** Ready
- Remove legacy routing from notification.service.ts
- Remove shadow comparison logic
- Keep only runtime pipeline

