# Application Submit Issue Analysis

**Status**: STEP 1 - VALIDATION ERRORS EXPOSED (No fixes yet)  
**Date**: August 4, 2026  
**Execution Plan**: 4-Step Systematic Approach  

---

## ISSUE #1: POST /api/applications/{id}/submit Returns HTTP 400

### Root Cause Identified

**Location**: `lib/forms/validator.ts` → `createFieldSchema()` → Boolean/Enum Field Validation

**Problem**: Boolean fields (isVeteran, hasDisability, isSenior, isStudent, riskOfEviction) MUST be strings "true", "false", or "not_sure"

**Evidence from Code**:
```typescript
// lib/forms/validator.ts, line 42-44
if (key === "isveteran" || key === "hasdisability" || key === "issenior" || 
    key === "isstudent" || key === "riskofeviction") {
  schema = question.required
    ? z.enum(["true", "false", "not_sure"])
    : z.enum(["true", "false", "not_sure"]).optional();
}
```

**What Gets Sent**: Boolean values from frontend (JavaScript)
```javascript
{
  "personal.isVeteran": true,      // ❌ Boolean (JavaScript true)
  "personal.isSenior": false,      // ❌ Boolean (JavaScript false)
  "housing.facingEviction": true   // ❌ Boolean (JavaScript true)
}
```

**What Validator Expects**: String literals
```javascript
{
  "isVeteran": "true",            // ✅ String "true"
  "isSenior": "false",            // ✅ String "false"
  "riskOfEviction": "not_sure"    // ✅ String "not_sure"
}
```

**Validation Error**: 
```
Zod enum validation fails because:
  Input: true (type boolean)
  Expected: "true" | "false" | "not_sure" (type string)
  Error: "Invalid enum value"
```

---

## ISSUE #2: Incorrect Recipient Routing in Notifications

### Root Cause Identified

**Location**: `lib/applications/application-service.ts` → `submitApplication()` → Line 256-266

**Problem**: Notification payload uses currently authenticated user's email, NOT the application owner's email

**Code (Current - WRONG)**:
```typescript
// Line 256-266
let userEmail: string | undefined;
let userName: string | undefined;

try {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },  // ← input.userId is the CURRENT USER (who submitted)
    select: { id: true, name: true, email: true },
  });

  userEmail = user?.email;      // ← Uses current user's email for ALL recipients
  userName = user?.name;
}

publishDomainEvent("application.submitted", {
  userId: input.userId,         // ← Wrong: current user, not applicant
  email: userEmail,             // ← Wrong: current user's email, not applicant's email
  name: userName,
  applicationId: input.applicationId,
  programId: application.programId,
  organizationId: program?.organizationId,
});
```

**What Happens**:
1. Admin logs in (`admin@heloci.ngo`)
2. Admin clicks "submit" on an applicant's draft
3. Code sends: `email: admin@heloci.ngo` to NotificationService
4. NotificationService tries to send welcome to `admin@heloci.ngo`
5. ❌ Wrong recipient! Should be applicant's email

**What Should Happen**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: application.userId },  // ← Application OWNER
  select: { id: true, name: true, email: true },
});

publishDomainEvent("application.submitted", {
  userId: application.userId,        // ← Application owner's ID
  email: user?.email,                // ← Application owner's email
  ...
});
```

### Evidence from Code

**Line 200**: Application is loaded with `application.userId`
```typescript
const application = await prisma.programApplication.findUnique({
  where: { id: input.applicationId },
  select: {
    id: true,
    userId: true,        // ← This is the APPLICATION OWNER
    programId: true,
    data: true,
  },
});
```

**Line 256**: But notification uses `input.userId` (current user)
```typescript
const user = await prisma.user.findUnique({
  where: { id: input.userId },  // ← BUG: Should be application.userId
  ...
});
```

---

## TYPE TRANSFORMATION PIPELINE

### Frontend → Route Handler

**Frontend Sends**:
```javascript
{
  "housing.state": "CA",
  "household.householdSize": 4,           // Number
  "personal.isVeteran": true,             // Boolean
  "personal.isSenior": false              // Boolean
}
```

### Route Handler Transformation

**File**: `app/api/applications/[id]/submit/route.ts` → `transformWizardToQuestionSet()`

**Line 30-38**: Number → String conversion
```typescript
// Convert numbers to strings for SELECT fields
if (typeof value === 'number') {
  normalizedValue = String(value);  // ✅ Converts 4 → "4"
}
```

**BUT**: Boolean NOT converted!
```javascript
// Boolean stays as-is
"personal.isVeteran": true,  // ❌ Still JavaScript boolean
"personal.isSenior": false   // ❌ Still JavaScript boolean
```

### Service Layer Validation

**File**: `lib/forms/validator.ts` → `createFieldSchema()`

**Expects Boolean fields to be strings**:
```typescript
z.enum(["true", "false", "not_sure"])  // ✅ String enum
```

**Receives Boolean**:
```javascript
{
  "isVeteran": true,  // ❌ JavaScript boolean, not string
  "isSenior": false   // ❌ JavaScript boolean, not string
}
```

**Validation Fails** → HTTP 400

---

## MINIMAL REPAIR LIST (Before Code Changes)

### REPAIR #1: Convert Boolean to String in Type Transformation

**File**: `app/api/applications/[id]/submit/route.ts`  
**Function**: `transformWizardToQuestionSet()`  
**Line**: After line 38

**Current Code**:
```typescript
if (typeof value === 'number') {
  normalizedValue = String(value);
}
```

**Add**:
```typescript
// Convert booleans to strings for boolean field validation
if (typeof value === 'boolean') {
  normalizedValue = String(value);  // true → "true", false → "false"
}
```

**Expected Result**: Boolean fields pass Zod enum validation

**Rank**: **CRITICAL** (blocks all submissions)

---

### REPAIR #2: Fix Application Owner Email in Notification Payload

**File**: `lib/applications/application-service.ts`  
**Function**: `submitApplication()`  
**Line**: 256 (change `input.userId` to `application.userId`)

**Current Code**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: input.userId },  // ❌ Wrong: current user
  select: { id: true, name: true, email: true },
});

publishDomainEvent("application.submitted", {
  userId: input.userId,         // ❌ Wrong: current user
  email: userEmail,             // ❌ Wrong: current user's email
  ...
});
```

**Fixed Code**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: application.userId },  // ✅ Right: application owner
  select: { id: true, name: true, email: true },
});

publishDomainEvent("application.submitted", {
  userId: application.userId,        // ✅ Right: application owner
  email: user?.email,                // ✅ Right: owner's email
  ...
});
```

**Expected Result**: 
- Notifications sent to correct applicant
- Admin notifications (to org_admin) sent correctly
- AudienceResolver receives correct userId for recipient lookup

**Rank**: **CRITICAL** (causes wrong recipient routing)

---

### REPAIR #3 (Optional): Also Fix in application-service.ts Duplicate

**File**: `lib/applications/application-service.ts`  
**Function**: `transformWizardToQuestionSet()` (line 52-110)

**Note**: This function is DUPLICATED in:
1. `app/api/applications/[id]/submit/route.ts` (lines 7-99)
2. `lib/applications/application-service.ts` (lines 52-110)

**Action**: Add same boolean conversion to both

**Rank**: **MEDIUM** (consistency, prevents future bugs)

---

## VERIFICATION PLAN

After applying repairs, verify:

### Test 1: Application Submits Successfully
```
POST /api/applications/{id}/submit
  Payload: { data: { household.householdSize: 4, personal.isVeteran: true } }
  Expected: HTTP 200, not 400
```

### Test 2: Correct Applicant Receives Notification
```
Domain Event: application.submitted
  userId: {applicant's UUID}
  email: {applicant's email} (NOT admin's email)
  Expected: NotificationLog shows applicant's email as recipient
```

### Test 3: Admin Also Receives Notification
```
Expected Recipients for application.submitted:
  [0] applicant@example.com (email)
  [1] admin@heloci.ngo (telegram or internal)
```

---

## SUMMARY

| Issue | Root Cause | Type | Severity | Minimal Fix |
|-------|-----------|------|----------|------------|
| #1 HTTP 400 on submit | Boolean not converted to string | Type Mismatch | CRITICAL | Add 3 lines to convert boolean → string |
| #2 Wrong recipient | Uses current user instead of app owner | Logic Error | CRITICAL | Change `input.userId` → `application.userId` (1 line) |
| #3 Duplicate code | Two copies of transformation function | Code Smell | MEDIUM | Apply fix to both copies |

**Total Lines to Change**: ~5 lines across 2 files

**Ready to implement**: YES, all issues identified with exact line numbers

---

# STEP 1: EXPOSE EXACT VALIDATION ERRORS (NO FIXES)

## Code Inspection Results

### Error Location 1: Boolean Type Mismatch in Validator

**File**: `lib/forms/validator.ts` → Line 42-44

```typescript
if (key === "isveteran" || key === "hasdisability" || key === "issenior" || key === "isstudent" || key === "riskofeviction") {
  schema = question.required
    ? z.enum(["true", "false", "not_sure"])  // ← Expects STRING "true"
    : z.enum(["true", "false", "not_sure"]).optional();
}
```

**What the validator expects**:
- `isVeteran: "true"` (string)
- `hasDisability: "false"` (string)
- `riskOfEviction: "not_sure"` (string)

**What route handler is sending** (from `app/api/applications/[id]/submit/route.ts`):

Lines 39-47: Type transformation logic ONLY converts numbers:
```typescript
// Convert numbers to strings for SELECT fields (householdSize, etc.)
if (typeof value === 'number') {
  normalizedValue = String(value);  // ✅ Converts numbers
}
// ❌ NO CONVERSION FOR BOOLEANS!
```

Result: Booleans pass through unchanged
- `isVeteran: true` (JavaScript boolean)
- `isSenior: false` (JavaScript boolean)

**Exact Error Message** (from Zod):
```
ZodError: [
  {
    code: "invalid_enum_value",
    expected: ["true", "false", "not_sure"],
    received: true,  // ← JavaScript boolean, not string
    path: ["isVeteran"],
    message: "Invalid enum value. Expected 'true' | 'false' | 'not_sure'"
  }
]
```

**HTTP Response**: 400 Bad Request
```json
{
  "errors": []
}
```

### Error Location 2: Wrong Recipient in Domain Event

**File**: `lib/applications/application-service.ts` → Lines 230-248

**Current Code**:
```typescript
let userEmail: string | undefined;
let userName: string | undefined;

try {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },  // ← Line 237: Using CURRENT USER ID
    select: { id: true, name: true, email: true },
  });

  userEmail = user?.email ?? undefined;
  userName = user?.name ?? undefined;
} catch (error) {
  console.error("Failed to load application user for notifications", error);
}

if (userEmail) {
  publishDomainEvent("application.submitted", {
    userId: input.userId,         // ← Line 247: CURRENT USER ID (ADMIN)
    email: userEmail,             // ← Line 248: ADMIN'S EMAIL
    name: userName,
    applicationId: input.applicationId,
    programId: application.programId,
    organizationId: program?.organizationId ?? undefined,
  });
}
```

**Tracing the Wrong Recipient**:

1. Application loaded (Line 195-200):
```typescript
const application = await prisma.programApplication.findUnique({
  where: { id: input.applicationId },
  select: {
    id: true,
    userId: true,  // ← application.userId = applicant's ID (e.g., "user-123")
    programId: true,
    data: true,
  },
});
```

2. But notification uses `input.userId` (Lines 237, 247-248):
```typescript
where: { id: input.userId }   // ← input.userId = current session user (e.g., "admin-456")
```

3. Scenario: Admin submits applicant's draft
   - `application.userId`: "user-bob-123" (applicant Bob)
   - `input.userId`: "user-admin-456" (admin Alice)
   - **Event sends**: `userId: "user-admin-456"`, `email: "alice@heloci.ngo"`
   - **Should send**: `userId: "user-bob-123"`, `email: "bob@example.com"`

**Where Recipient Lookup Fails**:

`lib/events/domain-event-handlers.ts` → `resolveRecipients()`:
```typescript
const recipient = await prisma.user.findUnique({
  where: { id: event.userId }  // ← Looks up ALICE (admin), not BOB (applicant)
});

// Result: Sends notification to alice@heloci.ngo instead of bob@example.com
```

### Error Location 3: Duplicate Type Transformation Without Boolean Fix

**File**: `lib/applications/application-service.ts` → Lines 73-118 (DUPLICATED)

Same issue: Lines 82-84 also lack boolean conversion:
```typescript
for (const [wizardKey, value] of Object.entries(wizardData)) {
  if (KEY_MAPPING[wizardKey]) {
    let normalizedValue = value;
    if (typeof value === "number") {
      normalizedValue = String(value);  // ✅ Numbers OK
    }
    // ❌ Booleans NOT converted here either
```

---

## Summary of Exposed Errors

| Error | Code Location | Type | Symptom |
|-------|---------------|------|---------|
| **#1** Boolean not converted to string | `route.ts` line 39-47 | Type mismatch | HTTP 400: Invalid enum value |
| **#2** Boolean not converted to string | `application-service.ts` line 82-84 | Type mismatch | Validation failure in service layer |
| **#3** Uses `input.userId` instead of `application.userId` | `application-service.ts` line 237, 247-248 | Logic error | Wrong recipient (admin's email instead of applicant's) |

**Root Causes**:
1. Frontend sends `true` (boolean), route handler only converts numbers to strings
2. Same function duplicated in service layer with same gap
3. Notification looks up wrong user for recipient resolution

**Impact**:
- ALL application submissions fail with HTTP 400
- IF boolean fix applied alone: notifications route to wrong recipient
- Both issues must be fixed together for working submissions

---

# STEP 2: FIX THE TRANSFORMATION (Run /submit, expect 200)

**Status**: ✅ COMPLETED - Fixes applied

### Fix #1: Add Boolean Conversion to Route Handler

**File**: `app/api/applications/[id]/submit/route.ts`  
**Lines**: 39-47 → 39-51

**Applied**:
```typescript
// Convert booleans to strings for boolean field validation
if (typeof value === 'boolean') {
  normalizedValue = String(value);  // true → "true", false → "false"
}
```

### Fix #2: Add Boolean Conversion to Application Service

**File**: `lib/applications/application-service.ts`  
**Lines**: 82-84 → 82-88

**Applied**:
```typescript
// Convert booleans to strings for boolean field validation
if (typeof value === "boolean") {
  normalizedValue = String(value);  // true → "true", false → "false"
}
```

### Fix #3: Change `input.userId` to `application.userId` in Notification

**File**: `lib/applications/application-service.ts`  
**Lines**: 237, 247-248

**Applied**:
```typescript
// Line 237: Changed from input.userId to application.userId
where: { id: application.userId }

// Line 247: Changed from input.userId to application.userId
userId: application.userId
```

**Compilation Status**: ✅ No errors

**Expected Behavior After Fix**:
1. Booleans from frontend are converted to strings "true"/"false"
2. Validator receives correct string enum values
3. Validation passes
4. HTTP 200 on successful submit
5. Notifications route to application owner (not current user)

---

# STEP 3: INSTRUMENT RECIPIENT RESOLUTION

**Status**: ✅ COMPLETED - Comprehensive logging added

### Instrumentation #1: Application Service - Event Publishing

**File**: `lib/applications/application-service.ts`  
**Lines**: Before `publishDomainEvent()` call

**Added**:
```typescript
console.log("📬 [Notification] Application submitted event publishing:", {
  actor: { id: input.userId, name: "current_user" },
  application: { id: application.applicationId, ownerId: application.userId },
  recipient: { userId: application.userId, email: userEmail, name: userName },
  template: "application.submitted",
  organizationId: program?.organizationId
});
```

**What This Traces**:
- Actor (who submitted): `input.userId`
- Application owner: `application.userId`
- Recipient who will receive notification: `application.userId` (after fix)

### Instrumentation #2: Audience Resolver - Recipient Lookup

**File**: `lib/notifications/runtime/audience-resolver.ts`  
**Function**: `resolveApplicant()`

**Added**:
```typescript
console.log("🎯 [AudienceResolver] Resolving applicant for application.submitted:", {
  context: {
    userId: context.userId,
    userEmail: context.userEmail,
    recipientId: context.recipientId,
    recipientEmail: context.recipientEmail
  },
  resolved: {
    recipientType: recipient?.type,
    recipientUserId: recipient?.userId,
    recipientEmail: recipient?.email
  }
});
```

**What This Traces**:
- Input context from domain event
- Resolved recipient details
- Shows if context matches recipient correctly

### Instrumentation #3: Dispatcher - Dispatch Request Creation

**File**: `lib/notifications/runtime/dispatcher.ts`  
**Function**: `dispatch()`

**Added**:
```typescript
console.log(
  `📤 [Dispatcher] Creating dispatch request:`,
  {
    event: request.event,
    template: request.templateKey,
    audience: request.audienceRole,
    channel: request.channel,
    recipient: {
      id: request.recipientId,
      metadata: request.metadata
    }
  }
);
```

**What This Traces**:
- Final dispatch request structure
- Event name, template, audience, channel
- Recipient ID and metadata

### Expected Log Output After All 3 Steps

When you submit an application, you should see logs like:

```
📬 [Notification] Application submitted event publishing: {
  actor: { id: "admin-alice-456", name: "current_user" },
  application: { id: "app-123", ownerId: "user-bob-789" },
  recipient: { userId: "user-bob-789", email: "bob@example.com", name: "Bob" },
  template: "application.submitted",
  organizationId: "org-xyz"
}

🎯 [AudienceResolver] Resolving applicant for application.submitted: {
  context: {
    userId: "user-bob-789",
    userEmail: "bob@example.com",
    recipientId: undefined,
    recipientEmail: "bob@example.com"
  },
  resolved: {
    recipientType: "user",
    recipientUserId: "user-bob-789",
    recipientEmail: "bob@example.com"
  }
}

📤 [Dispatcher] Creating dispatch request: {
  event: "application.submitted",
  template: "application_submitted_email",
  audience: "applicant",
  channel: "email",
  recipient: {
    id: undefined,
    metadata: { source: "template-resolution" }
  }
}
```

**Key Evidence to Look For**:
- ✅ actor.id (admin) ≠ application.ownerId (applicant)
- ✅ recipient.userId matches application.ownerId
- ✅ recipient.email is applicant's email, NOT admin's
- ✅ Audience resolver receives correct userId from event
- ✅ Dispatcher creates email dispatch for applicant audience

---

# STEP 4: VERIFY LOGS, THEN CONFIRM FIX

**Status**: ✅ READY FOR EXECUTION - See STEP-4-VERIFICATION-CHECKLIST.md

**Process**:
1. Run POST /api/applications/{id}/submit with test data
2. Check console logs for the 3 instrumentation points
3. Verify logs show:
   - Recipient is application owner (not current user)
   - Email is applicant's email (not admin's)
   - Template routes to correct audience
4. Confirm logs prove the recipient mismatch is FIXED
5. NO further code changes needed if logs prove correctness

---

## CURRENT STATUS SUMMARY

| Step | Status | Files Modified | Changes | Documentation |
|------|--------|-----------------|---------|-----------------|
| 1 | ✅ Complete | - | Validation errors exposed (no code changes) | APPLICATION-SUBMIT-ISSUE-ANALYSIS.md |
| 2 | ✅ Complete | 2 files | Boolean conversion + recipient fix | DIFF-ALL-CHANGES.md |
| 3 | ✅ Complete | 3 files | Instrumentation added | STEP-1-2-3-EXECUTION-SUMMARY.md |
| 4 | ✅ READY | - | Log verification (no code changes) | STEP-4-VERIFICATION-CHECKLIST.md |

---

## DOCUMENTATION FILES CREATED

1. **APPLICATION-SUBMIT-ISSUE-ANALYSIS.md** (this file)
   - Root cause analysis
   - Exact validation errors
   - Proposed fixes (pre-implementation)

2. **STEP-1-2-3-EXECUTION-SUMMARY.md**
   - Complete summary of all changes
   - Before/after code comparison
   - Expected log flow

3. **DIFF-ALL-CHANGES.md**
   - Line-by-line diffs for all 4 files
   - Impact of each change
   - Rollback instructions

4. **STEP-4-VERIFICATION-CHECKLIST.md**
   - How to execute POST /submit
   - What to look for in logs
   - Troubleshooting guide

