# PHASE 5D — OPERATIONAL CERTIFICATION

**Status**: Ready to Execute
**Date**: July 30, 2026
**Objective**: Launch HELoCI and execute every workflow through the browser as a real user would

---

## WHAT IS PHASE 5D?

Phase 5D moves from **static code analysis** to **live system testing**.

While Phases 5A-5C verified the code paths, registry entries, and event flows on paper, Phase 5D actually **runs the application** and tests every workflow end-to-end through the user interface.

---

## HOW TO EXECUTE PHASE 5D

### Prerequisites

Before starting, ensure:

1. **Database**: PostgreSQL running with migrations applied
2. **Environment**: `.env.local` configured with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/heloci
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   RESEND_API_KEY=[REDACTED-RESEND-KEY]
   TELEGRAM_BOT_TOKEN=[REDACTED-TELEGRAM-TOKEN]
   ```
3. **Dependencies**: `npm install` complete
4. **Build**: `npm run build` succeeds (optional, dev mode doesn't require)

### Launch Development Server

```bash
# Enable runtime tracing for detailed logs
export NOTIFICATION_RUNTIME_TRACE=true

# Start dev server
npm run dev

# Expected output:
# ▲ Next.js 16.2.3
# ▲ Local: http://localhost:3000
```

### Open Browser

Navigate to `http://localhost:3000` in your web browser (Chrome/Firefox/Safari recommended).

You should see the login page.

---

## TESTING WORKFLOW

For each workflow in the test matrix:

### 1. Follow User Path
- Navigate through UI exactly as a user would
- Fill forms with realistic data
- Click buttons and submit

### 2. Observe System
- Check browser console for errors
- Monitor server console logs
- Watch for runtime traces

### 3. Verify Each Checkpoint
- ✓ UI renders correctly
- ✓ Form validation works
- ✓ Server Action executes
- ✓ Database updates
- ✓ Event published
- ✓ Runtime orchestrator ran
- ✓ Notifications sent
- ✓ Audit logs created

### 4. Capture Evidence
- Screenshot of UI at each step
- Server logs showing event/runtime
- Database queries showing records created
- Email/notification confirmations

### 5. Record Result
- ✅ PASS: Workflow complete, all systems worked
- ⚠️ PARTIAL: Workflow works but has minor issues
- ❌ FAIL: Workflow breaks at specific point

---

## 23 WORKFLOWS TO TEST

### Authentication (3)

1. **User Registration** ← START HERE
   - Path: `/register` form → submit → email verification
   - Expected: ✅ PASS (welcome email, user created)

2. **User Login**
   - Path: `/login` form → submit → authenticated dashboard
   - Expected: ✅ PASS (session established, dashboard loads)

3. **Password Reset**
   - Path: `/forgot-password` → email → reset link → new password
   - Expected: ✅ PASS (after event publishing fix)

### Applications (8)

4. **Start Application**
   - Path: Dashboard → "Apply" → form loads
   - Expected: ✅ PASS (draft created, form renders)

5. **Save Draft**
   - Path: Fill form → Save → next page → back
   - Expected: ✅ PASS (data persists)

6. **Submit Application**
   - Path: Complete form → Submit → confirmation
   - Expected: ✅ PASS (notifications sent, events published)

7. **Withdraw Application**
   - Path: Application detail → Withdraw → confirm
   - Expected: ✅ PASS (status changed, notifications sent)

8. **Approve Application** (Admin)
   - Path: Admin dashboard → Applications → Open → Approve
   - Expected: ✅ PASS (multi-channel dispatch, audit logged)

9. **Reject Application** (Admin)
   - Path: Admin dashboard → Applications → Open → Reject
   - Expected: ✅ PASS (reason sent to applicant)

10. **Conditional Approval** (Admin)
    - Path: Admin dashboard → Applications → Open → Conditional
    - Expected: ✅ PASS (conditions included in email)

11. **Waitlist Application** (Admin)
    - Path: Admin dashboard → Applications → Open → Waitlist
    - Expected: ✅ PASS (position calculated and sent)

### Documents (5)

12. **Upload Document**
    - Path: Application detail → Documents → Upload → select file
    - Expected: ✅ PASS (file stored, record created)

13. **Request Documents** (Admin)
    - Path: Review workspace → Documents → Request missing
    - Expected: ✅ PASS (email with deadline sent)

14. **Approve Document** (Admin)
    - Path: Review workspace → Documents → Approve
    - Expected: ✅ PASS (applicant notified)

15. **Reject Document** (Admin)
    - Path: Review workspace → Documents → Reject with reason
    - Expected: ✅ PASS (reason in email)

16. **Request Replacement** (Admin)
    - Path: After rejection → Request replacement
    - Expected: ✅ PASS (new deadline set)

### Messaging (2)

17. **Applicant Message**
    - Path: Application detail → Message input → Send
    - Expected: ✅ PASS (message posted, staff notified)

18. **Admin Message**
    - Path: Admin compose page → Add recipients → Send
    - Expected: ✅ PASS (multi-recipient dispatch)

### Staff Management (4)

19. **Invite Staff**
    - Path: Admin settings → Staff → Invite → email sent
    - Expected: ✅ PASS (invitation email with link)

20. **Accept Invitation**
    - Path: Receive email → Click link → Set password
    - Expected: ✅ PASS (org member created, logged in)

21. **Change Staff Role**
    - Path: Admin settings → Staff → Change role → update
    - Expected: ✅ PASS (notification sent, role updated)

22. **Remove Staff**
    - Path: Admin settings → Staff → Remove → confirm
    - Expected: ✅ PASS (notification sent, record deleted)

### Programs (1)

23. **Eligibility Assessment**
    - Path: Background service or manual trigger
    - Expected: ✅ PASS (matches calculated, notifications sent)

---

## KEY MONITORING POINTS

### Server Console

Watch for these log entries:

```
[DomainEventPublisher] publish event=application.submitted ...
[RuntimeOrchestrator] EVENT: application.submitted
[AudienceResolver] resolved audiences: applicant, org_admin, reviewer, ...
[CommunicationPlanner] Plan 1: applicant → email
[TemplateResolver] application_submitted_applicant_email → loaded
[Dispatcher] Email dispatch: applicant@example.com
```

### Database Queries

After each workflow, run:

```sql
-- Check notification logs
SELECT eventName, channel, recipient, status FROM NotificationLog 
ORDER BY createdAt DESC LIMIT 10;

-- Check audit logs
SELECT entity, action, userId, meta FROM AuditLog 
ORDER BY createdAt DESC LIMIT 5;

-- Check communication timeline
SELECT eventName, organizationId FROM CommunicationTimelineEntry 
ORDER BY createdAt DESC LIMIT 10;

-- Check business records
SELECT id, status, userId FROM ProgramApplication 
WHERE id = 'app_...' LIMIT 1;
```

### External Evidence

- **Emails**: Check your inbox for emails from Resend
- **Telegram**: Check Telegram bot for messages
- **Browser Console**: Ensure no JavaScript errors (F12 → Console)

---

## TROUBLESHOOTING

### Workflow Breaks at "UI Rendering"

**Problem**: Form doesn't load or page is blank

**Debug**:
1. Check browser console (F12) for errors
2. Check server console for 500 errors
3. Check database connection
4. Verify Prisma migrations applied

**Fix**: Review server logs, check database connectivity

---

### Workflow Breaks at "Server Action Execution"

**Problem**: Clicking submit does nothing or throws error

**Debug**:
1. Check "Network" tab in browser DevTools
2. Verify Server Action is actually called (network request visible)
3. Check server console for errors
4. Verify request payload is correct

**Fix**: Debug Server Action code, check for validation errors

---

### Workflow Breaks at "Database Update"

**Problem**: Form submitted but data not in database

**Debug**:
1. Query database directly for record
2. Check for constraint violations (unique email, foreign key, etc.)
3. Verify schema matches code

**Fix**: Fix validation, check database constraints

---

### Workflow Breaks at "Event Publishing"

**Problem**: Notifications not sent, no audit logs

**Debug**:
1. Check server logs for `[DomainEventPublisher]` message
2. Query NotificationLog table (should have entries)
3. Check if event is in registry

**Fix**: Verify event name matches registry, check event publishing code

---

### Workflow Breaks at "Runtime Execution"

**Problem**: Event published but no dispatch

**Debug**:
1. Check for runtime orchestrator logs
2. Check if RuntimeOrchestrator.run() called
3. Check if AudienceResolver returned recipients
4. Verify templates exist

**Fix**: Check runtime configuration, verify registry entries

---

### Workflow Breaks at "Email Delivery"

**Problem**: RuntimeOrchestrator ran but email not received

**Debug**:
1. Check Resend dashboard for delivery status
2. Check NotificationLog for email status
3. Check provider error messages
4. Verify recipient email address

**Fix**: Check Resend API key, verify email address

---

## RECORDING RESULTS

For each workflow tested, create entry:

```
---
WORKFLOW: Application Submission
STATUS: ✅ PASS
EXECUTED: 2026-07-30 14:30:00

EVIDENCE:
- UI: Form renders all pages correctly
- Validation: Required fields enforced
- Server Action: submitApplicationAction() called
- Database: ProgramApplication record created with status="submitted"
- Domain Event: application.submitted published (server log shows timestamp)
- Runtime: [RuntimeOrchestrator] executed (console log captured)
- Audiences: applicant, org_admin, reviewer, case_worker, support (5 audiences)
- Templates: 8 templates loaded (4 channels × 2 audience groups)
- Dispatch: 5 notification dispatch requests logged
- Notifications: NotificationLog has 5 entries (verified via query)
- Audit: AuditLog entry created (action="submitted")
- Timeline: CommunicationTimelineEntry created
- User Response: Browser shows "Application submitted successfully"
- Email: Confirmation email received in inbox

NOTES:
- Telegram alert also sent (ops team screenshot captured)
- Multi-channel dispatch working perfectly
- All audit trails created
- No console errors
```

---

## SUCCESS CRITERIA

Phase 5D is successful when:

- [ ] 20/23 workflows marked ✅ PASS
- [ ] 2-3 workflows marked ⚠️ PARTIAL (acceptable minor issues)
- [ ] 0-1 workflows marked ❌ FAIL (with documented reason)
- [ ] All critical paths verified (registration, submission, approval)
- [ ] All email deliveries confirmed
- [ ] All database records created correctly
- [ ] All audit logs present
- [ ] All notification logs populated
- [ ] No critical errors in console
- [ ] No architecture changes made
- [ ] Evidence captured for each workflow

---

## TIMELINE

- **Setup**: 30 minutes (environment, database, dependencies)
- **Authentication**: 15 minutes (3 workflows)
- **Applications**: 45 minutes (8 workflows)
- **Documents**: 30 minutes (5 workflows)
- **Messaging**: 15 minutes (2 workflows)
- **Staff**: 20 minutes (4 workflows)
- **Programs**: 10 minutes (1 workflow)
- **Analysis & Fixes**: 1-2 hours (if issues found)

**Total**: ~3-4 hours for complete operational certification

---

## OUTPUT

After completing Phase 5D, create:

**PHASE-5D-OPERATIONAL-CERTIFICATION.md**

Contains:
- Certification matrix (all 23 workflows with status)
- Pass rate percentage
- Evidence capture for each workflow
- Failed workflow root cause analysis
- Minimal fixes needed
- Production readiness assessment

---

## NEXT: PHASE 6

After Phase 5D is complete:

1. ✅ Phase 5D results → PHASE-5D-OPERATIONAL-CERTIFICATION.md
2. ✅ Identify any blockers → Provide minimal fixes
3. ✅ Re-test failed workflows
4. ✅ Achieve 90%+ pass rate
5. ✅ Document all evidence
6. ✅ Get sign-off for Phase 6

**Phase 6** will be final integration testing before production deployment.

---

## START HERE

1. Read: `PHASE-5D-OPERATIONAL-CERTIFICATION-PLAN.md` (detailed testing guide)
2. Execute: Launch dev server and start with "User Registration"
3. Capture: Take screenshots, note server logs, query database
4. Record: Document each workflow status and evidence
5. Analyze: Review failures and identify root causes
6. Report: Create PHASE-5D-OPERATIONAL-CERTIFICATION.md

**Ready to launch?** Start with the dev server:

```bash
npm run dev
```

Navigate to http://localhost:3000 and begin testing!

---

*Phase 5D Ready for Execution*
