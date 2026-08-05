# PHASE C.1 INTEGRATION REPAIR PLAN

**Status:** BLOCKING ISSUES IDENTIFIED  
**Priority:** CRITICAL  
**Estimated Effort:** 7-10 hours  
**Target:** Make C.1 operational before Phase C.2

---

## ISSUES TO FIX

### ISSUE #1: C.1 AudienceResolver Not Called

**Current Code (WRONG):**
```typescript
// lib/notifications/runtime/runtime-orchestrator.ts:25
const audienceResolver = new AudienceResolver(); // ← Uses legacy!
const audiences = await audienceResolver.resolve(eventName, context);
```

**Target Code (RIGHT):**
```typescript
// Import C.1 resolver
import { AudienceResolver as C1AudienceResolver } from "@/lib/communications/runtime";
import type { CommunicationRequest, AudienceResolvedRequest } from "@/lib/communications/contracts";

// Build canonical request
const request: CommunicationRequest = {
  context: {
    traceId: this.generateTraceId(),
    organizationId: context?.organizationId || "system",
    userId: context?.userId,
    createdAt: new Date(),
  },
  event: eventName as CommunicationEvent,
  eventPayload: context || {},
  __stage: "initial",
};

// Use C.1 resolver
const resolved = await C1AudienceResolver.resolve(request);
const audienceResolvedRequest = resolved; // ← AudienceResolvedRequest (stage 2)
```

**Repair Effort:** 1 hour

---

### ISSUE #2: Type Mismatch - Audience vs Recipient

**Current Structure (LEGACY):**
```typescript
type Audience = {
  role: AudienceRole;
  name: string;
  recipient: AudienceRecipient; // { type: "user"|"email"|"system", userId?, email? }
}
```

**Target Structure (C.1):**
```typescript
type Recipient = {
  id: string;
  email: string;
  name?: string;
  role: AudienceRole;
  organizationId: string;
  preferences?: RecipientPreferences;
  metadata?: Record<string, unknown>;
}
```

**Fix Strategy:**
1. Convert Recipient[] to different structure for CommunicationPlanner
2. OR update CommunicationPlanner to work directly with Recipient[]
3. Recommend: Adapter pattern (convert in RuntimeOrchestrator)

**Repair Effort:** 2-3 hours

---

### ISSUE #3: Registry Not Wired

**Current Problem:**
```typescript
// Legacy resolver doesn't use registry
// It has hardcoded event mappings (switch statement)
const audiences = await audienceResolver.resolve(eventName, context);
```

**Required Fix:**
```typescript
// C.1 requires typed CommunicationEvent
import { VALID_COMMUNICATION_EVENTS } from "@/lib/communications/contracts";

// Validate event
if (!VALID_COMMUNICATION_EVENTS.includes(eventName as any)) {
  throw new Error(`Unknown communication event: ${eventName}`);
}

// Registry lookup happens inside C.1 AudienceResolver.resolve()
const request: CommunicationRequest = {
  event: eventName as CommunicationEvent, // ← Type-safe
  // ... rest of request
};

const resolved = await C1AudienceResolver.resolve(request);
// Registry lookups internal to resolve()
```

**Repair Effort:** 1 hour (after Issue #1 fixed)

---

### ISSUE #4: Payload-Driven Recipients Vulnerability

**Current Problem (LEGACY RESOLVER):**
```typescript
// lib/notifications/runtime/audience-resolver.ts:79-83
private async resolveOrganizationAdmin(context: AudienceResolutionContext): Promise<Audience | null> {
  // Accepts recipients DIRECTLY from payload! ⚠️
  const explicitRecipient = this.buildRecipient(
    context.organizationAdminId,   // From payload context
    context.organizationAdminEmail  // From payload context  
  );
  if (explicitRecipient) {
    return { ... };  // VIOLATION of C1-2!
  }
  // ...
}
```

**Fix:**
- Delete legacy resolver file entirely
- Replace with C.1 integrated resolver
- C.1 ONLY uses database relationships, never payload recipients

**Repair Effort:** Included in Issue #1 (delete legacy file = 30 min)

---

## REPAIR IMPLEMENTATION STEPS

### STEP 1: Update RuntimeOrchestrator (1.5 hours)

**File:** `lib/notifications/runtime/runtime-orchestrator.ts`

**Changes:**
1. Add C.1 imports
2. Build CommunicationRequest
3. Call C.1 resolver
4. Extract recipients from AudienceResolvedRequest

**Code Diff:**
```typescript
import { AudienceResolver as C1AudienceResolver } from "@/lib/communications/runtime";
import type { CommunicationRequest, AudienceResolvedRequest, CommunicationEvent } from "@/lib/communications/contracts";

export class RuntimeOrchestrator {
  static async runWithTrace(eventName: string, context?: AudienceResolutionContext | null): Promise<RuntimeTrace> {
    // DELETE: const audienceResolver = new AudienceResolver();

    // NEW: Build C.1 request
    const request: CommunicationRequest = {
      context: {
        traceId: context?.traceId || this.generateTraceId(),
        organizationId: context?.organizationId || "system",
        userId: context?.userId,
        createdAt: new Date(),
      },
      event: eventName as CommunicationEvent,
      eventPayload: context || {},
      __stage: "initial",
    };

    // NEW: Use C.1 resolver
    let audienceResolved: AudienceResolvedRequest;
    try {
      audienceResolved = await C1AudienceResolver.resolve(request);
    } catch (error) {
      console.error(`[RuntimeOrchestrator] Audience resolution failed for ${eventName}:`, error);
      return {
        eventName,
        audiences: [],
        plans: [],
        resolutions: [],
        dispatchRequests: [],
      };
    }

    // Convert C.1 recipients to legacy Audience format (for now)
    const audiences = this.adaptRecipientsToAudiences(audienceResolved.recipients);
    
    // Rest remains same...
  }

  private static adaptRecipientsToAudiences(recipients: Recipient[]): Audience[] {
    return recipients.map(r => ({
      role: r.role,
      name: r.name || r.email,
      recipient: {
        type: "user" as const,
        userId: r.id,
        email: r.email,
      }
    }));
  }

  private static generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

### STEP 2: Delete Legacy AudienceResolver (0.5 hours)

**Files to Delete:**
- `lib/notifications/runtime/audience-resolver.ts`
- `lib/notifications/runtime/audience-resolver.test.ts` (replace with integration tests)

**Reason:**
- Legacy resolver violates C.1 rules
- Accepts payload-driven recipients
- Doesn't use registry
- Replaced by C.1

**Action:**
```bash
rm lib/notifications/runtime/audience-resolver.ts
rm lib/notifications/runtime/audience-resolver.test.ts
```

---

### STEP 3: Update RuntimeOrchestrator Types (1 hour)

**Problem:** RuntimeOrchestrator still uses `Audience` type from legacy resolver

**Fix:**
1. Update imports to not reference audience-resolver
2. Create adapters for downstream layers
3. Maintain backward compatibility where possible

**Code:**
```typescript
// Update these imports
import type { Audience, AudienceRole } from "./audience.types"; // ← REMOVE

// Add C.1 imports
import type { Recipient } from "@/lib/communications/contracts";

// Create adapter (temporary, for next phase)
type Audience = {
  role: AudienceRole;
  name: string;
  recipient: Recipient; // Now uses C.1 type
};
```

---

### STEP 4: Update CommunicationPlanner (2 hours)

**File:** `lib/notifications/runtime/communication-planner.ts`

**Changes:**
1. Accept C.1 Recipient[] instead of Audience[]
2. Create CommunicationPlan for each recipient
3. Pass recipient info correctly to downstream

**Pseudocode:**
```typescript
export class CommunicationPlanner {
  plan(event: string, audiences: Audience[]): CommunicationPlan[] {
    // Current: takes Audience[]
    // Update to: take Recipient[] directly from AudienceResolvedRequest
    
    return audiences.flatMap(audience => {
      return {
        recipientId: audience.recipient.userId || "unknown",
        audienceRole: audience.role,
        event,
        preferredChannel: this.determineChannel(audience.role),
      };
    });
  }
}
```

---

### STEP 5: Integration Tests (2-3 hours)

**New Test File:** `tests/c1-integration-flow.test.ts`

**Test Cases:**
1. Domain event → AudienceResolver → recipients
2. Recipients immutable
3. Registry consulted
4. Cross-org protection
5. All 25 events supported
6. Full pipeline: Event → Recipients → Plans → Templates → Dispatch

**Example:**
```typescript
import { describe, it, expect } from "vitest";
import { publishDomainEvent } from "../lib/events/domain-event-bus";
import { RuntimeOrchestrator } from "../lib/notifications/runtime/runtime-orchestrator";

describe("C.1 Integration: Communication Flow", () => {
  it("should resolve recipients through C.1 AudienceResolver", async () => {
    const dispatchRequests = await RuntimeOrchestrator.run("application_submitted", {
      applicationId: "app-123",
      userId: "user-456",
      organizationId: "org-789",
    });

    expect(dispatchRequests).toBeDefined();
    expect(dispatchRequests.length).toBeGreaterThan(0);
    
    // Verify recipients are from database, not payload
    const applicantRequest = dispatchRequests.find(r => r.audienceRole === "applicant");
    expect(applicantRequest).toBeDefined();
  });

  it("should maintain immutability through pipeline", async () => {
    const requests = await RuntimeOrchestrator.run("user_registration", {
      userId: "user-999",
      organizationId: "org-111",
    });

    // Verify all requests are immutable
    for (const request of requests) {
      expect(Object.isFrozen(request)).toBe(true);
    }
  });
});
```

---

### STEP 6: Verify No Breaking Changes (1 hour)

**Checklist:**
- [ ] All existing tests still pass
- [ ] No import errors
- [ ] No type errors
- [ ] RuntimeOrchestrator still accessible to NotificationService
- [ ] CommunicationPlanner still produces valid plans
- [ ] Dispatcher still works

**Commands:**
```bash
npm run type-check
npm run lint
npm run test
npm run test:integration
```

---

## RISK MITIGATION

### Risk: Breaking Existing Functionality

**Mitigation:**
- Adapter pattern maintains backward compatibility
- Gradual migration of downstream layers
- Comprehensive integration tests before deployment
- Fallback to legacy resolver (temporarily) if needed

### Risk: Performance Degradation

**Mitigation:**
- C.1 resolver uses same DB queries as legacy
- No additional network calls
- Caching can be added in Phase C.2
- Benchmark before/after

### Risk: Missing Edge Cases

**Mitigation:**
- Run existing test suite
- Add integration tests for all 25 events
- Manual testing in staging
- Monitor error rates in production

---

## SUCCESS CRITERIA

After repairs complete, verify:

✅ **Integration Complete**
- [ ] C.1 AudienceResolver called by RuntimeOrchestrator
- [ ] Recipients correctly resolved from database
- [ ] AudienceResolvedRequest passed to downstream
- [ ] No payload-driven recipients used

✅ **All Tests Passing**
- [ ] C.1 unit tests pass
- [ ] RuntimeOrchestrator tests pass
- [ ] Integration tests pass
- [ ] Existing tests still pass

✅ **Types Correct**
- [ ] No TypeScript errors
- [ ] CommunicationRequest properly typed
- [ ] AudienceResolvedRequest properly received
- [ ] Recipient type used correctly

✅ **Registry Verified**
- [ ] All 25 events supported
- [ ] Registry consulted for audiences
- [ ] Unknown events throw errors
- [ ] Type safety enforced

✅ **Security**
- [ ] Cross-org protection holds
- [ ] Payload-driven recipients impossible
- [ ] Immutability maintained
- [ ] No information leakage

---

## TIMELINE

- **Hour 1:** Update RuntimeOrchestrator
- **Hour 2:** Delete legacy resolver + update types
- **Hour 3:** Update CommunicationPlanner
- **Hour 4:** Write integration tests
- **Hour 5:** Fix test failures
- **Hour 6-7:** Manual testing + verification
- **Hour 8-10:** Buffer for unexpected issues

**Total: 7-10 hours**

**Realistic Timeline:** 2-3 days with 2-3 developers

---

## DEPLOYMENT PLAN

1. Create feature branch: `feat/c1-integration`
2. Implement all repairs
3. Run full test suite
4. Code review
5. Merge to staging branch
6. Deploy to staging
7. Run integration tests in staging
8. Manual QA testing
9. Deploy to production
10. Monitor error rates for 7 days
11. Then proceed to Phase C.2

---

## FINAL NOTES

**Do NOT proceed to Phase C.2 until:**
- ✅ All repairs complete
- ✅ Integration tests passing
- ✅ Re-certification approved
- ✅ 7-day production monitoring complete

**Phase C.1 Code Quality:** Excellent (no changes needed)  
**Phase C.1 Integration:** BROKEN (repairs required)

**Recommendation:** Treat integration work as highest priority.

---

**REPAIR PLAN COMPLETE**
