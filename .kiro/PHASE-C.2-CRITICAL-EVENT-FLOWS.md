# PHASE C.2 — Critical Event Flow Maps
## Visual Guides for Key Events

This document shows the complete flow for the most critical events in the platform.

---

## Event Flow: Application Submitted

### Most Important Event in System
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. EVENT PUBLISHED                                              │
├─────────────────────────────────────────────────────────────────┤
│ Location: app/api/applications/route.ts                         │
│ Code: publishDomainEvent('application.submitted', {             │
│   applicationId, userId, email, programId, timestamp            │
│ })                                                              │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SUBSCRIBER TRIGGERED                                         │
├─────────────────────────────────────────────────────────────────┤
│ Subscriber: NotificationDomainSubscriber                        │
│ Handler: Receives 'application.submitted'                       │
│ Maps to: 'application_submitted' (communication event)          │
│ Calls: notificationService.notify()                             │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AUDIENCE RESOLVED                                            │
├─────────────────────────────────────────────────────────────────┤
│ Service: AudienceResolver                                       │
│ Query: "Who should get this notification?"                      │
│ Result: [                                                       │
│   { type: 'applicant', email: 'applicant@email.com' },         │
│   { type: 'case_worker', email: 'worker@org.com' },            │
│   { type: 'org_admin', email: 'admin@org.com' }                │
│ ]                                                               │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PLANNER EXECUTED                                             │
├─────────────────────────────────────────────────────────────────┤
│ Service: CommunicationPlanner                                   │
│ Input: applicationId, userId, email, programId                 │
│ Decision: Select channels for each recipient type              │
│ Result: {                                                       │
│   'applicant': ['email', 'internal'],                           │
│   'case_worker': ['email', 'telegram'],                         │
│   'org_admin': ['email', 'internal']                            │
│ }                                                               │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. TEMPLATE LOADED                                              │
├─────────────────────────────────────────────────────────────────┤
│ Service: TemplateResolver                                       │
│ Template: 'application_submitted'                               │
│ Channel: 'email' | 'telegram' | 'internal'                     │
│ Locale: 'en' (or user preference)                               │
│ Content: {                                                      │
│   subject: "Your Application Has Been Received",               │
│   body: "Thank you {{name}} for submitting your application...",│
│   html: "<html>...", rendered with data                         │
│ }                                                               │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CHANNEL SELECTED                                             │
├─────────────────────────────────────────────────────────────────┤
│ Routing: Email channel → Resend provider                        │
│          Internal channel → Database insert                     │
│          Telegram channel → Telegram Bot                        │
│ Configuration: Each recipient type gets appropriate provider    │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ↓
         ┌──────┴──────────────────┬─────────────────────┐
         ↓                         ↓                     ↓
    ┌────────────┐        ┌─────────────┐       ┌────────────┐
    │   EMAIL    │        │  INTERNAL   │       │  TELEGRAM  │
    └────────────┘        └─────────────┘       └────────────┘
         │                       │                     │
         ↓                       ↓                     ↓
    ┌────────────┐        ┌─────────────┐       ┌────────────┐
    │  7A: CALL  │        │  7B: INSERT │       │  7C: SEND  │
    │   RESEND   │        │   TO TABLE  │       │   TO BOT   │
    │   API      │        │  Notif'ns   │       │   API      │
    └────────────┘        └─────────────┘       └────────────┘
         │                       │                     │
         ↓                       ↓                     ↓
    ┌────────────┐        ┌─────────────┐       ┌────────────┐
    │  Email     │        │Notification │       │  Telegram  │
    │  Sent      │        │ Stored      │       │  Sent      │
    │  (Resend)  │        │ (Visible)   │       │ (Telegram) │
    └────────────┘        └─────────────┘       └────────────┘

                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. DELIVERY LOGGED                                              │
├─────────────────────────────────────────────────────────────────┤
│ Table: NotificationLog                                          │
│ Entry: {                                                        │
│   event_name: 'application_submitted',                          │
│   recipient_email: 'applicant@email.com',                       │
│   recipient_type: 'applicant',                                  │
│   channel: 'email',                                             │
│   provider: 'resend',                                           │
│   delivery_status: 'sent',                                      │
│   provider_response: { messageId: '...' },                      │
│   sent_at: 2026-07-30T12:34:56Z,                               │
│   template_name: 'application_submitted',                       │
│   application_id: '...',                                        │
│   user_id: '...'                                                │
│ }                                                               │
│                                                                 │
│ Result: Can trace entire flow from publication to delivery      │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Checklist
- [ ] Event published from /api/applications endpoint
- [ ] Domain event bus routes to NotificationDomainSubscriber
- [ ] Subscriber maps to 'application_submitted' communication event
- [ ] AudienceResolver identifies 3 recipient types
- [ ] CommunicationPlanner assigns 2-3 channels per recipient
- [ ] TemplateResolver loads email, internal, and telegram templates
- [ ] Each template renders with applicant name/data
- [ ] Resend API receives email payload
- [ ] Internal notification persisted to database
- [ ] Telegram API called with message
- [ ] NotificationLog has 3 entries (one per recipient)
- [ ] All 8 stages complete ✅

---

## Event Flow: Document Approved

### High-Priority Event
```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  DOCUMENT        │     │  CASE WORKER     │     │  REVIEWER        │
│  SUBMITTED       │────→│  NOTIFIED        │────→│  APPROVES DOCS   │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                            │
                                                            ↓
                         ┌──────────────────────────────────────────┐
                         │ publishDomainEvent(                      │
                         │   'document.approved',                   │
                         │   { docId, type, userId, email }         │
                         │ )                                        │
                         └──────────────┬───────────────────────────┘
                                        │
         ┌──────────────────────────────┴────────────────────────────┐
         │                                                            │
         ↓ (Immediate)                            ↓ (Next trigger)
    ┌─────────────┐                         ┌──────────────┐
    │ Send to     │                         │ Check for    │
    │ applicant   │                         │ remaining    │
    │ "Approved"  │                         │ docs needed  │
    │ email       │                         │              │
    └─────────────┘                         └──────────────┘
         │
         ↓
    ┌────────────────────────────────────────┐
    │ Audience: Applicant                    │
    │ Channel: Email + Internal Notification│
    │ Template: 'document_approved'           │
    │ Content: "Document type {{docType}}     │
    │           has been approved by admin"   │
    └────────────────────────────────────────┘
         │
         ↓
    ┌──────────┐         ┌──────────┐
    │  Resend  │         │ Database │
    │  Email   │         │ Insert   │
    └──────────┘         └──────────┘
         │
         ↓
    ┌────────────────────────────────────────┐
    │ NotificationLog:                        │
    │ - document_approved event logged        │
    │ - email delivery status                 │
    │ - internal notification status          │
    │ - timestamp and provider response       │
    └────────────────────────────────────────┘
```

---

## Event Flow: Admin Alert - Application Submitted

### CURRENT ISSUE: Bypasses Pipeline ⚠️

```
WRONG (Current Implementation):
┌────────────────────────────────────┐
│ Application Submitted              │
└────────────┬───────────────────────┘
             │
             ↓
        ❌ DIRECT API CALL
        alert-service.ts calls
        TelegramBot.send() directly
        BYPASSES ENTIRE PIPELINE
             │
             ↓
        Telegram message sent
        NO LOGGING
        NO AUDIENCE RESOLUTION
        NO TEMPLATE SYSTEM
        NO RETRY LOGIC
        NO AUDITING

Result: ⚠️ CRITICAL - Breaks certification
```

```
RIGHT (After Migration):
┌────────────────────────────────────┐
│ Application Submitted              │
└────────────┬───────────────────────┘
             │
             ↓
    publishDomainEvent(
      'admin.alert.application_submitted',
      { applicationId, email, name }
    )
             │
             ↓
    ✅ NotificationDomainSubscriber
       receives event
             │
             ↓
    AudienceResolver:
    Audience = [org_admin]
             │
             ↓
    CommunicationPlanner:
    Channel = telegram (urgent)
             │
             ↓
    TemplateResolver:
    Load 'admin_alert_application_submitted'
    Template: "🔔 New Application: {{name}}"
             │
             ↓
    Telegram Provider:
    Send message via Telegram Bot
             │
             ↓
    NotificationLog:
    Record full delivery history
    
Result: ✅ CERTIFIED - Flows through pipeline
```

### How to Fix (2 Hours)

**Step 1: Remove Bypass**
```typescript
// REMOVE from lib/telegram/alert-service.ts:
const result = await TelegramBot.send(message); // ❌ REMOVE THIS

// REPLACE WITH:
publishDomainEvent('admin.alert.application_submitted', {
  applicationId,
  applicantName,
  email,
  timestamp: new Date()
});
```

**Step 2: Add Registry Entry**
```typescript
// In lib/communications/communication-registry.ts:
COMMUNICATION_REGISTRY.set('admin.alert.application_submitted', {
  domainEvent: 'admin.alert.application_submitted',
  communicationEventName: 'admin_alert_application_submitted',
  audienceType: 'org_admin',
  preferredChannels: ['telegram', 'email'],
  retryPolicy: 'aggressive' // Urgent alerts get aggressive retries
});
```

**Step 3: Create Template**
```typescript
// templates/admin-alert-application-submitted.json
{
  "eventName": "admin_alert_application_submitted",
  "channels": {
    "telegram": {
      "message": "🔔 NEW APPLICATION: {{applicantName}}\n\nProgram: {{programName}}\nReceived: {{submittedAt}}\n\n→ Review Now: /reviews/{{applicationId}}"
    },
    "email": {
      "subject": "🔔 New Application Submitted",
      "body": "New application from {{applicantName}} in {{programName}}"
    }
  }
}
```

**Step 4: Verify**
```typescript
// Run end-to-end test
test('admin.alert.application_submitted goes through full pipeline', async () => {
  // S1: Publish
  publishDomainEvent('admin.alert.application_submitted', payload);
  
  // S2: Subscriber processes
  await waitFor(() => notificationProcessed);
  
  // S3: Audience resolved
  const audience = await getResolvedAudience();
  expect(audience).toContainEqual({ type: 'org_admin' });
  
  // S4-7: Planner, Template, Channel, Provider
  expect(telegramApiCalled).toBe(true);
  
  // S8: Logged
  const log = await NotificationLog.findLatest();
  expect(log.event_name).toBe('admin_alert_application_submitted');
  expect(log.delivery_status).toBe('sent');
});
```

---

## Event Flow: Partial Implementation - User Login

### Current Status: 50% Complete
```
✅ WORKS:
┌──────────────────────────────────────┐
│ User logs in at /auth/login          │
├──────────────────────────────────────┤
│ publishDomainEvent('user.login', {   │
│   userId, email, ip, userAgent       │
│ })                                   │
├──────────────────────────────────────┤
│ NotificationDomainSubscriber receives │
│ Looks up 'user_login' in registry    │
└──────────────────────────────────────┘

❌ MISSING:
┌──────────────────────────────────────┐
│ Template not created                 │
│ → Do we send email? (Probably not)   │
│ → Send alert? (Only suspicious IPs)  │
│                                      │
│ Planner logic incomplete             │
│ → Don't notify every login           │
│ → Only notify:                       │
│   - New IP address?                  │
│   - Unusual location?                │
│   - Failed attempts?                 │
│                                      │
│ Provider not called                  │
│ Channel selection undefined          │
│ Delivery not logged                  │
└──────────────────────────────────────┘
```

### To Complete (2 Hours)

**Option 1: Security Alerts Only**
- Only notify on suspicious login
- Template: "⚠️ Login alert from {{location}}"
- Channel: Email + internal
- Store IP and geo data for anomaly detection

**Option 2: All Logins Tracked**
- Log every login for audit trail
- No notification sent (just logged)
- Template: None (internal logging only)
- Use for security analytics

**Decision:** Implement Option 2 first (cleaner), add Option 1 later if needed.

---

## Event Gap: Password Reset (Not Implemented)

### Flow to Build
```
User clicks "Forgot Password"
           ↓
    /auth/forgot-password endpoint
           ↓
    publishDomainEvent('user.password.reset', {
      email,
      resetToken,
      resetUrl,
      expiresAt
    })
           ↓
    AudienceResolver: [user]
           ↓
    CommunicationPlanner: [email]
           ↓
    TemplateResolver: password-reset-email
    "Click here to reset: {{resetUrl}}"
           ↓
    Resend API sends email
           ↓
    NotificationLog records
           ↓
    User receives email
    Clicks link
    Resets password
    ✅ DONE
```

**Implementation Estimate:** 2-3 hours
1. Add event publisher (30 min)
2. Add registry entry (15 min)
3. Create template (30 min)
4. Add audience resolver logic (30 min)
5. Add test (30 min)

---

## Summary: Critical Path to Certification

| Event | Current | Fix | Time | Priority |
|-------|---------|-----|------|----------|
| app.submitted | ✅ WORKS | None | — | P0 |
| doc.approved | ✅ WORKS | None | — | P0 |
| admin.alert | ⚠️ BYPASS | Migrate to pipeline | 2h | **CRITICAL** |
| user.login | ⏳ PARTIAL | Complete templates & logic | 2h | P2 |
| password.reset | ❌ MISSING | Build full event flow | 2-3h | P1 |
| 34 others | ❓ MIXED | See main inventory | 20h+ | P1-P3 |

---

## Next: Use This Document

When implementing each event, refer back to:
1. **Application Submitted** — Copy this pattern for similar events
2. **Admin Alert** — Remember the bypass fix (apply to all direct API calls)
3. **Password Reset** — Template for implementing new events
4. **Main Inventory** — Check detailed status for all 38 events

The communication platform is built once, used a thousand times.  
Let's build it right.

