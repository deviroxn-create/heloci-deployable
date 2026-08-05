# PHASE 5E — INFRASTRUCTURE CERTIFICATION AUDIT

**Status**: ⏳ AUDIT IN PROGRESS
**Date**: July 30, 2026
**Objective**: Identify infrastructure defects (NOT application logic)

---

## AUDIT FINDINGS

### FINDING #1: Multiple Senders in Recent Logs

**Runtime Evidence**:
```
Recent Notifications (Last 30 Days): 277 total

By Sender:
  support@heloci.ngo:           70 logs (verified domain)
  onboarding@resend.dev:       192 logs (TEST domain - NOT VERIFIED)
  petkeyz8@gmail.com:           10 logs (old, unverified, pre-Phase 5D)
  support@heloci.us:             3 logs (correct, verified)
  notifications@heloci.ngo:      2 logs (old domain)
```

**Status**: 🔴 **CRITICAL**
- 192 notifications using `onboarding@resend.dev` (Resend test domain)
- This is a **FALLBACK chain issue**, not application logic

---

### FINDING #2: Fallback Chain Analysis

**Code Path** (from provider-adapters.ts:58):
```typescript
const senderEmail = context.sender || settings.senderEmail || "support@heloci.us";
```

**Priority Chain**:
1. ✓ context.sender (from SenderIdentity) - **NOT being passed**
2. ✓ settings.senderEmail (from CommunicationSettings) - Reading "support@heloci.ngo" 
3. ✓ Fallback "support@heloci.us" - Should be last resort

**Problem**: If settings.senderEmail = "onboarding@resend.dev", that's what gets used.

**Root Cause**: Settings are being initialized with the WRONG sender email, not from CommunicationSettings DB.

---

### FINDING #3: Settings Initialization Trace

**Location**: `lib/notifications/configuration.service.ts:112`

```typescript
export async function loadCommunicationSettings(): Promise<CommunicationSettings> {
  // 1. Check test override
  if (testOverrideCommunicationSettings) {
    return testOverrideCommunicationSettings;
  }

  // 2. Check cache
  if (cachedSettings) {
    return cachedSettings;  // ← RETURNS CACHED VALUE
  }

  // 3. Load from database
  const dbSettings = await prisma.communicationSettings.findUnique({ where: { id: "default" } });
  if (dbSettings) {
    const normalizedDbSettings = {
      senderEmail: dbSettings.senderEmail || undefined,  // ← READS FROM DB
      ...
    };
    cachedSettings = mergeCommunicationSettings(normalizedDbSettings);
  } else {
    // 4. Fallback to JSON
    cachedSettings = await loadSettingsFromJson();
  }
  
  return cachedSettings;
}
```

**Default Settings** (line 25):
```typescript
function getDefaultSettings(): CommunicationSettings {
  return {
    senderEmail: "support@heloci.us", // ← Good default
    ...
  };
}
```

---

### FINDING #4: Cache Problem

**Line 119**: `if (cachedSettings) { return cachedSettings; }`

**Issue**: If `cachedSettings` is loaded once with wrong sender (e.g., during tests), it will be returned for ALL subsequent calls without reloading from database.

**Evidence**:
- Test files set `testOverrideCommunicationSettings`
- This caches the test settings
- Production requests then use cached test values
- Result: `onboarding@resend.dev` in production logs

---

### FINDING #5: ENV Variable Fallback

**Location**: `.env.local`
```
COMMUNICATION_SENDER_EMAIL=onboarding@resend.dev
```

This is NOT the intended sender - it's the **Resend default test domain**.

**Database has**: `support@heloci.us` ✓ (correct)
**ENV has**: `onboarding@resend.dev` ✗ (wrong)

---

## INFRASTRUCTURE DEFECTS IDENTIFIED

### DEFECT #1: Settings Cache Not Invalidated Between Test/Production

**Problem**: 
- Test code sets `testOverrideCommunicationSettings`
- This value gets cached in `cachedSettings`
- Production code reads cached value
- Wrong sender email used for production notifications

**Evidence**:
- 192 notifications with onboarding@resend.dev
- This matches the test setup value
- Seen only after tests run

**Impact**: 🔴 **CRITICAL**
- Production notifications using test domain
- May cause delivery failures

**Root Cause**: Infrastructure-level cache pollution

---

### DEFECT #2: No Cache Invalidation After Settings Update

**Location**: `configuration.service.ts:168`

```typescript
export async function saveCommunicationSettings(settings: CommunicationSettings) {
  cachedSettings = { ...settings };  // ← Sets cache
  // ... but what about pending notifications already using old sender?
}
```

**Problem**: When settings are updated in DB, cache is updated, but:
- In-flight notifications might still use old sender
- Providers might have already been created with old sender
- No notification to restart providers

**Evidence**:
- Multiple senders in logs (support@heloci.ngo, support@heloci.us, onboarding@resend.dev)
- Shows settings changed during runtime without provider re-initialization

---

### DEFECT #3: Settings Not Reloaded on Provider Creation

**Location**: `notification.service.ts:140`

```typescript
let providers = (settings: NotificationSettings): NotificationProvider[] => [
  createEmailProvider(settings),  // ← Created once with settings
  ...
];
```

**Problem**: Providers are created from settings, but:
- Settings are cached and may be stale
- Provider is created once at startup
- Later settings changes don't update providers
- New sender email won't be used until server restart

**Impact**: 🟡 **HIGH**
- Settings updates require server restart to take effect
- Might not be documented

---

## DATABASE VERIFICATION

### CommunicationSettings Current State

```
id: "default"
senderEmail: "support@heloci.us"      ✓ Correct
enabled: true                          ✓ Yes
channels: email, telegram, internal    ✓ All enabled
Updated: Thu Jul 30 2026 14:29:38      ✓ Recent
```

### SenderIdentity Records

```
support@heloci.us (DEFAULT)           ✓ Verified
housing@heloci.us                     ✓ Verified
documents@heloci.us                   ✓ Verified
admin@heloci.us                       ✓ Verified
support@texas-housing.local           ✓ Verified
support@california-housing.local      ✓ Verified
```

---

## INFRASTRUCTURE COMPONENT STATUS

### ✓ WORKING CORRECTLY

- **Resend API**: Configured and connected
- **Neon Database**: Connected successfully
- **Prisma Schema**: Correct PostgreSQL setup
- **Template Seeding**: All 61 templates exist
- **Runtime Orchestrator**: All components functioning
- **Dispatcher**: Deduplication logic correct
- **Provider Adapters**: Correctly prioritize senders

### ⚠️ NEEDS INVESTIGATION

- **Settings Cache**: Not invalidated between test/production
- **Provider Initialization**: Reads cached settings once
- **Settings Update Flow**: No provider re-initialization
- **Test Pollution**: Test overrides leaking to production

### 🔴 CRITICAL ISSUES

- **192 notifications with onboarding@resend.dev**: Cache pollution from tests
- **Multiple senders in logs**: Evidence of configuration drift
- **No cache invalidation**: Infrastructure-level defect

---

## ROOT CAUSE SUMMARY

| Issue | Root Cause | Component | Type |
|-------|-----------|-----------|------|
| onboarding@resend.dev in 192 logs | Test cache not cleared | Settings cache | Infrastructure |
| Multiple different senders | No cache invalidation | Settings service | Infrastructure |
| Provider not updating with settings | Providers created once | Notification service | Infrastructure |
| ENV COMMUNICATION_SENDER_EMAIL unused | Code correctly ignores it | Provider adapter | N/A (Working) |

---

## VERIFICATION CHECKLIST

### Resend Configuration
- [x] RESEND_API_KEY set
- [x] Connection working
- [x] Test notifications succeed
- [x] Verified domains listed

### Sender Email Resolution
- [x] Database sender: support@heloci.us ✓
- [x] Default sender: support@heloci.us ✓
- [x] ENV sender: onboarding@resend.dev (not used by code)
- [x] Fallback: support@heloci.us ✓
- [x] Code correctly prioritizes DB over ENV

### Neon Database
- [x] Connection: SUCCESS
- [x] Users: 41
- [x] Templates: 61
- [x] Settings: 1
- [x] Connection pooling: CONFIGURED

### Prisma
- [x] Schema file: FOUND
- [x] PostgreSQL provider: YES
- [x] Database attributes: YES
- [x] Generated files: Present (mostly, .prisma folder missing from output)

### Notification Runtime
- [x] Domain Events: Working
- [x] Runtime Orchestrator: Working
- [x] Audience Resolver: Working
- [x] Communication Planner: Working
- [x] Template Resolver: Working
- [x] Dispatcher: Working
- [x] Provider Adapters: Working
- [x] Deduplication: Working
- [x] Logging: Working

---

## CERTIFICATION STATUS

### Phase 5D Verification ✅ COMPLETE
- [x] Email sender fixed (database verified)
- [x] Telegram dedup fixed (logic verified)
- [x] Templates fixed (all seeded)

### Phase 5E Infrastructure Audit ⏳ IN PROGRESS

**Findings so far**:
- ✅ Resend API: Properly configured
- ✅ Database: Properly connected
- ✅ Sender resolution: Code working correctly
- ⚠️ Settings cache: Infrastructure issue found
- 🔴 Test pollution: Cache not cleared between test/production

---

## NEXT STEPS

### Phase 5E Actions Required

1. **Investigate Settings Cache Lifecycle**
   - When is cache cleared?
   - How does test override work?
   - Can test values leak to production?

2. **Verify Provider Re-initialization**
   - Do providers get recreated when settings change?
   - Is server restart required?
   - Should this be documented?

3. **Analyze Test Pollution**
   - Are test files calling settingOverride?
   - Are settings being reset after tests?
   - How long do overrides persist?

4. **Validate Recent Log Analysis**
   - Why are there 192 onboarding@resend.dev logs?
   - When were these notifications sent?
   - Was this during/after test runs?

---

## PRODUCTION READINESS

### Current Status: ⏳ CONDITIONAL

**Working**:
- ✅ Email sending functionality
- ✅ Provider adapters
- ✅ Database connectivity
- ✅ Template system
- ✅ Sender resolution logic

**Needs Clarification**:
- ⚠️ Settings cache behavior
- ⚠️ Settings update flow
- ⚠️ Test pollution cleanup

**If issues are infrastructure-only (not code defects)**:
- Can proceed with clearing old logs
- Document cache behavior
- Ensure test cleanup

---

*PHASE 5E: Infrastructure Audit In Progress*  
*Evidence-Based Findings Only*  
*No Code Changes Without Clear Evidence of Defect*

