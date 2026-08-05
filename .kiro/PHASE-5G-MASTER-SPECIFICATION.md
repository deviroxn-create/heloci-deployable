# Phase 5G — Communication Runtime Certification

**Master Specification**  
**Status**: Ready for Execution  
**Date**: August 3, 2026  
**Authority**: Final specification for production certification

---

## Mission

Execute a complete production-grade audit of Heloci's communication subsystem following database recovery.

This phase exists to **certify the notification system before any further feature development**.

**This is an audit and certification phase — not a feature development phase.**

---

## Global Rules

### Rule 1: Reality First

**Only runtime evidence is accepted.**

Do not assume anything works because:
- ❌ Code exists
- ❌ Tests pass
- ❌ Configuration looks correct

**Every conclusion must be backed by execution evidence.**

### Rule 2: Read Only

**Until remediation begins:**
- ❌ No code modifications
- ❌ No database modifications
- ❌ No template modifications
- ❌ No configuration changes

**Collect evidence only.**

### Rule 3: Fix Only Confirmed Problems

- ❌ Never redesign the notification architecture
- ✅ Only fix failures proven during the audit

### Rule 4: Scope Integrity

Do not:
- ❌ Add features during audit
- ❌ Refactor code
- ❌ Optimize architecture
- ❌ Make "while we're here" changes

---

## Phase 5G.1 — Runtime Audit (Evidence Collection)

### Objective

Discover every communication failure in the system.

- ❌ No fixes
- ❌ No improvements
- ✅ Only evidence

### Section A — Notification Inventory

Build a complete inventory of every implemented notification.

#### Authentication
- [ ] User Registered → Welcome Email
- [ ] Email Verification
- [ ] Login Notification
- [ ] Password Reset

#### Applicant Lifecycle
- [ ] Application Submitted
- [ ] Application Under Review
- [ ] Application Status Changed
- [ ] Document Requested
- [ ] Document Uploaded
- [ ] Eligibility Result
- [ ] Program Match
- [ ] Case Closed

#### Organization/Admin
- [ ] New User Registered
- [ ] New Application
- [ ] New Document Uploaded
- [ ] Internal Notification (Fallback)
- [ ] Telegram Admin Alert

**Include any additional events discovered during code inspection.**

### Section B — Runtime Flow Verification

For every notification, execute the complete flow:

```
Business Action
    ↓ [Trigger event]
Event Created
    ↓ [Event data created]
NotificationService.notify()
    ↓ [notify() invoked]
Recipient Resolution
    ↓ [AudienceResolver identifies recipients]
Template Resolution
    ↓ [Template lookup succeeds]
Channel Selection
    ↓ [Email/Telegram/Internal chosen]
Provider Invocation
    ↓ [Provider.send() called]
NotificationLog Entry
    ↓ [Database record created]
Actual Delivery Confirmed
    ↓ [Provider response captured]
```

**Collect runtime evidence at every stage:**
- Console logs (debug output)
- Event payload (data that triggered)
- Recipient list (who was identified)
- Template ID (which template used)
- Provider response (API response)
- NotificationLog entry (database record)
- Delivery status (final result)

### Section C — Recipient Audit

**Verify that every notification reaches the correct audience.**

#### Examples

**Welcome Email**
- Recipient: Registered Applicant
- Never: Admin, Organization Staff

**Document Request**
- Recipient: Applicant (owner of application)
- Never: Staff, Other applicants

**New Application Alert**
- Recipient: Organization Admin
- Never: Applicant, Staff from other orgs

**Verification Checklist**

For each notification:
- [ ] Correct primary recipient identified
- [ ] Organization verified (multi-tenant isolation)
- [ ] Role verified (applicant vs. admin vs. staff)
- [ ] Email address correct
- [ ] Telegram destination correct
- [ ] No unintended recipients

### Section D — Template Audit

**Verify every notification loads the expected template.**

#### Checks

- [ ] Template exists in database
- [ ] Template marked as `active = true`
- [ ] Template status = `PUBLISHED`
- [ ] All placeholders resolve correctly
- [ ] Subject correct
- [ ] Body correct

#### Template Variables

Verify these resolve:
- `{{firstName}}`
- `{{lastName}}`
- `{{organizationName}}`
- `{{applicationId}}`
- `{{status}}`
- `{{documentName}}`
- `{{deadline}}`
- `{{programName}}`
- `{{eligibilityScore}}`

**No unresolved placeholders are acceptable.**

### Section E — Provider Audit

#### Resend (Email)

Capture for every email:
- [ ] Request sent to Resend API
- [ ] HTTP 200 response received
- [ ] Message ID returned
- [ ] From/To addresses correct
- [ ] Subject correct
- [ ] Body correct
- [ ] Status code captured
- [ ] Error message (if any)

#### Telegram (Admin Alerts)

Capture for every Telegram:
- [ ] Bot token verified
- [ ] Chat ID correct
- [ ] HTTP 200 response received
- [ ] Message ID returned
- [ ] Text/content correct
- [ ] HTTP status captured
- [ ] Telegram response captured
- [ ] Error message (if any)

### Section F — Database Audit

**Verify runtime reads from correct tables:**

- [ ] NotificationTemplate (correct template selected)
- [ ] NotificationLog (entries created)
- [ ] CommunicationSettings (channels enabled)
- [ ] SenderIdentity (sender info)
- [ ] OrganizationCommunicationConfig (org settings)

**Confirm correct organization data is selected:**

```sql
-- Verify user's organization
SELECT u.id, u.email, om.organizationId 
FROM User u 
JOIN OrganizationMember om ON u.id = om.userId 
WHERE u.id = '[userId]'

-- Verify notification template for org
SELECT * FROM NotificationTemplate 
WHERE organizationId = '[correctOrgId]'

-- Verify no cross-org data
SELECT * FROM NotificationLog 
WHERE userId IN (SELECT id FROM User 
  WHERE organizationId != '[expectedOrgId]')
-- Should return empty
```

### Section G — Business Rule Audit

**Verify notifications occur only under the correct business conditions.**

#### Registration Rule

```
Expected Flow:
  User submits signup form
    ↓
  User record created in database
    ↓
  user_registered event fired
    ↓
  Email verification email sent (1 time)
    ↓
  User clicks verification link
    ↓
  Email verified
    ↓
  Welcome email sent (1 time)

Violations to check:
  ❌ Welcome email sent before verification
  ❌ Multiple welcome emails sent
  ❌ Email sent if user already registered
```

#### Status Change Rule

```
Expected:
  Application status actually changes (PENDING → APPROVED)
    ↓
  application_status_changed event fires
    ↓
  Email sent to applicant

Violations to check:
  ❌ Email sent when editing unrelated field
  ❌ Email sent without actual status change
  ❌ Email sent multiple times for same change
```

#### Document Request Rule

```
Expected:
  Staff creates DocumentRequest
    ↓
  document_requested event fires
    ↓
  Email sent to applicant (1 time)
    ↓
  Applicant uploads document
    ↓
  document_uploaded event fires
    ↓
  Email sent to staff (1 time)

Violations to check:
  ❌ Email sent without request created
  ❌ Multiple emails for single request
  ❌ Upload notification sent to wrong person
```

### Section H — Notification Timing Audit

**Verify notifications occur at the correct time.**

- [ ] No early notifications (before business action completes)
- [ ] No delayed notifications (should be immediate)
- [ ] No duplicate notifications (exact duplicates)
- [ ] Timestamps correct
- [ ] Timezone handling correct

### Section I — Idempotency Audit

**Verify every event sends exactly one notification.**

For each notification type:
- [ ] Single trigger → Single notification
- [ ] Repeated trigger → Single notification (not duplicates)
- [ ] Unless designed for multiple recipients, each recipient gets exactly one

**Examples**:
- Registration → 1 welcome email (not 2, not 3)
- Status change → 1 email to applicant (not one per observer)
- Document request → 1 email to applicant (not repeated on edit)

### Section J — Multi-Tenant Isolation Audit

**CRITICAL: Verify organization data isolation**

#### Rules

Organization A can never receive:
- ❌ Organization B emails
- ❌ Organization B Telegram alerts
- ❌ Organization B NotificationLogs
- ❌ Organization B SenderIdentity
- ❌ Organization B TemplateData

#### Verification

```sql
-- Check: No cross-org template usage
SELECT DISTINCT 
  u.organizationId as user_org,
  t.organizationId as template_org
FROM NotificationLog nl
JOIN User u ON nl.userId = u.id
JOIN NotificationTemplate t ON nl.templateUsed = t.id
WHERE u.organizationId != t.organizationId

-- Should return empty

-- Check: No cross-org recipient leakage
SELECT nl.recipient, u.organizationId, om.organizationId
FROM NotificationLog nl
JOIN User u ON nl.userId = u.id
LEFT JOIN OrganizationMember om ON u.id = om.userId
WHERE u.organizationId != om.organizationId

-- Should return empty
```

**Cross-tenant leakage is CRITICAL SEVERITY**

### Section K — Regression Matrix

Generate complete pass/fail matrix:

| Event | Event Fired | Recipient Correct | Template Correct | Email Delivered | Telegram Delivered | Internal Logged | Result |
|-------|-------------|-------------------|------------------|-----------------|-------------------|-----------------|--------|
| user_registered | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | 🟢/🟡/🔴 |
| email_verification | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| user_login | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| password_reset | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| application_submitted | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| application_under_review | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| application_status_changed | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| document_requested | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| document_uploaded | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | 🟢/🟡/🔴 |
| eligibility_result | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| program_match | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| case_closed | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢/🟡/🔴 |
| new_user_registered | ✓/✗ | ✓/✗ | N/A | N/A | ✓/✗ | ✓/✗ | 🟢/🟡/🔴 |
| new_application | ✓/✗ | ✓/✗ | N/A | N/A | ✓/✗ | ✓/✗ | 🟢/🟡/🔴 |
| new_document_uploaded | ✓/✗ | ✓/✗ | N/A | N/A | ✓/✗ | ✓/✗ | 🟢/🟡/🔴 |

**Legend**:
- 🟢 = All checks pass (ready for production)
- 🟡 = Some checks fail (minor issue)
- 🔴 = Critical failure (blocks production)

### Section L — Root Cause Ranking

**For every confirmed failure, rank by:**

#### Severity

- **CRITICAL**: Blocks functionality (notifications never sent)
- **HIGH**: Causes wrong behavior (sent to wrong person/time)
- **MEDIUM**: Partial failure (some channels work, others don't)
- **LOW**: Cosmetic issue (logging, retry logic)

#### Effort

- **Small**: < 15 minutes to fix
- **Medium**: 15 minutes - 1 hour
- **Large**: > 1 hour

#### Example Ranking

```
1. CRITICAL / Small
   registration event not fired
   → Fix: Add publishEvent call to registerUserAccount()
   
2. CRITICAL / Medium
   Welcome template missing
   → Fix: Insert template to database
   
3. HIGH / Small
   Telegram channel disabled
   → Fix: Enable telegram in CommunicationSettings
   
4. MEDIUM / Medium
   Recipient resolution fails for organization staff
   → Fix: Debug AudienceResolver organization lookup
```

### Deliverable: Phase 5G.1

**Produce:**

1. ✅ **Runtime Audit Report**
   - Summary of findings
   - Each section (A-L) results
   - Evidence collected

2. ✅ **Notification Inventory**
   - All 15+ notification types
   - Event names
   - Channels
   - Expected recipients

3. ✅ **Runtime Flow Diagram**
   - Visual: Event → notify() → Resolution → Template → Provider → Log → Delivery

4. ✅ **Recipient Matrix**
   - Who should receive each notification
   - Organization isolation verified

5. ✅ **Template Matrix**
   - Which templates are used
   - Variables verified
   - Status (active/inactive)

6. ✅ **Provider Matrix**
   - Email delivery status
   - Telegram delivery status
   - Error tracking

7. ✅ **Database Evidence**
   - Query results
   - Organization isolation confirmed

8. ✅ **Regression Matrix**
   - Complete pass/fail for all notifications

9. ✅ **Root Cause Report**
   - Every failure identified
   - Ranked by severity and effort
   - Fix recommendation for each

---

## Phase 5G.2 — Remediation

### Objective

Fix only the issues discovered in Phase 5G.1.

### Rules

- ✅ Minimal code changes
- ❌ No architecture redesign
- ✅ One issue at a time
- ✅ Retest after each fix
- ❌ No scope expansion

### Procedure

For each failure (in rank order):

1. **Identify** — Exact location in code
2. **Fix** — Minimal change to resolve
3. **Retest** — Execute that specific notification again
4. **Verify** — Runtime evidence shows success
5. **Document** — What changed and why

### Deliverable: Phase 5G.2

**Produce:**

- ✅ **Communication Fix Report**
  - Each fix applied
  - Code changes documented
  - Before/after evidence

---

## Phase 5G.3 — Re-Audit

### Objective

Re-run the entire runtime audit.

**Every previous failure must now pass.**

### Procedure

Execute all sections from Phase 5G.1 again:
- Section A — Notification Inventory (unchanged)
- Section B — Runtime Flow Verification (retest all)
- Section C — Recipient Audit (retest all)
- Section D — Template Audit (retest all)
- Section E — Provider Audit (retest all)
- Section F — Database Audit (retest all)
- Section G — Business Rule Audit (retest all)
- Section H — Timing Audit (retest all)
- Section I — Idempotency Audit (retest all)
- Section J — Multi-Tenant Isolation (retest all)

### Deliverable: Phase 5G.3

**Produce:**

- ✅ **Updated Regression Matrix**
  - All previous failures now pass
  - New failures (if any) identified

---

## Phase 5G.4 — Regression Test Suite

### Objective

Create permanent automated tests.

**Only execute after all runtime issues pass.**

### Coverage

Generate automated tests for:

- [ ] User Registration
- [ ] Welcome Email
- [ ] Email Verification
- [ ] Login Notification
- [ ] Password Reset
- [ ] Application Submitted
- [ ] Application Status Changed
- [ ] Document Requested
- [ ] Document Uploaded
- [ ] Eligibility Result
- [ ] Program Match
- [ ] Case Closed
- [ ] Admin: New User
- [ ] Admin: New Application
- [ ] Admin: Telegram Alert

### Test Requirements

Every automated test must verify:

- [ ] Event fired
- [ ] notify() executed
- [ ] Correct recipient
- [ ] Correct template
- [ ] Provider called
- [ ] NotificationLog written
- [ ] Delivery confirmed (or provider accepted)

### Test Location

File: `tests/communication-production-certification.test.ts`

### Deliverable: Phase 5G.4

**Produce:**

- ✅ **Regression Test Suite**
  - `tests/communication-production-certification.test.ts`
  - All 15+ notifications covered
  - Complete pass

---

## Phase 5G.5 — Production Certification

### Objective

Issue final certification.

**The communication subsystem is production-ready.**

### Deliverable: Phase 5G.5

**Produce:**

1. ✅ **Communication Certification Report**
   - Executive summary
   - All audits passed
   - All regressions fixed
   - All tests passing

2. ✅ **Final Regression Matrix**
   - All 🟢 (all green)

3. ✅ **Runtime Certification**
   - Evidence of production readiness
   - Known limitations
   - Maintenance recommendations

### Certification Table

```
Area                     Status
─────────────────────────────────
Event Dispatch           🟢
Recipient Resolution     🟢
Template Resolution      🟢
Email Delivery           🟢
Telegram Delivery        🟢
Notification Logging     🟢
Business Rules           🟢
Multi-Tenant Isolation   🟢
Regression Suite         🟢
─────────────────────────────────
OVERALL:                 🟢 CERTIFIED FOR PRODUCTION
```

---

## Completion Criteria

**Phase 5G is complete only when:**

- ✅ Every notification flow has been executed
- ✅ Every result is backed by runtime evidence
- ✅ All confirmed defects have been fixed and reverified
- ✅ Automated regression tests have been created
- ✅ The communication subsystem is certified for production use

### Final Sign-Off

**Do not proceed to the next Heloci development phase until Phase 5G receives full production certification.**

---

## Authority

This specification is the authoritative guide for Phase 5G execution. It supersedes all previous communication audit specifications.

**Execution begins after database recovery is complete and confirmed working.**

</content>
</invoke>