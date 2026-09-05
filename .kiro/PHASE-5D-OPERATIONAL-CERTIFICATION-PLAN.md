# PHASE 5D — OPERATIONAL CERTIFICATION PLAN

**Status**: Ready to Execute
**Date**: July 30, 2026
**Objective**: Launch HELoCI in development mode and execute every workflow as a real user would, capturing evidence

---

## EXECUTION ENVIRONMENT

### Prerequisites

```
✅ Node.js 18+ installed
✅ PostgreSQL database running
✅ .env.local configured with:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - RESEND_API_KEY (for email)
   - TELEGRAM_BOT_TOKEN (for alerts)
```

### Environment Variables (Already Configured)

```
RESEND_API_KEY=<configure-in-environment>
COMMUNICATION_SENDER_EMAIL=petkeyz8@gmail.com
TELEGRAM_BOT_TOKEN=<configure-in-environment>
TELEGRAM_CHAT_ID=7060936226
```

### Enable Runtime Tracing

Before launching dev server:
```bash
export NOTIFICATION_RUNTIME_TRACE=true
```

This enables detailed logging of:
- Domain events published
- RuntimeOrchestrator execution
- AudienceResolver recipient resolution
- CommunicationPlanner channel selection
- TemplateResolver template loading
- Dispatcher provider dispatch

---

## LAUNCH SEQUENCE

### Step 1: Start Development Server

```bash
cd /path/to/heloci-main
npm run dev
```

Expected output:
```
> heloci@0.1.0 dev
> next dev --webpack

  ▲ Next.js 16.2.3
  ▲ Local:        http://localhost:3000
  ▲ Experimental feature (webpack): enabled
```

### Step 2: Verify Application Loads

- Navigate to: `http://localhost:3000`
- Expected: Login page loads
- Check console for errors
- Verify no runtime errors

### Step 3: Check Database Connection

- Verify Prisma client initialized
- Check database is accessible
- Confirm migrations applied

---

## WORKFLOW TESTING MATRIX

### AUTHENTICATION WORKFLOWS

#### 1. USER REGISTRATION

**Objective**: Verify registration from browser → notification engine

**User Path**:
1. Navigate to `/register`
2. Fill form: email, password, name
3. Click "Sign Up"
4. Verify Supabase email sent
5. Confirm email (check inbox)
6. Verify redirected to dashboard

**System Verification**:
- [ ] UI form renders
- [ ] Form validation works (required fields)
- [ ] Server Action `registerUser()` executes
- [ ] User record created in Prisma
- [ ] Domain Event `user.registration` published
  - Evidence: Check server logs for `[DomainEventPublisher]`
- [ ] RuntimeOrchestrator.run() called
  - Evidence: Check console for runtime trace
- [ ] Audiences resolved: applicant, org_admin
  - Evidence: Check `[AudienceResolver]` logs
- [ ] Templates loaded: welcome email
  - Evidence: Check `[TemplateResolver]` logs
- [ ] Email sent via Resend
  - Evidence: Check Resend dashboard or email inbox
- [ ] NotificationLog entries created
  - Query: `SELECT * FROM NotificationLog WHERE eventName = 'user.registration'`
  - Expected: 1-2 entries (email + internal)
- [ ] CommunicationTimeline entry created
  - Query: `SELECT * FROM CommunicationTimelineEntry WHERE eventName = 'user.registration'`
- [ ] AuditLog entry created
  - Query: `SELECT * FROM AuditLog WHERE entity = 'User' AND action = 'created'`
- [ ] Browser shows success message
  - Expected: "Welcome email sent" or redirect to dashboard

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of registration form
- Screenshot of success message
- Server log excerpt showing event published
- Database query results (NotificationLog, AuditLog)

---

#### 2. USER LOGIN

**Objective**: Verify login workflow

**User Path**:
1. Navigate to `/login`
2. Enter email + password
3. Click "Sign In"
4. Verify redirected to dashboard
5. Verify session established

**System Verification**:
- [ ] UI form renders
- [ ] Form validation works
- [ ] Supabase authentication succeeds
- [ ] Session established
- [ ] getCurrentUser() works (authorization)
- [ ] Dashboard loads with user data
- [ ] No runtime errors

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of login form
- Screenshot of authenticated dashboard
- Browser console (no errors)

---

#### 3. PASSWORD RESET

**Objective**: Verify password reset workflow and event publishing

**User Path**:
1. Navigate to `/forgot-password`
2. Enter email
3. Click "Send Reset Email"
4. Check email for reset link (Supabase)
5. Click link and set new password
6. Login with new password

**System Verification**:
- [ ] UI form renders
- [ ] Form validation works
- [ ] Server Action `resetPasswordAction()` called
- [ ] Domain Event `user.password_reset_requested` published
  - Evidence: Check server logs
- [ ] NotificationLog entry created
  - Query: `SELECT * FROM NotificationLog WHERE eventName = 'user.password_reset_requested'`
- [ ] AuditLog entry created
- [ ] Email sent by Supabase
- [ ] Password successfully reset
- [ ] Login works with new password

**Expected Result**: ✅ PASS (after fix implementation)

**Evidence Capture**:
- Screenshot of password reset form
- Screenshot of success message
- Server log showing event published
- Database query results

---

### APPLICATION WORKFLOWS

#### 4. START APPLICATION

**Objective**: Create new application in draft state

**User Path** (as Applicant):
1. Login to dashboard
2. Click "Apply to Program"
3. Select program
4. Form loads (multi-page wizard)
5. Verify "Save" button works
6. Navigate between pages

**System Verification**:
- [ ] UI renders correctly
- [ ] Form pages display
- [ ] Save button calls `saveApplicationDraft()`
- [ ] Application record created with status: "draft"
- [ ] Form data persisted to database
- [ ] currentPage tracking works

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of program selection
- Screenshot of draft form
- Database query: `SELECT * FROM ProgramApplication WHERE status = 'draft'`

---

#### 5. SAVE DRAFT

**Objective**: Verify incremental draft saving

**User Path**:
1. Fill out first page of application
2. Click "Save & Continue"
3. Fill next page
4. Click "Save & Continue"
5. Navigate away and back
6. Verify data persisted

**System Verification**:
- [ ] Each save calls `saveApplicationDraft()`
- [ ] Data merged correctly (not overwritten)
- [ ] currentPage updated
- [ ] No errors on save
- [ ] Data persists on page reload

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of form at page 1
- Screenshot of form at page 2
- Database query showing merged data

---

#### 6. SUBMIT APPLICATION

**Objective**: Complete and submit application

**User Path**:
1. Complete all pages of application
2. Review page shows all data
3. Click "Submit Application"
4. Verify success message
5. Check email for confirmation

**System Verification**:
- [ ] UI form renders all pages
- [ ] Validation works (all required fields)
- [ ] Server Action `submitApplicationAction()` called
- [ ] Application status changed: "draft" → "submitted"
- [ ] Domain Event `application.submitted` published
  - Evidence: Check server logs
- [ ] RuntimeOrchestrator.run() executed
  - Evidence: Check runtime trace
- [ ] Audiences resolved: applicant, org_admin, reviewer, case_worker, support
  - Evidence: Check audience resolver logs
- [ ] Templates loaded for all audiences
- [ ] Dispatch executed to all channels (email, telegram, internal)
  - Evidence: Check dispatch logs
- [ ] NotificationLog entries created (multiple for multi-channel)
  - Query: `SELECT * FROM NotificationLog WHERE eventName = 'application.submitted'`
  - Expected: 5+ entries (multi-audience, multi-channel)
- [ ] CommunicationTimeline entry created
- [ ] AuditLog entry created
- [ ] Browser shows "Application submitted successfully"
- [ ] Applicant receives email confirmation
- [ ] Org admin receives telegram alert
- [ ] Staff see internal notification

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of filled form
- Screenshot of submission success
- Screenshot of confirmation email
- Server log excerpts (events, runtime, dispatch)
- Database queries (NotificationLog, AuditLog)
- Telegram screenshot (if applicable)

---

#### 7. WITHDRAW APPLICATION

**Objective**: Verify applicant can withdraw application

**User Path** (as Applicant):
1. Go to submitted application
2. Click "Withdraw Application"
3. Confirm withdrawal
4. Verify status changed to withdrawn

**System Verification**:
- [ ] UI button available on application
- [ ] Confirmation dialog shown
- [ ] Server Action executes
- [ ] Application status changed: "submitted" → "withdrawn"
- [ ] Domain Event `application.withdrawn` published
- [ ] NotificationLog entries created
- [ ] Browser shows success message

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of application detail
- Screenshot of withdrawal confirmation
- Screenshot of success message

---

#### 8. APPLICATION APPROVAL (Admin Decision)

**Objective**: Verify admin approval workflow

**User Path** (as Reviewer/Admin):
1. Login as admin/reviewer
2. Navigate to "Applications" → "Under Review"
3. Click application to open review workspace
4. Review checklist, documents, etc.
5. Click "Approve"
6. Fill in approval message (optional)
7. Click "Submit Decision"
8. Verify success message

**System Verification**:
- [ ] UI review workspace renders
- [ ] Application data loads
- [ ] Approve button available
- [ ] Server Action `approveApplication()` called
- [ ] TRANSACTION block executes:
  - [ ] caseDecision record created
  - [ ] programApplication status updated → "approved"
  - [ ] waitlistEntry removed (if applicable)
  - [ ] applicationEvent created (timeline)
  - [ ] auditLog created
  - [ ] CaseMessage posted to conversation
- [ ] Domain Event `application.approved` published (after transaction)
  - Evidence: Check server logs
- [ ] RuntimeOrchestrator executed
  - Evidence: Check runtime trace
- [ ] Audiences resolved: applicant, org_admin, reviewer
  - Evidence: Check audience logs
- [ ] Templates loaded for each audience + channel
- [ ] Dispatch executed to:
  - applicant email (congratulations)
  - applicant internal (in-app notification)
  - org_admin telegram (alert)
  - org_admin internal (audit)
  - reviewer internal (FYI)
- [ ] NotificationLog entries created (5 entries)
  - Query: `SELECT * FROM NotificationLog WHERE eventName = 'application.approved'`
- [ ] CommunicationTimeline entry created
- [ ] AuditLog entry created
- [ ] CaseConversation updated with decision message
- [ ] Browser shows "Application approved"
- [ ] Applicant receives congratulations email
- [ ] Org admin receives telegram alert

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of review workspace
- Screenshot of approval form
- Screenshot of success message
- Server log (events, runtime, dispatch)
- Database queries (NotificationLog, CaseDecision, CaseMessage)
- Email screenshot
- Telegram screenshot

---

#### 9. APPLICATION REJECTION

**Objective**: Verify admin rejection workflow

**User Path** (as Reviewer):
1. Open application in review workspace
2. Click "Reject"
3. Fill in rejection reason
4. Click "Submit Decision"

**System Verification**:
- [ ] Server Action `rejectApplication()` called
- [ ] Application status → "rejected"
- [ ] Domain Event `application.rejected` published
- [ ] NotificationLog entries created (multi-channel)
- [ ] CaseMessage posted to conversation
- [ ] Applicant receives rejection email with reason
- [ ] Org admin receives notification

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of rejection form
- Screenshot of success message
- Email screenshot with reason

---

#### 10. CONDITIONAL APPROVAL

**Objective**: Verify conditional approval with conditions

**User Path** (as Reviewer):
1. Open application in review workspace
2. Click "Conditional Approval"
3. Add conditions (e.g., "Provide proof of income")
4. Set expiration date
5. Click "Submit Decision"

**System Verification**:
- [ ] Server Action `conditionallyApproveApplication()` called
- [ ] Application status → "conditional_approval"
- [ ] Conditions stored in database
- [ ] Domain Event `application.review.completed` published
  - Payload includes conditions array
- [ ] NotificationLog entries created
- [ ] Applicant receives email with conditions list
- [ ] CaseMessage shows all conditions

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of conditional form
- Screenshot of conditions
- Email screenshot showing conditions
- Database query showing conditions stored

---

#### 11. WAITLIST DECISION

**Objective**: Verify waitlist workflow

**User Path** (as Reviewer):
1. Open application in review workspace
2. Click "Waitlist"
3. Add optional message
4. Click "Submit Decision"

**System Verification**:
- [ ] Application status → "waitlisted"
- [ ] WaitlistEntry record created
- [ ] Position calculated
- [ ] Domain Event `application.waitlisted` published
- [ ] NotificationLog entries created
- [ ] Applicant receives waitlist notification with position
- [ ] Email includes timeline information

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of waitlist form
- Screenshot of success
- Email screenshot with position

---

### DOCUMENT WORKFLOWS

#### 12. UPLOAD DOCUMENT

**Objective**: Verify applicant can upload documents

**User Path** (as Applicant):
1. Go to application detail page
2. Scroll to "Documents" section
3. Click "Upload Document"
4. Select document type
5. Choose file from computer
6. Click "Upload"
7. Verify document appears in list

**System Verification**:
- [ ] UI file input renders
- [ ] File selected successfully
- [ ] Server Action calls `uploadDocumentForApplication()`
- [ ] Document storage service persists file
- [ ] Document record created in Prisma
- [ ] Domain Event `document.uploaded` published (optional)
- [ ] File appears in document list
- [ ] No errors on page

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of upload form
- Screenshot of document in list
- Database query: `SELECT * FROM Document WHERE applicationId = '...'`

---

#### 13. REQUEST DOCUMENTS

**Objective**: Verify admin can request missing documents

**User Path** (as Reviewer):
1. Open application in review workspace
2. Go to "Documents" section
3. Identify missing required documents
4. Click "Request Documents"
5. Select which documents to request
6. Add deadline (default 7 days)
7. Click "Send Request"

**System Verification**:
- [ ] UI form renders with document checklist
- [ ] Server Action calls `requestDocumentsInCase()` or similar
- [ ] DocumentRequest records created (one per document type)
- [ ] Deadline set in each request
- [ ] Domain Event `documents.requested` published
  - Payload includes document types, deadline
- [ ] NotificationLog entries created
- [ ] CaseMessage posted to conversation
- [ ] Applicant receives email with:
  - List of required documents
  - Deadline
  - Instructions for upload
- [ ] Staff see internal notification

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of document request form
- Screenshot of success message
- Email screenshot with document list and deadline
- Database query: `SELECT * FROM DocumentRequest WHERE applicationId = '...'`

---

#### 14. APPROVE DOCUMENT

**Objective**: Verify admin can approve uploaded documents

**User Path** (as Reviewer):
1. Open application in review workspace
2. Go to "Documents" section
3. Review uploaded document (view/download)
4. Click "Approve Document"
5. Add optional notes
6. Click "Confirm"

**System Verification**:
- [ ] Document preview works
- [ ] Server Action calls `approveDocument()`
- [ ] DocumentRequest status → "approved"
- [ ] DocumentVerification record created
- [ ] Domain Event `document.approved` published
- [ ] NotificationLog entries created
- [ ] CaseMessage posted
- [ ] Applicant receives approval email

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of document detail
- Screenshot of approval confirmation
- Email screenshot

---

#### 15. REJECT DOCUMENT

**Objective**: Verify admin can reject documents

**User Path** (as Reviewer):
1. Open application
2. Go to documents
3. Click "Reject Document"
4. Add rejection reason
5. Click "Submit"

**System Verification**:
- [ ] Server Action calls `rejectDocument()`
- [ ] DocumentRequest status → "rejected"
- [ ] Rejection reason stored
- [ ] Domain Event `document.rejected` published
- [ ] NotificationLog entries created
- [ ] Applicant receives rejection email with reason
- [ ] Can request replacement

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of rejection form
- Email screenshot with reason

---

#### 16. REQUEST REPLACEMENT

**Objective**: Verify replacement request workflow

**User Path** (as Reviewer):
1. After rejecting document
2. Click "Request Replacement"
3. Set new deadline
4. Click "Send Request"

**System Verification**:
- [ ] New DocumentRequest created for replacement
- [ ] Domain Event `document.replacement.requested` published
- [ ] NotificationLog entries created
- [ ] Applicant receives email with replacement request

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of request form
- Email screenshot

---

### MESSAGING WORKFLOWS

#### 17. APPLICANT SENDS MESSAGE

**Objective**: Verify applicant messaging in case conversation

**User Path** (as Applicant):
1. Go to application detail
2. Scroll to "Conversation" or "Messages"
3. Type message in input box
4. Click "Send"
5. Verify message appears in conversation

**System Verification**:
- [ ] UI message input renders
- [ ] Server Action calls `sendCaseMessage()` or similar
- [ ] CaseMessage record created
- [ ] Message visible in conversation immediately (optimistic update)
- [ ] Domain Event `message.created` or `admin.action` published
- [ ] NotificationLog entries created
- [ ] Staff receive notification of new message
- [ ] Conversation lastMessageAt updated

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of message form
- Screenshot of message in conversation
- Notification screenshot (for staff)

---

#### 18. ADMIN SENDS MESSAGE

**Objective**: Verify admin messaging to applicant

**User Path** (as Admin):
1. Go to application in review workspace
2. Go to "Conversation" tab
3. Type response message
4. Click "Send to Applicant"
5. Verify message posted

**System Verification**:
- [ ] UI message input renders
- [ ] Message marked for visibility to applicant
- [ ] Server Action executes
- [ ] CaseMessage created with role: "staff_to_applicant"
- [ ] Domain Event `message.created` published
- [ ] NotificationLog entries created
- [ ] Applicant receives in-app notification
- [ ] Optional: Email notification sent

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of admin message form
- Screenshot of message in conversation
- Applicant notification screenshot

---

#### 19. MANUAL ADMIN MESSAGE

**Objective**: Verify admin compose and send custom message

**User Path** (as Admin):
1. Navigate to `/admin/email` or Communication page
2. Click "Compose Message"
3. Select recipients (applicant, staff, external)
4. Fill subject and body
5. Choose sending channel (email, internal, etc.)
6. Click "Send"

**System Verification**:
- [ ] UI compose form renders
- [ ] Recipient selector works (autocomplete)
- [ ] Server Action `sendMixedEmailAction()` or similar called
- [ ] For each recipient: Domain Event `admin.action` published
- [ ] Dispatch routes correctly based on recipient type
- [ ] NotificationLog entries created (one per recipient)
- [ ] Message sent via selected channel
- [ ] Browser shows success with recipient count

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of compose form
- Screenshot of recipient selection
- Screenshot of success message
- NotificationLog query results

---

### STAFF MANAGEMENT WORKFLOWS

#### 20. INVITE STAFF

**Objective**: Verify staff invitation workflow

**User Path** (as Org Admin):
1. Navigate to `/admin/staff` or organization settings
2. Click "Invite Staff Member"
3. Enter email, name, role
4. Click "Send Invitation"
5. Verify success message

**System Verification**:
- [ ] UI form renders
- [ ] Server Action `inviteStaffMember()` or similar called
- [ ] Invitation record created with unique token
- [ ] Expiration date set (typically 7 days)
- [ ] Domain Event `staff.invited` published
  - Payload includes: email, token, invitationId
- [ ] RuntimeOrchestrator executed
- [ ] Email sent to new staff member
- [ ] Email includes invitation link with token
- [ ] NotificationLog entries created
- [ ] AuditLog entry created
- [ ] Browser shows "Invitation sent to <email>"

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of invitation form
- Screenshot of success message
- Email screenshot with invitation link
- Database query: `SELECT * FROM Invitation WHERE email = '...'`

---

#### 21. ACCEPT STAFF INVITATION

**Objective**: Verify staff member accepts invitation

**User Path** (as New Staff Member):
1. Receive invitation email
2. Click invitation link in email
3. Navigate to `/invite/[token]`
4. Form shows email (pre-filled)
5. Set password
6. Click "Accept Invitation"
7. Verify logged in and taken to staff dashboard

**System Verification**:
- [ ] Invitation page loads with email pre-filled
- [ ] Form validation works (password strength)
- [ ] Server Action calls `acceptStaffInvitation()` or similar
- [ ] Invitation record updated: acceptedAt = now()
- [ ] OrganizationMember record created with assigned role
- [ ] User record created (if not exists) or role updated
- [ ] Domain Event `staff.invitation.accepted` published
- [ ] NotificationLog entries created
- [ ] AuditLog entry created
- [ ] Staff member logged in and redirected to dashboard
- [ ] Org admin receives notification of staff acceptance

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of invitation page
- Screenshot of password form
- Screenshot of staff dashboard
- Database query: `SELECT * FROM OrganizationMember WHERE role = 'staff'`

---

#### 22. CHANGE STAFF ROLE

**Objective**: Verify staff role update workflow

**User Path** (as Org Admin):
1. Navigate to staff members list
2. Find staff member in table
3. Click role dropdown (e.g., "Reviewer" → "Manager")
4. Select new role
5. Click "Update"
6. Verify success message

**System Verification**:
- [ ] UI role dropdown renders
- [ ] Server Action `updateStaffRole()` or similar called
- [ ] RBAC check: Only org_admin can change roles
- [ ] OrganizationMember.role updated
- [ ] Cannot change own role (validation)
- [ ] Domain Event `staff.role.changed` published
- [ ] RuntimeOrchestrator executed
- [ ] Staff member receives notification of role change
- [ ] Org admin receives confirmation
- [ ] Telegram alert sent (ops team aware)
- [ ] AuditLog entry created
- [ ] Browser shows "Role updated successfully"

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of staff list with role dropdown
- Screenshot of success message
- Notification screenshot (staff member received notification)
- Telegram alert screenshot
- Database query: `SELECT role FROM OrganizationMember WHERE userId = '...'`

---

#### 23. REMOVE STAFF

**Objective**: Verify staff member removal

**User Path** (as Org Admin):
1. Navigate to staff members list
2. Find staff member
3. Click "Remove" button
4. Confirm removal dialog
5. Click "Yes, Remove"

**System Verification**:
- [ ] Remove button available for eligible staff
- [ ] Validation: Cannot remove if last org_admin
- [ ] Confirmation dialog shown
- [ ] Server Action `removeStaffMember()` called
- [ ] RBAC check enforced
- [ ] OrganizationMember record deleted
- [ ] Domain Event `staff.removed` published
- [ ] NotificationLog entries created
- [ ] Staff member receives removal notification
- [ ] Org admin receives confirmation
- [ ] AuditLog entry created
- [ ] Browser shows "Staff member removed"

**Expected Result**: ✅ PASS

**Evidence Capture**:
- Screenshot of staff list
- Screenshot of removal confirmation
- Screenshot of success message
- Removal notification screenshot

---

## EVIDENCE COLLECTION TEMPLATE

For each workflow, capture:

```
WORKFLOW: [Name]
STATUS: PASS / FAIL / BLOCKED
EXECUTED: [Date/Time]

EVIDENCE:
1. Screenshots:
   - UI rendering
   - Form submission
   - Success message
   
2. Server Logs:
   - [DomainEventPublisher] published event=...
   - [RuntimeOrchestrator] executed
   - [AudienceResolver] resolved audiences
   - [Dispatcher] sent notifications
   
3. Database Queries:
   - NotificationLog entries
   - AuditLog entries
   - CommunicationTimeline entries
   - Business record (Application, Document, etc.)
   
4. External Verification:
   - Email sent (screenshot from inbox)
   - Telegram message sent (screenshot)
   - SMS sent (if applicable)
   
5. Error Tracking:
   - No console errors
   - No server errors
   - All validations passed
```

---

## EXPECTED OUTCOMES

### Critical Workflows (Must PASS)

- ✅ User Registration → Email delivery confirmed
- ✅ Application Submission → Multi-channel dispatch confirmed
- ✅ Application Approval → All audiences receive notification
- ✅ Document Upload → Storage and tracking confirmed
- ✅ Staff Invitation → Email with token confirmed

### Important Workflows (Must PASS)

- ✅ Login → Session established
- ✅ Draft Saving → Data persists
- ✅ Messaging → Communication tracked
- ✅ Rejection → Reason included in email

### Optional Workflows

- ⚠️ Password Reset → Event publishing (after fix)
- ⚠️ Login Event → Optional notification

---

## FAILURE HANDLING

If a workflow shows ❌ FAIL:

1. **Identify Breakpoint**: Exactly where does the workflow break?
   - UI rendering?
   - Server Action call?
   - Database update?
   - Event publishing?
   - Runtime execution?
   - Dispatch?

2. **Capture Evidence**: Screenshot, logs, error message

3. **Analyze Root Cause**: 
   - Configuration issue?
   - Code bug?
   - Missing dependency?
   - Database problem?

4. **Minimal Fix**: Only fix what's broken, don't redesign

5. **Re-test**: Verify workflow now passes

6. **Document**: Add to blocked issues list

---

## SUCCESS CRITERIA

Phase 5D is **complete when**:

- [ ] All 23 critical workflows tested end-to-end
- [ ] 20+ workflows marked ✅ PASS
- [ ] All failures documented with root cause
- [ ] Evidence captured for each workflow
- [ ] No architecture changes made
- [ ] No business logic refactored
- [ ] All data persisted correctly
- [ ] All notifications sent
- [ ] All audit trails created

---

## NEXT STEPS AFTER 5D

1. **Compile Results** → PHASE-5D-OPERATIONAL-CERTIFICATION.md
2. **Document Failures** → Minimal fixes provided
3. **Verify Production Ready** → 90%+ pass rate required
4. **Gate Decision** → Proceed to Phase 6 or fix blockers

---

*Phase 5D Operational Certification Plan Complete*

Ready for live testing in development environment.
