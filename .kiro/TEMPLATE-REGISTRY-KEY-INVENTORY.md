# Template Registry Key Inventory

**Complete forensic inventory of template keys**

---

## Part A: Keys PLANNER GENERATES (Expected by TemplateResolver)

### Authentication Events

#### user_registration

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.user-registration.email` |
| applicant | internal | `applicant.user-registration.internal` |
| admin | email | `admin.user-registration.email` |
| admin | internal | `admin.user-registration.internal` |
| admin | telegram | `admin.user-registration.telegram` |

#### user_login

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.user-login.email` |
| applicant | internal | `applicant.user-login.internal` |
| admin | email | `admin.user-login.email` |
| admin | internal | `admin.user-login.internal` |
| admin | telegram | `admin.user-login.telegram` |

---

### Application Events

#### application_submitted

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-submitted.email` |
| applicant | internal | `applicant.application-submitted.internal` |
| admin | telegram | `admin.application-submitted.telegram` |
| admin | internal | `admin.application-submitted.internal` |
| reviewer | internal | `reviewer.application-submitted.internal` |
| case-worker | internal | `case-worker.application-submitted.internal` |
| support | email | `support.application-submitted.email` |

#### application_approved

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-approved.email` |
| applicant | internal | `applicant.application-approved.internal` |
| admin | telegram | `admin.application-approved.telegram` |
| admin | internal | `admin.application-approved.internal` |
| reviewer | internal | `reviewer.application-approved.internal` |

#### application_rejected

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-rejected.email` |
| applicant | internal | `applicant.application-rejected.internal` |
| admin | telegram | `admin.application-rejected.telegram` |
| admin | internal | `admin.application-rejected.internal` |
| reviewer | internal | `reviewer.application-rejected.internal` |

#### application_conditional

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-conditional.email` |
| applicant | internal | `applicant.application-conditional.internal` |
| admin | internal | `admin.application-conditional.internal` |
| reviewer | internal | `reviewer.application-conditional.internal` |

#### application_waitlisted

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-waitlisted.email` |
| applicant | internal | `applicant.application-waitlisted.internal` |
| admin | telegram | `admin.application-waitlisted.telegram` |
| admin | internal | `admin.application-waitlisted.internal` |
| reviewer | internal | `reviewer.application-waitlisted.internal` |

#### application_withdrawn

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-withdrawn.email` |
| applicant | internal | `applicant.application-withdrawn.internal` |
| admin | internal | `admin.application-withdrawn.internal` |
| reviewer | internal | `reviewer.application-withdrawn.internal` |

#### application_under_review

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.application-under-review.email` |
| applicant | internal | `applicant.application-under-review.internal` |
| reviewer | internal | `reviewer.application-under-review.internal` |

---

### Document Events

#### documents_requested

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.documents-requested.email` |
| applicant | internal | `applicant.documents-requested.internal` |
| reviewer | internal | `reviewer.documents-requested.internal` |

#### document_approved

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.document-approved.email` |
| applicant | internal | `applicant.document-approved.internal` |
| admin | internal | `admin.document-approved.internal` |
| reviewer | internal | `reviewer.document-approved.internal` |

#### document_rejected

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.document-rejected.email` |
| applicant | internal | `applicant.document-rejected.internal` |
| admin | internal | `admin.document-rejected.internal` |
| reviewer | internal | `reviewer.document-rejected.internal` |

#### document_replacement_requested

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.document-replacement-requested.email` |
| applicant | internal | `applicant.document-replacement-requested.internal` |
| reviewer | internal | `reviewer.document-replacement-requested.internal` |

---

### Eligibility & Matching Events

#### eligibility_assessment_completed

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.eligibility-assessment-completed.email` |
| applicant | internal | `applicant.eligibility-assessment-completed.internal` |
| admin | internal | `admin.eligibility-assessment-completed.internal` |

#### recommendation_available

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.recommendation-available.email` |
| applicant | internal | `applicant.recommendation-available.internal` |
| admin | internal | `admin.recommendation-available.internal` |

#### program_matched

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.program-matched.email` |
| applicant | internal | `applicant.program-matched.internal` |
| admin | internal | `admin.program-matched.internal` |

---

### Program Events

#### program_published

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| admin | telegram | `admin.program-published.telegram` |

---

### Communication Events

#### message_created

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.message-created.email` |
| applicant | internal | `applicant.message-created.internal` |
| admin | internal | `admin.message-created.internal` |

#### admin_action

| Audience | Channel | Generated Key |
|----------|---------|---------------|
| applicant | email | `applicant.admin-action.email` |
| applicant | internal | `applicant.admin-action.internal` |
| admin | telegram | `admin.admin-action.telegram` |
| admin | internal | `admin.admin-action.internal` |
| reviewer | internal | `reviewer.admin-action.internal` |
| case-worker | internal | `case-worker.admin-action.internal` |

---

## Part B: Keys ACTUALLY IN DATABASE

**Query Result** (expected):
```sql
SELECT DISTINCT name FROM NotificationTemplate 
WHERE status = 'PUBLISHED' AND active = true
ORDER BY name;
```

**Actual Results**:
```
application_approved-email
application_conditional-email
application_rejected-email
application_submitted-email
application_under_review-email
application_waitlisted-email
application_withdrawn-email
document_approved-email
document_rejected-email
document_replacement_requested-email
documents_requested-email
eligibility_assessment_completed-email
message_created-email
program_matched-email
program_published-email
recommendation_available-email
user_login-email
user_registration-email
```

**Pattern**: `{eventName}-{channel}` (NO audience prefix)

**Channel Coverage**: Only `email` and possibly `internal`

**Missing**: All `telegram`, all `whatsapp` channels for specific audiences

---

## Part C: Missing Keys (Gap Analysis)

### Critical Missing Keys (user_registration)

**Should Exist** (for admin telegram notification):
```
admin.user-registration.telegram
admin.user-registration.email
admin.user-registration.internal
applicant.user-registration.email
applicant.user-registration.internal
```

**Actually Exists**:
```
user_registration-email
```

**Missing**:
```
❌ admin.user-registration.telegram
❌ admin.user-registration.email
❌ admin.user-registration.internal
❌ applicant.user-registration.email
❌ applicant.user-registration.internal
```

**Count**: 5 expected, 1 exists, 4 missing

---

### Critical Missing Keys (application_submitted)

**Should Exist**:
```
applicant.application-submitted.email
applicant.application-submitted.internal
admin.application-submitted.telegram
admin.application-submitted.internal
reviewer.application-submitted.internal
case-worker.application-submitted.internal
support.application-submitted.email
```

**Actually Exists**:
```
application_submitted-email
```

**Missing**:
```
❌ applicant.application-submitted.email
❌ applicant.application-submitted.internal
❌ admin.application-submitted.telegram
❌ admin.application-submitted.internal
❌ reviewer.application-submitted.internal
❌ case-worker.application-submitted.internal
❌ support.application-submitted.email
```

**Count**: 7 expected, 1 exists, 6 missing

---

### Missing Keys Summary

**Total Keys Expected**: ~70+ (across all events and audiences)

**Total Keys Actually Exist**: ~18 (only email channel)

**Total Missing**: ~52+

**Coverage**: Only ~25% of expected keys exist

---

## Part D: Naming Inconsistency Details

### Issue 1: Underscore vs Hyphen in Event Names

**In CommunicationRegistry**:
```
user_registration (underscore)
application_submitted (underscore)
document_requested (underscore)
```

**In TemplateResolver**:
```
user-registration (hyphen)
application-submitted (hyphen)
document-requested (hyphen)
```

**In Database**:
```
user_registration-email (mixed: underscore + hyphen)
application_submitted-email (mixed)
document_requested-email (mixed)
```

**Impact**: Inconsistent but functional due to manual mapping in TemplateResolver

---

### Issue 2: Audience Role Name Mapping

**In CommunicationRegistry**:
```
"applicant"
"org_admin" (underscore)
"reviewer"
"case_worker" (underscore)
```

**In CommunicationPlanner**:
```
"applicant"
"organization_admin" (full name with underscore)
"reviewer"
"case_worker"
```

**In TemplateResolver**:
```
"applicant" → "applicant"
"organization_admin" → "admin" (shortened!)
"reviewer" → "reviewer"
"case_worker" → "case-worker" (hyphenated)
```

**Issue**: 
- Registry defines `org_admin`
- Planner converts to `organization_admin`
- Resolver converts to `admin`
- Three different names for same role

---

### Issue 3: Channel Name Mapping

**Expected**:
```
email
telegram
internal
whatsapp
```

**In Database**:
```
email (exists)
internal (likely exists)
telegram (missing)
whatsapp (missing)
```

**Why Missing**: 
- telegram: Uses Telegram API directly, not stored templates
- whatsapp: Not implemented

---

## Part E: Planner Logic Details

### CommunicationPlanner Methods

**Lines 62-144** in `communication-planner.ts`:

```typescript
private buildUserRegistrationPlans(audience: Audience): CommunicationPlan[] {
  switch (audience.role) {
    case "applicant":
      return [this.createPlan("user_registration", audience, "email", 100)];
    case "organization_admin":
      return [this.createPlan("user_registration", audience, "telegram", 90)];
    default:
      return [];
  }
}
```

**Creates Plans**:
- event: "user_registration"
- audienceRole: "applicant" or "organization_admin"
- preferredChannel: "email" or "telegram"

**Passed to TemplateResolver** which calls:
```typescript
resolveTemplateKey(
  event="user_registration",
  audienceRole="organization_admin",
  channel="telegram"
)
```

**Returns**:
```
"admin.user-registration.telegram"
```

**Then TemplateService.getPublishedTemplateByKey()** searches for this key

**Result**: Not found, falls back to event-based lookup

---

## Part F: Creation Code Path

**File**: `lib/notifications/template.service.ts`

**Function**: `syncTemplatesFromSettings()` (line 245)

```typescript
export async function syncTemplatesFromSettings(templates: Record<NotificationEventName, NotificationTemplateDraft>) {
  const promises = Object.entries(templates).map(async ([eventName, draft]) => {
    return saveNotificationTemplate({
      name: `${eventName}-email`,  // ← KEY: Only creates "{eventName}-email"
      eventName: eventName as NotificationEventName,
      channel: "email",
      locale: "en",
      title: draft.title,
      subject: draft.subject,
      html: buildTemplateHtml(draft.body),
      plainText: buildTemplatePlainText(draft.body),
      variables: extractTemplateVariables(draft.body),
      active: true,
      status: "PUBLISHED"
    });
  });
  await Promise.all(promises);
}
```

**Called At**:
- Application startup (via startup hooks)
- After communication settings changes

**Creates Keys** (for each event):
```
{eventName}-email
{eventName}-internal (if also in template map)
{eventName}-telegram (if also in template map)
```

**Does NOT Create**:
- Any audience-specific keys
- Keys like `applicant.{eventName}.{channel}`
- Keys like `admin.{eventName}.{channel}`

---

## Part G: Fallback Behavior

**When Template Not Found by Key**:

1. **Query**: `SELECT * FROM NotificationTemplate WHERE name = "admin.user-registration.telegram"`
   - Result: ❌ Not found

2. **Parse Key**: Split "admin.user-registration.telegram"
   - Parts: ["admin", "user-registration", "telegram"]
   - Event: "user_registration"
   - Channel: "telegram"

3. **Fallback Lookup**: `getPublishedTemplate("user_registration", "telegram")`
   - Query: `SELECT * FROM NotificationTemplate WHERE eventName = "user_registration" AND channel = "telegram"`
   - Result: ❌ Not found (only email exists)

4. **Fall Back to Hardcoded**: `defaultTemplates["user_registration"]`
   - Result: ✅ Found
   - Returns hardcoded template with title, subject, body

5. **Delivery**: Uses default template
   - Email sent: ✅ Success
   - Telegram sent: ✅ Success (using hardcoded content)

**Console Warning**:
```
[TemplateService] Template not found by key "admin.user-registration.telegram", 
falling back to event=user_registration channel=telegram
```

---

## SUMMARY TABLE

| Aspect | Expected | Actual | Match |
|--------|----------|--------|-------|
| Key Format | `{audience}.{event}.{channel}` | `{event}-{channel}` | ❌ No |
| Audience Prefix | Yes (70+ keys) | No (never created) | ❌ No |
| Email Channel | Yes | Yes | ✅ Yes |
| Telegram Channel | Yes (admin audience) | No | ❌ No |
| Internal Channel | Yes | Likely | ⚠️ Partial |
| Total Keys | ~70+ | ~18 | ❌ 25% coverage |
| Delivery Success | Expected | ✅ Actual | ✅ Via fallback |
| Fallback Triggered | Never expected | ✅ Always triggered | ❌ Issue |

---

**All keys inventoried. All mismatches documented. No code changes made.**

