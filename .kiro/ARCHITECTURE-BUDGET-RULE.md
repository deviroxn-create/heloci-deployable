# Architecture Budget Rule

---

## The Rule

Every subsystem is allowed:

1. **1 Architecture Phase** — Design and initial implementation
2. **1 Verification Phase** — Testing and validation
3. **1 Freeze Phase** — Documentation and closure

**After that: No new architecture is allowed without a production defect that justifies reopening the subsystem.**

---

## Why This Rule Exists

Without this rule, subsystems can expand infinitely:
- "Let's add a runtime inspector" (new infrastructure)
- "Let's add tracing framework" (new architecture)
- "Let's redesign with contracts" (refactoring)
- "Let's add certification layers" (more infrastructure)

This happened with the notification system and consumed multiple phases without delivering core product features.

**This rule prevents that.**

---

## How It Works

### Phase 1: Architecture
The subsystem is designed and built.

**Examples for Communication System:**
- Notification architecture designed
- Runtime orchestrator implemented
- Audience resolver built
- Template system created
- Sender identity system developed
- Multi-tenant isolation implemented

**Exit:** "Architecture is complete"

### Phase 2: Verification
The subsystem is tested and validated.

**For Communication System:**
- Runtime verification tests created
- All components verified to work
- Defects documented
- System cleared for production

**Exit:** "System is verified and ready"

### Phase 3: Freeze
The subsystem is documented and closed.

**For Communication System:**
- Documentation finalized
- Maintenance guide created
- Temporary artifacts removed
- Subsystem marked frozen

**Exit:** "System is documented and closed"

---

## After Freeze

### What Happens

The subsystem enters **Maintenance Mode**:
- ✅ Bug fixes are allowed (production issues)
- ❌ New features are not allowed
- ❌ Architecture changes are not allowed
- ❌ New abstractions are not allowed

### To Reopen

If a production defect requires architectural changes:

1. **Document the defect** — What's broken? Why does current architecture fail?
2. **Justify reopening** — Why can't it be fixed within current architecture?
3. **Get approval** — Confirm this is worth a new phase
4. **Create new phase** (5H, 5I, etc.) with full specification

**This is rare.** It means the original architecture was fundamentally flawed.

---

## Applied to Notification System

Current state of communication subsystem:

```
Phase 1: Architecture ✅ COMPLETE
├─ Runtime orchestrator
├─ Audience resolver
├─ Template system
├─ Sender identity management
├─ Multi-tenant support
└─ Notification logging

Phase 2: Verification ⏳ IN PROGRESS (Phase 5F)
├─ Runtime tests
├─ Defect identification
└─ Production readiness

Phase 3: Freeze 🔜 NEXT (Phase 6)
├─ Documentation
├─ Maintenance guide
└─ Official closure

After Phase 6: MAINTENANCE MODE 🔒
├─ Bug fixes only
├─ No new features
├─ No architecture changes
└─ Frozen until defect reopens it
```

---

## Budget Exhausted After Phase 6

Once the communication subsystem reaches Maintenance Mode:

| Request | Status | Reason |
|---------|--------|--------|
| "Fix this bug in notifications" | ✅ Allowed | Bug fixes permitted |
| "Add a runtime inspector" | ❌ Not allowed | New architecture |
| "Redesign with contracts" | ❌ Not allowed | Refactoring |
| "Add retry logic" | ❌ Not allowed | New infrastructure |
| "Build tracing framework" | ❌ Not allowed | New tooling |

---

## How to Prevent Subsystem Bloat

1. **Define clear scope** for each architecture phase
2. **Verify, don't redesign** — Use verification phase to test, not rearchitect
3. **Freeze enforces discipline** — Documentation and closure phase makes it final
4. **Maintenance mode is sticky** — Reopening requires real justification

---

## This Rule Prevents

❌ Endless iterations on the same subsystem  
❌ Architecture churn (design 1.0, 2.0, 3.0...)  
❌ Scope creep (one verification phase becomes three)  
❌ Distraction from core product features  

---

## This Rule Allows

✅ Clean subsystem boundaries  
✅ Focus on core product after freeze  
✅ Well-documented, stable foundation  
✅ Predictable timelines  
✅ Clear when to move on  

---

## Applied Going Forward

**Every subsystem gets 3 phases max, unless a production defect reopens it.**

This applies to:
- Eligibility Engine (phases 7, 8, 9)
- Application Workflow (phases 10, 11, 12)
- Document Management (phases 13, 14, 15)
- Case Management (phases 16, 17, 18)
- Admin Dashboard (phases 19, 20, 21)
- AI Assistant (phases 22, 23, 24)
- Security Hardening (phases 25, 26, 27)
- Production Deployment (phases 28, 29, 30)

Each gets: Architecture → Verification → Freeze

Then moves on.

No exceptions.

---

## The Benefit

By the time you finish Phase 30 (Production Deployment), Heloci is complete.

You're not still rearchitecting the notification system.

You're not redesigning the eligibility engine for the 4th time.

You're shipping a product.

---

## Enforcement

This rule is enforced at the "Next Prompt" stage of each Freeze phase.

**Freeze phase exit criteria includes:**

```
✅ Architecture Budget Rule enforced
   - No new architecture phases scheduled
   - Subsystem enters Maintenance Mode
   - Next phase does NOT return to this subsystem
```

If someone tries to schedule a 4th phase for a subsystem, refer back to this rule.

---

## Exception Process (Rare)

If a production defect requires reopening a subsystem:

1. **File defect report** with evidence
2. **Document architectural failure** — why current design fails
3. **Get stakeholder approval** — confirm value of new phase
4. **Create new phase** with full spec (goal, scope, deliverables, exit criteria)
5. **Track as subsystem 2.0** (Communication 2.0, Eligibility 2.0, etc.)
6. **New phase gets budget of 3 again**

This prevents the "let's redesign communication again" trap.

---

## Final Rule

**Subsystems have a lifespan: 3 phases max.**

After that, they're maintained, not rebuilt.

This keeps Heloci moving forward.
