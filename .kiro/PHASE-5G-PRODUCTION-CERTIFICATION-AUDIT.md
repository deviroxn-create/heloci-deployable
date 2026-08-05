# Phase 5G — Communication Runtime Audit (Production Certification)

**Status**: Specification Complete, Ready for Execution  
**Date**: August 3, 2026  
**Objective**: Certify the complete communication subsystem after database recovery  
**Scope**: Verify every notification reaches the correct recipient with correct content at the right time  
**No fixes during this phase** — Evidence collection only

---

## Part 1: Notification Inventory

Complete audit of every implemented notification type:

### Authentication Notifications

- [ ] **User Registered** 
  - Trigger: Signup form submission → registerUserAccount()
  - Channels: Email, Telegram (admin), Internal
  - Recipients: Applicant (email), Organization Admin (telegram)
  
- [ ] **Email Verification**
  - Trigger: User clicks verification link
  - Channels: Email
  - Recipients: Registered user
  
- [ ] **Login Notification** ✅ (Known working)
  - Trigger: Successful authentication
  - Channels: Email
  - Recipients: Logged-in user
  
- [ ] **Password Reset**
  - Trigger: Password reset request
  - Channels: Email
  - Recipients: User email address

### Applicant Lifecycle Notifications

- [ ] **Application Submitted**
  - Trigger: Application form completed
  - Channels: Email, Internal
  - Recipients: Applicant (confirmation), Organization Admin (new app alert)
  
- [ ] **Application Under Review**
  - Trigger: Application status → UNDER_REVIEW
  - Channels: Email, Internal
  - Recipients: Applicant
  
- [ ] **Application Status Changed**
  - Trigger: Application status transition (Pending→Approved/Denied/Waitlisted)
  - Channels: Email, Internal
  - Recipients: Applicant, Organization staff
  
- [ ] **Document Requested**
  - Trigger: Staff creates DocumentRequest
  - Channels: Email, Internal
  - Recipients: Applicant (request), Staff (confirmation)
  
- [ ] **Document Uploaded**
  - Trigger: Applicant uploads requested document
  - Channels: Email, Internal, Telegram
  - Recipients: Applicant (confirmation), Staff (notification)
  
- [ ] **Eligibility Result**
  - Trigger: Eligibility evaluation completes
  - Channels: Email, Internal
  - Recipients: Applicant (result), Organization staff (alert)
  
- [ ] **Program Match**
  - Trigger: Applicant matched to program
  - Channels: Email, Internal
  - Recipients: Applicant (match notification), Staff (assignment)
  
- [ ] **Case Closed**
  - Trigger: Application case marked closed
  - Channels: Email, Internal
  - Recipients: Applicant (closure notice), Staff (confirmation)

### Organization/Admin Notifications

- [ ] **New User Registered**
  - Trigger: User account creation
  - Channels: Telegram, Internal
  - Recipients: Organization Admin
  
- [ ] **New Application Submitted**
  - Trigger: Application form submitted
  - Channels: Telegram, Internal
  - Recipients: Organization Admin, Assigned reviewer
  
- [ ] **New Document**
  - Trigger: Document uploaded by applicant
  - Channels: Telegram, Internal
  - Recipients: Organization staff, Case assigned reviewer
  
- [ ] **Internal Notification** (Fallback)
  - Trigger: Any unrouted notification event
  - Channels: Internal
  - Recipients: Organization admin

**Total Notifications**: 15 distinct types  
**Total Channels**: Email, Telegram, Internal  
**Total Recipient Types**: Applicant, Organization Admin, Assigned Staff, System

---

## Part 2: Runtime Flow Audit

For every notification, verify complete flow:

```
Business Action (e.g., Submit Application)
    ↓
    Event Created (e.g., application_submitted)
    ↓ [Verify event fired with correct data]
    NotificationService.notify() called
    ↓ [Verify notify() invoked]
    Recipient Resolution (AudienceResolver)
    ↓ [Verify correct recipients identified]
    Template Resolution (Template lookup)
    ↓ [Verify correct template loaded]
    Channel Selection (Email/Telegram/Internal)
    ↓ [Verify appropriate channels selected]
    Provider Call (Resend/Telegram API)
    ↓ [Verify provider.send() invoked with correct context]
    NotificationLog Created (Database record)
    ↓ [Verify log entry persisted]
    Delivery Confirmed (Provider response captured)
    ↓ [Verify delivery status recorded]
```

**Evidence to capture at each step**:
1. Console logs (if debug enabled)
2. Event payload (what data triggered this?)
3. Recipient resolution (who got identified as recipient?)
4. Template ID (which template was used?)
5. Provider response (success/failure from API)
6. NotificationLog entry (database record)
7. Delivery status (SENT/FAILED/PENDING)

---

## Part 3: Recipient Audit (Heloci-Specific)

**Verify not just delivery, but delivery to the correct person.**

### Business Logic Rules

#### Welcome Email (user_registered)
**Must receive**:
- [ ] Applicant who registered (email from registration form)

**Must NOT receive**:
- [ ] Organization admin (only Telegram admin alert)
- [ ] Other applicants
- [ ] Staff members

**How to verify**: Query NotificationLog for user_registered events, confirm all recipients are registered users

#### Document Request (document_requested)
**Must receive**:
- [ ] Applicant who owns the application (applicationId → userId)

**Must NOT receive**:
- [ ] Organization admin (gets internal notification only)
- [ ] Other applicants
- [ ] Unrelated staff

**How to verify**: Check DocumentRequest record, confirm email recipient matches application owner

#### New Application Alert (new_application)
**Must receive**:
- [ ] Organization admin for that application's organization
- [ ] Assigned reviewer (if assigned)

**Must NOT receive**:
- [ ] Applicant (no self-notification)
- [ ] Admins from other organizations
- [ ] Unassigned staff

**How to verify**: Query organization membership, confirm admin belongs to application's organization

#### Status Change (application_status_changed)
**Must receive**:
- [ ] Applicant who submitted the application
- [ ] Organization admin (internal)
- [ ] Assigned staff (internal)

**Must NOT receive**:
- [ ] Organization admin from different organization
- [ ] Applicants from other applications
- [ ] Random staff members

**How to verify**: Check ProgramApplication owner, compare with NotificationLog recipient

#### Document Upload (document_uploaded)
**Must receive**:
- [ ] Applicant (confirmation email)
- [ ] Requesting staff member (telegram/internal alert)

**Must NOT receive**:
- [ ] Applicant who didn't request document
- [ ] Staff who didn't request document
- [ ] Other applicants
- [ ] Organization admins not assigned to case

**How to verify**: Check DocumentRequest.requestedBy field, compare with log recipients

### Recipient Verification Checklist

For each notification type, create a test case:

| Notification | Expected Recipient | Expected Org | Expected Role | Actual Recipient | Correct? |
|--------------|-------------------|--------------|----------------|-----------------|----------|
| Welcome Email | Registered User | Any | Applicant | [Check log] | ✓/✗ |
| Doc Request | Application Owner | Correct Org | Applicant | [Check log] | ✓/✗ |
| New App Alert | Org Admin | Correct Org | Admin | [Check log] | ✓/✗ |
| Status Change | Applicant | Correct Org | Applicant | [Check log] | ✓/✗ |
| Document Upload | Requesting Staff | Correct Org | Staff | [Check log] | ✓/✗ |

---

## Part 4: Template Audit

**Verify every notification loads the expected template with all variables resolved.**

### Template Existence Checks

For each notification type:

```sql
SELECT id, eventName, channel, subject, html, plainText, variables, active, status
FROM NotificationTemplate
WHERE eventName = 'user_registered' 
  AND channel = 'email'
  AND active = true
  AND status = 'PUBLISHED'
```

### Template Variable Resolution Checks

**Common Heloci template variables**:
- `{{firstName}}` — Applicant first name
- `{{lastName}}` — Applicant last name
- `{{organizationName}}` — Organization name
- `{{applicationId}}` — Application ID
- `{{status}}` — Current application status
- `{{documentName}}` — Name of requested document
- `{{deadline}}` — Document request deadline
- `{{programName}}` — Program name
- `{{eligibilityScore}}` — Eligibility evaluation score
- `{{adminName}}` — Admin/staff member name

### Template Audit Checklist

For each notification:

| Event | Channel | Template Exists | Template Active | Variables Defined | All Vars Resolved | Notes |
|-------|---------|-----------------|-----------------|-------------------|-------------------|-------|
| user_registered | email | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| user_registered | telegram | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| document_requested | email | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| application_submitted | email | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |

**Check for**:
- [ ] Template exists in database
- [ ] Template marked as `active = true`
- [ ] Template status = `PUBLISHED`
- [ ] All `{{variable}}` placeholders have matching values in payload
- [ ] No unresolved placeholders in rendered output

---

## Part 5: Provider Audit

### Email Provider (Resend)

**Capture for every email notification**:

```json
{
  "to": "applicant@example.com",
  "from": "support@heloci.us",
  "subject": "{{subject}}",
  "html": "...",
  "messageId": "...",
  "status": "sent|failed",
  "errorCode": "...",
  "timestamp": "..."
}
```

**Checklist**:
- [ ] API key present in environment
- [ ] Sender email configured: `COMMUNICATION_SENDER_EMAIL`
- [ ] HTTP 200 response received
- [ ] Message ID returned by Resend
- [ ] Email actually arrives in test inbox

**Provider Evidence Table**:

| Event | Email To | From | Subject | Status | Message ID | Notes |
|-------|----------|------|---------|--------|-----------|-------|
| user_registered | user@example.com | support@heloci.us | Welcome | ✓/✗ | msg_xxx | |
| application_submitted | user@example.com | support@heloci.us | Application Received | ✓/✗ | msg_xxx | |

### Telegram Provider

**Capture for every Telegram notification**:

```json
{
  "chat_id": "7060936226",
  "text": "New application submitted by John Doe",
  "status": "sent|failed",
  "messageId": "...",
  "timestamp": "..."
}
```

**Checklist**:
- [ ] Bot token present: `TELEGRAM_BOT_TOKEN`
- [ ] Chat ID configured: `TELEGRAM_CHAT_ID`
- [ ] HTTP 200 response from Telegram API
- [ ] Message ID returned
- [ ] Message actually appears in Telegram chat

**Provider Evidence Table**:

| Event | Chat ID | Message | Status | Telegram Message ID | Notes |
|-------|---------|---------|--------|-------------------|-------|
| new_application | 7060936226 | New app from... | ✓/✗ | msg_xxx | |
| document_uploaded | 7060936226 | Doc uploaded... | ✓/✗ | msg_xxx | |

---

## Part 6: Database Audit

**Verify correct organization records are queried.**

### Tables to Verify

For every notification, check:

```sql
-- NotificationTemplate used
SELECT * FROM NotificationTemplate WHERE id = '[template_from_log]'

-- NotificationLog entry
SELECT * FROM NotificationLog WHERE eventName = 'user_registered'

-- CommunicationSettings configuration
SELECT * FROM CommunicationSettings WHERE id = 'default'

-- SenderIdentity used
SELECT * FROM SenderIdentity WHERE id = '[sender_id_from_log]'

-- OrganizationCommunication if applicable
SELECT * FROM OrganizationCommunication WHERE organizationId = '[org_id]'
```

### Organization Isolation Verification

**Critical for multi-tenant safety**:

```sql
-- Verify user belongs to correct organization
SELECT u.id, u.email, om.organizationId 
FROM User u 
JOIN OrganizationMember om ON u.id = om.userId 
WHERE u.id = '[userId_from_notification]'

-- Verify notification went to correct org
SELECT nl.recipient, nl.userId, u.email, om.organizationId
FROM NotificationLog nl
JOIN User u ON nl.userId = u.id
JOIN OrganizationMember om ON u.id = om.userId
```

**Checklist**:
- [ ] Notification queried user from correct organization
- [ ] Template used belongs to correct organization (if org-specific)
- [ ] Recipient email matches organization member
- [ ] No cross-organization data leakage

---

## Part 7: Business Rule Audit

**Verify notifications occur ONLY when they should.**

### Registration Flow Rules

```
When: User completes signup form
Then: 
  ✓ Exactly ONE welcome email sent (no duplicates)
  ✓ Exactly ONE admin telegram alert sent
  ✓ Exactly ONE internal notification logged
  ✓ NOT sent again if user logs in later
```

**Audit evidence**:
```sql
SELECT COUNT(*), eventName, userId
FROM NotificationLog 
WHERE eventName = 'user_registered'
GROUP BY userId
-- Should show COUNT(*) = 1 for each user
```

### Document Request Rules

```
When: Staff creates DocumentRequest
Then:
  ✓ Exactly ONE email sent to applicant
  ✓ NOT sent when request is edited without change
  ✓ NOT sent if request already expired
  ✓ NOT duplicate sends
```

**Audit evidence**:
```sql
SELECT nr.id, nr.applicationId, COUNT(nl.id) as notification_count
FROM DocumentRequest nr
LEFT JOIN NotificationLog nl ON nl.eventName = 'document_requested' 
  AND nl.payload->>'documentRequestId' = nr.id
GROUP BY nr.id
HAVING COUNT(nl.id) > 1
-- Should return empty (no duplicates)
```

### Status Change Rules

```
When: Application status changes (Pending → Approved)
Then:
  ✓ Email sent to applicant
  ✓ Internal alert sent to staff
  ✓ NOT sent on minor edits without status change
  ✓ NOT sent if user manually updates field
```

**Audit evidence**:
- Check ApplicationEvent records
- Verify notification sent only when `fromStatus` != `toStatus`
- Verify timestamp correlation

### Business Rule Audit Table

| Rule | Expected Behavior | Actual Behavior | Correct? |
|------|-------------------|-----------------|----------|
| No duplicate registration emails | 1 email per signup | [Check count] | ✓/✗ |
| Doc request only when created | Email only on creation | [Check timeline] | ✓/✗ |
| Status change only on transition | Email only when status changes | [Check events] | ✓/✗ |
| No cross-org leakage | Org1 data never sent to Org2 | [Check recipients] | ✓/✗ |

---

## Part 8: Regression Matrix

Complete pass/fail matrix for certification:

| Event | Event Fired | Recipient Correct | Template Correct | Email Delivered | Telegram Delivered | Log Created | Status |
|-------|-------------|-------------------|------------------|-----------------|-------------------|-------------|--------|
| user_registered | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | 🔴/🟡/🟢 |
| email_verification | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| user_login | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🟢 |
| password_reset | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| application_submitted | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| application_under_review | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| application_status_changed | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| document_requested | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| document_uploaded | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | 🔴/🟡/🟢 |
| eligibility_result | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| program_match | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| case_closed | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | 🔴/🟡/🟢 |
| new_user | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | ✓/✗ | 🔴/🟡/🟢 |
| new_application | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | ✓/✗ | 🔴/🟡/🟢 |
| new_document | ✓/✗ | ✓/✗ | ✓/✗ | N/A | ✓/✗ | ✓/✗ | 🔴/🟡/🟢 |

**Legend**:
- 🟢 = All checks pass (ready for production)
- 🟡 = Some checks fail (minor issue)
- 🔴 = Critical failure (blocks production)

---

## Part 9: Root Cause Ranking

When audit identifies failures, rank them:

### Example Failure Analysis

**Failure**: Welcome email not sent

**Rank by severity**:

```
1. CRITICAL: user_registered event not fired
   Location: authActions.ts → registerUserAccount()
   Fix: Ensure publishEvent('user_registered', ...) is called
   Impact: No applicants receive welcome email
   Effort: 5 min

2. CRITICAL: Template missing
   Location: Database - NotificationTemplate table
   Fix: Insert welcome email template
   Impact: No welcome email can be sent
   Effort: 10 min

3. MEDIUM: Recipient resolution fails
   Location: AudienceResolver → resolveApplicant()
   Fix: Verify userId is passed correctly
   Impact: Email sent to wrong person
   Effort: 15 min

4. MEDIUM: Telegram channel disabled
   Location: CommunicationSettings → channels.telegram
   Fix: Enable telegram channel in settings
   Impact: Admin notifications not sent
   Effort: 2 min

5. LOW: NotificationLog not writing
   Location: notification.service.ts → persistNotificationLog()
   Fix: Verify Prisma connection
   Impact: Audit trails incomplete
   Effort: 10 min
```

### Severity Scale

- **CRITICAL**: Blocks functionality (notifications never sent)
- **HIGH**: Causes wrong behavior (sent to wrong person/time)
- **MEDIUM**: Partial failure (some channels work, others don't)
- **LOW**: Cosmetic (logging, retry logic)

---

## Part 10: Deliverables

After audit execution, Kiro will generate:

### 1. **Notification Inventory** ✅
Complete catalog of all 15+ notification types with event names, channels, recipients

### 2. **Runtime Flow Diagram** 
Visual showing: Event → notify() → Resolution → Template → Provider → Log

### 3. **Recipient Matrix**
Who should receive each notification (applicant/admin/staff)

### 4. **Template Matrix**
Which template is used for each event+channel combination

### 5. **Provider Matrix**
Email/Telegram delivery status for each notification

### 6. **Regression Matrix**
Pass/fail table for all 15+ notification types

### 7. **Root Cause Report**
Detailed analysis of every failure with exact location and fix recommendation

### 8. **Minimal Fix List**
Ranked by severity, estimated effort to fix

---

## Part 11: Permanent Regression Test Suite

After audit, Kiro will generate automated test file: `tests/communication-production-certification.test.ts`

**Test every notification**:

```typescript
describe('Communication Production Certification', () => {
  
  test('user_registered: event fires with correct payload', async () => {
    // Signup → verify event published
    // Verify payload contains userId, email, firstName, etc.
  })
  
  test('user_registered: recipient is correct (applicant, not admin)', async () => {
    // Verify NotificationLog recipient = registered user email
    // Verify NOT sent to admin
  })
  
  test('user_registered: uses welcome template', async () => {
    // Verify templateUsed = welcome_email_user_registered
    // Verify template variables resolved
  })
  
  test('user_registered: email delivered via Resend', async () => {
    // Verify provider response captured
    // Verify status = SENT/DELIVERED
    // Verify message ID from Resend
  })
  
  test('user_registered: logged to NotificationLog', async () => {
    // Verify NotificationLog entry exists
    // Verify deliveryStatus = DELIVERED
    // Verify timestamps correct
  })

  // ... repeat for all 15+ notifications
  
  test('no duplicate registration emails', async () => {
    // Signup → verify exactly 1 email log entry
    // Not 2, not 3, exactly 1
  })
  
  test('no cross-organization data leakage', async () => {
    // Create users in Org1 and Org2
    // Verify Org1 notifications don't reach Org2 members
  })
  
  test('status change only on actual transition', async () => {
    // Create application with status PENDING
    // Update application (no status change)
    // Verify NO notification sent
    // Change status to APPROVED
    // Verify notification sent
  })
})
```

**Test Coverage**:
- ✅ Event fired
- ✅ Provider called
- ✅ NotificationLog written
- ✅ Correct recipient
- ✅ Correct template
- ✅ No duplicates
- ✅ No cross-org leakage
- ✅ Business rules enforced

---

## Success Criteria: Certification Table

Audit complete when all rows are 🟢:

| Area | Status | Evidence |
|------|--------|----------|
| Event Dispatch | 🟢/🟡/🔴 | All 15 events fire correctly |
| Recipient Resolution | 🟢/🟡/🔴 | Correct person receives each notification |
| Template Resolution | 🟢/🟡/🔴 | All templates exist, active, variables resolved |
| Email Delivery | 🟢/🟡/🔴 | All emails reach Resend, get message IDs |
| Telegram Delivery | 🟢/🟡/🔴 | Admin alerts reach Telegram chat |
| Notification Logging | 🟢/🟡/🔴 | All deliveries logged in database |
| Business Rules | 🟢/🟡/🔴 | No duplicates, no cross-org leakage, proper timing |
| Regression Suite | 🟢/🟡/🔴 | Automated tests covering all scenarios |

**If any row is not 🟢**: Report identifies exact failure point + minimal fix recommendation

---

## Execution Timeline

When database is fully accessible:

1. **Setup** (5 min) — Enable debug logging, prepare test data
2. **Authentication Audit** (20 min) — Test registration, login, password reset
3. **Applicant Lifecycle Audit** (30 min) — Test application, documents, status changes
4. **Organization Admin Audit** (15 min) — Test admin alerts, new user, new application
5. **Evidence Compilation** (15 min) — Build all matrices and reports
6. **Root Cause Analysis** (15 min) — Identify failures, rank by severity
7. **Regression Suite Generation** (15 min) — Create permanent test file

**Total Time**: ~2.5 hours for complete certification

---

## Ready to Execute

This audit specification is complete and ready for runtime execution. It will provide:

✅ **Definitive proof** of what works and what doesn't  
✅ **Exact failure points** for every issue  
✅ **Ranked fix list** (severity + effort)  
✅ **Minimal fixes** without architecture redesign  
✅ **Permanent regression tests** to prevent recurrence  
✅ **Production certification** for Heloci launch

</content>
</invoke>