# PHASE 5F — Notification Ownership Matrix

This is the rulebook for every future notification in Heloci.

## Platform-Owned Events

These events are owned by the platform and use the platform sender (`support@heloci.us`).

| Event | Owner | Sender | Template Origin | Audience | Retry Policy | Notes |
|-------|-------|--------|-----------------|----------|------|-------|
| `user_registration` | **Platform** | `support@heloci.us` | Platform | Applicant | Yes (3x) | User confirmation email. No org context yet. |
| `user_login` | **Platform** | `support@heloci.us` | Platform | None (internal) | No | Informational only, not sent to user. |
| `password_reset` | **Platform** | `support@heloci.us` | Platform | User | Yes (3x) | Password reset link. High priority. |
| `staff_invited` | **Platform** | `support@heloci.us` | Platform | Staff User | Yes (3x) | Invitation to join org as staff. Links to org. |
| `staff_invitation_accepted` | **Platform** | `support@heloci.us` | Platform | Org Admin | No | Informational (staff joined). |
| `staff_removed` | **Platform** | `support@heloci.us` | Platform | Staff User | No | Notification of removal. |
| `system_error` | **Platform** | `support@heloci.us` | Platform | System (Telegram) | No | Ops alert, sent to admin telegram. |
| `ops_alert` | **Platform** | `support@heloci.us` | Platform | System (Telegram) | No | System health alert. |
| `admin_test` | **Platform** | `support@heloci.us` | Platform | Sender | No | Test notification from UI. |

### Platform-Owned Rules

1. **No organizationId required** in context
2. **Sender is always** `support@heloci.us`
3. **Template is always** global platform template (organizationId = null in DB)
4. **No org customization** (org cannot override template or sender)
5. **Can appear in multiple orgs** with identical copy

---

## Organization-Owned Events

These events are owned by individual organizations and use the organization's sender.

| Event | Owner | Sender | Template Origin | Audience | Retry Policy | Notes |
|-------|-------|--------|-----------------|----------|------|-------|
| `application_submitted` | **Organization** | Org SenderIdentity | Org or Platform | Applicant + Org Admins | Yes (5x) | User submitted application. Critical. |
| `application_approved` | **Organization** | Org SenderIdentity | Org or Platform | Applicant + Case Worker + Org Admins | Yes (5x) | Application approved. HIGHEST priority. |
| `application_rejected` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (5x) | Application rejected. User-facing. |
| `application_withdrawn` | **Organization** | Org SenderIdentity | Org or Platform | Applicant + Org Admins | Yes (3x) | User withdrew application. |
| `application_conditional` | **Organization** | Org SenderIdentity | Org or Platform | Applicant + Org Admins | Yes (5x) | Conditional approval. Needs clarification. |
| `application_under_review` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | No | Informational status update. |
| `application_waitlisted` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Added to waitlist. |
| `documents_requested` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (5x) | Request for additional docs. CRITICAL. |
| `document_approved` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Document accepted. |
| `document_rejected` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Document rejected (resubmit). |
| `document_replacement_requested` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Different document needed. |
| `eligibility_assessment_started` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | No | Informational. |
| `eligibility_assessment_completed` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Results ready. |
| `program_matched` | **Organization** | Org SenderIdentity | Org or Platform | Applicant | Yes (3x) | Recommended for program. |
| `program_published` | **Organization** | Org SenderIdentity | Org or Platform | Eligible Applicants (batch) | No | New program available. Batch send. |
| `case_note_added` | **Organization** | Org SenderIdentity | Org or Platform | Assigned Staff | No | Internal staff notification. |
| `message_created` | **Organization** | Org SenderIdentity | Org or Platform | Recipient of message | Yes (3x) | New case message. |

### Organization-Owned Rules

1. **organizationId REQUIRED** in context (authorization check)
2. **Sender is resolved from** `SenderIdentity` table for that organization
   - Priority: Org's default `SenderIdentity` → Org's primary sender → Fallback `support@heloci.us`
3. **Template origin** (org or platform):
   - Priority: Org-specific template (if exists) → Platform template (fallback)
4. **Organization can customize:**
   - Sender domain (via SenderIdentity verification)
   - Template (override platform template)
   - Branding (colors, logo in email)
5. **All send attempts logged** with org context

---

## Sender Resolution Priority

**For platform-owned events:**
```
1. support@heloci.us (hardcoded)
```

**For organization-owned events:**
```
1. Org's default SenderIdentity.emailAddress (from DB, must be verified with Resend)
   └─ If not set:
2. Org.primarySenderId resolved to SenderIdentity.emailAddress
   └─ If not set:
3. Org.emailFromName (legacy field, may not be email)
   └─ If not valid email:
4. support@heloci.us (fallback, verified Heloci domain)
```

**NEVER use:**
- `COMMUNICATION_SENDER_EMAIL` environment variable (unverified)
- Applicant's email address (not verified with Resend)
- Admin's personal email (not verified)

---

## Template Resolution Priority

**For platform-owned events:**
```
Query: SELECT * FROM NotificationTemplate 
       WHERE eventName = ? 
       AND channel = ?
       AND organizationId IS NULL
       AND active = true
       ORDER BY version DESC
       LIMIT 1

If not found: Use hardcoded fallback template in code
```

**For organization-owned events:**
```
Query: SELECT * FROM NotificationTemplate 
       WHERE eventName = ? 
       AND channel = ?
       AND (organizationId = ? OR organizationId IS NULL)
       AND active = true
       ORDER BY organizationId DESC, version DESC
       LIMIT 1

Result priority: 
1. Org-specific template (organizationId = given org)
2. Platform template (organizationId = NULL)
3. Hardcoded fallback
```

---

## Audience Mapping

### Platform Events

| Event | Audience | Recipients |
|-------|----------|-----------|
| `user_registration` | Applicant | User being registered |
| `password_reset` | User | User requesting reset |
| `staff_invited` | Staff | User invited to join org |

### Organization Events (Examples)

| Event | Audience | Recipients |
|-------|----------|-----------|
| `application_submitted` | Applicant | User who submitted |
| `application_submitted` | Org Admin | All org admins for that program |
| `application_approved` | Applicant | User who applied |
| `application_approved` | Case Worker | Assigned case worker (if set) |
| `application_approved` | Org Admin | All org admins |
| `documents_requested` | Applicant | User being asked |
| `case_note_added` | Assigned Staff | User assigned to case |

---

## Channel Selection by Audience

**Applicants:**
- Primary: `email` (high priority, user-facing)
- Fallback: `internal` (dashboard notification)
- Never: `telegram` (not configured for applicants)

**Organization Admins:**
- Primary: `telegram` (ops alert)
- Fallback: `email` (if telegram unconfigured)
- Secondary: `internal` (dashboard)

**Case Workers / Staff:**
- Primary: `internal` (in-app notification)
- Secondary: `email` (if flagged as high-priority)
- Never: `telegram` (not staff channels)

**System / Ops:**
- Primary: `telegram` (ops alerts)
- Secondary: `email` (escalation)

---

## Retry Policies

### Yes (3x) — Low-Priority Transactional
- Retry up to 3 times on transient failure (network timeout, rate limit)
- Backoff: 1s, 2s, 4s
- If all fail: Log and stop (non-blocking)
- Examples: `user_registration`, `staff_invited`, `eligibility_assessment_completed`

### Yes (5x) — High-Priority Transactional
- Retry up to 5 times on transient failure
- Backoff: 1s, 2s, 4s, 8s, 16s
- If all fail: Alert ops and retry next day
- Examples: `application_approved`, `documents_requested`, `application_submitted`

### No — Informational
- Send once, don't retry
- If fails: Log and stop
- Examples: `application_under_review`, `case_note_added`, `program_published`

---

## Mutation Rules

### Allowed Mutations
None. The pipeline is immutable.

### Monitored Values (Must NOT Change)
- Event name
- Organization ID
- Audience role
- Recipient email
- Sender email
- Template key
- Channel

### If Any Value Changes
- Log as blocker in trace
- Halt execution
- Investigate stage where mutation occurred
- File ticket (HIGH priority)

---

## Testing & Certification Checklist

For each event type, before shipping:

**Platform Events:**
- [ ] Sender is `support@heloci.us`
- [ ] organizationId is null (platform-level)
- [ ] Template is global (organizationId=null in DB)
- [ ] No org-specific customization possible

**Organization Events:**
- [ ] organizationId is preserved from context
- [ ] Sender is resolved from SenderIdentity (org-specific)
- [ ] Template priority: org > platform > fallback
- [ ] Multiple audiences handled correctly
- [ ] Deduplication works (no duplicate sends per audience role)

**All Events:**
- [ ] NotificationLog created for each attempt
- [ ] Retry logic applied per policy
- [ ] No data leaks between orgs (org isolation verified)
- [ ] Correlation ID (traceId) preserved

---

## Future Enhancements

1. **Per-org API keys** (when Resend supports org routing)
2. **Scheduled sends** (send in user's timezone)
3. **A/B testing** (multiple template versions)
4. **Personalized branding** (org logo/colors in emails)
5. **Custom delivery windows** (no emails at night)

---

## Related Documents

- `.kiro/PHASE-5F-RUNTIME-CERTIFICATION.md` — Main certification guide
- `.kiro/PHASE-5F-PIPELINE-MAP.md` — Component responsibilities
- `.kiro/communication-registry.md` — Event definitions
- `prisma/schema.prisma` — Database schema (SenderIdentity, NotificationTemplate, NotificationLog)
