# PHASE 5F — Layered Runtime Certification

## The Right Approach

Instead of trying to certify the entire pipeline in one pass, certify it in layers.

Each layer proves one component works correctly before testing the next layer. This gives you:
- ✓ Much smaller debugging surface
- ✓ Clear ownership for each component
- ✓ Confidence in foundations before building on them
- ✓ Easy to identify where defects exist

---

## The Seven Layers

### Layer 1: Event Integrity Certification (5F.1)
**What:** Prove the event entering the runtime is valid

```
notify()
  ↓
eventName ✓
payload ✓
metadata ✓
correlationId ✓
organizationId ✓
```

**Questions:**
- Is the event name present and valid?
- Is the payload well-formed?
- Is organizationId present (or null for platform events)?
- Is correlationId generated correctly?
- Does metadata exist?

**Success Criteria:**
- Event object validates against schema
- No missing required fields
- Organization ID is either present or explicitly null
- Trace ID is unique

**Test:** `tests/phase-5f-1-event-integrity.test.ts`

---

### Layer 2: Audience Certification (5F.2)
**What:** Prove the audience resolver returns correct recipients

```
Event
  ↓
Audience Resolver
  ↓
Applicant ✓
Org Admin ✓
Case Worker ✓
System Admin ✓
```

**Questions:**
- Did it resolve the correct audiences?
- Did it duplicate recipients?
- Did it miss someone who should be there?
- Did it leak data from another tenant?
- Are recipients sorted consistently?

**Success Criteria:**
- For `user_registration`: Only applicant
- For `application_approved`: Applicant + org admins + case worker (if assigned)
- For `documents_requested`: Applicant + assigned staff
- No duplicate recipients
- Organization isolation verified (org A's audiences don't appear for org B)

**Test:** `tests/phase-5f-2-audience-certification.test.ts`

---

### Layer 3: Communication Plan Certification (5F.3)
**What:** Prove the planner selects correct channels

```
Audiences
  ↓
Communication Planner
  ↓
Applicant → Email ✓
Org Admin → Telegram ✓
System → Internal ✓
```

**Questions:**
- Did planner choose correct channel for each audience?
- Did organization preferences override defaults?
- Did user preferences override?
- Were fallback channels applied correctly?
- Was channel priority correct?

**Success Criteria:**
- Applicants get email (primary) or internal (fallback)
- Organization admins get telegram (primary) or email (fallback)
- System alerts get internal or telegram
- Preferences are applied in correct order (user > org > global)

**Test:** `tests/phase-5f-3-communication-plan.test.ts`

---

### Layer 4: Template Certification (5F.4)
**What:** Prove the template resolver picks the right template

```
Communication Plan
  ↓
Template Resolver
  ↓
Platform template? ✓
Organization template? ✓
Custom override? ✓
Fallback? ✓
```

**Questions:**
- Did it pick platform template (global)?
- Did it prioritize org-specific template?
- Did it handle missing locale (fallback to en)?
- Did template have all required variables?
- Did placeholder syntax exist ({{name}}, {{email}})?
- Was template active/published?
- Did wrong tenant get wrong template?

**Success Criteria:**
- For `user_registration` (platform event): Platform template always
- For `application_approved` (org event): Org template if exists, else platform
- Locale fallback works (fr → en if fr not found)
- All templates have required variables for event
- Template is active and published

**Test:** `tests/phase-5f-4-template-certification.test.ts`

---

### Layer 5: Sender Certification (5F.5)
**What:** Prove the sender is resolved and verified correctly

```
Sender Identity Resolver
  ↓
Organization sender?
  ↓
Platform sender?
  ↓
Verified domain?
  ↓
support@heloci.us (fallback)?
```

**Questions:**
- For platform event: Did it use support@heloci.us?
- For org event: Did it use org's SenderIdentity?
- Is sender domain verified with Resend?
- Did it fall back to platform sender if org sender unverified?
- Did unverified org email NOT get used?
- Did it use environment variable (which is wrong)?
- Did sender email survive to provider request?

**Success Criteria:**
- Platform events always use support@heloci.us
- Organization events use org's primary SenderIdentity (if verified)
- Fallback to support@heloci.us if org sender unverified
- Sender email exactly matches what goes to provider
- No unverified domain used

**Test:** `tests/phase-5f-5-sender-certification.test.ts`

---

### Layer 6: Dispatch Certification (5F.6)
**What:** Prove the dispatcher creates correct request object

```
Template + Audience + Sender
  ↓
Dispatcher
  ↓
DispatchRequest {
  recipient ✓
  sender ✓
  subject ✓
  html ✓
  channel ✓
  templateKey ✓
  correlationId ✓
}
  ↓
Provider Request
```

**Questions:**
- Does dispatch request have all required fields?
- Do values match what came from previous layers?
- Is recipient email valid?
- Is sender email valid?
- Is subject rendered (variables filled)?
- Is HTML rendered (variables filled)?
- Does correlationId match?
- Are there unexpected mutations?

**Success Criteria:**
- Dispatch request is complete (no missing fields)
- Recipient matches audience
- Sender matches sender resolver output
- Subject and HTML are rendered (no {{}} left)
- All values match what went into dispatcher
- One dispatch request per audience role

**Test:** `tests/phase-5f-6-dispatch-certification.test.ts`

---

### Layer 7: Persistence Certification (5F.7)
**What:** Prove NotificationLog stores exactly what was sent

```
Provider Response
  ↓
NotificationLog {
  event ✓
  recipient ✓
  sender ✓
  provider_id ✓
  organization ✓
  status ✓
  error ✓
  timestamp ✓
  correlationId ✓
}
```

**Questions:**
- Does log record exactly what was sent (not what should have been)?
- Does log have provider ID (from Resend)?
- Does log have correct status (SENT vs FAILED)?
- Does log have error message if failed?
- Does log have organization context?
- Does log have correlation ID (trace)?
- Can you look up log by event + recipient?
- Can you audit trail by organization?

**Success Criteria:**
- Log event name matches original event
- Log recipient matches what was actually sent to
- Log sender matches what was actually sent from
- Log organization is correct (or null for platform)
- Log status is SENT (provider succeeded) or FAILED (provider failed)
- Log provider response captured (Resend email ID)
- Log correlation ID matches trace ID
- Query logs by org returns only that org's logs

**Test:** `tests/phase-5f-7-persistence-certification.test.ts`

---

## Layer 8: End-to-End Certification (5F.E2E)
**What:** Combine all layers and trace one complete notification

```
Layer 1: Event Integrity ✓
  ↓
Layer 2: Audience Resolution ✓
  ↓
Layer 3: Communication Planning ✓
  ↓
Layer 4: Template Resolution ✓
  ↓
Layer 5: Sender Resolution ✓
  ↓
Layer 6: Dispatch Creation ✓
  ↓
Layer 7: Persistence ✓
```

**Questions:**
- Do all values from layer 1 survive to layer 7?
- Is there any unexpected mutation between layers?
- Does the complete trace match expectations?

**Success Criteria:**
- All 7 layer tests pass
- End-to-end test passes
- Trace shows no mutations
- Correlation ID preserved
- Organization ID preserved
- Multi-tenant isolation verified

**Test:** `tests/phase-5f-e2e-certification.test.ts`

---

## The Notification Contract

Before implementing tests, define the contract:

| Stage | Input | Output | Never Changes |
|-------|-------|--------|---|
| Runtime Entry | eventName, payload | RuntimeContext | correlationId |
| Audience Resolver | RuntimeContext | Audience[] | organizationId |
| Planner | Audience[] | Plan[] | eventName |
| Template Resolver | Plan | Template | audienceRole |
| Dispatcher | Template | DispatchRequest | sender |
| Provider | DispatchRequest | ProviderResponse | recipient |
| Logger | ProviderResponse | NotificationLog | event |

**Rule:** Every value that enters a stage must either:
1. Exit unchanged (preserved)
2. Be intentionally transformed (documented)

If a value changes unexpectedly, you've found a defect.

---

## Implementation Order

**Week 1:** Layers 1-3
- Event Integrity (1 day)
- Audience Certification (1.5 days)
- Communication Planning (1 day)

**Week 2:** Layers 4-6
- Template Certification (2 days — most complex)
- Sender Certification (1 day)
- Dispatch Certification (1 day)

**Week 3:** Layers 7 + E2E
- Persistence Certification (1 day)
- End-to-End Certification (1 day)
- Defect fixes (as needed)

---

## Testing Strategy

Each layer gets its own test file:

```
tests/
├── phase-5f-1-event-integrity.test.ts
├── phase-5f-2-audience-certification.test.ts
├── phase-5f-3-communication-plan.test.ts
├── phase-5f-4-template-certification.test.ts
├── phase-5f-5-sender-certification.test.ts
├── phase-5f-6-dispatch-certification.test.ts
├── phase-5f-7-persistence-certification.test.ts
└── phase-5f-e2e-certification.test.ts
```

Each test:
- Seeds minimal test data for that layer only
- Tests one component in isolation
- Verifies input → output contract
- Checks for mutations
- Verifies multi-tenant isolation
- Produces trace output

Run in order:
```bash
npm run test -- tests/phase-5f-1-event-integrity.test.ts
npm run test -- tests/phase-5f-2-audience-certification.test.ts
npm run test -- tests/phase-5f-3-communication-plan.test.ts
# ... etc
npm run test -- tests/phase-5f-e2e-certification.test.ts
```

---

## What This Gives You

### 1. Small Debugging Surface
If layer 4 (template) fails, you know:
- Layers 1-3 work (already passed)
- Problem is in TemplateResolver
- Input/output contract tells you what's wrong
- Not buried in 7 layers of complexity

### 2. Component Ownership
```
Layer 1: notify() entry        → Your responsibility
Layer 2: AudienceResolver      → C.1 contract owner
Layer 3: CommunicationPlanner  → Planner owner
Layer 4: TemplateResolver      → Template service owner
Layer 5: Sender resolution     → SenderIdentity service owner
Layer 6: Dispatcher            → Dispatcher owner
Layer 7: NotificationLog       → Persistence owner
```

Each owner can verify their component independently.

### 3. Defect Confidence
When you find a defect:
- Trace pinpoints exactly which layer
- Contract shows what was expected
- Fix is isolated to that component
- Layers below are proven working
- Layers above won't be affected

### 4. Runtime Inspector Ready
With layer tests in place, building a runtime inspector is straightforward:
- Same structure as test traces
- Same validation logic
- Same mutation detection
- Could be dashboard or CLI tool

---

## The Contract as Foundation

This contract becomes the **specification** for the entire communication engine:

```typescript
interface NotificationContract {
  layers: {
    eventIntegrity: {
      input: { eventName: string; payload: object; organizationId?: string };
      output: { correlationId: string };
      neverChanges: ['correlationId'];
    };
    audience: {
      input: { correlationId: string; organizationId?: string };
      output: { audiences: Audience[] };
      neverChanges: ['organizationId', 'correlationId'];
    };
    // ... etc for each layer
  };
}
```

This becomes the specification that future developers follow.

---

## Success Criteria for Phase 5F

✓ Layer 1 passes (event integrity proven)
✓ Layer 2 passes (audiences resolved correctly)
✓ Layer 3 passes (channels planned correctly)
✓ Layer 4 passes (templates resolved correctly)
✓ Layer 5 passes (senders resolved correctly)
✓ Layer 6 passes (dispatch requests created correctly)
✓ Layer 7 passes (persistence stores exactly what was sent)
✓ E2E passes (all layers combined work together)
✓ Contract documented
✓ Runtime Inspector planned (for Phase 5G)

---

## Next: Phase 5G (Optional)

After layered certification is complete:

**Runtime Inspector Tool**
- CLI or dashboard to inspect any notification trace
- See exactly what happened at each layer
- Like Chrome DevTools for notifications
- Used for debugging production issues

---

## Why Layering Wins

**Old way (monolithic certification):**
```
Run entire pipeline
  ✓ or ✗
If ✗, where did it break?
  → Could be any of 7 layers
  → Have to add logging everywhere
  → Rerun entire pipeline
  → Very slow iteration
```

**New way (layered certification):**
```
Run layer 1 → passes
Run layer 2 → fails
  → Problem is in AudienceResolver
  → Contract says what input/output should be
  → Fix is fast
  → Move to layer 3
```

---

## Implementation Guideline

For each layer test file (`phase-5f-N-*.test.ts`):

1. **Setup:** Seed only data for this layer
2. **Execute:** Call the component being tested
3. **Verify Contract:**
   - Input matches expected schema
   - Output matches expected schema
   - No unexpected mutations
4. **Check Isolation:**
   - If multi-tenant: Verify org isolation
   - If preferences involved: Verify preferences applied
5. **Generate Trace:** Output what happened

Example structure:

```typescript
describe('PHASE 5F.2 — Audience Certification', () => {
  it('resolves correct audiences for user_registration', async () => {
    // Setup: Seed test user
    const user = await prisma.user.create({...});
    
    // Execute
    const audiences = await AudienceResolver.resolve({
      event: 'user_registration',
      organizationId: null,
      userId: user.id
    });
    
    // Verify Contract Input
    expect(audiences).toBeDefined();
    
    // Verify Contract Output
    expect(audiences).toHaveLength(1);
    expect(audiences[0].role).toBe('applicant');
    expect(audiences[0].recipient.email).toBe(user.email);
    
    // Check Isolation
    expect(audiences[0].organizationId).toBeUndefined(); // platform event
    
    // Verify no mutations
    expect(audiences[0].recipient.email).not.toContain('***');
  });
});
```

---

## Key Difference from 5F.1

**Phase 5F (original):** One giant end-to-end test
- Harder to debug
- One failure means entire pipeline fails
- Difficult to identify root cause
- Takes longer to implement

**Phase 5F (layered):** Seven focused tests + one E2E
- Easy to debug (small surface)
- Early failures isolated to one layer
- Contract makes expected behavior clear
- Faster implementation (can run in parallel)
- Foundation for runtime inspector

---

## Start Here

1. **Define the contract** (30 min)
   - Create `PHASE-5F-CONTRACT.md`
   - Document input/output for each layer
   - List "never changes" values

2. **Implement layer tests one by one** (3-4 weeks)
   - Start with layer 1 (event integrity) — easiest
   - Move to layer 2 (audience) — medium
   - Layer 4 (template) — hardest
   - Layer 7 (persistence) — important

3. **Combine into E2E test** (1-2 days)
   - E2E test exercises all layers
   - Should pass if all individual layers pass

4. **Document findings** (1 day)
   - Create `PHASE-5F-CERTIFICATION-REPORT.md`
   - List any defects found and fixed
   - Verify contract accuracy

---

## This is the Right Foundation

When you build Phase 6 (async infrastructure), you'll have:
- ✓ Proven each component works
- ✓ Clear ownership for debugging
- ✓ Contract that specifies behavior
- ✓ Confidence that foundation is solid
- ✓ Inspector tool ready to build

This pays off enormously when debugging production issues later.
