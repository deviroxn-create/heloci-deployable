# PHASE 5D — EXECUTION GUIDE

**Status**: Execution Started
**Dev Server**: http://localhost:3000 ✅ Running
**Start Time**: July 30, 2026
**Tester Role**: Manual browser testing + server verification

---

## QUICK START

1. **Dev Server**: Already running on http://localhost:3000
2. **Open Browser**: Go to http://localhost:3000
3. **Follow Plan**: Use `PHASE-5D-OPERATIONAL-CERTIFICATION-PLAN.md` for detailed workflow steps
4. **Capture Evidence**: Screenshots, server logs, database queries
5. **Record Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL for each workflow

---

## VERIFICATION COMMANDS

After each workflow, run these commands to verify system state:

### Check Latest NotificationLog Entries
```sql
SELECT 
  id, 
  eventName, 
  channel, 
  recipient, 
  status, 
  createdAt 
FROM "NotificationLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Check Latest AuditLog Entries
```sql
SELECT 
  id, 
  entity, 
  action, 
  userId, 
  meta, 
  "createdAt" 
FROM "AuditLog" 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

### Check CommunicationTimeline
```sql
SELECT 
  id, 
  "eventName", 
  "organizationId", 
  "createdAt" 
FROM "CommunicationTimelineEntry" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Check Recent Users
```sql
SELECT id, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
```

### Check Recent Applications
```sql
SELECT id, status, "userId", "createdAt" FROM "ProgramApplication" ORDER BY "createdAt" DESC LIMIT 5;
```

### Check Recent Documents
```sql
SELECT id, "fileName", status, "applicationId", "createdAt" FROM "Document" ORDER BY "createdAt" DESC LIMIT 5;
```

### Check Recent Messages
```sql
SELECT id, "applicationId", "senderId", "createdAt" FROM "CaseMessage" ORDER BY "createdAt" DESC LIMIT 5;
```

### Check Staff Invitations
```sql
SELECT id, email, status, "acceptedAt", "createdAt" FROM "Invitation" ORDER BY "createdAt" DESC LIMIT 5;
```

---

## WORKFLOW EXECUTION CHECKLIST

### AUTHENTICATION (3 workflows)

#### ☐ 1. User Registration
**Steps**:
1. Go to http://localhost:3000/register
2. Fill form: email, password, name
3. Click "Sign Up"
4. Check email for verification link
5. Confirm email

**Verification**:
- [ ] UI renders form correctly
- [ ] Form validation works (required fields)
- [ ] Supabase creates user account
- [ ] User record in database:
  ```sql
  SELECT * FROM "User" WHERE email = '[test_email]' LIMIT 1;
  ```
- [ ] Domain Event published (check server logs)
- [ ] NotificationLog entries created:
  ```sql
  SELECT * FROM "NotificationLog" WHERE "eventName" LIKE 'user.%' ORDER BY "createdAt" DESC LIMIT 5;
  ```
- [ ] AuditLog entry created:
  ```sql
  SELECT * FROM "AuditLog" WHERE entity = 'User' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Email received in inbox
- [ ] Success message shown in browser

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshot of registration form
- [ ] Screenshot of success message
- [ ] Email screenshot
- [ ] Server log excerpt
- [ ] Database query results

---

#### ☐ 2. User Login
**Steps**:
1. Go to http://localhost:3000/login
2. Enter email and password
3. Click "Sign In"
4. Verify redirected to dashboard

**Verification**:
- [ ] UI renders login form
- [ ] Form validation works
- [ ] Authentication succeeds
- [ ] Session established
- [ ] Dashboard loads
- [ ] User data visible
- [ ] No console errors

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshot of login form
- [ ] Screenshot of authenticated dashboard
- [ ] Browser console (F12 → Console, screenshot)

---

#### ☐ 3. Password Reset
**Steps**:
1. Go to http://localhost:3000/forgot-password
2. Enter registered email
3. Click "Send Reset Email"
4. Check email for reset link
5. Click link and set new password
6. Login with new password

**Verification**:
- [ ] UI renders password reset form
- [ ] Form validation works
- [ ] Domain Event `user.password_reset_requested` published:
  ```sql
  SELECT * FROM "NotificationLog" WHERE "eventName" = 'user.password_reset_requested' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] AuditLog entry created
- [ ] Email sent with reset link
- [ ] Reset link works
- [ ] Password updated in Supabase
- [ ] Login with new password succeeds

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshot of password reset form
- [ ] Email screenshot with reset link
- [ ] Screenshot of success message
- [ ] Server log excerpt
- [ ] Database query results

---

### APPLICATIONS (8 workflows)

#### ☐ 4. Start Application
**Steps**:
1. Login as applicant
2. Go to dashboard
3. Click "Apply to Program"
4. Select program
5. Form wizard loads

**Verification**:
- [ ] UI renders program selection
- [ ] Form pages display
- [ ] ProgramApplication record created with status="draft":
  ```sql
  SELECT * FROM "ProgramApplication" WHERE status = 'draft' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Form data persisted
- [ ] currentPage tracking works

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of each form page
- [ ] Database query showing draft created

---

#### ☐ 5. Save Draft
**Steps**:
1. Fill out first page of application
2. Click "Save & Continue"
3. Fill next page
4. Click "Save & Continue"
5. Navigate away and back
6. Verify data persisted

**Verification**:
- [ ] Each save succeeds
- [ ] Data merged correctly
- [ ] currentPage updates
- [ ] Data persists on reload:
  ```sql
  SELECT "data", "currentPage" FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of form at each page
- [ ] Database query showing data persistence

---

#### ☐ 6. Submit Application
**Steps**:
1. Complete all pages of application
2. Review all data
3. Click "Submit Application"
4. Verify success message
5. Check email for confirmation
6. Verify applicant receives notification

**Verification**:
- [ ] UI validation works (all required fields)
- [ ] Status changed: "draft" → "submitted":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event `application.submitted` published (server logs)
- [ ] NotificationLog entries created (5+):
  ```sql
  SELECT * FROM "NotificationLog" WHERE "eventName" = 'application.submitted' ORDER BY "createdAt" DESC LIMIT 10;
  ```
- [ ] CommunicationTimeline entry created:
  ```sql
  SELECT * FROM "CommunicationTimelineEntry" WHERE "eventName" = 'application.submitted' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] AuditLog entry created
- [ ] Email sent to applicant
- [ ] Telegram alert sent to org admin
- [ ] Success message shown

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of submission
- [ ] Email screenshot
- [ ] Telegram screenshot
- [ ] Server log excerpts
- [ ] Database query results (10+ lines from above queries)

---

#### ☐ 7. Withdraw Application
**Steps**:
1. Go to submitted application
2. Click "Withdraw Application"
3. Confirm withdrawal

**Verification**:
- [ ] Status changed: "submitted" → "withdrawn":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event published (server logs)
- [ ] NotificationLog entries created
- [ ] Browser shows success message

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of withdrawal
- [ ] Success message screenshot

---

#### ☐ 8. Application Approval (Admin)
**Steps**:
1. Login as admin/reviewer
2. Navigate to Applications → Under Review
3. Open application
4. Click "Approve"
5. Submit approval

**Verification**:
- [ ] Review workspace renders
- [ ] Status changed: "submitted" → "approved":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] CaseDecision record created:
  ```sql
  SELECT * FROM "CaseDecision" WHERE "applicationId" = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event `application.approved` published (server logs)
- [ ] NotificationLog entries created (5+):
  ```sql
  SELECT * FROM "NotificationLog" WHERE "eventName" = 'application.approved' ORDER BY "createdAt" DESC LIMIT 10;
  ```
- [ ] Applicant email sent
- [ ] Org admin telegram alert sent
- [ ] AuditLog entry created

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of review workspace
- [ ] Email screenshot
- [ ] Telegram screenshot
- [ ] Server logs
- [ ] Database queries (NotificationLog, CaseDecision)

---

#### ☐ 9. Application Rejection (Admin)
**Steps**:
1. Open application in review workspace
2. Click "Reject"
3. Fill rejection reason
4. Submit decision

**Verification**:
- [ ] Status changed: "submitted" → "rejected":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] NotificationLog entries created
- [ ] Rejection email sent with reason
- [ ] CaseMessage posted

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of rejection form
- [ ] Email screenshot with reason

---

#### ☐ 10. Conditional Approval (Admin)
**Steps**:
1. Open application
2. Click "Conditional Approval"
3. Add conditions
4. Submit decision

**Verification**:
- [ ] Status changed: "submitted" → "conditional_approval":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] NotificationLog entries created
- [ ] Email includes conditions list

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of conditions form
- [ ] Email screenshot with conditions

---

#### ☐ 11. Waitlist Decision (Admin)
**Steps**:
1. Open application
2. Click "Waitlist"
3. Add optional message
4. Submit decision

**Verification**:
- [ ] Status changed: "submitted" → "waitlisted":
  ```sql
  SELECT status FROM "ProgramApplication" WHERE id = '[app_id]' LIMIT 1;
  ```
- [ ] WaitlistEntry created:
  ```sql
  SELECT * FROM "WaitlistEntry" WHERE "applicationId" = '[app_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Email sent with position

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of waitlist form
- [ ] Email screenshot with position

---

### DOCUMENTS (5 workflows)

#### ☐ 12. Upload Document
**Steps**:
1. Go to application
2. Scroll to Documents section
3. Click "Upload Document"
4. Select document type
5. Choose file
6. Click "Upload"

**Verification**:
- [ ] UI file input renders
- [ ] Document record created:
  ```sql
  SELECT * FROM "Document" WHERE "applicationId" = '[app_id]' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] File stored successfully
- [ ] Document appears in list

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of upload form
- [ ] Document in list screenshot
- [ ] Database query

---

#### ☐ 13. Request Documents (Admin)
**Steps**:
1. Open application in review workspace
2. Go to Documents section
3. Click "Request Documents"
4. Select documents to request
5. Click "Send Request"

**Verification**:
- [ ] UI form renders
- [ ] DocumentRequest records created (one per type):
  ```sql
  SELECT * FROM "DocumentRequest" WHERE "applicationId" = '[app_id]' ORDER BY "createdAt" DESC LIMIT 10;
  ```
- [ ] Domain Event published
- [ ] Email sent with document list and deadline
- [ ] CaseMessage posted

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of request form
- [ ] Email screenshot with deadline
- [ ] Database query

---

#### ☐ 14. Approve Document (Admin)
**Steps**:
1. Open application
2. Go to Documents
3. Review document
4. Click "Approve Document"
5. Click "Confirm"

**Verification**:
- [ ] DocumentRequest status updated to "approved":
  ```sql
  SELECT status FROM "DocumentRequest" WHERE id = '[request_id]' LIMIT 1;
  ```
- [ ] DocumentVerification record created:
  ```sql
  SELECT * FROM "DocumentVerification" WHERE "documentId" = '[doc_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Email sent to applicant

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of approval
- [ ] Email screenshot

---

#### ☐ 15. Reject Document (Admin)
**Steps**:
1. Open application
2. Go to Documents
3. Click "Reject Document"
4. Add rejection reason
5. Submit

**Verification**:
- [ ] DocumentRequest status updated to "rejected":
  ```sql
  SELECT status FROM "DocumentRequest" WHERE id = '[request_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Email sent with reason

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of rejection
- [ ] Email screenshot

---

#### ☐ 16. Request Replacement
**Steps**:
1. After rejecting document
2. Click "Request Replacement"
3. Set deadline
4. Send

**Verification**:
- [ ] New DocumentRequest created:
  ```sql
  SELECT * FROM "DocumentRequest" WHERE "documentId" = '[doc_id]' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Email sent

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots
- [ ] Email screenshot

---

### MESSAGING (2 workflows)

#### ☐ 17. Applicant Message
**Steps**:
1. Go to application detail
2. Scroll to Conversation
3. Type message
4. Click "Send"

**Verification**:
- [ ] CaseMessage record created:
  ```sql
  SELECT * FROM "CaseMessage" WHERE "applicationId" = '[app_id]' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Staff notified
- [ ] Message appears in conversation

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of message form and conversation

---

#### ☐ 18. Admin Message
**Steps**:
1. Go to application in review workspace
2. Go to Conversation tab
3. Type message to applicant
4. Click "Send"

**Verification**:
- [ ] CaseMessage created with role="staff_to_applicant":
  ```sql
  SELECT * FROM "CaseMessage" WHERE "applicationId" = '[app_id]' AND role = 'staff_to_applicant' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Applicant notified
- [ ] Message posted

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of message and notification

---

### STAFF MANAGEMENT (4 workflows)

#### ☐ 19. Invite Staff
**Steps**:
1. Navigate to `/admin/staff` or settings
2. Click "Invite Staff Member"
3. Enter email, name, role
4. Click "Send Invitation"

**Verification**:
- [ ] Invitation record created:
  ```sql
  SELECT * FROM "Invitation" WHERE email = '[invite_email]' ORDER BY "createdAt" DESC LIMIT 1;
  ```
- [ ] Domain Event `staff.invited` published
- [ ] Email sent with invitation link
- [ ] AuditLog entry created

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of invitation form
- [ ] Email screenshot with link
- [ ] Database query

---

#### ☐ 20. Accept Staff Invitation
**Steps**:
1. Receive invitation email
2. Click link
3. Set password
4. Click "Accept Invitation"

**Verification**:
- [ ] Invitation accepted:
  ```sql
  SELECT "acceptedAt" FROM "Invitation" WHERE email = '[invite_email]' LIMIT 1;
  ```
- [ ] OrganizationMember record created:
  ```sql
  SELECT * FROM "OrganizationMember" WHERE "userId" = '[staff_id]' LIMIT 1;
  ```
- [ ] Domain Event published
- [ ] Staff logged in
- [ ] Org admin notified

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of invitation page
- [ ] Staff dashboard screenshot
- [ ] Database queries

---

#### ☐ 21. Change Staff Role
**Steps**:
1. Navigate to staff list
2. Find staff member
3. Click role dropdown
4. Select new role
5. Click "Update"

**Verification**:
- [ ] OrganizationMember.role updated:
  ```sql
  SELECT role FROM "OrganizationMember" WHERE "userId" = '[staff_id]' LIMIT 1;
  ```
- [ ] Domain Event `staff.role.changed` published
- [ ] Staff notified
- [ ] Org admin notified
- [ ] AuditLog entry created

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of role change
- [ ] Notification screenshots
- [ ] Database query

---

#### ☐ 22. Remove Staff
**Steps**:
1. Navigate to staff list
2. Find staff member
3. Click "Remove"
4. Confirm removal

**Verification**:
- [ ] OrganizationMember deleted:
  ```sql
  SELECT * FROM "OrganizationMember" WHERE "userId" = '[staff_id]' LIMIT 1;
  ```
  (Should return no rows)
- [ ] Domain Event `staff.removed` published
- [ ] Staff notified
- [ ] AuditLog entry created

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of removal
- [ ] Confirmation message screenshot

---

### PROGRAMS (1 workflow)

#### ☐ 23. Eligibility Assessment
**Steps**:
1. Manual trigger or background service
2. Verify assessment runs
3. Matches calculated

**Verification**:
- [ ] ProgramRecommendation records created:
  ```sql
  SELECT * FROM "ProgramRecommendation" WHERE "applicationId" = '[app_id]' ORDER BY "createdAt" DESC LIMIT 5;
  ```
- [ ] Domain Event published (if applicable)
- [ ] Notifications sent

**Status**: ☐ PASS / ☐ PARTIAL / ☐ FAIL

**Evidence**:
- [ ] Screenshots of results
- [ ] Database queries

---

## SUMMARY

**Total Workflows**: 23
**Critical Path**: Registration → Application Submission → Approval → Notifications

**Timeline**:
- Authentication: 15 min
- Applications: 45 min
- Documents: 30 min
- Messaging: 15 min
- Staff: 20 min
- Programs: 10 min
- **Total**: ~2.5-3 hours

---

## NEXT STEP

Begin with Workflow ☐ 1: User Registration

Use server running on http://localhost:3000

Record all status checkboxes and evidence above, then compile into `PHASE-5D-OPERATIONAL-CERTIFICATION.md` report.

