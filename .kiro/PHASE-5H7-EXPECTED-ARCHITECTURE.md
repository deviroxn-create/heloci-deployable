# PHASE 5H.7 — EXPECTED SYSTEM ARCHITECTURE

**Basis**: Code inspection of communication-registry.ts and notification system  
**Date**: August 4, 2026  
**Purpose**: Define expected behavior before observation

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM ARCHITECTURE              │
└─────────────────────────────────────────────────────────────────┘

┌─ COMMUNICATION REGISTRY (Source of Truth)
│  │
│  ├─ Domain Event Name → Communication Event Name mapping
│  ├─ Communication Event → Audiences (who receives)
│  ├─ Audience → Channels (email, telegram, internal)
│  └─ Rules: One domain event → One communication intent
│
├─ DOMAIN EVENT BUS
│  │
│  ├─ Publishes: application.submitted, application.approved, etc.
│  ├─ Subscribers: NotificationDomainSubscriber listens to ALL
│  └─ One-way: Event published → subscribers notified
│
├─ NOTIFICATION DOMAIN SUBSCRIBER
│  │
│  ├─ Step 1: Receive domain event
│  ├─ Step 2: Query registry: domain event → communication event
│  ├─ Step 3: Call notificationService.notify(communicationEvent)
│  └─ This is THE ONLY bridge between domain and notification system
│
├─ NOTIFICATION SERVICE
│  │
│  ├─ Input: communicationEventName + payload
│  ├─ Step 1: Query registry for audiences
│  ├─ Step 2: For each audience:
│  │   ├─ AudienceResolver: Identify recipients (who)
│  │   ├─ TemplateResolver: Select template (what)
│  │   ├─ ChannelResolver: Choose channel (how)
│  │   └─ Dispatcher: Send via provider
│  └─ Output: NotificationResult (channels sent, success/fail)
│
├─ AUDIENCE RESOLVER
│  │
│  ├─ Input: Event name + context (userId, organizationId, etc.)
│  ├─ Logic: For each audience in registry:
│  │   ├─ applicant → resolveApplicant(context)
│  │   ├─ org_admin → resolveOrganizationAdmin(context)
│  │   ├─ reviewer → resolveReviewer(context)
│  │   └─ ... others
│  ├─ Output: Audience[] with resolved recipients
│  └─ Guarantee: Applicant != Admin (multi-tenant isolation)
│
├─ TEMPLATE RESOLVER
│  │
│  ├─ Input: Communication event name + audience
│  ├─ Logic: Find template for this combination
│  ├─ Output: Template ID + content
│  └─ Guarantee: Applicant template != Admin template
│
├─ CHANNEL RESOLVER
│  │
│  ├─ Input: Audience + context
│  ├─ Logic: Query registry for channels this audience receives via
│  ├─ Output: Channels array (e.g., ["email", "telegram"])
│  └─ Guarantee: Each audience → consistent channels per registry
│
├─ DISPATCHER
│  │
│  ├─ For each recipient + channel:
│  │   ├─ Email → Resend API
│  │   ├─ Telegram → Telegram Bot API
│  │   ├─ Internal → Database (NotificationLog)
│  │   └─ WhatsApp → WhatsApp API (if configured)
│  ├─ Logs: HTTP status, response, delivery status
│  └─ Records: NotificationLog entry per delivery
│
└─ NOTIFICATION LOG
   │
   ├─ Records every delivery attempt
   ├─ Fields: userId, recipient, channel, template, status
   └─ Truth source for audit trail
```

---

## COMMUNICATION REGISTRY (Current State)

From `lib/communications/communication-registry.ts`:

### APPLICATION_SUBMITTED

```typescript
application_submitted: {
  communicationEventName: 'application_submitted',
  domainEventName: 'application.submitted',
  audiences: ['applicant', 'org_admin', 'reviewer', 'case_worker', 'support'],
  channelsByAudience: {
    applicant: ['email', 'internal'],
    org_admin: ['telegram', 'internal'],
    reviewer: ['internal'],
    case_worker: ['internal'],
    support: ['email'],
    ...others: []
  },
  type: 'mixed',
  priority: 'critical',
  implemented: true
}
```

**Interpretation:**
- Applicant receives: email + internal
- Org Admin receives: telegram + internal
- Reviewer receives: internal only
- Case worker receives: internal only
- Support receives: email only

**Critical Invariant:**
- Applicant email ≠ Org Admin telegram (different channels, different recipients)

---

### APPLICATION_APPROVED

```typescript
application_approved: {
  communicationEventName: 'application_approved',
  domainEventName: 'application.approved',
  audiences: ['applicant', 'org_admin', 'reviewer'],
  channelsByAudience: {
    applicant: ['email', 'internal'],
    org_admin: ['telegram', 'internal'],
    reviewer: ['internal']
  },
  type: 'user-facing',
  priority: 'critical',
  implemented: true
}
```

---

### DOCUMENTS_REQUESTED

```typescript
documents_requested: {
  communicationEventName: 'documents_requested',
  domainEventName: 'documents.requested',
  audiences: ['applicant', 'reviewer'],
  channelsByAudience: {
    applicant: ['email', 'internal'],
    org_admin: [],
    reviewer: ['internal']
  },
  type: 'user-facing',
  priority: 'critical',
  implemented: true
}
```

---

## AUDIENCE RESOLUTION LOGIC (Current Implementation)

From `lib/notifications/runtime/audience-resolver.ts`:

### For event: application_submitted

```typescript
private async buildAudiences(
  eventName: 'application_submitted',
  context: AudienceResolutionContext
): Promise<Audience[]> {
  return [
    this.resolveApplicant(context),         // Audience: applicant
    await this.resolveOrganizationAdmin(context),  // Audience: org_admin
    this.resolveReviewer(context),          // Audience: reviewer
    this.resolveCaseWorker(context),        // Audience: case_worker
    this.resolveSupport(context)            // Audience: support
  ].filter((audience): audience is Audience => Boolean(audience));
}
```

### Applicant Resolution

```typescript
private resolveApplicant(context: AudienceResolutionContext): Audience | null {
  const recipient = this.buildRecipient(
    context.userId,      // User who submitted
    context.userEmail,   // Their email
    context.recipientId,
    context.recipientEmail
  );
  
  if (!recipient) return null;
  
  return {
    role: "applicant",
    name: "Applicant",
    recipient  // { type: 'user', userId: '...', email: '...' }
  };
}
```

**Expected Result:**
- Type: user
- User ID: applicant's user ID (from context.userId)
- Email: applicant's email (from context.userEmail)

---

### Organization Admin Resolution

```typescript
private async resolveOrganizationAdmin(
  context: AudienceResolutionContext
): Promise<Audience | null> {
  // If explicitly provided
  const explicitRecipient = this.buildRecipient(
    context.organizationAdminId,
    context.organizationAdminEmail
  );
  if (explicitRecipient) {
    return {
      role: "organization_admin",
      name: "Organization Admin",
      recipient: explicitRecipient
    };
  }

  // Otherwise query database for org's admin
  const recipient = await this.resolveOrganizationAdminRecipient(context);
  if (!recipient) return null;

  return {
    role: "organization_admin",
    name: "Organization Admin",
    recipient
  };
}

private async resolveOrganizationAdminRecipient(
  context: AudienceResolutionContext
): Promise<AudienceRecipient | null> {
  const organizationId = await this.resolveOrganizationId(context);
  
  // Query database for org_admin role member
  const adminMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      role: "org_admin"
    },
    include: {
      user: { select: { id: true, email: true } }
    }
  });

  if (!adminMember?.user) return null;

  return this.buildRecipient(
    adminMember.user.id,     // Admin's user ID
    adminMember.user.email   // Admin's email
  );
}
```

**Expected Result:**
- Type: user
- User ID: admin's user ID (from database)
- Email: admin's email (from database)
- **MUST BE DIFFERENT from applicant**

---

## TEMPLATE SELECTION LOGIC

From specification: Each communication event has multiple templates:
- applicant_application_submitted (for applicant audience)
- admin_application_submitted (for admin audience)
- reviewer_application_submitted (for reviewer audience)

**Expected behavior:**
```
For each audience:
  ├─ If audience = applicant
  │  └─ Select: applicant_application_submitted template
  ├─ If audience = org_admin
  │  └─ Select: admin_application_submitted template
  └─ If audience = reviewer
     └─ Select: reviewer_application_submitted template
```

**Critical invariant:**
- Applicant never receives admin_application_submitted template
- Admin never receives applicant_application_submitted template

---

## CHANNEL SELECTION LOGIC

From registry:
```typescript
channelsByAudience: {
  applicant: ['email', 'internal'],
  org_admin: ['telegram', 'internal'],
  reviewer: ['internal'],
  case_worker: ['internal'],
  support: ['email']
}
```

**Expected behavior:**
```
For audience = applicant:
  └─ Send via: email, internal

For audience = org_admin:
  └─ Send via: telegram, internal

For audience = reviewer:
  └─ Send via: internal (only)
```

---

## DATA FLOW FOR APPLICATION SUBMISSION

```
Step 1: User submits application
  └─ POST /api/applications/{{id}}/submit
     ├─ Headers: Authorization: Bearer {{token}}
     ├─ Body: { data: {{ wizard payload with 81 keys }} }
     └─ Response: HTTP 200 { success: true }

Step 2: SubmitApplication service called
  ├─ Input: applicationId, userId, wizardPayload
  ├─ Logic:
  │  ├─ Fetch application + program + form
  │  ├─ Transform wizardPayload → questionSetPayload
  │  ├─ Validate questionSetPayload
  │  ├─ Update database: status = SUBMITTED
  │  └─ Return success
  └─ Output: Application updated

Step 3: Domain event published
  ├─ Event name: application.submitted
  ├─ Payload:
  │  ├─ applicationId: '...'
  │  ├─ userId: '...' (applicant)
  │  ├─ organizationId: '...'
  │  ├─ programId: '...'
  │  └─ ... other fields
  └─ Published to: EventBus

Step 4: Event bus delivers to all subscribers
  └─ NotificationDomainSubscriber receives event

Step 5: Subscriber handles event
  ├─ Step 5.1: Receive domain event
  ├─ Step 5.2: Query registry
  │  ├─ Input: domain event name = 'application.submitted'
  │  └─ Output: communication event name = 'application_submitted'
  ├─ Step 5.3: Call notificationService.notify()
  │  ├─ Input: 'application_submitted', { applicationId, userId, organizationId, ... }
  │  └─ Output: NotificationResult
  └─ Step 5.4: Log result

Step 6: NotificationService.notify() processes
  ├─ Step 6.1: Query registry for audiences
  │  └─ Output: ['applicant', 'org_admin', 'reviewer', 'case_worker', 'support']
  ├─ Step 6.2: For each audience:
  │  ├─ AudienceResolver.resolve(applicant)
  │  │  ├─ Input: userId='...', userEmail='...', organizationId='...'
  │  │  └─ Output: Audience { role: 'applicant', recipient: { userId, email } }
  │  ├─ AudienceResolver.resolve(org_admin)
  │  │  ├─ Input: organizationId='...', (query database)
  │  │  └─ Output: Audience { role: 'org_admin', recipient: { userId: adminId, email: adminEmail } }
  │  ├─ TemplateResolver.resolve(communication_event, audience)
  │  │  ├─ For applicant: 'applicant_application_submitted_template'
  │  │  └─ For org_admin: 'admin_application_submitted_template'
  │  ├─ ChannelResolver.resolve(audience)
  │  │  ├─ For applicant: ['email', 'internal']
  │  │  └─ For org_admin: ['telegram', 'internal']
  │  └─ Dispatcher.send(recipient, template, channel)
  │     ├─ Email: Send via Resend API to applicantEmail
  │     ├─ Telegram: Send via Telegram API to adminChatId
  │     └─ Internal: Create NotificationLog entry
  │
  └─ Step 6.3: Collect results
     ├─ email: 1 success (applicant)
     ├─ telegram: 1 success (org_admin)
     ├─ internal: 5 entries created (all audiences)
     └─ Return: { delivered: true, channels: ['email', 'telegram', 'internal'] }

Step 7: Event completes
  └─ Application submission complete
     ├─ Applicant receives email confirmation
     ├─ Admin receives Telegram alert
     ├─ Reviewer receives internal notification
     └─ All recorded in NotificationLog
```

---

## CRITICAL INVARIANTS (Must Always Be True)

1. **Multi-Tenant Isolation**
   - Applicant A's email ≠ Applicant B's organization admin email
   - Applicant's notifications never go to another applicant's org admin

2. **Audience Separation**
   - Applicant audience always resolved to applicant's user record
   - Org_admin audience always resolved to organization's admin user record
   - Never reversed or crossed

3. **Template Separation**
   - Applicant template contains applicant-facing language
   - Admin template contains admin-facing language
   - Templates never sent to wrong audience

4. **Channel Fidelity**
   - Applicant receives email (not telegram)
   - Admin receives telegram (not email)
   - Channels per registry never violated

5. **Event Publication**
   - Domain event always published before notifications sent
   - Domain event contains accurate payload
   - Subscriber always receives published event

6. **Database Consistency**
   - NotificationLog has one entry per delivery
   - Each entry has: userId, recipient, channel, template, status
   - No orphaned records

---

## WHAT WOULD BREAK THESE INVARIANTS

**Symptom**: Admin receives applicant email

**Root causes to investigate:**
1. AudienceResolver returns applicant recipient for org_admin audience
2. AudienceResolver returns admin recipient for applicant audience
3. TemplateResolver selects wrong template
4. ChannelResolver assigns wrong channel
5. Dispatcher sends to wrong provider

**Each root cause leaves evidence:**
- If #1: Console shows org_admin role but applicantEmail in recipient
- If #2: Console shows applicant role but adminEmail in recipient
- If #3: Emails don't match template content expected
- If #4: Email sent instead of telegram, or vice versa
- If #5: Provider logs show wrong recipient

---

## OBSERVATION TARGETS

We will observe for evidence of:

✅ **Correct behavior:**
- Applicant resolved to applicantId + applicantEmail
- Admin resolved to adminId + adminEmail  
- Email sent to applicantEmail only
- Telegram sent to adminChatId only

❌ **Broken behavior (if found):**
- Applicant email = admin email (multi-tenant isolation broken)
- Wrong template sent to audience
- Wrong channel used
- Recipient not resolved
- Event not published
- Subscriber didn't receive

---

## NEXT STEP

With this architecture documented, we now execute workflows and compare:

**Expected**: Architecture as described above  
**Actual**: Console logs from execution  
**Match**: ✅ YES / ❌ NO  

If NO: Find exact divergence point and document with line numbers.

