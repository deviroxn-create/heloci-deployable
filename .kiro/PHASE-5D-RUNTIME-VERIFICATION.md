# PHASE 5D — RUNTIME VERIFICATION PROTOCOL

**Status**: 🔴 NOT STARTED - AWAITING MANUAL EXECUTION
**Objective**: Collect runtime evidence to verify fixes work
**Mode**: AUDITOR (Evidence Collection, No Fixes)
**Date**: July 30, 2026

---

## CRITICAL RULES

🚫 **DO NOT**:
- Modify any code
- Fix any issues found
- Refactor anything
- Make assumptions
- Skip steps

✅ **MUST**:
- Collect complete runtime traces
- Document every layer
- Show exact log output
- Verify database state
- Reference evidence for all conclusions

---

## PREREQUISITE: ENVIRONMENT SETUP

### Terminal 1: Start Dev Server

```bash
# In project root directory
export NOTIFICATION_RUNTIME_TRACE=true
export NODE_ENV=development

# Clear cache completely
rm -rf .next
rm -rf node_modules/.next

# Start dev server
npm run dev
```

**Wait for**:
```
> next dev
  ▲ Next.js 14.x
  - Local:        http://localhost:3000
```

**Keep this terminal open** - it will show all runtime logs.

### Terminal 2: Keep This Window Open

In this terminal, you will:
1. Register new applicant
2. Monitor logs in Terminal 1
3. Record all output
4. Verify database
5. Login as applicant
6. Verify again

---

## STEP 1: REGISTRATION VERIFICATION

**Objective**: Verify email sender fix + no duplicate telegrams + correct dispatch count

### 1.1 Navigate to Registration

```
URL: http://localhost:3000/register
```

### 1.2 Submit Registration

**Enter Test Data**:
```
Name:     Test Applicant (date: $(date +%s))
Email:    testapplicant-[timestamp]@example.com  
Password: TestPass123!
```

Use timestamp to ensure unique email each run.

**Click**: "Sign Up"

**Wait for**: Success message or redirect

### 1.3 Collect Runtime Traces from Terminal 1

**Watch logs for these sections**:

#### Trace Point 1A: Domain Event Entry

```
[Notification] notify called event=user_registration payloadKeys=...
```

**Record**: 
- [ ] Event name: ___________
- [ ] Payload keys present

#### Trace Point 1B: RuntimeOrchestrator Dispatch Count

```
[Notification][RuntimeTrace] event=user_registration dispatchCount=X requests=[...]
```

**Record EXACTLY**:
- [ ] dispatchCount = _____ (MUST be 2, not 3)
- [ ] requests list:
  - [ ] Request 1: audienceRole=___, channel=___, templateKey=___
  - [ ] Request 2: audienceRole=___, channel=___, templateKey=___
  - [ ] (Should NOT have Request 3)

#### Trace Point 1C: Email Provider Adapter

```
[ProviderAdapter][Email] sender=support@heloci.us
[ProviderAdapter][Email] from: Heloci <support@heloci.us>
[ProviderAdapter][Email] requestPayload={"from":"Heloci <support@heloci.us>",...}
[ProviderAdapter][Email] successfulDelivery emailId=...
```

**Record EXACTLY**:
- [ ] sender = ___________________
- [ ] from = ___________________
- [ ] delivery status = ___________
- [ ] emailId = ___________________

**Verify NO**:
- [ ] ❌ petkeyz8@gmail.com
- [ ] ❌ 403 error
- [ ] ❌ domain not verified

#### Trace Point 1D: Telegram Provider Adapter

```
[ProviderAdapter][Telegram] selectedProvider=telegram-api recipient=... enabled=true
[ProviderAdapter][Telegram] providerResponse={"ok":true,"status":200}
```

**Record EXACTLY**:
- [ ] recipient = _________________ (should be admin chat ID)
- [ ] response status = _________
- [ ] success = ________________

#### Trace Point 1E: Deduplication Evidence

```
[Notification][RuntimeTrace] Deduped: user_registration:organization_admin:telegram:...
```

**Record EXACTLY**:
- [ ] Dedup key = _________________________________________
- [ ] (Confirms no duplicate telegram sent)

### 1.4 Database Verification After Registration

**SQL Query**:

```sql
SELECT 
  eventName,
  channel,
  audienceRole,
  recipient,
  sender,
  deliveryStatus,
  errorMessage,
  createdAt
FROM NotificationLog 
WHERE eventName = 'user_registration'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY channel, audienceRole, createdAt;
```

**Expected Result**:
```
| user_registration | email | applicant | testapplicant@... | support@heloci.us | SENT | NULL |
| user_registration | telegram | organization_admin | 7060936226 | support@heloci.us | SENT | NULL |
```

**Record EXACTLY**:
- [ ] Row 1 Channel: ____________ Status: ____________
- [ ] Row 2 Channel: ____________ Status: ____________
- [ ] Duplicate Check: Total rows = _____ (MUST be 2)

**Verify**:
- [ ] NO Row 3 (telegram duplicate)
- [ ] Both deliveryStatus = SENT
- [ ] Both sender = support@heloci.us
- [ ] NO errorMessage values

### 1.5 Email Receipt Verification (Optional)

**If you can access test email inbox**:
- [ ] Email received in testapplicant@... inbox
- [ ] From: Heloci <support@heloci.us>
- [ ] Subject: "Welcome to Heloci" (or similar)
- [ ] Body contains applicant welcome template (NOT admin template)

### 1.6 Telegram Receipt Verification (Optional)

**If Telegram configured**:
- [ ] Organization admin receives 1 message (not 2)
- [ ] Content: "New applicant registered" (not welcome message)
- [ ] Message count in chat: exactly 1 new message

---

## STEP 2: LOGIN VERIFICATION

**Objective**: Verify login sends correct emails/telegrams with correct templates

### 2.1 Navigate to Login

```
URL: http://localhost:3000/login
```

### 2.2 Submit Login

**Enter Credentials**:
```
Email:    testapplicant-[same timestamp]@example.com
Password: TestPass123!
```

**Click**: "Sign In"

**Wait for**: Dashboard or success redirect

### 2.3 Collect Runtime Traces from Terminal 1

#### Trace Point 2A: User Login Event

```
[Notification] notify called event=user_login payloadKeys=...
```

**Record**:
- [ ] Event name: user_login ✓
- [ ] Timestamp: ___________

#### Trace Point 2B: RuntimeOrchestrator Dispatch Count

```
[Notification][RuntimeTrace] event=user_login dispatchCount=X requests=[...]
```

**Record EXACTLY**:
- [ ] dispatchCount = _____ (MUST be 2)
- [ ] requests:
  - [ ] Request 1: audienceRole=___, channel=email, templateKey=___
  - [ ] Request 2: audienceRole=___, channel=telegram, templateKey=___

**Verify template keys**:
- [ ] applicant email: should contain "login" NOT "registration"
- [ ] admin telegram: should contain "login" NOT "registration"

#### Trace Point 2C: Email Sender Verification

```
[ProviderAdapter][Email] sender=support@heloci.us
[ProviderAdapter][Email] from: Heloci <support@heloci.us>
```

**Record**:
- [ ] sender = support@heloci.us ✓
- [ ] NO petkeyz8@gmail.com ✓

#### Trace Point 2D: Telegram Dispatch

```
[ProviderAdapter][Telegram] selectedProvider=telegram-api
[ProviderAdapter][Telegram] providerResponse={"ok":true,"status":200}
```

**Record**:
- [ ] success = ✓
- [ ] status = 200 ✓
- [ ] duplicate count = 0 ✓

### 2.4 Database Verification After Login

**SQL Query**:

```sql
SELECT 
  eventName,
  channel,
  audienceRole,
  deliveryStatus,
  errorMessage
FROM NotificationLog 
WHERE eventName = 'user_login'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY channel, audienceRole;
```

**Expected Result**:
```
| user_login | email | applicant | SENT | NULL |
| user_login | telegram | organization_admin | SENT | NULL |
```

**Record EXACTLY**:
- [ ] Total rows = _____ (MUST be 2)
- [ ] Channel 1: ________ Status: ________
- [ ] Channel 2: ________ Status: ________
- [ ] errorMessage column: All NULL ✓

---

## STEP 3: DATABASE AGGREGATION VERIFICATION

### 3.1 Complete Notification Count

```sql
SELECT 
  eventName,
  COUNT(*) as total_count,
  SUM(CASE WHEN deliveryStatus='SENT' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN deliveryStatus='FAILED' THEN 1 ELSE 0 END) as failed
FROM NotificationLog 
WHERE eventName IN ('user_registration', 'user_login')
  AND createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
GROUP BY eventName;
```

**Record EXACTLY**:
```
Registration:
  Total: _____ (should be 2)
  Sent: _____ (should be 2)
  Failed: _____ (should be 0)

Login:
  Total: _____ (should be 2)
  Sent: _____ (should be 2)
  Failed: _____ (should be 0)
```

### 3.2 Sender Verification

```sql
SELECT 
  DISTINCT sender,
  COUNT(*) as usage_count
FROM NotificationLog 
WHERE channel = 'email'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
GROUP BY sender;
```

**Expected**:
```
| support@heloci.us | 2 |
```

**Record**:
- [ ] Email sender: ___________________________
- [ ] Count: _____ (should be 2, not 0)
- [ ] ❌ petkeyz8@gmail.com NOT present ✓

### 3.3 Duplicate Telegram Detection

```sql
SELECT 
  eventName,
  audienceRole,
  channel,
  COUNT(*) as dispatch_count
FROM NotificationLog 
WHERE channel = 'telegram'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
GROUP BY eventName, audienceRole, channel
HAVING COUNT(*) > 1;
```

**Expected**: Empty result (no rows)

**Record**:
- [ ] Query returns: __________ rows (MUST be 0)
- [ ] ❌ No duplicate telegrams ✓

---

## STEP 4: EVIDENCE SUMMARY

### Runtime Evidence Checklist

**Email Sender Fix** ✅ or ❌:
- [ ] sender = support@heloci.us (verified domain) ✓
- [ ] NO sender = petkeyz8@gmail.com ✓
- [ ] NO 403 errors ✓
- [ ] Email delivery status = SENT ✓

**Telegram Deduplication Fix** ✅ or ❌:
- [ ] dispatchCount = 2 (not 3) ✓
- [ ] Dedup key includes audienceRole ✓
- [ ] Admin receives 1 telegram (not 2) ✓
- [ ] Database shows 1 org_admin/telegram (not 2) ✓

**Template Correctness** ✅ or ❌:
- [ ] user_registration uses registration templates ✓
- [ ] user_login uses login templates (not registration) ✓
- [ ] Applicant email = welcome template ✓
- [ ] Admin telegram = registration alert (not welcome) ✓

**No Regressions** ✅ or ❌:
- [ ] All notifications sent successfully ✓
- [ ] No error messages in logs ✓
- [ ] Database all SENT (no FAILED) ✓
- [ ] No orphaned records ✓

---

## STEP 5: CERTIFICATION DECISION

### Verification Status

After collecting all evidence above, determine:

```
┌─────────────────────────────────────────┐
│ PASS: All criteria met                  │
│ └─ Proceed to Phase 5E browser testing  │
│                                         │
│ FAIL: Criteria not met                  │
│ └─ Identify root cause only             │
│ └─ Document exact layer/file/line       │
│ └─ STOP (no fixes in this phase)        │
└─────────────────────────────────────────┘
```

### Decision Criteria

#### PASS Conditions (ALL must be true):

1. **Email Sender** ✅
   - [x] sender = support@heloci.us
   - [x] NO gmail.com
   - [x] deliveryStatus = SENT
   - [x] NO 403 errors

2. **Dispatch Count** ✅
   - [x] dispatchCount = 2 (not 3)
   - [x] No duplicate dispatches in logs

3. **Telegram Deduplication** ✅
   - [x] Admin receives 1 telegram (not 2)
   - [x] Database shows 1 org_admin/telegram (not 2)
   - [x] Dedup key includes audienceRole

4. **Template Routing** ✅
   - [x] Correct templates used for each event
   - [x] user_login ≠ user_registration templates
   - [x] Applicant email ≠ admin templates

5. **No Errors** ✅
   - [x] NO error messages in logs
   - [x] NO database FAILED entries
   - [x] All notifications SENT

#### FAIL Conditions (ANY one triggers FAIL):

- [ ] sender still contains petkeyz8@gmail.com
- [ ] 403 error present in logs
- [ ] dispatchCount = 3 or higher
- [ ] Admin receives 2+ telegrams
- [ ] Database shows duplicate org_admin/telegram
- [ ] Delivery status = FAILED
- [ ] Error messages in logs

---

## STEP 6: ROOT CAUSE IDENTIFICATION (IF FAIL)

**If verification FAILS**:

### Identify Exact Location

```
Layer | Expected | Actual | Root Cause
───────────────────────────────────────
Domain Event | user_registration | ? |
RuntimeOrchestrator | dispatchCount=2 | ? |
CommunicationPlanner | audienceRole=applicant,admin | ? |
TemplateResolver | event in key | ? |
Dispatcher | 2 requests | ? |
ProviderAdapter | sender=heloci.us | ? |
NotificationService | sender=heloci.us | ? |
Database | 2 rows, SENT | ? |
```

### Document Evidence

**For each failed criterion, record**:
1. Layer where failure detected
2. Expected value
3. Actual value
4. Exact log line or SQL result
5. Possible root cause (if obvious)

### Example Failure Documentation

```
FAILURE: Email sender still Gmail

Evidence:
  Log: [ProviderAdapter][Email] sender=petkeyz8@gmail.com
  File: lib/notifications/provider-adapters.ts
  Line: 50
  Actual: const senderEmail = process.env.COMMUNICATION_SENDER_EMAIL
  
Root Cause Analysis:
  - Fix not applied? Check git status
  - Fix not loaded? Dev server restart needed?
  - Context not passed? Check notification.service.ts sender parameter
```

### STOP Here

Do NOT:
- Apply fixes
- Modify code
- Refactor anything

Only:
- Document the failure
- Show exact evidence
- Identify root cause
- Communicate findings

---

## DELIVERABLES

### During Verification

Create file: `.kiro/PHASE-5D-VERIFICATION-RESULTS.md`

Record:
1. All evidence points (copy-paste from logs)
2. All SQL results (with timestamps)
3. All database records
4. Pass/Fail decision
5. If Fail: Root cause with evidence

### Format

```markdown
# PHASE 5D RUNTIME VERIFICATION RESULTS

**Date**: [Date]
**Status**: PASS / FAIL

## EVIDENCE COLLECTED

### Registration Flow
- Event entry: [log output]
- Dispatch count: [value]
- Email sender: [value]
- Database rows: [query result]

### Login Flow
- Event entry: [log output]
- Dispatch count: [value]
- Email sender: [value]
- Database rows: [query result]

## DATABASE VERIFICATION

[SQL queries and results]

## DECISION

Status: PASS or FAIL

If FAIL:
- Layer: [identified layer]
- File: [exact file]
- Line: [exact line if known]
- Evidence: [log/query result]
```

---

## FINAL CHECKLIST

- [ ] Dev server running with NOTIFICATION_RUNTIME_TRACE=true
- [ ] Registered new applicant
- [ ] Collected all runtime traces
- [ ] Verified database after registration
- [ ] Logged in as applicant
- [ ] Collected all runtime traces for login
- [ ] Verified database after login
- [ ] Ran all 3 SQL verification queries
- [ ] Completed evidence summary
- [ ] Made PASS/FAIL decision
- [ ] Documented all findings
- [ ] Created PHASE-5D-VERIFICATION-RESULTS.md

---

## MANUAL EXECUTION REQUIRED

⚠️ **This verification cannot be automated from this console**

**You must manually**:
1. Open Terminal 1, start dev server
2. Open browser, navigate to register page
3. Complete registration form
4. Monitor Terminal 1 logs
5. Record all output
6. Query database manually
7. Login again
8. Monitor Terminal 1 logs
9. Record all output
10. Document findings

**Expected time**: 30-40 minutes

---

*PHASE 5D RUNTIME VERIFICATION PROTOCOL*

*Auditor Mode: Evidence Collection Only*

*No Fixes. No Refactoring. Evidence Only.*

