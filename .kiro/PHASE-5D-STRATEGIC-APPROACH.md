# PHASE 5D — STRATEGIC APPROACH

**Objective**: Execute all 23 workflows end-to-end and capture operational evidence

**Status**: ✅ Dev Server Running on http://localhost:3000

---

## KEY INSIGHT

Phase 5D is **live system testing**, not code analysis. You must:
1. Actually run the application
2. Use the browser UI exactly as a real user would
3. Verify system responses at each step
4. Capture evidence (screenshots, logs, database records)

---

## EXECUTION STRATEGY

### Phase 5D Testing Approach

**Framework**: Manual browser testing + server-side verification

**Tools**:
- Browser: Chrome/Firefox/Safari
- Dev Server: http://localhost:3000 (✅ Running)
- Database: PostgreSQL (direct SQL queries)
- Server Logs: Terminal running `npm run dev`
- Evidence: Screenshots, log excerpts, database query results

### Critical Success Factors

1. **Test as Real User**: Follow exact user paths, don't skip steps
2. **Verify Each Layer**: UI → Server → Database → Events → Runtime → Dispatch
3. **Capture Evidence**: Screenshots at key points, server logs, database records
4. **No Redesign**: If a workflow fails, fix only what's broken (minimal code changes)
5. **Record All**: Even partial successes or blockers must be documented

---

## WORKFLOW CATEGORIES BY COMPLEXITY

### TIER 1: CRITICAL PATH (Test First)
- ✅ User Registration (foundation)
- ✅ Application Submission (primary workflow)
- ✅ Application Approval (admin action)
- ✅ Staff Invitation (org setup)

**Why First**: These are prerequisites for other workflows

**Time**: ~45 minutes

---

### TIER 2: DEPENDENT WORKFLOWS (Test After Tier 1)
- Document Upload
- Document Request
- Application Rejection
- Admin Messaging
- Accept Staff Invitation

**Why Second**: Require Tier 1 workflows to complete

**Time**: ~60 minutes

---

### TIER 3: OPTIONAL/SECONDARY (Test Last)
- Password Reset
- Login (already tested in setup)
- Waitlist
- Conditional Approval
- Staff Role Change
- Remove Staff
- Eligibility Assessment

**Why Last**: Don't block other tests if they fail

**Time**: ~45 minutes

---

## STEP-BY-STEP EXECUTION PLAN

### STEP 1: Initial Setup (30 min)

- [ ] Verify dev server running: http://localhost:3000
- [ ] Open browser DevTools (F12)
- [ ] Clear browser cache/cookies
- [ ] Open terminal for server logs
- [ ] Prepare SQL tool for database queries (SQL editor or psql)
- [ ] Create evidence folder (screenshots)

**Success Criteria**: Login page loads without errors

---

### STEP 2: Test Tier 1 - Critical Path (45 min)

#### Workflow 1: User Registration
1. Go to `/register`
2. Fill form (unique email)
3. Submit
4. Verify email received
5. Confirm email address
6. Query database

**Verification**:
```sql
SELECT * FROM "User" WHERE email = '[test_email]' LIMIT 1;
SELECT * FROM "NotificationLog" WHERE "eventName" LIKE 'user.%' ORDER BY "createdAt" DESC LIMIT 5;
SELECT * FROM "CommunicationTimelineEntry" WHERE "eventName" LIKE 'user.%' ORDER BY "createdAt" DESC LIMIT 1;
```

**Record**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

#### Workflow 4: Start Application
1. Login as applicant
2. Go to dashboard
3. Click "Apply to Program"
4. Select program
5. Fill first page

**Verification**:
```sql
SELECT * FROM "ProgramApplication" WHERE "userId" = '[user_id]' ORDER BY "createdAt" DESC LIMIT 1;
```

**Record**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

#### Workflow 6: Submit Application
1. Complete all form pages
2. Review page
3. Click "Submit"
4. Verify success message
5. Check email

**Verification**:
```sql
SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
SELECT * FROM "NotificationLog" WHERE "eventName" = 'application.submitted' ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "CaseMessage" WHERE "applicationId" = '[app_id]' ORDER BY "createdAt" DESC;
```

**Record**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

#### Workflow 8: Application Approval
1. Login as admin
2. Navigate to Applications
3. Open application in review workspace
4. Click "Approve"
5. Submit approval
6. Verify notifications

**Verification**:
```sql
SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
SELECT * FROM "CaseDecision" WHERE "applicationId" = '[app_id]' LIMIT 1;
SELECT * FROM "NotificationLog" WHERE "eventName" = 'application.approved' ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "AuditLog" WHERE "meta"->>'applicationId' = '[app_id]' ORDER BY "createdAt" DESC LIMIT 5;
```

**Record**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

#### Workflow 19: Invite Staff
1. Go to admin settings → Staff
2. Click "Invite Staff"
3. Enter email, name, role
4. Send invitation
5. Check email for link

**Verification**:
```sql
SELECT * FROM "Invitation" WHERE email = '[invite_email]' ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "NotificationLog" WHERE "eventName" LIKE 'staff.%' ORDER BY "createdAt" DESC LIMIT 5;
```

**Record**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

### STEP 3: Test Tier 2 - Dependent Workflows (60 min)

Continue with:
- Workflow 12: Document Upload
- Workflow 13: Document Request
- Workflow 9: Application Rejection
- Workflow 18: Admin Message
- Workflow 20: Accept Staff Invitation

**Record each**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

### STEP 4: Test Tier 3 - Optional/Secondary (45 min)

Continue with:
- Workflow 3: Password Reset
- Workflow 2: Login (verify existing session)
- Workflow 11: Waitlist
- Workflow 10: Conditional Approval
- Workflow 21: Change Staff Role
- Workflow 22: Remove Staff
- Workflow 23: Eligibility Assessment

**Record each**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

### STEP 5: Analyze Results (30 min)

For each failed/partial workflow:
1. Identify exact breakpoint (UI/Server/DB/Event/Runtime/Dispatch)
2. Check server logs for error messages
3. Query database for expected records
4. Document root cause
5. Plan minimal fix (if needed)

---

### STEP 6: Compile Certification Report (30 min)

Create `PHASE-5D-OPERATIONAL-CERTIFICATION.md` with:
- Certification matrix (23 workflows × status)
- Pass rate percentage
- Evidence summary for each workflow
- Failed workflow root causes
- Minimal fixes needed
- Production readiness assessment

---

## TIME ESTIMATE

| Phase | Time | Status |
|-------|------|--------|
| Setup | 30 min | ⏳ To Do |
| Tier 1 (Critical) | 45 min | ⏳ To Do |
| Tier 2 (Dependent) | 60 min | ⏳ To Do |
| Tier 3 (Optional) | 45 min | ⏳ To Do |
| Analysis | 30 min | ⏳ To Do |
| Report | 30 min | ⏳ To Do |
| **Total** | **3.5 hours** | ⏳ To Do |

---

## EVIDENCE CAPTURE TEMPLATE

For each workflow, capture:

```
WORKFLOW: [Name]
STATUS: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
TIME: [Date/Time Started]

FLOW VERIFICATION:
☐ UI renders correctly
☐ Form validation works
☐ Server Action executes
☐ Database records created
☐ Domain Event published
☐ Runtime executes
☐ Audiences resolved
☐ Templates loaded
☐ Notifications dispatched
☐ Audit logs created

EVIDENCE:
1. Screenshots:
   - [Description]
   
2. Server Logs (timestamp):
   - [Log excerpt]
   
3. Database Records:
   - [Query result]
   
4. External Confirmation:
   - Email/SMS/Telegram sent
   
5. Errors/Issues:
   - [Any errors observed]

ROOT CAUSE (if failed):
   - [Analysis of why it failed]
   
MINIMAL FIX (if needed):
   - [Smallest code change needed]
```

---

## SUCCESS CRITERIA

**Phase 5D is complete when**:

- [x] Dev server launched successfully
- [ ] All 23 workflows executed
- [ ] 20+ workflows marked ✅ PASS
- [ ] All failures documented with root cause
- [ ] Evidence captured for each workflow
- [ ] Production readiness assessment complete
- [ ] Minimal fixes identified (if any)
- [ ] Report created: `PHASE-5D-OPERATIONAL-CERTIFICATION.md`

---

## EXECUTION COMMAND

```bash
# Already running:
npm run dev

# Navigate to:
http://localhost:3000

# SQL queries for verification:
psql -h localhost -U [user] -d heloci

# Then follow the step-by-step plan above
```

---

## KEY MONITORING POINTS

### Server Console (Terminal Running npm run dev)

Watch for:
```
[DomainEventPublisher] publish event=...
[RuntimeOrchestrator] EVENT: ...
[AudienceResolver] resolved audiences: ...
[Dispatcher] Email/Telegram/SMS dispatch: ...
```

### Browser Console (F12 → Console)

Watch for:
```
No errors expected
All API calls should return 200 OK
No "Uncaught Error" messages
```

### Database

After each workflow, verify records:
```sql
-- Most recent records
SELECT * FROM "NotificationLog" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 5;
SELECT * FROM "CommunicationTimelineEntry" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## FAILURE HANDLING STRATEGY

If workflow shows ❌ FAIL:

1. **Reproduce**: Try again to confirm it's not a fluke
2. **Breakpoint**: Exactly where does it break?
3. **Root Cause**: Server logs? Database? Event not published?
4. **Minimal Fix**: Only fix what's broken
5. **Re-test**: Verify fix works
6. **Document**: Add to failures list

---

## NEXT STEPS

1. ✅ Dev server is running
2. 👉 **NOW**: Start with Workflow #1 (User Registration)
3. Follow the step-by-step plan above
4. Capture evidence for each workflow
5. After completing all 23 workflows, compile results into certification report

---

## REFERENCE DOCUMENTS

- `PHASE-5D-OPERATIONAL-CERTIFICATION-PLAN.md` - Detailed workflow procedures
- `PHASE-5D-README.md` - Quick reference and troubleshooting
- `PHASE-5D-EXECUTION-GUIDE.md` - SQL queries and verification commands
- `.env.local` - Environment configuration (already set up)
- `package.json` - Dev server configuration

---

**Ready to begin?** Start with Step 1 (Setup) and work through systematically.

The dev server is running. You're ready to start testing! 🚀

