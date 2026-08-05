# PHASE 5D — VERIFICATION & TESTING PROCEDURE

**Status**: Ready for Testing
**Date**: July 30, 2026
**Objective**: Verify all 3 bugs are fixed
**Expected Duration**: 15-20 minutes

---

## PRE-TESTING SETUP

### Step 1: Configure Environment

```bash
# Set trace logging to see detailed runtime
export NOTIFICATION_RUNTIME_TRACE=true
export NODE_ENV=development
```

### Step 2: Restart Dev Server

```bash
# Stop current server (if running)
# Ctrl+C

# Clear cache (important!)
rm -rf .next
rm -rf node_modules/.next

# Start fresh
npm run dev
```

Expected output:
```
> next dev
  ▲ Next.js 14.x
  - Local:        http://localhost:3000
```

### Step 3: Verify Database State

```sql
-- Check sender identities exist
SELECT id, emailAddress, displayName, verificationStatus, isDefault 
FROM SenderIdentity 
WHERE organizationId IN (
  SELECT id FROM Organization WHERE slug='heloci'
)
ORDER BY isDefault DESC, createdAt ASC;

-- Expected: At least 1 verified sender with heloci.us domain
```

If no senders exist, run seed:
```bash
node scripts/seed-sender-identities.js
```

---

## TEST 1: EMAIL SENDER VERIFICATION (BUG #1 FIX)

**Objective**: Verify emails send from verified heloci.us domain, not Gmail

### Test Flow

**Step 1: Navigate to Register**
```
URL: http://localhost:3000/register
```

**Step 2: Enter Registration Data**
```
Name: Test User
Email: testuser@example.com
Password: TestPass123!
```

**Step 3: Submit Registration**
- Click "Sign Up"
- Wait for success message

### Verification in Server Logs

**Look for**:
```
[ProviderAdapter][Email] selectedProvider=resend recipient=testuser@example.com sender=support@heloci.us subject=...
[ProviderAdapter][Email] requestPayload={"from":"Heloci <support@heloci.us>","to":"testuser@example.com",...}
[ProviderAdapter][Email] successfulDelivery emailId=...
```

**Check for NO errors like**:
```
❌ [ProviderAdapter][Email] sender=petkeyz8@gmail.com
❌ [ProviderAdapter][Email] error=403 gmail.com domain not verified
❌ [ProviderAdapter][Email] errorMessage=domain not verified
```

### Database Verification

```sql
-- Check notification log
SELECT 
  id, 
  eventName, 
  channel, 
  recipient,
  sender,
  deliveryStatus, 
  errorMessage,
  createdAt
FROM NotificationLog 
WHERE eventName = 'user_registration'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY createdAt DESC;

-- Expected:
-- eventName: user_registration
-- channel: email
-- recipient: testuser@example.com
-- sender: support@heloci.us (NOT petkeyz8@gmail.com)
-- deliveryStatus: SENT (NOT FAILED)
-- errorMessage: NULL
```

### Pass Criteria

- [x] Logs show sender as `support@heloci.us`
- [x] No 403 error messages
- [x] Logs show successfulDelivery
- [x] Database shows deliveryStatus=SENT
- [x] Database shows sender=support@heloci.us

---

## TEST 2: DUPLICATE TELEGRAM VERIFICATION (BUG #3 FIX)

**Objective**: Verify admin receives exactly 1 telegram, not 2

### Test Flow

**Step 1: Enable Runtime Trace** (if not already enabled)
```bash
export NOTIFICATION_RUNTIME_TRACE=true
```

**Step 2: Trigger Registration Again**
```
URL: http://localhost:3000/register
```
(Use same email or different if cleaned up)

**Step 3: Monitor Console**

### Verification in Server Logs

**Look for dispatch count**:
```
[Notification][RuntimeTrace] event=user_registration dispatchCount=2 requests=[
  {"audienceRole":"applicant","channel":"email","templateKey":"..."},
  {"audienceRole":"organization_admin","channel":"telegram","templateKey":"..."}
]
```

**Look for deduplication activity**:
```
[Notification][RuntimeTrace] Deduped: user_registration:organization_admin:telegram:...
```

**Check for NO double dispatch**:
```
❌ dispatchCount=3  (should be 2, not 3)
❌ Two telegram requests in requests list
```

### Database Verification

```sql
-- Check notification log for duplicates
SELECT 
  eventName,
  channel,
  audienceRole,
  COUNT(*) as send_count,
  GROUP_CONCAT(id) as notification_ids
FROM NotificationLog 
WHERE eventName = 'user_registration'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
GROUP BY eventName, channel, audienceRole
ORDER BY eventName, channel;

-- Expected output:
-- user_registration | email | applicant | 1 | [ID]
-- user_registration | telegram | organization_admin | 1 | [ID]
--
-- NOT:
-- ❌ user_registration | telegram | organization_admin | 2 | [ID1, ID2]
```

### Detailed Duplicate Check

```sql
-- Find actual duplicates by checking same audienceRole+channel
SELECT 
  eventName,
  audienceRole,
  channel,
  createdAt,
  deliveryStatus,
  id
FROM NotificationLog 
WHERE eventName = 'user_registration'
  AND audienceRole = 'organization_admin'
  AND channel = 'telegram'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY createdAt;

-- Expected: 1 row only
-- If 2+ rows, duplicate still exists!
```

### Pass Criteria

- [x] Logs show dispatchCount=2
- [x] Only 2 dispatch requests (applicant email + org_admin telegram)
- [x] Logs show deduplication message
- [x] Database shows 1 organization_admin telegram (not 2)
- [x] No "Count(*) > 1" in duplicate check query

---

## TEST 3: TELEGRAM AUDIENCE VERIFICATION (BUG #2 - CONFIGURATION)

**Objective**: Verify applicant and admin receive correct telegram notifications

### Test Flow

**Step 1: Register with Telegram Configured**

Assume telegram is configured in `.env.local`:
```
TELEGRAM_BOT_TOKEN=[REDACTED-TELEGRAM-TOKEN]
TELEGRAM_CHAT_ID=7060936226
```

**Step 2: Complete Registration**
```
URL: http://localhost:3000/register
```

**Step 3: Check Telegram for Messages**
- Check Telegram chat configured in TELEGRAM_CHAT_ID
- Verify you receive registration notification

### Verification in Logs

```
[Notification][RuntimeTrace] event=user_registration dispatchCount=2 requests=[
  {"audienceRole":"applicant","channel":"email",...},
  {"audienceRole":"organization_admin","channel":"telegram",...}  ← ADMIN TELEGRAM
]
```

### Database Verification

```sql
-- Check what channels were used
SELECT 
  eventName,
  audienceRole,
  channel,
  templateUsed,
  deliveryStatus
FROM NotificationLog 
WHERE eventName = 'user_registration'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY audienceRole, channel;

-- Expected:
-- user_registration | applicant | email | applicant.user_registration.email | SENT
-- user_registration | organization_admin | telegram | org_admin.user_registration.telegram | SENT
```

### Telegram Message Content

If you receive admin telegram, verify it contains:
```
[Registration Alert]
A new user account has been created.
User: [Name]
Email: [Email]
```

### Pass Criteria

- [x] Admin receives 1 telegram in expected chat
- [x] Telegram contains registration alert
- [x] Logs show both email and telegram dispatches
- [x] Database shows correct channels per audience

### Decision Point

**If Telegram is NOT configured**: Skip this test, no telegram will be sent.

---

## TEST 4: LOGIN WORKFLOW VERIFICATION (REGRESSION)

**Objective**: Verify login still works correctly after fixes

### Test Flow

**Step 1: Navigate to Login**
```
URL: http://localhost:3000/login
```

**Step 2: Login with Registered Account**
```
Email: testuser@example.com (from Test 1)
Password: TestPass123!
```

**Step 3: Submit Login**
- Click "Sign In"
- Wait for success/redirect

### Verification in Server Logs

```
[Notification][RuntimeTrace] event=user_login dispatchCount=2 requests=[
  {"audienceRole":"applicant","channel":"email","templateKey":"..."},
  {"audienceRole":"organization_admin","channel":"telegram","templateKey":"..."}
]
```

**Check NO errors**:
```
❌ error=
❌ FAILED
❌ 403
```

### Database Verification

```sql
-- Check user_login notifications created
SELECT 
  eventName,
  audienceRole,
  channel,
  COUNT(*) as count,
  deliveryStatus
FROM NotificationLog 
WHERE eventName = 'user_login'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
GROUP BY eventName, audienceRole, channel, deliveryStatus;

-- Expected:
-- user_login | applicant | email | 1 | SENT
-- user_login | organization_admin | telegram | 1 | SENT
--
-- NOT:
-- ❌ user_login | organization_admin | telegram | 2 | SENT  (duplicate)
```

### Pass Criteria

- [x] Login succeeds (redirects to dashboard)
- [x] Logs show dispatchCount=2
- [x] No 403 errors
- [x] No duplicate telegrams
- [x] Applicant email received
- [x] Admin telegram received (1, not 2)

---

## TEST 5: APPLICATION SUBMITTED WORKFLOW (REGRESSION)

**Objective**: Verify other events still work

### Test Flow

**Step 1: Create Application**
- Login and navigate to application form
- Fill out housing application

**Step 2: Submit Application**
- Click "Submit Application"
- Wait for success message

### Verification in Logs

```
[Notification][RuntimeTrace] event=application_submitted dispatchCount=...
```

Should show multiple audiences and channels per registry.

### Database Verification

```sql
-- Check application_submitted notifications
SELECT 
  eventName,
  audienceRole,
  channel,
  COUNT(*) as count,
  deliveryStatus
FROM NotificationLog 
WHERE eventName = 'application_submitted'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
GROUP BY eventName, audienceRole, channel, deliveryStatus;

-- Expected: Multiple rows with SENT status
-- No FAILED or 403 errors
```

### Pass Criteria

- [x] Application submits successfully
- [x] Multiple notifications sent (applicant + admin + reviewers)
- [x] No errors in logs
- [x] No duplicates in database

---

## SUMMARY TABLE

| Test | Expected Result | Status |
|------|-----------------|--------|
| Email Sender (BUG #1) | Emails from heloci.us, no 403 | [ ] |
| Duplicate Telegram (BUG #3) | Admin gets 1 telegram, not 2 | [ ] |
| Telegram Audience (BUG #2) | Admin receives telegram alerts | [ ] |
| Login Workflow | Login works, no errors | [ ] |
| Application Submitted | App accepted, notifications sent | [ ] |

---

## COMMON ISSUES & SOLUTIONS

### Issue 1: Still Seeing Gmail Sender

**Symptom**:
```
[ProviderAdapter][Email] sender=petkeyz8@gmail.com
```

**Solution**:
1. Verify dev server was restarted (not just file change)
2. Check `.env.local` is not being used by ProviderAdapter directly
3. Verify resolveSender() returns database sender
4. Check SenderIdentity table has verified senders

**Debug**:
```sql
SELECT * FROM SenderIdentity WHERE organizationId IN (
  SELECT id FROM Organization WHERE slug='heloci'
);
-- Should show support@heloci.us with verificationStatus=VERIFIED
```

### Issue 2: Still Seeing Duplicate Telegrams

**Symptom**:
```
[Notification][RuntimeTrace] dispatchCount=3
```

**Solution**:
1. Verify notification.service.ts was updated (line 535)
2. Verify dedup key includes audienceRole
3. Check dispatch requests have audienceRole field populated
4. Enable NOTIFICATION_RUNTIME_TRACE to see which requests are created

**Debug**:
```typescript
// Add debug logging in provider-adapters.ts before send()
console.log(`[DEBUG] Sending ${channel} to ${request.audienceRole}:${request.recipientId}`);
```

### Issue 3: No Notifications Sent at All

**Symptom**:
```
[Notification][RuntimeTrace] dispatchCount=0
```

**Solution**:
1. Check RuntimeOrchestrator returns dispatch requests
2. Verify AudienceResolver finds audiences
3. Check event name matches registry
4. Verify channels are enabled in settings

**Debug**:
```bash
# Run with trace to see each stage
export NOTIFICATION_RUNTIME_TRACE=true
npm run dev
```

### Issue 4: Email Shows Wrong Sender Name

**Symptom**:
```
From: SomethingElse <support@heloci.us>
```

**Solution**:
1. Verify senderIdentity.displayName is set correctly
2. Check SenderIdentity is VERIFIED in database
3. Verify NotificationService passes senderName to provider

---

## QUICK REFERENCE

### Enable Full Tracing

```bash
export NOTIFICATION_RUNTIME_TRACE=true
export NODE_ENV=development
npm run dev
```

### Watch Logs for Key Events

```bash
# In separate terminal
npm run dev 2>&1 | grep -E "\[ProviderAdapter\]|\[Notification\]"
```

### Quick Database Checks

```bash
# Count notifications by type
SELECT eventName, deliveryStatus, COUNT(*) FROM NotificationLog 
GROUP BY eventName, deliveryStatus;

# Check for duplicates
SELECT eventName, audienceRole, channel, COUNT(*) as cnt 
FROM NotificationLog 
GROUP BY eventName, audienceRole, channel 
HAVING cnt > 1;

# Check sender usage
SELECT sender, COUNT(*) as usage FROM NotificationLog 
WHERE channel = 'email'
GROUP BY sender;
```

### Restart Dev Server Cleanly

```bash
# Kill any existing processes
pkill -f "next dev"

# Clear cache
rm -rf .next node_modules/.next

# Start fresh
npm run dev
```

---

## SUCCESS CRITERIA

All tests pass if:

✅ **FIX #1 (Email Sender)**:
- Logs show heloci.us sender
- No 403 errors
- Database shows sender=support@heloci.us
- Email delivers successfully

✅ **FIX #2 (Duplicate Telegram)**:
- dispatchCount=2 (not 3)
- Admin receives 1 telegram (not 2)
- Database shows 1 org_admin/telegram entry
- Logs show dedup message

✅ **FIX #3 (Telegram Audience)**:
- Admin receives telegram notifications
- Telegram is routed to correct audience
- Content matches expected template

✅ **REGRESSION**:
- Login works
- Application submitted works
- No new errors introduced

---

## NEXT STEPS

1. [ ] Complete all tests above
2. [ ] Document any issues found
3. [ ] If all pass: Update Phase 5D status to VERIFIED
4. [ ] If issues: Investigate using debug sections above
5. [ ] Continue with Phase 5E (Full Platform Certification)

---

*Verification Procedure Complete*  
*Ready for Testing*  
*Expected: All Tests Pass*


