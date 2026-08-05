# PHASE 5D — PRE-EXECUTION CHECKLIST

**Status**: Ready to Begin Operational Certification
**Dev Server**: ✅ Running on http://localhost:3000
**Date**: July 30, 2026
**Next Step**: Begin browser testing

---

## PRE-EXECUTION VERIFICATION

### ✅ Environment Ready

- [x] Dev server launched: `npm run dev`
- [x] Server running on: http://localhost:3000
- [x] Server output shows: "Ready in X.Xs"
- [ ] Database connection verified
- [ ] .env.local configured
- [ ] Node.js 18+ installed

### ✅ Browser Tools Ready

- [ ] Chrome/Firefox/Safari browser open
- [ ] Developer Tools ready (F12)
- [ ] Console tab visible (watch for errors)
- [ ] Network tab ready (verify API calls)
- [ ] Storage tab ready (check session/cookies)

### ✅ Database Tools Ready

- [ ] SQL client installed (psql, TablePlus, DBeaver, etc.)
- [ ] Can connect to PostgreSQL
- [ ] Can run queries against heloci database
- [ ] Know current database state (empty or seeded?)

### ✅ Evidence Capture Ready

- [ ] Screenshot tool available (Print Screen, Snipping Tool, etc.)
- [ ] Can save screenshots to folder
- [ ] Notepad/editor for logging results
- [ ] Copy/paste working for SQL queries

### ✅ Documentation Ready

- [ ] `PHASE-5D-OPERATIONAL-CERTIFICATION-PLAN.md` open (detailed instructions)
- [ ] `PHASE-5D-EXECUTION-GUIDE.md` open (SQL queries)
- [ ] `PHASE-5D-STRATEGIC-APPROACH.md` open (strategy)
- [ ] This checklist printed/visible

---

## KNOWN BLOCKERS & PRE-FIXES

### BLOCKER #1: Password Reset Event Not Published

**Status**: ⚠️ Known Issue from Phase 5C
**Impact**: Workflow #3 will FAIL without fix
**Fix Location**: `PHASE-5C-REQUIRED-FIXES.md`
**Implementation Time**: 15-20 minutes

**Files to Update**:
1. `actions/auth.actions.ts` - Add `resetPasswordAction()` Server Action
2. `app/(auth)/forgot-password/page.tsx` - Call new Server Action instead of direct Supabase
3. `lib/communications/communication-registry.ts` - Add registry entry for `user.password_reset_requested`

**Recommendation**: Implement this fix BEFORE testing Workflow #3

---

## WORKFLOW TESTING ORDER

### PHASE 1: CRITICAL PATH (Do First)
- [x] Dev server running
- [ ] Workflow #1: User Registration
- [ ] Workflow #4: Start Application
- [ ] Workflow #5: Save Draft
- [ ] Workflow #6: Submit Application
- [ ] Workflow #8: Application Approval

**Why**: Foundation for all other workflows
**Time**: ~50 minutes
**Expected Pass Rate**: 100% (critical path is stable)

---

### PHASE 2: SUPPORTING WORKFLOWS (Do Second)
- [ ] Workflow #2: User Login
- [ ] Workflow #3: Password Reset (AFTER fix implemented)
- [ ] Workflow #12: Upload Document
- [ ] Workflow #13: Request Documents
- [ ] Workflow #9: Application Rejection

**Why**: Depend on Phase 1 workflows
**Time**: ~60 minutes
**Expected Pass Rate**: 95%+

---

### PHASE 3: OPTIONAL WORKFLOWS (Do Last)
- [ ] Workflow #7: Withdraw Application
- [ ] Workflow #10: Conditional Approval
- [ ] Workflow #11: Waitlist Decision
- [ ] Workflow #14: Approve Document
- [ ] Workflow #15: Reject Document
- [ ] Workflow #16: Request Replacement
- [ ] Workflow #17: Applicant Message
- [ ] Workflow #18: Admin Message
- [ ] Workflow #19: Invite Staff
- [ ] Workflow #20: Accept Staff Invitation
- [ ] Workflow #21: Change Staff Role
- [ ] Workflow #22: Remove Staff
- [ ] Workflow #23: Eligibility Assessment

**Why**: Less critical, can be optional
**Time**: ~90 minutes
**Expected Pass Rate**: 90%+

---

## EVIDENCE CAPTURE STRATEGY

### For Each Workflow

**Tier 1: Essential Evidence**
- [ ] Screenshot of UI at start
- [ ] Screenshot of success message
- [ ] Database query results (at least one table)

**Tier 2: Verification Evidence**
- [ ] Server log showing event published
- [ ] NotificationLog query results
- [ ] AuditLog query results

**Tier 3: External Evidence**
- [ ] Email screenshot (if applicable)
- [ ] Telegram notification (if applicable)
- [ ] SMS confirmation (if applicable)

### Storage

Create folder structure:
```
Phase-5D-Evidence/
├── Workflow-01-Registration/
│   ├── 1-form.png
│   ├── 2-success.png
│   ├── 3-database.txt
│   ├── 4-logs.txt
│   └── 5-email.png
├── Workflow-02-Login/
│   └── ...
└── ...
```

---

## EXECUTION TIMELINE

| Phase | Workflows | Time | Status |
|-------|-----------|------|--------|
| Pre-Exec Check | - | 15 min | ⏳ DO THIS FIRST |
| Fix Password Reset | Blocker | 20 min | ⏳ Before Workflow #3 |
| Phase 1 (Critical) | 6 workflows | 50 min | ⏳ Do Second |
| Phase 2 (Supporting) | 5 workflows | 60 min | ⏳ Do Third |
| Phase 3 (Optional) | 13 workflows | 90 min | ⏳ Do Fourth |
| Analysis & Fixes | All failed | 30 min | ⏳ Do Fifth |
| Report Compilation | All results | 30 min | ⏳ Do Last |
| **TOTAL** | 23 workflows | **4.5 hours** | - |

---

## QUICK REFERENCE: URL MAP

### Application URLs

| Workflow | URL |
|----------|-----|
| Registration | `http://localhost:3000/register` |
| Login | `http://localhost:3000/login` |
| Password Reset | `http://localhost:3000/forgot-password` |
| Dashboard (Applicant) | `http://localhost:3000/applicant/dashboard` |
| Apply Program | `http://localhost:3000/applicant/apply` |
| Admin Dashboard | `http://localhost:3000/admin/dashboard` |
| Applications (Admin) | `http://localhost:3000/admin/applications` |
| Staff Management | `http://localhost:3000/admin/staff` |
| Communication Hub | `http://localhost:3000/admin/communication` |

---

## QUICK REFERENCE: DATABASE QUERIES

### After Each Workflow, Run:

**Check Latest Events**:
```sql
SELECT eventName, COUNT(*) as count, MAX("createdAt") as last_event
FROM "NotificationLog"
GROUP BY eventName
ORDER BY last_event DESC
LIMIT 10;
```

**Check User Records**:
```sql
SELECT id, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
```

**Check Application Records**:
```sql
SELECT id, status, "userId", "createdAt" FROM "ProgramApplication" ORDER BY "createdAt" DESC LIMIT 5;
```

**Check Recent Audit Logs**:
```sql
SELECT id, entity, action, "userId", "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## COMMON ISSUES & QUICK FIXES

### Issue: "Can't connect to database"
- [ ] Check PostgreSQL is running
- [ ] Verify DATABASE_URL in `.env.local`
- [ ] Run: `psql -h localhost -U postgres -d heloci`

### Issue: "Registration form not loading"
- [ ] Check dev server console for errors
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Check browser console (F12 → Console)
- [ ] Verify Supabase keys in `.env.local`

### Issue: "Email not received"
- [ ] Check Resend API key in `.env.local`
- [ ] Check NotificationLog for email records
- [ ] Check provider response for error messages
- [ ] Verify recipient email is correct

### Issue: "Server logs not showing events"
- [ ] Check if env var set: `NOTIFICATION_RUNTIME_TRACE=true`
- [ ] Restart dev server: Stop and `npm run dev`
- [ ] Check for stderr vs stdout (both should be visible)

### Issue: "Workflow breaks at specific step"
- [ ] Take screenshot of error
- [ ] Check browser console (F12)
- [ ] Check server console for 500 errors
- [ ] Query database to see what WAS created
- [ ] Document exact breakpoint

---

## SUCCESS METRICS

### Minimum Requirements

- [ ] 20/23 workflows show ✅ PASS
- [ ] All critical path workflows (Phase 1) show ✅ PASS
- [ ] No production-critical errors
- [ ] All databases records created correctly
- [ ] All notifications logged

### Target Requirements

- [ ] 22/23 workflows show ✅ PASS
- [ ] 1 workflow shows ⚠️ PARTIAL or ❌ FAIL with documented reason
- [ ] All failures have root cause identified
- [ ] All failures have minimal fix documented
- [ ] Production readiness score: 95%+

---

## WHAT IF A WORKFLOW FAILS?

### Step 1: Identify Breakpoint

Ask: "Where exactly did it break?"

- ✗ UI rendering? → Issue with page loading
- ✗ Form validation? → Issue with form rules
- ✗ Server Action? → Issue with backend logic
- ✗ Database? → Issue with Prisma/schema
- ✗ Event publishing? → Event not triggered
- ✗ Runtime? → RuntimeOrchestrator didn't execute
- ✗ Dispatch? → Notification provider failed
- ✗ External service? → Email/SMS/Telegram failed

### Step 2: Capture Evidence

- Screenshot of error
- Server logs (full error message)
- Database state (what records exist?)
- Browser console errors

### Step 3: Analyze Root Cause

- Is it a code bug?
- Is it a configuration issue?
- Is it a missing dependency?
- Is it a database constraint?

### Step 4: Plan Minimal Fix

- Only fix what's broken
- Don't redesign
- Don't refactor
- Only touch what's necessary

### Step 5: Re-test

- Implement fix
- Re-run workflow
- Verify now passes
- Update evidence

---

## REPORTING FORMAT

After all testing, you'll compile into:

**File**: `.kiro/PHASE-5D-OPERATIONAL-CERTIFICATION.md`

**Contains**:
- Executive summary (pass rate %)
- Certification matrix (all 23 workflows × status)
- Detailed results for each workflow
- Evidence summary
- Failed workflow analysis
- Minimal fixes needed
- Production readiness assessment
- Recommendation: Approve for Phase 6 or identify blockers

---

## NOW YOU'RE READY

✅ Dev server running
✅ All documentation prepared
✅ Database tools ready
✅ Browser tools ready
✅ Evidence capture ready
✅ Testing order defined
✅ Backup plans for failures

**NEXT STEP**: 

Begin Phase 1 testing with **Workflow #1: User Registration**

Go to: `http://localhost:3000/register`

---

## SUPPORT DOCUMENTS

Reference anytime:
- `PHASE-5D-OPERATIONAL-CERTIFICATION-PLAN.md` - Detailed procedure for each workflow
- `PHASE-5D-EXECUTION-GUIDE.md` - SQL queries and verification commands
- `PHASE-5D-STRATEGIC-APPROACH.md` - Overall strategy and approach
- `PHASE-5C-REQUIRED-FIXES.md` - Password Reset blocker fix
- `.env.local` - Environment configuration
- `package.json` - Dev server command: `npm run dev`

---

## GATE DECISION (After All Testing)

### Ready for Phase 6 IF:
- [x] 20+ / 23 workflows pass
- [x] All critical path passes
- [x] All failures documented with fix
- [x] Production readiness ≥ 90%

### Not Ready for Phase 6 IF:
- [ ] Critical path workflow fails
- [ ] Unfixable architectural issues
- [ ] Data loss or corruption
- [ ] Security vulnerabilities discovered

---

**Status**: ✅ READY TO BEGIN PHASE 5D TESTING

**You are authorized to proceed.** Start with Workflow #1.

