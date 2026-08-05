# PHASE 5F — Refined Layered Certification Approach

**Date:** July 30, 2026  
**Status:** ✓ Ready to execute (refined)  

---

## What Changed

Instead of the original monolithic approach that tried to certify the entire pipeline in one pass, we now have:

✅ **Layered certification** — 7 focused sub-phases  
✅ **Notification Contract** — Formal specification for each layer  
✅ **Runtime Inspector** — Infrastructure for future debugging  
✅ **Clear ownership** — Each component has defined responsibilities  

---

## The Core Insight

Your notification system isn't broken because you don't have infrastructure (queues, retries).

Your notification system needs validation because **you have no visibility into what actually happens to data at each stage**.

The question isn't "Did the email send?" (yes/no).

The question is "**Did every piece of data survive the runtime correctly?**"

---

## The Seven Layers (Your Plan)

### 5F.1 — Event Integrity
**Prove:** Event entering runtime is valid  
**Duration:** 1 day  
**Test:** `tests/phase-5f-1-event-integrity.test.ts`

Verify:
- eventName, payload, metadata present
- correlationId generated uniquely
- organizationId present or null (explicit)
- No mutations in event object

---

### 5F.2 — Audience Resolution
**Prove:** Audiences resolved correctly  
**Duration:** 1.5 days  
**Test:** `tests/phase-5f-2-audience-certification.test.ts`

Verify:
- Correct audiences for event type (applicant, org_admin, etc.)
- No duplicates
- No data leaks between organizations
- organizationId preserved

---

### 5F.3 — Communication Planning
**Prove:** Channels planned correctly  
**Duration:** 1 day  
**Test:** `tests/phase-5f-3-communication-plan.test.ts`

Verify:
- Planner selects email for applicants
- Planner selects telegram for org admins
- Preferences override defaults
- eventName preserved

---

### 5F.4 — Template Resolution
**Prove:** Right template selected  
**Duration:** 2 days (most complex)  
**Test:** `tests/phase-5f-4-template-certification.test.ts`

Verify:
- Platform template for platform events
- Org template (if exists) for org events
- Locale fallback (fr → en if not found)
- All variables present
- Correct tenant/org

---

### 5F.5 — Sender Resolution
**Prove:** Sender verified and resolved correctly  
**Duration:** 1 day  
**Test:** `tests/phase-5f-5-sender-certification.test.ts`

Verify:
- Platform events use support@heloci.us
- Org events use org's SenderIdentity
- Sender is verified with Resend
- Falls back if unverified
- Never uses unverified domain

---

### 5F.6 — Dispatch Creation
**Prove:** Dispatch request complete and correct  
**Duration:** 1 day  
**Test:** `tests/phase-5f-6-dispatch-certification.test.ts`

Verify:
- All required fields present
- Template rendered (no {{}} left)
- Recipient matches audience
- Sender matches resolution
- correlationId preserved

---

### 5F.7 — Persistence
**Prove:** NotificationLog stores exactly what was sent  
**Duration:** 1 day  
**Test:** `tests/phase-5f-7-persistence-certification.test.ts`

Verify:
- Log matches dispatch (recipient, sender, etc.)
- Provider ID captured (Resend email ID)
- Status correct (SENT or FAILED)
- correlationId and organizationId in log
- Multi-tenant isolation verified

---

### 5F.E2E — End-to-End
**Prove:** All layers work together  
**Duration:** 1-2 days  
**Test:** `tests/phase-5f-e2e-certification.test.ts`

Verify:
- All 7 layers pass individually
- No mutations when combined
- Complete trace matches expectations

---

## The Notification Contract

Before writing tests, define what each layer must satisfy:

**File:** `.kiro/PHASE-5F-NOTIFICATION-CONTRACT.md` (already created)

For each layer:
- **Input schema** — What it receives
- **Output schema** — What it produces
- **Never changes** — Values that must be preserved

This becomes the specification that code must satisfy.

---

## Timeline

| Week | Task | Duration |
|------|------|----------|
| 1 | Layers 1-3 (event, audience, planning) | 3.5 days |
| 2 | Layers 4-6 (template, sender, dispatch) | 4 days |
| 3 | Layer 7 + E2E (persistence, integration) | 2-3 days |
| 3 | Defect fixes + sign-off | As needed |

**Total:** 9-12 days (2-3 weeks)

---

## Success Looks Like This

After running all tests:

```
✅ PHASE 5F.1 — Event Integrity
   Proves: correlationId, organizationId preserved

✅ PHASE 5F.2 — Audience Resolution  
   Proves: Correct audiences, no leaks, no mutations

✅ PHASE 5F.3 — Communication Planning
   Proves: Channels selected correctly, preferences applied

✅ PHASE 5F.4 — Template Resolution
   Proves: Right template, locale handling, variables present

✅ PHASE 5F.5 — Sender Resolution
   Proves: Verified sender, fallback works, no unverified domains

✅ PHASE 5F.6 — Dispatch Creation
   Proves: Complete request, rendered templates, values preserved

✅ PHASE 5F.7 — Persistence
   Proves: Log stores exactly what was sent

✅ PHASE 5F.E2E — End-to-End
   Proves: All layers together work correctly

CERTIFICATION COMPLETE ✓
```

---

## What You Get From This

### 1. Visibility
You know exactly what happens at each stage. No black boxes.

### 2. Small Debugging Surface
If something breaks:
- Run the layer tests
- One fails → That's where the defect is
- Fix it in isolation
- Other layers unaffected

### 3. Component Ownership
```
Layer 1 (Event) → notify() owner
Layer 2 (Audience) → AudienceResolver owner
Layer 3 (Planner) → CommunicationPlanner owner
Layer 4 (Template) → TemplateResolver owner
Layer 5 (Sender) → SenderIdentity owner
Layer 6 (Dispatch) → Dispatcher owner
Layer 7 (Persist) → Database owner
```

Each owner can verify their component independently.

### 4. Foundation for Phase 6
When you build async infrastructure (queues, retries), you know:
- ✓ Each layer works
- ✓ Data integrity proven
- ✓ Multi-tenant isolation verified
- ✓ Foundation is solid

### 5. Contract Becomes Spec
Developers don't need to guess. The contract shows:
- Exactly what input to expect
- Exactly what output to produce
- Exactly what values to preserve
- Nothing more, nothing less

### 6. Runtime Inspector Ready
Once layers are proven, building a runtime inspector (like Chrome DevTools for notifications) is straightforward:
- Use same trace structure as tests
- Same validation logic
- Same mutation detection
- Perfect for debugging production issues

---

## Next Steps

### Immediate (This Week)
1. ✅ Read `.kiro/PHASE-5F-LAYERED-CERTIFICATION.md` (understand approach)
2. ✅ Read `.kiro/PHASE-5F-NOTIFICATION-CONTRACT.md` (understand contract)
3. Review this document (you are here)

### Week 1
1. Create test file: `tests/phase-5f-1-event-integrity.test.ts`
2. Run: `npm run test -- tests/phase-5f-1-event-integrity.test.ts`
3. Fix any defects in layer 1
4. Repeat for layer 2 and 3

### Week 2
1. Implement layer 4 (template) — most complex
2. Implement layer 5 (sender)
3. Implement layer 6 (dispatch)
4. Fix defects as found

### Week 3
1. Implement layer 7 (persistence)
2. Implement E2E test
3. Run all tests together
4. Generate certification report
5. Sign off

---

## Why This Beats Other Approaches

### ❌ Wrong: No Testing
"Just ship it, we'll catch bugs in production"
→ Result: Multi-tenant bugs, data leaks, sender issues

### ❌ Wrong: One Giant E2E Test
"Run entire pipeline, if it works we're good"
→ Result: One failure = entire pipeline broken, hard to debug

### ✅ Right: Layered Certification
"Test each component, then combine"
→ Result: Small debugging surface, clear ownership, confident foundation

---

## The Contract Advantage

Most systems say:
> "Make sure the email sends"

This contract says:
> "Prove that this specific value survives through this layer unchanged"

**Example:**

Wrong way:
```
Did organizationId survive to the database?
→ "Not sure, let's check logs"
```

Right way (using contract):
```
Layer 1 output: organizationId = "org-housing"
Layer 2 output: organizationId = "org-housing" ✓
Layer 3 output: organizationId = "org-housing" ✓
Layer 4 output: organizationId = "org-housing" ✓
Layer 5 output: organizationId = "org-housing" ✓
Layer 6 output: organizationId = "org-housing" ✓
Layer 7 output: organizationId = "org-housing" ✓
Database: organizationId = "org-housing" ✓

PROVEN ✓
```

---

## Files You Now Have

### Documentation
- ✅ `.kiro/PHASE-5F-LAYERED-CERTIFICATION.md` — The approach (7 layers)
- ✅ `.kiro/PHASE-5F-NOTIFICATION-CONTRACT.md` — Formal specification
- ✅ `.kiro/PHASE-5F-REFINED-APPROACH.md` — This document (summary)

### Test Files (to create)
- `tests/phase-5f-1-event-integrity.test.ts`
- `tests/phase-5f-2-audience-certification.test.ts`
- `tests/phase-5f-3-communication-plan.test.ts`
- `tests/phase-5f-4-template-certification.test.ts`
- `tests/phase-5f-5-sender-certification.test.ts`
- `tests/phase-5f-6-dispatch-certification.test.ts`
- `tests/phase-5f-7-persistence-certification.test.ts`
- `tests/phase-5f-e2e-certification.test.ts`

### Report (to create after tests)
- `.kiro/PHASE-5F-CERTIFICATION-REPORT.md`

---

## Start Here

1. **Read contract:** `.kiro/PHASE-5F-NOTIFICATION-CONTRACT.md` (30 min)
   - Understand what each layer must prove

2. **Read approach:** `.kiro/PHASE-5F-LAYERED-CERTIFICATION.md` (30 min)
   - Understand how to test each layer

3. **Create layer 1 test:** `tests/phase-5f-1-event-integrity.test.ts` (2 hours)
   - Simplest layer, good starting point
   - Use contract as specification

4. **Run test:** `npm run test -- tests/phase-5f-1-event-integrity.test.ts`
   - Should pass or show exactly what failed

5. **Iterate:** Move to layer 2

---

## Key Principle

**The contract is the specification.**

Don't guess what should happen. Read the contract. Code to satisfy it. Test to verify it.

---

## Questions This Answers

**Q: How do I know if data is preserved correctly?**
A: Use the contract. Layer 7's output should match Layer 1's input for "Never Changes" values.

**Q: Where should I add logging?**
A: At layer boundaries. Compare input vs output at each layer.

**Q: What if I find a defect?**
A: The layer test pinpoints it. Fix that layer. Other layers are proven already.

**Q: When can I build Phase 6?**
A: After all 8 tests pass (7 layers + E2E) and report is signed off.

**Q: What about the runtime inspector?**
A: Build it in Phase 5G (after 5F). Same structure as tests, used for production debugging.

---

## Confidence Timeline

**After Layer 1:** "Event entering runtime is valid"
**After Layer 2:** "Audiences are resolved correctly"
**After Layer 3:** "Channels are selected correctly"
**After Layer 4:** "Templates are resolved correctly"
**After Layer 5:** "Senders are verified correctly"
**After Layer 6:** "Dispatch requests are complete"
**After Layer 7:** "Persistence stores exactly what was sent"
**After E2E:** "Entire pipeline works together correctly"

Each layer builds confidence for the next.

---

## This is the Right Foundation

Heloci's notification system is central to every product you build.

Getting it right now — with proven layers and formal contracts — means:
- ✓ Future features build on solid ground
- ✓ Debugging is precise, not guessing
- ✓ Multi-tenant isolation is proven, not assumed
- ✓ Data integrity is verified, not hoped for

This is worth 2-3 weeks of focused work.

---

## Ready?

Start with `.kiro/PHASE-5F-NOTIFICATION-CONTRACT.md`

Then `.kiro/PHASE-5F-LAYERED-CERTIFICATION.md`

Then create the first test.

Let's build a notification system you can trust.
