# PHASE 5C — REQUIRED FIXES FOR PRODUCTION

**Status**: Critical blocker identified and minimal fix provided
**Blocker**: Password Reset event not published
**Fix Scope**: 1 file, ~25 lines of code
**Risk**: Minimal (isolated change, no architecture impact)

---

## BLOCKER IDENTIFICATION

### Password Reset Workflow

**Current State**:
```
ForgotPasswordForm
  ↓
supabase.auth.resetPasswordForEmail(email)
  ↓
Supabase sends reset email
  ↓
❌ NO DOMAIN EVENT PUBLISHED
❌ NO AUDIT LOG
❌ NO COMMUNICATION LOG
❌ NO ORGANIZATION VISIBILITY
```

**Impact**:
- ✗ No audit trail for compliance
- ✗ Organization cannot track resets
- ✗ No communication log entries
- ✗ Breaks end-to-end certification requirement

**Why It Happened**:
- Password reset delegated entirely to Supabase Auth
- No Server Action wrapper
- No event publishing on reset request
- Was treated as external operation

---

## MINIMAL FIX

### File 1: `actions/auth.actions.ts`

**Add this new Server Action**:

```typescript
"use server";

import { createClient } from "@supabase/supabase-js";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export type PasswordResetResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Request password reset for an email address.
 * 
 * PROCESS:
 * 1. Call Supabase resetPasswordForEmail()
 * 2. Publish domain event for audit trail
 * 3. Return success/error to UI
 * 
 * Supabase will send reset email via their template.
 * Our event creates organization visibility + audit log.
 */
export async function resetPasswordAction(
  email: string
): Promise<PasswordResetResult> {
  try {
    // Create Supabase service-role client for password reset
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      // Supabase error (invalid email, not found, etc.)
      return { success: false, error: error.message };
    }

    // Publish event for audit trail + organization awareness
    // This event enables:
    // - NotificationLog entry (communication pipeline)
    // - AuditLog entry (compliance)
    // - CommunicationTimeline (audit trail)
    // - Optional: org admin notification
    publishDomainEvent("user.password_reset_requested", {
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
    });

    // Success response to UI
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Password reset failed";
    console.error("[resetPasswordAction]", message);
    return { success: false, error: message };
  }
}
```

### File 2: `app/(auth)/forgot-password/page.tsx`

**Update the form submission**:

```typescript
// BEFORE:
const handleSubmit = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (!error) {
    setSuccess(true);
  }
};

// AFTER:
const handleSubmit = async (email: string) => {
  const result = await resetPasswordAction(email);  // ← Call Server Action
  if (result.success) {
    setSuccess(true);
  } else {
    setError(result.error);
  }
};
```

Import the action:
```typescript
import { resetPasswordAction } from "@/actions/auth.actions";
```

### File 3: `lib/communications/communication-registry.ts`

**Add registry entry**:

```typescript
// Add to COMMUNICATION_REGISTRY object

user_password_reset_requested: {
  communicationEventName: "user_password_reset_requested",
  domainEventName: "user.password_reset_requested",
  audiences: ["org_admin"],  // Only org_admin notified (optional)
  channelsByAudience: {
    applicant: [],
    org_admin: ["internal"],  // Internal notification only
    reviewer: [],
    case_worker: [],
    support: [],
    staff_member: [],
    staff_admin: [],
    system: [],
  },
  type: "system-facing",
  priority: "low",
  retry: {
    maxAttempts: 1,
    backoffStrategy: "fixed",
  },
  async: true,
  description: "User requested password reset",
  notes: "Triggered by forgot-password form submission. Creates audit trail.",
  implemented: true,  // ← Mark true after adding event handler
},
```

---

## VERIFICATION

After implementing these changes, verify:

```typescript
// 1. Verify event is published
test("password reset publishes domain event", async () => {
  const result = await resetPasswordAction("test@example.com");
  
  expect(result.success).toBe(true);
  
  // Wait for event bus
  await new Promise(r => setTimeout(r, 100));
  
  // Check notification log
  const logs = await prisma.notificationLog.findMany({
    where: { eventName: "user.password_reset_requested" },
  });
  
  expect(logs.length).toBeGreaterThan(0);
});

// 2. Verify audit trail
test("password reset creates audit log", async () => {
  await resetPasswordAction("audit@example.com");
  
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entity: "User",
      action: "password_reset_requested",
    },
  });
  
  expect(auditLogs.length).toBeGreaterThan(0);
});
```

---

## DEPLOYMENT STEPS

### Step 1: Code Changes
- [ ] Add resetPasswordAction() to actions/auth.actions.ts
- [ ] Update forgot-password page to call action
- [ ] Add registry entry for user.password_reset_requested
- [ ] Add import statement for publishDomainEvent

### Step 2: Testing
- [ ] Run unit test for resetPasswordAction
- [ ] Test end-to-end: Form → Action → Event → Log
- [ ] Verify NotificationLog entry created
- [ ] Verify AuditLog entry created
- [ ] Confirm no errors in console

### Step 3: Database
- [ ] No schema changes needed
- [ ] Registry entry optional (already has empty fields)
- [ ] NotificationLog will auto-create on event

### Step 4: Deployment
- [ ] Deploy actions/auth.actions.ts
- [ ] Deploy forgot-password page
- [ ] Deploy registry update
- [ ] Monitor logs for any errors
- [ ] Verify event in NOTIFICATION_RUNTIME_TRACE (if enabled)

---

## IMPACT ASSESSMENT

| Aspect | Impact | Risk |
|--------|--------|------|
| Lines of code changed | 25 | Minimal |
| Files modified | 3 | Low |
| Architecture impact | None | None |
| Breaking changes | None | None |
| Database migrations | None | None |
| Dependencies added | None | None |
| Testing effort | 1 test | Minimal |
| Performance impact | Negligible | None |
| Rollback difficulty | Easy (revert 3 files) | Low |

---

## ROLLBACK PLAN

If the change causes issues:

1. Revert the 3 file changes
2. Password reset will still work (Supabase fallback)
3. Just no event publishing (same as current state)
4. No data loss
5. Deployment: Immediate

---

## OPTIONAL ENHANCEMENT: Wire Login Event

### File: `app/(auth)/login/page.tsx`

**Add after successful auth** (optional, not blocking):

```typescript
import { trackLoginAction } from "@/actions/auth.actions";

// After Supabase signin succeeds
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (!error && data.user) {
  // Optional: Track login for audit trail
  await trackLoginAction(data.user.email);
  
  router.push("/dashboard");
}
```

**New Server Action** (in actions/auth.actions.ts):

```typescript
export async function trackLoginAction(
  email: string
): Promise<{ success: boolean }> {
  try {
    publishDomainEvent("user.login", {
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    console.error("[trackLoginAction]", error);
    return { success: false };
  }
}
```

**Why it's optional**:
- ✓ Event already exists in registry
- ✓ Not critical for compliance
- ✓ Can be added in Phase 6
- ✓ Low priority

---

## SIGN-OFF

**Blocker**: ❌ Password Reset
**Fix Provided**: ✅ Yes (25 lines, 3 files)
**Risk Level**: ✅ Minimal
**Architecture Impact**: ✅ None
**Testing Coverage**: ✅ Provided

**Recommendation**:
1. Implement Password Reset fix (required)
2. Deploy to staging
3. Test end-to-end
4. Deploy to production
5. Optional: Add login event in Phase 6

**Timeline**: 30 minutes implementation, 15 minutes testing

---

*End of Phase 5C Required Fixes*
