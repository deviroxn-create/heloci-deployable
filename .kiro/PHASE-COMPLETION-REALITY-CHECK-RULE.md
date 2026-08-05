# Phase Completion: Reality Check Rule

**Status**: Effective immediately  
**Date**: August 3, 2026  
**Applies To**: All future phases

---

## The Rule

**No phase is complete until:**

1. ✅ **The application actually works** — Not just "code compiles"
2. ✅ **End-user behavior is verified** — Not just "feature implemented"
3. ✅ **Browser flow executes successfully** — Not just "unit tests pass"
4. ✅ **Runtime behavior matches intent** — Not just "matches documentation"
5. ✅ **Documentation reflects reality** — Not just "is comprehensive"

---

## Why This Matters

### The Problem We Hit

**Phase 5F issue**: 
- We documented communication system as "verified" ✅
- Created comprehensive freeze documentation ✅
- Later discovered: **Application can't start** (database blocker) ❌
- **Result**: All documentation was premature; created false closure

**Root cause**: We verified the *communication code* but never verified that the *application could run*.

### The Cost

- Multiple documentation files created prematurely
- False confidence that the system was "verified"
- Time spent closing a phase that couldn't actually be tested
- Needed to backtrack and do Phase 5F-B recovery investigation

---

## New Workflow for Each Phase

### Before Marking Phase Complete

```
1. Code Implementation → Commit
2. Unit Tests Pass → Green tests
3. **REALITY CHECK REQUIRED:**
   a. Start application
   b. Open browser
   c. Execute actual workflow
   d. Verify intended behavior
   e. Screenshot/log evidence
4. Only THEN: Write documentation
5. Only THEN: Mark phase complete
```

### Reality Check Checklist (Before Closing Any Phase)

- [ ] Application starts without errors
- [ ] Can navigate to main feature
- [ ] Feature works end-to-end through UI
- [ ] No PrismaClientInitializationError
- [ ] No unhandled exceptions in browser console
- [ ] No unhandled exceptions in server logs
- [ ] Intended user behavior completed successfully
- [ ] Everything documented *after* behavior verified

---

## Example: Phase 5F Should Have Been

**What We Did:**
1. ❌ Wrote Phase 5F documentation
2. ❌ Created verification tests
3. ❌ Declared "verified and frozen"
4. ❌ THEN discovered: app can't start

**What We Should Have Done:**
1. ✅ Implement communication code
2. ✅ Run unit tests
3. ✅ **START APP AND TEST IN BROWSER**
4. ✅ Verify signup → notification flow works end-to-end
5. ✅ Only then write documentation
6. ✅ Then declare complete

---

## Definition: "Reality Check"

A reality check is:
- **NOT** a unit test
- **NOT** a passing build
- **NOT** theoretical verification
- **IS** actual runtime behavior in the real application
- **IS** observable through browser or logs
- **IS** matching the intended user workflow

---

## For Communication System (Phase 5F) Specifically

**What Should Have Been Reality Check:**

```
1. Start app: npm run dev
2. Open http://localhost:3000
3. Signup → see registration
4. Check email (Resend) → notification received
5. Login → see dashboard
6. Perform action that triggers notification
7. Verify notification delivered
8. Only THEN: Document as "verified"
```

**What Actually Happened:**
1. Wrote tests and documentation
2. Later discovered: Step 1 (Start app) fails due to database
3. Had to backtrack

---

## How This Prevents Future Issues

### Issue Prevented: False Closures

Instead of:
```
Phase X marked complete
  → Documentation looks great
  → Later: Application doesn't work
  → Had to reopen phase
  → Wasted time and credibility
```

We get:
```
Phase X implementation
  → Reality check: App works end-to-end
  → Document actual behavior
  → Mark complete with confidence
```

### Issue Prevented: Assumption-Based Work

Instead of:
```
"Communication system must be working because tests pass"
  → Assumption, not proof
  → No app connectivity = no proof
```

We get:
```
"Communication system works, verified in running app"
  → Actual evidence
  → Can't be wrong
```

---

## Implementation: Going Forward

### For Each Phase

**Entry Checklist:**
- [ ] Understand intended behavior
- [ ] Know what success looks like
- [ ] Identify browser workflow needed

**Exit Checklist (BEFORE Phase is marked complete):**
- [ ] App starts
- [ ] Browser flow works
- [ ] Intended behavior achieved
- [ ] No errors in logs/console
- [ ] Take screenshot/evidence
- [ ] Document what was verified
- [ ] Document how to replicate verification
- [ ] Only then: Mark complete

### If Reality Check Fails

**Option 1**: Phase is NOT complete
- Fix blocker
- Re-run reality check
- Then complete

**Option 2**: Phase scope was wrong
- Adjust scope to match what actually worked
- Document what couldn't be tested
- Document blocker clearly
- Move blocker to next phase

**Option 3**: Infrastructure is missing
- Document exactly what infrastructure is needed
- Mark phase as "blocked by infrastructure"
- Move to recovery phase (like Phase 5F-B)

---

## Documentation After Reality Check

**All documentation should answer:**

1. **What was the intended behavior?**
   - User action or system behavior to verify

2. **How was it verified?**
   - Browser steps, logs, screenshots

3. **What evidence confirms it works?**
   - Console output, screenshots, test results

4. **What was NOT verified and why?**
   - Infrastructure blockers, missing dependencies

5. **If it failed, what's the next step?**
   - Is it a bug? Infrastructure issue? Scope problem?

---

## Example: Phase 5F Proper Reality Check

**What Should Be Documented:**

> **Phase 5F Reality Check — PASSED**
>
> 1. Application started successfully
> 2. User registration triggered notification
> 3. Verified in browser console: notification event published
> 4. Checked Resend logs: email delivered to support@heloci.us
> 5. Notification recorded in NotificationLog table
>
> **Evidence**: Screenshots of each step
> **Status**: Phase 5F complete, communication system verified working

---

## Why This Rule Exists

**We're building a housing assistance platform where:**
- ❌ "Verified" code that doesn't run = people can't apply
- ❌ "Complete" features that don't work = wasted development
- ✅ "Verified" means: Actually works, end-to-end, in production-like conditions

This rule ensures we never ship documentation for features that don't actually work.

---

## Going Forward

This rule applies to:
- ✅ All future phases
- ✅ Phase 5F-B (must be tested before completion)
- ✅ Core product phases (Eligibility, Applications, etc.)
- ✅ Any phase declaring "complete" or "verified"

**No exceptions.**

---

*This rule is foundational. It prevents the exact problem we hit with Phase 5F.*

</content>
</invoke>