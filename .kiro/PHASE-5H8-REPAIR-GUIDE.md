# PHASE 5H.8 — TARGETED REPAIR GUIDE

**Status**: Ready to implement  
**Prerequisites**: Phase 5H.7 complete (all 28 CRITICAL keys certified)  
**Duration**: 1-2 hours implementation + 30min verification  
**Risk Level**: Low (creating new records, no modifications to existing code)  

---

## QUICK START

### What You're Doing
Creating 28 new notification templates so that planner-generated keys match database records.

### Current State
- Planner generates: `applicant.user-registration.email`
- Database has: 14 generic templates (no audience-prefixed keys)
- Result: Planner lookups fail, fallback to hardcoded defaults
- Problem: All notifications use generic content, not audience-specific

### Target State
- Planner generates: `applicant.user-registration.email`
- Database will have: `applicant.user-registration.email` (exact match)
- Result: Planner finds exact match, uses audience-specific template
- Success: Each audience receives customized notification content

---

## REPAIR INVENTORY

### TIER 1: CREATE — 21 Templates (Missing Entirely)

These keys have no record in database. You must create them from scratch.

**Registration (5 keys)**
```
applicant.user-registration.email
applicant.user-registration.internal
admin.user-registration.email
admin.user-registration.internal
admin.user-registration.telegram
```

**Login (3 keys)**
```
applicant.user-login.internal
admin.user-login.internal
admin.user-login.telegram
```

**Submit (3 keys)**
```
applicant.application-submitted.internal
admin.application-submitted.internal
reviewer.application-submitted.internal
```

**Approve (5 keys)**
```
applicant.application-approved.internal
admin.application-approved.telegram
admin.application-approved.internal
reviewer.application-approved.internal
```

**Reject (5 keys)**
```
applicant.application-rejected.internal
admin.application-rejected.telegram
admin.application-rejected.internal
reviewer.application-rejected.internal
```

**DocumentRequest (2 keys)**
```
applicant.documents-requested.internal
reviewer.documents-requested.internal
```

### TIER 2: CREATE_AUDIENCE_KEY — 7 Templates (Optimize Fallback)

These keys have generic fallback templates but should have audience-specific ones. You can copy content from fallback or create new.

**Login (2 keys)**
```
applicant.user-login.email (currently uses: user_login-email)
admin.user-login.email (currently uses: user_login-email)
```

**Submit (2 keys)**
```
applicant.application-submitted.email (currently uses: application_submitted-email)
admin.application-submitted.telegram (currently uses: application_submitted-telegram)
```

**Approve (1 key)**
```
applicant.application-approved.email (currently uses: application_approved-email)
```

**Reject (1 key)**
```
applicant.application-rejected.email (currently uses: application_rejected-email)
```

**DocumentRequest (1 key)**
```
applicant.documents-requested.email (currently uses: documents_requested-email)
```

### TIER 3: MONITOR — 3 Templates (Safe to Defer)

These keys have generic fallback and are not critical. You can monitor and optimize later.

```
support.application-submitted.email (currently uses: application_submitted-email)
applicant.application-waitlisted.email (currently uses: application_waitlisted-email)
applicant.message-created.email (currently uses: message_created-email)
```

---

## IMPLEMENTATION OPTIONS

### Option A: Fast Path (Use Existing Content)

**Best for**: Getting templates working quickly

1. For each TIER 1 (CREATE) key:
   - Look up generic fallback template (e.g., `user_registration-email`)
   - Copy its content
   - Create new record with audience-prefixed name

2. For each TIER 2 (CREATE_AUDIENCE_KEY) key:
   - Copy content from generic fallback (already in database)
   - Create new record with audience-prefixed name

**Time**: ~1 hour  
**Result**: Planner finds exact matches, delivery still uses same content

### Option B: Recommended Path (Custom Content)

**Best for**: Long-term audience customization

1. For each TIER 1 + TIER 2 key:
   - Review audience type and workflow
   - Write audience-specific content
   - Examples:
     - applicant audience: User-friendly, action-oriented tone
     - admin audience: Operational, summary-focused tone
     - reviewer audience: Professional, structured format

2. Test variations:
   - Same event, different audiences should have slightly different wording
   - Tone should match audience needs
   - Information should be relevant to audience role

**Time**: ~2 hours  
**Result**: Customized experience per audience, demonstrates template architecture

---

## IMPLEMENTATION STEPS

### Step 1: Preparation

```bash
# List all current templates to understand fallback content
npx prisma studio
# Navigate to NotificationTemplate
# Review existing templates for pattern/tone

# Example current templates:
# - Welcome Email (user_registration-email)
# - Login Notification (user_login-email)
# - Application Submitted Confirmation (application_submitted-email)
# - New Application Alert (application_submitted-telegram)
# - Application Approved (application_approved-email)
# - Application Rejected (application_rejected-email)
# - Application Waitlisted (application_waitlisted-email)
# - Documents Requested (documents_requested-email)
```

### Step 2: Create TIER 1 Templates (21 keys)

**Example: applicant.user-registration.email**

```prisma
{
  name: "applicant.user-registration.email",
  eventName: "user_registration",
  channel: "email",
  subject: "Welcome to Housing Program",
  body: "Hi {{userName}}, welcome! Your account has been created.",
  variables: ["userName", "email", "organizationName"],
  status: "PUBLISHED",
  active: true
}
```

**Approach**:
- Copy content from fallback (e.g., "Welcome Email")
- Replace generic greetings with audience-specific tone
- Customize action buttons for audience role
- Keep event name and channel consistent

**For internal channel templates**:
- Same event, different content
- Internal audience: internal staff
- Format: Structured, includes metadata
- Example: Staff summary notification, not user-facing email

### Step 3: Create TIER 2 Templates (7 keys)

Same process but focus on optimization:
- If fallback content is already good: copy it
- If generic content needs refinement: update for audience
- Test that planner prefers exact match over fallback

### Step 4: Verify Creation

```bash
# Check that all 28 keys exist
npx prisma studio
# Navigate to NotificationTemplate
# Filter by name containing audience-prefixed pattern
# Should find exactly 28 new records

# Or use query:
SELECT COUNT(*), COUNT(DISTINCT name)
FROM NotificationTemplate
WHERE name LIKE '%.%.%';  -- audience.event.channel pattern
```

### Step 5: Test End-to-End

**Manual test for each workflow**:
1. Trigger registration workflow
2. Check logs for "Template not found" warnings
   - Should see NONE (was seeing them before)
3. Verify notification received
4. Confirm content is audience-appropriate

**Automated verification**:
```bash
# Run planner test
npm test -- CommunicationPlanner.spec.ts

# Check delivery logs
grep -i "template" logs/notification.log
# Should NOT find: "Template not found by key"
```

---

## COMMON PITFALLS

### Pitfall 1: Wrong Key Format
❌ **Wrong**: `user_registration_applicant_email` or `applicant-user-registration-email`  
✅ **Correct**: `applicant.user-registration.email` (audience.event.channel)

### Pitfall 2: Missing Event Name
Template record must have correct `eventName`:
- Key: `applicant.user-registration.email`
- Event name: `user_registration` (not `user-registration`)
- Channel: `email`

### Pitfall 3: Typos in Audience
Check against actual audiences:
- ✅ `applicant`, `admin`, `reviewer` (core, must be exact)
- ❌ `applicant`, `administrator`, `review` (typos will break routing)

### Pitfall 4: Publishing Status
All new templates must be `status: "PUBLISHED"` and `active: true` or they won't be found.

### Pitfall 5: Not Testing Internal Channel
Internal channel is new. Verify it works:
- Created: Yes
- Found by planner: Yes (needs exact match)
- Delivered: Yes (to internal notification system, not email)

---

## VALIDATION CHECKLIST

Before declaring Phase 5H.8 complete:

- [ ] 21 CREATE templates created ✅
- [ ] 7 CREATE_AUDIENCE_KEY templates created ✅
- [ ] 3 MONITOR templates reviewed (can defer) ✅
- [ ] All templates have correct key format (audience.event.channel) ✅
- [ ] All templates have correct eventName ✅
- [ ] All templates have correct channel ✅
- [ ] All templates published (status: PUBLISHED, active: true) ✅
- [ ] Database count: 14 (original) + 28 (new) = 42 total ✅
- [ ] Query returns 28 audience-prefixed keys ✅
- [ ] Planner tests pass (no template-not-found errors) ✅
- [ ] End-to-end workflow test passes (at least one core workflow) ✅
- [ ] Notifications delivered with correct audience-specific content ✅
- [ ] Logs show NO "Template not found by key" warnings ✅
- [ ] No hardcoded defaults used for CRITICAL keys ✅

---

## VERIFICATION QUERY

**Quick check** that repairs are complete:

```sql
-- Count audience-prefixed keys in database
SELECT COUNT(*) as audience_prefixed_count
FROM NotificationTemplate
WHERE name LIKE '%.%.%' AND name NOT LIKE '%-%';

-- Expected result: 28

-- List all audience-prefixed keys
SELECT name, eventName, channel, status, active
FROM NotificationTemplate
WHERE name LIKE '%.%.%' AND name NOT LIKE '%-%'
ORDER BY name;

-- Verify no duplicates or conflicts
SELECT name, COUNT(*)
FROM NotificationTemplate
WHERE name LIKE '%.%.%' AND name NOT LIKE '%-%'
GROUP BY name
HAVING COUNT(*) > 1;

-- Expected result: empty (no duplicates)
```

---

## SUCCESS CRITERIA

### Phase 5H.8 Complete When:

✅ **All 28 CRITICAL keys created in database**  
✅ **Planner finds exact matches (zero fallback lookups for CRITICAL keys)**  
✅ **All 6 core workflows deliver with correct audience-specific templates**  
✅ **No "Template not found" warnings in production logs**  
✅ **Validation tests pass end-to-end**  

### Post-Phase 5H.8 (Future):

→ 3 MONITOR keys can be optimized (optional)  
→ 48 FUTURE keys remain for future workflows  
→ Template customization now possible per audience  
→ Architecture supports audience-specific content  

---

## PHASE 5H.8 SUMMARY

**What**: Create 28 audience-prefixed notification templates  
**Why**: So planner finds exact matches instead of using fallback/hardcoded defaults  
**Time**: 1-2 hours implementation  
**Risk**: Low (new records, no existing code changes)  
**Impact**: Every core workflow will use audience-specific templates  
**Result**: Production-ready notification system with proper template architecture  

---

**Reference Files**:
- `PHASE-5H7-FINAL-CERTIFICATION-REPORT.md` — Complete repair contract with all 76 keys
- `scripts/template-registry-final-certification.js` — Script that generated repair decisions
- `.kiro/TEMPLATE-REGISTRY-FORENSIC-CERTIFICATION-FINAL.md` — Evidence of root cause

**Questions?**
Refer back to PHASE-5H7-FINAL-CERTIFICATION-REPORT.md for detailed justification of each repair decision.

