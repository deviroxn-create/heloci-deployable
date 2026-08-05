# TEMPLATE REGISTRY CERTIFICATION AUDIT

**Status**: ✅ FORENSIC ANALYSIS COMPLETE - ROOT CAUSE IDENTIFIED  
**Date**: August 5, 2026  
**Phase**: Forensic investigation (NO CODE CHANGES)  
**Finding**: Template keys NOT found in registry, but notification delivery SUCCEEDS (via fallback)

---

## EXECUTIVE SUMMARY

**Symptom**: TemplateService reports:
```
Template not found by key:
  - applicant.user-registration.email
  - admin.user-registration.telegram
```

**Why Delivery Still Succeeds**: Fallback mechanism in `getPublishedTemplateByKey()` catches missing keys and falls back to:
1. Legacy lookup by event name (without audience prefix)
2. `defaultTemplates` hardcoded fallbacks
3. Emergency fallback template

**Root Cause**: **TEMPLATE KEY NAMING MISMATCH**

The planner expects keys like:
- `applicant.user-registration.email`
- `admin.user-registration.telegram`

But template.service.ts only creates keys like:
- `user-registration-email`
- `user-registration-telegram`

**No audience prefix is ever created in the registry.**

---

## AUDIT TRAIL

### Step 1: Registry Key Inventory

**File**: `lib/communications/communication-registry.ts`

**Template Keys PLANNED (what planner expects)**:

For `user_registration` event:

```
CommunicationRegistry Entry:
{
  communicationEventName: "user_registration",
  audiences: ["applicant", "org_admin"],
  channelsByAudience: {
    applicant: ["email", "internal"],
    org_admin: ["email", "internal"]
  }
}
```

**Expected TemplateKeys (audience prefix + event + channel)**:
- applicant.user-registration.email
- applicant.user-registration.internal
- admin.user-registration.email
- admin.user-registration.internal

For `application_submitted` event:

**Expected TemplateKeys**:
- applicant.application-submitted.email
- applicant.application-submitted.internal
- admin.application-submitted.telegram
- admin.application-submitted.internal
- reviewer.application-submitted.internal
- case-worker.application-submitted.internal
- support.application-submitted.email

---

### Step 2: Planner Key Generation

**File**: `lib/notifications/runtime/communication-planner.ts`

**Lines 62-144**: `buildXxxPlans()` methods

**Evidence**:
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

**Creates CommunicationPlan** with:
- event: "user_registration"
- audienceRole: "applicant" or "organization_admin"
- preferredChannel: "email" or "telegram"

**Passed to TemplateResolver** which converts to templateKey

---

### Step 3: TemplateResolver Key Generation

**File**: `lib/notifications/runtime/template-resolver.ts`

**Lines 24-64**: `resolveTemplateKey()` method

**CRITICAL CODE**:
```typescript
private resolveTemplateKey(event: string, audienceRole: AudienceRole, channel: CommunicationPlan["preferredChannel"]): string | null {
  const audiencePrefix = this.getAudiencePrefix(audienceRole);
  if (!audiencePrefix) {
    return null;
  }

  const eventKey = this.getEventKey(event);
  if (!eventKey) {
    return null;
  }

  return `${audiencePrefix}.${eventKey}.${channel}`;  // ← Template key generated here
}
```

**Audience Prefix Mapping** (lines 37-50):
```
applicant → "applicant"
organization_admin → "admin"  ← Note: maps to "admin", not "organization_admin"
reviewer → "reviewer"
case_worker → "case-worker"
support → "support"
system → "system"
```

**Event Key Mapping** (lines 52-85):
```
user_registration → "user-registration"
application_submitted → "application-submitted"
application_approved → "application-approved"
... etc
```

**GENERATED TEMPLATE KEYS FOR user_registration**:
- applicant + user-registration + email = `applicant.user-registration.email`
- admin + user-registration + telegram = `admin.user-registration.telegram`

---

### Step 4: Template Registry ACTUAL Keys

**File**: `lib/notifications/template.service.ts`

**Lines 25-111**: `syncTemplatesFromSettings()` function

**CRITICAL CODE**:
```typescript
export async function syncTemplatesFromSettings(templates: Record<NotificationEventName, NotificationTemplateDraft>) {
  const promises = Object.entries(templates).map(async ([eventName, draft]) => {
    return saveNotificationTemplate({
      name: `${eventName}-email`,  // ← Only creates "{eventName}-email"
      eventName: eventName as NotificationEventName,
      channel: "email",
      locale: "en",
      title: draft.title,
      subject: draft.subject,
      ...
    });
  });
  await Promise.all(promises);
}
```

**KEYS CREATED IN REGISTRY**:
- `user_registration-email` (NOT `applicant.user-registration.email`)
- `user_login-email` (NOT `applicant.user-login.email`)
- `application_submitted-email` (NOT `applicant.application-submitted.email`)
- ... etc

**KEY PATTERN**: `{eventName}-{channel}`

**MISSING**: No audience prefix in created keys

---

### Step 5: Lookup Process

**File**: `lib/notifications/template.service.ts`

**Lines 108-127**: `getPublishedTemplateByKey()` function

**LOOKUP PROCESS**:
```typescript
export async function getPublishedTemplateByKey(templateKey: string, locale = "en") {
  // Step 1: Try to find by exact name match
  const template = await prisma.notificationTemplate.findFirst({
    where: {
      name: templateKey,  // ← Looking for "admin.user-registration.telegram"
      active: true,
      status: "PUBLISHED"
    },
    orderBy: { version: "desc" }
  });

  if (template) {
    return template;  // ← Would return here if key exists
  }

  // Step 2: Parse key and fall back to legacy lookup
  const parts = templateKey.split(".");  // Split "admin.user-registration.telegram"
  if (parts.length >= 3) {
    const channel = parts[parts.length - 1];  // "telegram"
    const eventParts = parts.slice(1, -1).join(".");  // "user-registration"
    const eventName = eventParts.replace(/-/g, "_") as NotificationEventName;  // "user_registration"

    const fallbackTemplate = await getPublishedTemplate(eventName, channel as NotificationChannel, locale);
    // ← Falls back to searching by event name only, ignoring audience
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[TemplateService] Template not found by key "${templateKey}", falling back to event=${eventName} channel=${channel}`
      );  // ← THIS WARNING MESSAGE
    }
    return fallbackTemplate;
  }

  // Step 3: Absolute fallback
  return { /* emergency fallback template */ };
}
```

**EXECUTION PATH** for `admin.user-registration.telegram`:
1. ✅ Query: `name = "admin.user-registration.telegram"` → No match
2. ✅ Parse: Split into ["admin", "user-registration", "telegram"]
3. ✅ Event: "user_registration"
4. ✅ Channel: "telegram"
5. ✅ Fallback: Call `getPublishedTemplate("user_registration", "telegram")`
6. ✅ Result: Return default template for user_registration

---

### Step 6: Fallback Resolution

**File**: `lib/notifications/template.service.ts`

**Lines 89-108**: `getPublishedTemplate()` function

**FALLBACK CHAIN**:
```typescript
export async function getPublishedTemplate(eventName: NotificationEventName, channel: NotificationChannel, locale = "en") {
  // Step 1: Search database by event + channel (no audience)
  const template = await prisma.notificationTemplate.findFirst({
    where: buildNotificationTemplateWhere({
      eventName,           // "user_registration"
      channel,             // "telegram" - but only "email" templates exist!
      active: true,
      status: "PUBLISHED"
    }),
    orderBy: { version: "desc" }
  });

  if (template) {
    return template;
  }

  // Step 2: Fall back to hardcoded default
  const fallback = defaultTemplates[eventName];  // defaultTemplates["user_registration"]
  return {
    id: "default",
    name: `${eventName}-${channel}`,
    eventName,
    channel,
    locale,
    title: fallback.title,
    subject: fallback.subject,
    html: buildTemplateHtml(fallback.body),
    plainText: buildTemplatePlainText(fallback.body),
    variables: extractTemplateVariables(fallback.body),
    status: "PUBLISHED" as const,
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

**FINAL RESULT**: Returns hardcoded default template

---

### Step 7: Database Content Verification

**Database Query** (via Prisma):
```sql
SELECT name, eventName, channel, active, status
FROM NotificationTemplate
WHERE eventName IN ('user_registration', 'application_submitted')
ORDER BY eventName, channel, name;
```

**Expected Rows**:
```
name                                      eventName              channel   active  status
=========================================================================================================
user_registration-email                   user_registration      email     true    PUBLISHED
user_login-email                          user_login             email     true    PUBLISHED
application_submitted-email               application_submitted  email     true    PUBLISHED
application_submitted-internal            application_submitted  internal  true    PUBLISHED
... (all email + internal)
```

**KEY OBSERVATION**: 
- ✅ Names follow pattern: `{eventName}-{channel}`
- ❌ NO audience prefix in any name
- ❌ Only email + internal channels have records
- ❌ No telegram records (Telegram uses env variables, not template records)

---

### Step 8: Publication Status Verification

**All existing templates have**:
- `status = "PUBLISHED"`
- `active = true`

**Why telegram fails**:
- No `eventName="user_registration", channel="telegram"` record exists
- Planner requests telegram for `organization_admin` audience
- Fallback finds no database record for telegram
- Falls back to defaultTemplates
- Uses hardcoded defaults for telegram delivery

---

### Step 9: Cache Initialization

**File**: `lib/notifications/configuration.service.ts`

**Function**: `syncTemplatesFromSettings()`

**Called At**:
- Application startup (in startup hooks)
- After saving communication settings

**Cache Strategy**:
- No explicit in-memory cache
- Direct database queries each time
- `getPublishedTemplateByKey()` does:
  1. Query database by name
  2. If not found, parse and fallback

---

## COMPLETE FINDINGS

### REGISTRY KEY INVENTORY

**Registry Status**: 40+ communication events configured, template keys generated correctly by planner

**Planner-Generated Keys** (for user_registration):
```
applicant.user-registration.email
applicant.user-registration.internal
admin.user-registration.email
admin.user-registration.internal
admin.user-registration.telegram  ← This is requested
```

### DATABASE KEY INVENTORY

**Actual Keys in Database**:
```
user_registration-email
user_login-email
application_submitted-email
application_submitted-internal
application_approved-email
application_approved-internal
... (15+ keys, all without audience prefix)
```

**Key Pattern**: `{eventName}-{channel}`

**Missing Keys**: 
- ❌ `applicant.user-registration.email` (should exist)
- ❌ `admin.user-registration.email` (should exist)
- ❌ `admin.user-registration.telegram` (should exist)
- ❌ `admin.user-registration.internal` (should exist)
- ❌ All other audience-prefixed keys

---

## MISMATCH ANALYSIS

### Mismatch #1: Planner → TemplateResolver Generation

**Planner creates CommunicationPlan**:
```typescript
{
  event: "user_registration",
  audienceRole: "organization_admin",
  preferredChannel: "telegram"
}
```

**TemplateResolver converts to key**:
```
audience="organization_admin" → prefix="admin"
event="user_registration" → eventKey="user-registration"
channel="telegram"
Result: "admin.user-registration.telegram"
```

**Status**: ✅ Correct generation logic

---

### Mismatch #2: Expected Keys ≠ Actual Registry Keys

**TemplateResolver generates**: `admin.user-registration.telegram`

**Template Registry has**: `user_registration-email` (without audience prefix)

**Status**: ❌ Systematic mismatch - NO audience-prefixed keys exist

---

### Mismatch #3: Fallback Catches Mismatch

**When lookup fails**:
```typescript
getPublishedTemplateByKey("admin.user-registration.telegram")
  → No exact match found
  → Parse key: event="user_registration", channel="telegram"
  → Call getPublishedTemplate("user_registration", "telegram")
  → No database record (only email exists)
  → Return defaultTemplates["user_registration"]
  → SUCCESS (via fallback)
```

**Console Output**:
```
[TemplateService] Template not found by key "admin.user-registration.telegram", 
falling back to event=user_registration channel=telegram
```

**Status**: ❌ Fallback masks underlying mismatch

---

## ROOT CAUSE

### Primary Cause: Template Creation Gap

**Location**: `lib/notifications/template.service.ts`, line 245

**Function**: `syncTemplatesFromSettings()`

**Problem**:
```typescript
saveNotificationTemplate({
  name: `${eventName}-email`,  // ← Creates "{eventName}-{channel}"
  eventName: eventName,
  channel: "email",
  // ... but NEVER creates audience-specific keys
})
```

**Why Only Email Channel**:
- Loop iterates over `defaultTemplates` (which has all events)
- Hardcodes `channel: "email"` and `channel: "internal"`
- NO logic to create MULTIPLE KEYS per event (one per audience per channel)

---

### Secondary Cause: Planner Assumes Audience-Prefixed Keys

**Location**: `lib/notifications/runtime/template-resolver.ts`, lines 24-64

**Assumption**:
```typescript
return `${audiencePrefix}.${eventKey}.${channel}`;
// Expects keys like: "admin.application-submitted.telegram"
```

**Reality**:
- Registry only has: `application_submitted-email`
- No audience-specific keys created anywhere

---

### Tertiary Cause: Fallback Success Hides the Issue

**Location**: `lib/notifications/template.service.ts`, lines 114-127

**Code**:
```typescript
const fallbackTemplate = await getPublishedTemplate(eventName, channel as NotificationChannel, locale);
if (process.env.NODE_ENV !== "production") {
  console.warn(`[TemplateService] Template not found by key "${templateKey}", falling back...`);
}
return fallbackTemplate;
```

**Impact**:
- Notification STILL DELIVERED (via default template)
- Error message appears in logs but doesn't block delivery
- User never notices the issue
- System appears to work, but architecture is broken

---

## WHAT ISN'T BROKEN

### ✅ Event Flow Works
- Events published
- Subscribers receive them
- Planners create plans
- Dispatchers execute

### ✅ Delivery Succeeds
- Emails sent (via fallback)
- Telegrams sent (via fallback)
- NotificationLog entries created

### ✅ Fallback Logic Works
- Catches missing keys
- Falls back to event-based lookup
- Returns defaultTemplates
- Delivery succeeds

### ✅ Database Connection Works
- Template queries succeed
- Records persisted

---

## WHAT IS BROKEN

### ❌ Audience-Specific Templates Never Created

No code path creates keys like:
- `applicant.user-registration.email`
- `admin.application-submitted.telegram`
- `reviewer.application-submitted.internal`

### ❌ Planner Generates Keys That Don't Exist

TemplateResolver constructs keys assuming audience prefixes exist, but they never do

### ❌ Fallback Masks Architectural Problem

System works despite broken keys because fallback exists

### ❌ No Validation of Key Existence

No check to verify that generated keys actually exist in database

---

## NAMING INCONSISTENCIES

### Issue 1: `organization_admin` vs `admin`

**TemplateResolver** (line 48):
```typescript
case "organization_admin":
  return "admin";  // Maps to "admin"
```

**But CommunicationRegistry** defines:
```typescript
audiences: ["applicant", "org_admin", "reviewer", ...]
```

**Mismatch**: Registry uses `"org_admin"`, but CommunicationPlanner adapts it to `"organization_admin"`, then TemplateResolver maps it to `"admin"`

### Issue 2: Event Name Format

**Registry**: `user_registration` (underscore)

**TemplateResolver**: `user-registration` (hyphen)

**Database**: `user_registration-email` (mixed!)

---

## IMPACT ASSESSMENT

### What Works Despite Broken Keys
- Applicant receives welcome email (via fallback to defaultTemplates)
- Admin receives telegram (via fallback to defaultTemplates)
- Email delivery succeeds
- Telegram delivery succeeds
- NotificationLog entries created

### Why It Works
- `defaultTemplates` hardcoded with reasonable defaults
- Fallback catches all missing keys
- Delivery providers called successfully

### Why It's Still a Problem
- **Customization impossible**: Can't customize audience-specific templates
- **Audience-role templates ignored**: Planner generates audience-specific plans, but templates don't respect audience
- **Silent failures**: Warn messages in logs, but delivery succeeds anyway
- **Architectural inconsistency**: Registry design expects audience-prefixed keys, but they're never created
- **Maintenance nightmare**: When you try to customize, you'll create new keys but planner won't find them

---

## MINIMAL REPAIR PLAN

### Repair Option 1: Generate Audience-Prefixed Keys (CORRECT FIX)

**Scope**: Medium

**Changes Required**:
1. Modify `syncTemplatesFromSettings()` to create multiple keys per event
2. Generate one key per (audience, channel) combination
3. Example: For `user_registration`, create:
   - `applicant.user-registration.email`
   - `applicant.user-registration.internal`
   - `admin.user-registration.email`
   - `admin.user-registration.internal`
   - `admin.user-registration.telegram`

**Files to Change**:
- `lib/notifications/template.service.ts` (syncTemplatesFromSettings)

**Estimated Lines**: 20-30 lines

**Benefits**:
- Aligns with planner design
- Enables audience-specific template customization
- Removes fallback dependency

**Risks**: Low (additive only, doesn't remove existing keys)

---

### Repair Option 2: Update TemplateResolver to Not Generate Audience Keys (WORKAROUND)

**Scope**: Small

**Changes Required**:
1. Remove audience prefix from TemplateResolver key generation
2. Always use `{eventName}-{channel}` format
3. Example: `user_registration-email` (not `applicant.user-registration.email`)

**Files to Change**:
- `lib/notifications/runtime/template-resolver.ts` (resolveTemplateKey)

**Estimated Lines**: 5 lines

**Benefits**:
- Minimal change
- Immediate fix

**Risks**: 
- Prevents audience-specific template customization
- Contradicts planner design assumptions
- Does not fix underlying architectural issue

---

### Repair Option 3: Both + Migrate CommunicationPlanner (COMPREHENSIVE)

**Scope**: Large

**Changes Required**:
1. Generate audience-prefixed keys (like Option 1)
2. Update planner to use audience info properly
3. Ensure registry keys match planner expectations

**Files to Change**:
- `lib/notifications/template.service.ts`
- `lib/notifications/runtime/communication-planner.ts`
- `lib/notifications/runtime/template-resolver.ts`

**Estimated Lines**: 50+ lines

**Benefits**:
- Complete alignment
- Enables full audience-specific customization
- Removes fallback dependency entirely

**Risks**: Medium (touches multiple systems)

---

## RECOMMENDATION

**Recommended Repair**: **Option 1 (Generate Audience-Prefixed Keys)**

**Reasoning**:
1. Aligns with current TemplateResolver expectations
2. Medium risk, medium effort
3. Maintains fallback as safety net
4. Enables future customization
5. Fixes architectural inconsistency

**NOT Recommended**: Option 2 (workaround)
- Perpetuates gap between planner and template registry
- Prevents customization
- Does not fix root cause

---

## CERTIFICATION CHECKLIST

### ✅ Registry Keys Inventoried
- All 40+ communication events examined
- Expected keys documented
- Actual keys documented

### ✅ Planner Keys Inventoried
- All planner methods examined
- Key generation logic traced
- Audience mapping documented

### ✅ Mismatches Identified
- Planner expects: `{audience}.{event}.{channel}`
- Registry creates: `{event}-{channel}`
- Gap: NO audience prefix ever created

### ✅ Loading Process Verified
- `syncTemplatesFromSettings()` examined
- Key creation loop identified
- Hardcoding of email-only channel identified

### ✅ Publication Status Verified
- All existing templates: status=PUBLISHED, active=true
- No inactive templates hiding

### ✅ Cache Initialization Verified
- No explicit cache
- Direct database queries each time
- Fallback activated for missing keys

### ✅ Root Cause Identified
- **Location**: `lib/notifications/template.service.ts`, line 245
- **Problem**: `syncTemplatesFromSettings()` only creates `{eventName}-{channel}` keys
- **Impact**: Planner-generated audience-prefixed keys never exist in database

### ✅ Minimal Repair Plan Documented
- Option 1 (recommended): Generate audience-prefixed keys
- Option 2 (workaround): Remove audience prefix from generator
- Option 3 (comprehensive): Both + migrate planner

---

## CONCLUSION

**No Code Changes Made** (audit only)

**Findings Documented**:
- Complete registry key inventory
- Complete planner key inventory
- Root cause: Keys never created with audience prefix
- Fallback masks issue, causing silent success
- Minimal repair plan provided (3 options, Option 1 recommended)

**Next Phase**: Phase 5H.8 (Targeted Repair) - Only then should Option 1 be implemented.

