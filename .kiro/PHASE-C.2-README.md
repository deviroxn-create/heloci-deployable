# PHASE C.2 — COMMUNICATION PLATFORM CERTIFICATION
## Master Index & Getting Started

**Date:** July 30, 2026  
**Status:** Kickoff Complete ✅  
**Objective:** Certify all 38+ business events through the communication pipeline  
**Timeline:** 3-4 weeks to 100% certification  

---

## What Is Phase C.2?

We are certifying the entire communication platform as a single, complete system.

**The Problem:** Weeks of audits found gaps because we've never tested the whole system end-to-end. Individual components work, but events hit the pipeline inconsistently. Some bypass it entirely.

**The Solution:** Build a master inventory of every business event (38+), then certify each one passes through all 8 stages of the communication pipeline without exception.

**The Outcome:** When complete, the communication platform becomes a reliable, auditable, automatic system that handles every business event perfectly.

---

## Phase C.2 Documents (Master Index)

### 1. PHASE-C.2-KICKOFF-SUMMARY.md ⭐ START HERE
**Purpose:** Executive overview of the entire phase  
**Audience:** Leads, decision-makers  
**Contents:**
- What is Phase C.2 and why it matters
- Breakdown of 38 events by status (✅/⏳/❌)
- Implementation timeline (3-4 weeks)
- Effort estimates (40 hours total)
- What NOT to do (don't fix symptoms)
- Success criteria
- **Read first: 5-10 minutes**

### 2. PHASE-C.2-CRITICAL-EVENT-FLOWS.md 📊 UNDERSTAND THE PATTERN
**Purpose:** Visual guides showing how events flow through the pipeline  
**Audience:** Engineers, architects  
**Contents:**
- Complete flow map for `application.submitted` (most critical event)
- Complete flow map for `document.approved` (high priority)
- Current issue: `admin.alert` bypassing pipeline (with fix)
- Gap example: `password.reset` (not implemented)
- How to implement new events (template patterns)
- **Study this: 15-20 minutes**
- **Reference while coding: Throughout implementation**

### 3. PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md 📋 COMPLETE REFERENCE
**Purpose:** Authoritative inventory of all 38+ business events  
**Audience:** Anyone building communication features  
**Contents:**
- All 38 events catalogued by domain (9 domains)
- Detailed certification status for EACH event (all 8 stages)
- Subscriber implementation status
- Pipeline stage verification
- Audience mapping
- Channel routing
- Database schema support
- Architecture components
- 5-phase action plan (C.2.1 through C.2.4)
- Certification protocol for each event
- Testing & validation strategy
- **Reference constantly: ~500 lines of detailed specs**

### 4. PHASE-C.2-CERTIFICATION-CHECKLIST.md ✅ PRACTICAL TOOL
**Purpose:** Quick reference for certifying individual events  
**Audience:** Engineers certifying events  
**Contents:**
- Template checklist for 8-stage certification
- Breakdown by priority (P0/P1/P2/P3)
- Validation scripts
- Sign-off process
- Summary statistics
- **Use when certifying: Print or keep open**

### 5. PHASE-C.2-EVENT-CERTIFICATION-MATRIX.md 📊 (Optional)
**Purpose:** Quick matrix view of all events and their status  
**Audience:** Quick reference  
**Contents:**
- Matrix view (if separate from main inventory)
- Can be generated from inventory as needed
- **Use for: Dashboard, quick lookups**

---

## How to Use These Documents

### Scenario 1: I'm a Lead/Manager
1. Read: **PHASE-C.2-KICKOFF-SUMMARY.md** (5 min)
2. Understand: Current state is 47% certified (18/38 events)
3. Timeline: 3-4 weeks to 100% (40 hours effort)
4. Next: Tell team to start with document #2

### Scenario 2: I'm Implementing an Event
1. Read: **PHASE-C.2-CRITICAL-EVENT-FLOWS.md** (understand pattern)
2. Find: Your event in **PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md**
3. Check: What stage is it at? What's missing?
4. Use: **PHASE-C.2-CERTIFICATION-CHECKLIST.md** (run through all 8 stages)
5. Verify: Event passes all 8 stages ✅

### Scenario 3: I Need to Understand the Architecture
1. Study: **PHASE-C.2-CRITICAL-EVENT-FLOWS.md** (visual maps)
2. Reference: **PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md** (details)
3. Understand: 8-stage pipeline and how events flow
4. Pattern: Use `application.submitted` as template

### Scenario 4: I'm Auditing the Platform
1. Get: **PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md**
2. Check: Which events are ✅ certified, ⏳ incomplete, ❌ missing
3. Use: **PHASE-C.2-CERTIFICATION-CHECKLIST.md** (verify each)
4. Track: Fill in checklist as you verify

---

## Quick Reference: The 8-Stage Pipeline

```
Stage 1: Event Published ← Domain service publishes event
Stage 2: Subscriber Triggered ← NotificationDomainSubscriber receives it
Stage 3: Audience Resolved ← Who gets this? → recipients identified
Stage 4: Planner Executed ← What channels? → email/telegram/internal
Stage 5: Template Loaded ← What message? → template populated with data
Stage 6: Channel Selected ← Which provider? → Resend/Telegram/Database
Stage 7: Provider Called ← Send it! → delivery via provider
Stage 8: Delivery Logged ← Audit trail → complete record in NotificationLog
```

**If ANY stage fails, the event is NOT certified.**

---

## Current Status Summary

### Events by Category

| Category | Certified ✅ | Incomplete ⏳ | Missing ❌ | Total |
|----------|---|---|---|---|
| Authentication | 1 | 1 | 2 | 4 |
| Applications | 7 | 0 | 3 | 10 |
| Documents | 4 | 0 | 0 | 4 |
| Eligibility | 1 | 0 | 1 | 2 |
| Matching | 1 | 1 | 1 | 3 |
| Programs | 1 | 0 | 1 | 2 |
| Staff/Org | 4 | 0 | 1 | 5 |
| Communication | 2 | 1 | 0 | 3 |
| Alerts/System | 0 | 0 | 6 | 6 |
| **TOTAL** | **21** | **3** | **15** | **39** |

**Current Certification Rate: 53% (21/39 events)**

### Critical Issue to Fix Immediately

⚠️ **Admin Alert Bypasses Pipeline**

`admin.alert.application_submitted` currently uses direct Telegram API instead of the canonical pipeline. This breaks certification.

**Impact:** Breaks auditing, no logging, defeats entire system design  
**Fix:** Migrate to NotificationDomainSubscriber (2 hours)  
**Priority:** P0 - Must fix before platform lock

---

## Implementation Roadmap

### Week 1: Fixes & Completions (~6 hours)
- [ ] Migrate admin alerts (P0 - CRITICAL)
- [ ] Complete 3 partial implementations
- [ ] Verify 21 certified events still work

### Week 2: Priority 1 Events (~12 hours)
- [ ] Implement 8 critical events
- [ ] Build end-to-end tests for each

### Week 3: Priority 2 Events (~8 hours)
- [ ] Implement 8 optional events

### Week 4: Certification & Lock (~8 hours)
- [ ] Final certification suite
- [ ] Platform lock-down

**Total Effort:** ~40 hours over 4 weeks

---

## Starting Your First Event Certification

### Step 1: Choose an Event
From **PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md**, pick one.

**Recommendation:** Start with already-certified event to understand the pattern.
- `user.registration` — Good first example
- `application.submitted` — Most critical
- `document.approved` — High priority

### Step 2: Review Current Implementation
Look at the detailed entry in the inventory to understand:
- Where it's published (which service)
- Who's subscribed (NotificationDomainSubscriber?)
- Audience type (who receives it?)
- Channels (email/telegram/internal?)
- Template name (what message?)

### Step 3: Run Through Checklist
Use **PHASE-C.2-CERTIFICATION-CHECKLIST.md**:
- [ ] Stage 1: Event published?
- [ ] Stage 2: Subscriber triggered?
- [ ] Stage 3: Audience resolved?
- [ ] ... (all 8 stages)

### Step 4: Verify with Test
```bash
npm run test -- --grep "certification.*{{event_name}}"
```

### Step 5: Sign Off
Mark as certified when all 8 stages pass.

---

## Key Insights

### The Pipeline Is Not Optional
Every event MUST flow through all 8 stages. There are no shortcuts. There are no exceptions.

Why? Because if even one event bypasses the pipeline:
- It won't be logged ❌
- It won't be auditable ❌
- It won't have retries ❌
- It won't respect user preferences ❌
- Future changes will break it ❌

### Once an Event Is Certified, It's Done
Once an event passes all 8 stages, it should never break. The pipeline is stable, the pattern is proven, and any new feature using that event will work.

### New Features Become Trivial
After certification:
- Want to add a new feature? Publish an event.
- Want to notify someone? They're automatically in the audience.
- Want to change channels? The planner handles it.
- Want to track delivery? The log captures it.

No more building notification logic into features. Just publish events.

---

## FAQ

**Q: What if I find an event that's not in the inventory?**  
Add it immediately to the inventory. If it's not tracked, it's not certified.

**Q: Can I bypass the pipeline for "urgent" events?**  
No. The pipeline IS urgent. It has retries, logging, and proper channel selection. Direct APIs are fragile.

**Q: What if certification finds a bug?**  
Fix it and re-run the checklist. The event isn't certified until all 8 stages pass.

**Q: Why does admin.alert bypass the pipeline?**  
Historical decision—before the pipeline existed. We're fixing it in Week 1.

**Q: Can I implement events out of order?**  
Yes, but start with P0/P1 (Priority 0 and 1) for high impact first.

**Q: Who signs off on a certified event?**  
Lead engineer or tech lead. Certification is non-negotiable.

---

## Glossary

- **Domain Event:** Internal event published by a service (e.g., `application.approved`)
- **Communication Event:** External event name mapped from domain event (e.g., `application_approved`)
- **AudienceResolver:** Service that identifies recipients for an event
- **CommunicationPlanner:** Service that selects which channels to use
- **TemplateResolver:** Service that loads and populates message templates
- **Provider:** External service that delivers messages (Resend, Telegram, etc.)
- **NotificationLog:** Database table that records all delivery attempts
- **Certification:** Event passes all 8 stages without failure

---

## Need Help?

- **Understanding the architecture?** → Read PHASE-C.2-CRITICAL-EVENT-FLOWS.md
- **Implementing an event?** → Use PHASE-C.2-CERTIFICATION-CHECKLIST.md
- **Looking up event details?** → Check PHASE-C.2-COMMUNICATION-EVENT-INVENTORY.md
- **Quick overview?** → Start with PHASE-C.2-KICKOFF-SUMMARY.md

---

## Next Action

**Read:** PHASE-C.2-KICKOFF-SUMMARY.md (5 minutes)

Then pick your first event to certify and use the tools above to complete it.

The communication platform is waiting to be finished.

