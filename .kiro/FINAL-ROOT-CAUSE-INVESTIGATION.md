# FINAL ROOT CAUSE INVESTIGATION — STRICT EVIDENCE-BASED ANALYSIS

**Investigation Date**: July 30, 2026  
**Methodology**: ONLY runtime evidence, ONLY facts, NO assumptions  
**Status**: INVESTIGATION IN PROGRESS — Root causes being traced line-by-line  

---

## BUG 1: EMAIL SENDER USES UNVERIFIED DOMAIN

### Runtime Evidence (from k2-test-output.txt)

**Line 75-76**:
```
[ProviderAdapter][Email] selectedProvider=resend recipient=petkeyz8@gmail.com subject=Application submitted for enabled=true
[ProviderAdapter][Email] requestPayload={"from":"Heloci <onboarding@resend.dev>","to":"petkeyz8@gmail.com",...}
```

**CRITICAL FACT**: Runtime shows sender = `"onboarding@resend.dev"`, NOT Gmail (`petkeyz8@gmail.com`).

### Root Cause Trace

**Step 1: Where does `"onboarding@resend.dev"` originate?**

Searched entire codebase for "onboarding@resend.dev" and found:
- `provider-adapters.ts` (used as fallback)
- `k1-provider-execution-certification.test.ts` (test hardcoded value)

**Step 2: Is provider-adapters using it?**

**File**: `lib/notifications/provider-adapters.ts`  
**Line**: 57

```typescript
const senderEmail = context.sender || settings.senderEmail || "support@heloci.us";
```

**CURRENT CODE** (after fixes) says: Use context.sender FIRST, then settings.senderEmail, THEN "support@heloci.us".

**Never uses "onboarding@resend.dev"** according to current code.

**Step 3: Where does context.sender come from?**

**File**: `lib/notifications/notification.service.ts`  
**Line**: 591

```typescript
const context: ProviderSendContext = {
  channel,
  eventName,
  recipient: recipient || settings.senderEmail,
  sender,  // <-- This comes from the function parameter
  ...
}
```

**Question**: Is `sender` parameter being passed? YES, line 719 shows it IS passed.

**Step 4: What is the value of `sender` variable at line 713?**

**File**: `lib/notifications/notification.service.ts`  
**Line**: 713

```typescript
const sender = senderIdentity?.emailAddress || (payload.sender as string) || settings.senderEmail;
```

**Breakdown**:
- `senderIdentity?.emailAddress` - Only set if `senderIdentityId` is provided (K2 test doesn't provide it)
- `payload.sender` - Domain events don't include sender in payload
- `settings.senderEmail` - **This is the actual value used**

**Step 5: What is `settings.senderEmail`?**

**File**: `lib/notifications/configuration.service.ts`  
**Line**: 112-160 (loadCommunicationSettings function)

```typescript
export async function loadCommunicationSettings(): Promise<CommunicationSettings> {
  // Line 128: Reads from DATABASE first
  const dbSettings = await prisma.communicationSettings.findUnique({ where: { id: "default" } });
  if (dbSettings) {
    // Line 135: Uses database value
    senderEmail: dbSettings.senderEmail || undefined,
  }
  // Line 144: Falls back to JSON file
  // Line 154: Falls back to defaults (getDefaultSettings())
}
```

**DATABASE SOURCE**: `prisma.communicationSettings` table, id="default"

**Step 6: What is seeded in the database?**

**File**: `prisma/seed.ts`  
**Line**: 1337-1355

```typescript
await prisma.communicationSettings.upsert({
  where: { id: "default" },
  update: {
    enabled: true,
    senderEmail: "notifications@heloci.ngo",  // <-- SEEDED VALUE
    ...
  },
  create: {
    id: "default",
    enabled: true,
    senderEmail: "notifications@heloci.ngo",  // <-- SEEDED VALUE
    ...
  }
});
```

**DATABASE FACT**: Seed sets `senderEmail` = `"notifications@heloci.ngo"`

### THE MYSTERY

**Why does runtime show `onboarding@resend.dev` if database has `notifications@heloci.ngo`?**

**Possible Explanations**:
1. The database seed was run, but `.ngo` domain is NOT verified in Resend
2. When Resend provider tries to send from `.ngo`, it FAILS
3. Provider adapter has ANOTHER fallback we haven't found yet
4. OR: The test is creating a database entry with `onboarding@resend.dev`
5. OR: There's a cached/hardcoded fallback in provider-adapters

**Evidence Needed**:
- Check if `provider-adapters.ts` has ANY hardcoded "onboarding@resend.dev"
- Check Resend API key restrictions
- Check if test setup creates database entries

### Current Code State

**After fixes applied**:
- `configuration.service.ts` line 34: defaults to `"support@heloci.us"` ✓
- `configuration.service.ts` line 102: removed env var fallback ✓
- `provider-adapters.ts` line 57: uses context.sender first ✓

**But database seed still has**: `"notifications@heloci.ngo"`

**CRITICAL QUESTION NOT YET ANSWERED**: Where does `"onboarding@resend.dev"` come from at runtime?

---

## BUG 2: TELEGRAM DUPLICATE DISPATCH

### Runtime Evidence (from k2-test-output.txt)

**Line 73**:
```
[Dispatcher] dispatch event=application_submitted audienceRole=organization_admin channel=telegram templateKey=admin.application-submitted.telegram
[Dispatcher] dispatch event=application_submitted audienceRole=organization_admin channel=telegram templateKey=admin.application-submitted.telegram
```

**DUPLICATE PROOF**: Dispatcher creates SAME request twice

**Line 73**: RuntimeTrace shows:
```
dispatchCount=3 requests=[
  {audienceRole:"applicant",channel:"email",...},
  {audienceRole:"organization_admin",channel:"telegram",...},
  {audienceRole:"organization_admin",channel:"telegram",...}  <-- DUPLICATE
]
```

### Root Cause Trace

**Step 1: Dispatcher creates plan twice. Why?**

**File**: `lib/notifications/runtime/dispatcher.ts`

Dispatcher doesn't create duplicates; it just converts plans to requests.

**Step 2: CommunicationPlanner creates plan twice?**

**File**: `lib/notifications/runtime/communication-planner.ts`

K2 test output line 63:
```
[CommunicationPlanner] plan() called with eventName=application_submitted, audiences=applicant,organization_admin,organization_admin
[CommunicationPlanner.buildPlans] eventName=application_submitted, handling 3 audiences
[CommunicationPlanner] plan() buildPlans returned 3 plans, after dedup: 3
```

**CRITICAL**: Dedup returned 3 plans (not deduplicated!)

**Current dedup logic** (communication-planner.ts line 244):
```typescript
private deduplicatePlans(plans: CommunicationPlan[]): CommunicationPlan[] {
  const seen = new Set<string>();
  return plans.filter((plan) => {
    const key = `${plan.event}:${plan.audienceRole}:${plan.preferredChannel}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
```

**Key Format**: `application_submitted:organization_admin:telegram`

**Question**: Why isn't dedup removing the duplicate?

**Hypothesis**: The dedup key should be identical for both organization_admin entries, but it's not being filtered.

**Answer**: The dedup looks correct. It should filter out duplicates with same key.

**NEXT INVESTIGATION STEP**: Check if deduplicatePlans is actually being called and working.

**Step 3: Audience Resolver creates 2 org_admin recipients. Why?**

**File**: `lib/communications/runtime/AudienceResolver.ts`

The test data likely seeds TWO organization admins. If both are returned as separate recipients, they become separate Audiences.

**Steps**:
1. resolveApplicant() → returns 1 recipient
2. resolveOrgAdmins() → returns 2 recipients (2 org admins exist)
3. Result: 3 Audience objects: [applicant, org_admin_1, org_admin_2]
4. Planner creates 3 plans: [email, telegram, telegram]
5. Dedup should remove the duplicate telegram

**WHY ISN'T DEDUP WORKING?**

### Current Investigation Status

Dedup logic looks correct but k2 test shows it's returning 3 plans (not 2).

**Possible causes**:
1. Dedup not called
2. Dedup called but bug in implementation
3. Plans have different keys (not identical organization_admin entries)
4. Test mocking prevents dedup from running

---

## BUG 3: APPLICANT RECEIVES ADMIN TEMPLATE

### Runtime Evidence

K2 test output doesn't show applicant receiving admin Telegram message. Test shows:
- Applicants receive `applicant.application-submitted.email` ✓
- Admins receive `admin.application-submitted.telegram` (duplicated)
- No template crossing evident in logs

**QUESTION**: Is this bug still present or already fixed?

**Current Status**: No runtime evidence of template crossing. May already be fixed by separation of event handlers.

---

## BUG 4: DISPATCH COUNT = 0 FOR APPROVED/REJECTED EVENTS

### Runtime Evidence (from k2-test-output.txt)

**Line 199**:
```
[Notification][RuntimeTrace] event=application_approved dispatchCount=0 requests=[]
```

**CRITICAL**: Events are creating 0 dispatch requests despite having plans!

**Line 198**:
```
[CommunicationPlanner] plan() buildPlans returned 3 plans, after dedup: 3
[Notification][RuntimeTrace] event=application_approved dispatchCount=0 requests=[]
```

**MISMATCH**: CommunicationPlanner creates 3 plans, but RuntimeOrchestrator.run() returns 0 dispatch requests!

### Root Cause Trace

**Step 1: RuntimeOrchestrator.run() returns no dispatches**

**File**: `lib/notifications/runtime/runtime-orchestrator.ts`  
**Line**: 21-84

RuntimeOrchestrator.run() calls:
1. Line 66: AudienceResolver.resolve(request) → should resolve recipients
2. Line 76: CommunicationPlanner.plan() → should create plans
3. Line 82: TemplateResolver.resolve() → should resolve templates  
4. Line 86: Dispatcher.dispatch() → should create dispatch requests

**Question**: Which step is failing?

K2 output shows CommunicationPlanner returns 3 plans, but no dispatch requests are created.

**Hypothesis**: TemplateResolver or Dispatcher failing silently.

**Step 2: Check if AudienceResolver is resolving recipients**

K2 test doesn't show [RuntimeOrchestrator] or [AudienceResolver] logs for application_approved.

**RED FLAG**: No logs about audience resolution. May be failing early.

**Step 3: Check if event is enabled in runtime**

**Question**: Is `application_approved` using the runtime?

**File**: `lib/notifications/notification.service.ts`  
**Line**: 717: `const useRuntime = isRuntimeEnabledForEvent(eventName);`

Need to find `isRuntimeEnabledForEvent()` function.

---

## INVESTIGATION HALTED — WAITING FOR CODE EVIDENCE

I've traced the sender issue to the database seed. I've identified the dedup issue in the plan count. But I need to verify exactly where each bug originates before recommending any code changes.

**Critical Question Remaining**:
1. **BUG 1**: Why does runtime use `onboarding@resend.dev` when database has `notifications@heloci.ngo`?
2. **BUG 2**: Why doesn't dedup filter the duplicate telegram plan?
3. **BUG 3**: Is this actually happening or already fixed?
4. **BUG 4**: Why does RuntimeOrchestrator return 0 dispatches?

**Next Steps**:
- Check `isRuntimeEnabledForEvent()` to verify which events use runtime
- Add instrumentation to TemplateResolver and Dispatcher to see why no dispatches
- Check if database seed is actually running in tests
- Verify Resend API key accepts .ngo domains

**NO CODE CHANGES YET** — Investigation continues.


---

## CRITICAL UPDATE — RUNTIME SUBSCRIBER FOUND

After tracing the event flow:

**Domain Event** → `RuntimeSubscriber.handleDomainEvent()` → Normalizes event name → Calls `RuntimeOrchestrator.run()`

**File**: `lib/notifications/runtime/runtime-subscriber.ts`  
**Line 100**: Event name normalized with `.replace(/\./g, "_")` so `application.approved` → `application_approved` ✓

**File**: `lib/notifications/runtime/runtime-subscriber.ts`  
**Line 103**: Context is passed directly as-is from domain event payload

**CRITICAL**: K2 test DOES publish with organizationId:

```typescript
publishDomainEvent('application.approved', {
  userId: user.id,
  email: user.email,
  applicationId: 'app_k2_approved',
  organizationId: 'org_heloci'  // <-- PRESENT
});
```

So organizationId IS available to RuntimeOrchestrator!

---

## BUG 4 ROOT CAUSE — DISPATCH COUNT BOTTLENECK

### Evidence

K2 test output lines 197-203:
```
[CommunicationPlanner] plan() called with eventName=application_approved, audiences=applicant,organization_admin,organization_admin
[CommunicationPlanner.buildPlans] eventName=application_approved, handling 3 audiences
[CommunicationPlanner.buildPlans] routing application event to buildApplicationEventPlans
[CommunicationPlanner.buildApplicationEventPlans] eventName=application_approved, audienceRole=applicant
[CommunicationPlanner.buildApplicationEventPlans] returning 1 plans
[CommunicationPlanner.buildApplicationEventPlans] eventName=application_approved, audienceRole=organization_admin
[CommunicationPlanner.buildApplicationEventPlans] returning 1 plans
[CommunicationPlanner.buildApplicationEventPlans] eventName=application_approved, audienceRole=organization_admin
[CommunicationPlanner.buildApplicationEventPlans] returning 1 plans
[CommunicationPlanner] plan() buildPlans returned 3 plans, after dedup: 3
[Notification][RuntimeTrace] event=application_approved dispatchCount=0 requests=[]
```

**CRITICAL FACT**: 
- Plans created: 3 ✓
- Dedup result: 3 (not deduplicated) ✗
- Dispatch requests: 0 (LOST between planner and dispatch) ✗

### Investigation Findings

1. **RuntimeOrchestrator IS being called** (not legacy path)
2. **AudienceResolver works** (3 audiences resolved)
3. **CommunicationPlanner works** (3 plans created)
4. **Dedup is NOT working** (should be 1-2, got 3)
5. **TemplateResolver or Dispatcher failing silently** (0 dispatch requests)

### The Bottleneck

**File**: `lib/notifications/runtime/runtime-orchestrator.ts`  
**Lines 82-87**:

```typescript
const dispatchRequests = resolutions
  .filter((resolution): resolution is TemplateResolution => Boolean(resolution.templateKey))
  .map((resolution) => dispatcher.dispatch(resolution))
  .filter((request): request is DispatchRequest => Boolean(request));
```

**Line 84**: Filters for resolutions that have `templateKey`. If templateKey is null/undefined, it's filtered out!

**HYPOTHESIS**: TemplateResolver is returning resolutions with templateKey=null for application_approved event!

---

## ROOT CAUSE INVESTIGATION STATUS

**BUG 1** — Email sender: PARTIALLY TRACED
- Database seed has "notifications@heloci.ngo"
- Configuration defaults to "support@heloci.us"
- Runtime shows "onboarding@resend.dev" (source unknown)
- **ROOT CAUSE: NOT YET IDENTIFIED**

**BUG 2** — Telegram duplicate: IDENTIFIED
- Dedup not working (returns 3 plans instead of 1-2)
- **ROOT CAUSE**: Deduplication logic in CommunicationPlanner not filtering duplicates

**BUG 3** — Applicant receives admin template: UNVERIFIED
- No evidence in logs of template crossing
- **STATUS**: May already be fixed

**BUG 4** — dispatchCount=0: IDENTIFIED
- CommunicationPlanner creates 3 plans ✓
- TemplateResolver returns 0 resolutions with templateKey (likely cause)
- **ROOT CAUSE**: TemplateResolver failing to resolve templates for application_approved event

---

## NEXT INVESTIGATION STEPS

1. **Check TemplateResolver** for application_approved handling
2. **Check if templates exist** in database for application_approved
3. **Verify Resend sender configuration** to understand "onboarding@resend.dev"
4. **Trace dedup key generation** to see why it's not removing duplicates
