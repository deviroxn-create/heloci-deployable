# Phase 5G — Communication Runtime Audit Plan

**Status**: In Progress  
**Date**: August 3, 2026  
**Scope**: Full notification pipeline audit (no code changes)  
**Objective**: Identify every failing event and exact point of failure

---

## Audit Scope: 9 Critical Events

Based on Heloci application lifecycle, we will audit:

| # | Event | Email | Telegram | Internal | Description |
|---|-------|-------|----------|----------|-------------|
| 1 | `user_registered` | ✓ | ✓ | ✓ | Welcome email to applicant |
| 2 | `user_login` | ✓ |  |  | Login confirmation |
| 3 | `application_submitted` | ✓ |  | ✓ | Applicant submits program application |
| 4 | `application_status_changed` | ✓ |  | ✓ | Application status update (Pending→Approved) |
| 5 | `document_requested` | ✓ |  | ✓ | Staff requests additional documents |
| 6 | `document_uploaded` | ✓ | ✓ | ✓ | Applicant uploads requested document |
| 7 | `eligibility_completed` | ✓ |  | ✓ | Eligibility evaluation results |
| 8 | `program_match` | ✓ |  | ✓ | Applicant matched to program |
| 9 | `admin_notification` |  | ✓ |  | Admin/staff internal notification |

---

## Audit Framework: For Each Event

**For every event, we will verify:**

### Step 1: Event Configuration
- [ ] Is event registered in notification settings?
- [ ] Is event enabled in system configuration?
- [ ] What channels are configured (email, telegram, internal)?

### Step 2: Event Triggering
- [ ] Does the event fire at the correct runtime moment?
- [ ] Is the event data (payload) correct?
- [ ] Does the payload contain required fields?

### Step 3: Audience Resolution
- [ ] Does AudienceResolver determine correct recipients?
- [ ] Are applicants correctly identified?
- [ ] Are staff/admin correctly identified?

### Step 4: Template Resolution
- [ ] Does system find the correct template?
- [ ] Is template marked as active?
- [ ] Are all template variables available?

### Step 5: Provider Invocation
- [ ] Does provider.send() get called?
- [ ] Are provider credentials present (API keys, tokens)?
- [ ] Does provider return success/failure?

### Step 6: Delivery Recording
- [ ] Is NotificationLog entry created?
- [ ] Is delivery status recorded correctly?
- [ ] Are errors captured?

### Step 7: Evidence Collection
- [ ] Collect console logs (if debug enabled)
- [ ] Collect Resend API response
- [ ] Collect Telegram API response
- [ ] Collect NotificationLog database records

---

## Current Known State

**Working ✅**:
- `user_login` notification (confirmed working)
- Email provider (Resend integrated)
- Telegram provider (configured)
- NotificationLog persistence

**Failing ❌**:
- `user_registered` notification (no welcome email)
- Telegram admin notification (not sent)
- Unknown: application_submitted, status_changed, etc.

**Never Tested**:
- Document request/upload flows
- Eligibility result notifications
- Program matching notifications

---

## Audit Methodology

### Phase 1: Static Code Analysis (Already Done)
- ✅ Read notification service code
- ✅ Understand routing logic
- ✅ Identify event registration points

### Phase 2: Runtime Testing (Current)
- Will trigger each event
- Will collect console logs
- Will check NotificationLog database
- Will check provider responses (Resend/Telegram)

### Phase 3: Evidence Compilation
- Build evidence table showing pass/fail for each event
- Identify common failure patterns
- Rank fixes by impact

---

## Test Environment Setup

**Prerequisites**:
- ✅ Database connected (Neon now available)
- ✅ Resend API key configured
- ✅ Telegram configured
- ✅ Application running

**What we'll do**:
1. Start dev server
2. Execute each event trigger
3. Monitor logs in real-time
4. Check database records immediately
5. Collect evidence

---

## Evidence Table Template

Will be populated during audit:

| Event | Email Works | Telegram Works | Internal Works | Template Found | Provider Called | Log Entry | Notes |
|-------|------------|----------------|----------------|----------------|-----------------|-----------|-------|
| user_registered | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| user_login | ✅ | ? | ? | ✅ | ✅ | ✅ | Currently working |
| application_submitted | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| application_status_changed | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| document_requested | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| document_uploaded | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| eligibility_completed | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| program_match | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |
| admin_notification | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | |

---

## Failure Point Checklist

For each failure, we'll identify the exact point:

- **Event Not Fired**: Code doesn't trigger event
- **Event Fired But Not Routed**: Event fired but notify() not called
- **Routing Failed**: notify() called but plan resolved to 0 channels
- **Template Not Found**: Template lookup returned null/empty
- **Provider Failed**: Provider.send() threw error or returned FAILED
- **Log Failed**: Log entry not created
- **Silent Failure**: Returned success but nothing actually happened

---

## Execution Plan

### When Database is Ready (Now)

1. **Start dev server with debug logging**
   ```bash
   DEBUG=* npm run dev
   ```

2. **For each event, execute trigger + collect evidence**:
   - Signup as new user (triggers user_registered)
   - Login (triggers user_login) ✅
   - Submit application (triggers application_submitted)
   - etc.

3. **Immediate checks after each event**:
   - Check server console for debug logs
   - Query NotificationLog table
   - Check Resend dashboard/logs
   - Check Telegram logs

4. **Compile findings into evidence table**

5. **Identify patterns** (why are some working, others not?)

6. **Rank fixes** by impact and effort

---

## Success Criteria

Audit is complete when:
- ✅ Every event has been tested or marked "not testable"
- ✅ Pass/fail status known for each event
- ✅ Root cause identified for each failure
- ✅ Evidence table is 100% populated
- ✅ Fixes are ranked by priority
- ✅ No guessing remains

---

## Output Deliverables

After audit completes:
1. **Evidence Table** — Pass/fail for all events
2. **Runtime Flow Diagram** — How events flow through system
3. **Root Cause Analysis** — Why each failure occurs
4. **Ranked Fix List** — Prioritized by impact
5. **Decision Matrix** — Which events must be fixed vs. nice-to-have

---

## Next Step

When database is fully accessible, begin Phase 5G execution:
- Execute event triggers
- Collect real-time logs
- Build evidence systematically
- No assumptions, only runtime proof

</content>
</invoke>