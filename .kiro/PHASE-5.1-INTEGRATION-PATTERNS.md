# PHASE 5.1 — INTEGRATION PATTERNS REFERENCE

**Purpose**: Quick reference for how every workflow integrates with the communication engine

---

## PATTERN 1: Standard Decision Workflow (Approval/Rejection)

### Used by:
- Application Approval
- Application Rejection
- Conditional Approval
- Document Approval
- Document Rejection

### Flow:

```typescript
// 1. Server Action (lib/reviews/decision.service.ts)
export async function approveApplication(input: ApproveDecisionInput) {
  
  // 2. Execute business logic in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 2a. Authorize
    await verifyApplicationAccess(...)
    
    // 2b. Fetch context
    const application = await tx.programApplication.findUnique({...})
    
    // 2c. Validate state
    validateApplicationStateForDecision(application.status, "approved")
    
    // 2d. Create records (decision, update application, audit, timeline)
    await tx.caseDecision.create({...})
    await tx.programApplication.update({...})
    await tx.auditLog.create({...})
    await tx.applicationEvent.create({...})
    
    // 2e. Post to communication center
    await postDecisionToConversation(tx, ...)
    
    return result;
  });
  
  // 3. CRITICAL: Publish domain event AFTER transaction
  const application = await prisma.programApplication.findUnique({...})
  
  if (application) {
    publishDomainEvent("application.approved", {
      userId: application.user.id,
      email: application.user.email,
      applicationId: input.applicationId,
      // ... other context
    });
  }
  
  // 4. Return to UI
  return { success: true, decisionId: result.id };
}
```

### Key Points:
- ✅ Domain event published AFTER transaction (ensures clean state)
- ✅ Event includes userId + email (for AudienceResolver)
- ✅ Event includes aggregateId (applicationId)
- ✅ AuditLog created in transaction (permanent record)
- ✅ CaseConversation post created in transaction (user sees decision immediately)

### Registry Entry:
```typescript
application_approved: {
  domainEventName: "application.approved",
  audiences: ["applicant", "org_admin", "reviewer"],
  channelsByAudience: {
    applicant: ["email", "internal"],
    org_admin: ["telegram", "internal"],
    reviewer: ["internal"]
  }
}
```

---

## PATTERN 2: Staff Workflow (Invitation/Role/Removal)

### Used by:
- Staff Invitation
- Staff Invitation Acceptance
- Staff Role Update
- Staff Removal

### Flow:

```typescript
// 1. Service function (lib/organizations/team-service.ts)
export async function inviteStaff(
  orgId: string,
  inviterId: string,
  email: string,
  role: string
) {
  // 2. Create invitation record
  const token = randomBytes(16).toString("hex");
  const invitation = await prisma.invitation.create({
    data: { organizationId: orgId, email, role, token, ... }
  });
  
  // 3. Create audit log
  await prisma.auditLog.create({...})
  
  // 4. Publish domain event
  publishDomainEvent("staff.invited", {
    email,
    invitationId: invitation.id,
    token,
    organizationId: orgId
  });
  
  return invitation;
}
```

### Key Points:
- ✅ Domain event published synchronously (no transaction needed)
- ✅ Event includes all context for audience resolution
- ✅ Email is primary identifier (AudienceResolver matches by email)
- ✅ For role changes: also call queueTelegramAlert() for ops team
- ✅ For removal: validate not removing last org_admin before delete

### Registry Entry:
```typescript
staff_invited: {
  domainEventName: "staff.invited",
  audiences: ["staff_member"],
  channelsByAudience: {
    staff_member: ["email"]
  },
  priority: "critical",
  retry: { maxAttempts: 5, backoffStrategy: "exponential" }
}
```

---

## PATTERN 3: Document Request Workflow

### Used by:
- Documents Requested
- Document Replacement Requested

### Flow:

```typescript
// 1. Service function (lib/reviews/document-review.service.ts)
export async function requestDocuments(
  applicationId: string,
  requiredDocs: string[],
  deadline: Date
) {
  // 2. Create request + verification records
  await prisma.documentRequest.create({...})
  for (const doc of requiredDocs) {
    await prisma.documentVerification.create({...})
  }
  
  // 3. Post to communication center
  await postToConversation(...)
  
  // 4. Publish domain event with full context
  const application = await prisma.programApplication.findUnique({...})
  
  publishDomainEvent("documents.requested", {
    userId: application.user.id,
    email: application.user.email,
    applicationId,
    requiredDocuments: requiredDocs,
    deadline
  });
}
```

### Key Points:
- ✅ Event includes complete context (document list, deadline)
- ✅ TemplateResolver can access via event payload
- ✅ CommunicationComposer can show context in history
- ✅ Multiple audiences get different templates (applicant vs reviewer)

### Registry Entry:
```typescript
documents_requested: {
  domainEventName: "documents.requested",
  audiences: ["applicant", "reviewer"],
  channelsByAudience: {
    applicant: ["email", "internal"],
    reviewer: ["internal"]
  },
  priority: "high"
}
```

---

## PATTERN 4: Message/Communication Workflow

### Used by:
- Message Created
- Manual Email Send

### Flow:

```typescript
// Pattern 4a: Automatic message (message.created)
export async function sendApplicantNoteForDocument(...) {
  // 1. Create message record
  const message = await prisma.caseMessage.create({...})
  
  // 2. Publish domain event
  publishDomainEvent("message.created", {
    messageId: message.id,
    applicantId: application.user.id,
    email: application.user.email,
    // content is in DB, not in event
  });
}

// Pattern 4b: Manual send (admin.action - one event per recipient)
export async function sendManualEmailAction(data: {
  recipients: Array<{email, name}>,
  subject: string,
  body: string
}) {
  for (const recipient of data.recipients) {
    publishDomainEvent("admin.action", {
      recipientEmail: recipient.email,
      subject: data.subject,
      body: data.body
      // RuntimeOrchestrator looks up channel + audience from recipient
    });
  }
}
```

### Key Points:
- ✅ For message.created: email + userId resolve to applicant audience
- ✅ For admin.action: email resolves recipient type (applicant, staff, admin)
- ✅ Manual send: one event per recipient (allows different channel per person)
- ✅ CommunicationComposer stores all messages in conversation history

### Registry Entries:
```typescript
message_created: {
  domainEventName: "message.created",
  audiences: ["applicant", "org_admin"],
  channelsByAudience: {
    applicant: ["email", "internal"],
    org_admin: ["internal"]
  }
},

admin_action: {
  domainEventName: "admin.action",
  audiences: ["applicant", "org_admin", "reviewer", "case_worker"],
  channelsByAudience: {
    applicant: ["email", "internal"],
    org_admin: ["telegram", "internal"],
    reviewer: ["internal"],
    case_worker: ["internal"]
  }
}
```

---

## PATTERN 5: Registration/Login (User-Only Events)

### Used by:
- User Registration
- User Login

### Flow:

```typescript
// 1. Service (lib/auth/user-profile.service.ts)
export async function registerUserAccount(data: {email, name}) {
  // 2. Create user
  const user = await prisma.user.create({...})
  
  // 3. If new user, publish domain event
  if (isNewUser) {
    publishDomainEvent("user.registration", {
      userId: user.id,
      email: user.email,
      name: user.name
    });
  }
}

// 2. On login (actions/notifications.actions.ts)
export async function trackLoginNotificationAction(email: string) {
  publishDomainEvent("user.login", {
    email,
    // userId resolved by AudienceResolver from email
  });
}
```

### Key Points:
- ✅ These events don't have organizationId (user has no org yet)
- ✅ RuntimeOrchestrator.isUserOnlyEvent() allows this exception
- ✅ AudienceResolver resolves based on email alone
- ✅ org_admin audience resolved from organization lookup

### Registry Entries:
```typescript
user_registration: {
  domainEventName: "user.registration",
  audiences: ["applicant", "org_admin"],
  // Note: org_admin resolved via user's organization
},

user_login: {
  domainEventName: "user.login",
  audiences: ["applicant", "org_admin"],
  // Note: org_admin resolved via user's organization
}
```

---

## RUNTIME ORCHESTRATOR EXECUTION

### For every domain event:

```typescript
RuntimeOrchestrator.run(eventName, context) {
  // 1. Build CommunicationRequest
  const request = {
    context: {
      traceId: generateTraceId(),
      organizationId: context.organizationId,
      userId: context.userId,
      createdAt: now()
    },
    event: eventName,
    eventPayload: context
  };
  
  // 2. Lookup registry
  const entry = COMMUNICATION_REGISTRY[eventName];
  
  // 3. Resolve audiences
  const audienceResolved = await AudienceResolver.resolve(request);
  
  // 4. Plan communications
  const plans = CommunicationPlanner.plan(eventName, audiences);
  
  // 5. Resolve templates
  const resolutions = plans.map(p => TemplateResolver.resolve(p));
  
  // 6. Dispatch
  return resolutions
    .map(r => Dispatcher.dispatch(r))
    .filter(d => !!d);
}
```

---

## CRITICAL CHECKLIST

For every workflow integration:

- [ ] **UI Action**: Form/button calls Server Action ("use server")
- [ ] **Server Action**: Calls business logic function
- [ ] **Transaction**: All writes happen in prisma.$transaction()
- [ ] **Audit Log**: auditLog.create() in transaction
- [ ] **Timeline Event**: applicationEvent.create() in transaction
- [ ] **Communication Post**: postDecisionToConversation() in transaction
- [ ] **Domain Event**: publishDomainEvent() AFTER transaction
- [ ] **Event Payload**: Includes userId + email + context
- [ ] **Registry Entry**: Event maps to registry with all audiences
- [ ] **Return Value**: UI receives success/error result
- [ ] **State Update**: UI loading → success → display

---

## DISPATCH CHANNELS

### Email (sendgrid)
- **Uses**: TemplateResolver finds email template
- **Payload**: Name, application ID, program name, decision text
- **Retry**: Up to 5 attempts with exponential backoff
- **Example**: `application_approved_applicant_email`

### Telegram (telegram_bot)
- **Uses**: TemplateResolver finds telegram template
- **Payload**: Condensed text (char limit)
- **Retry**: Up to 3 attempts
- **Recipients**: org_admin, ops team
- **Example**: `application_approved_org_admin_telegram`

### Internal (prisma)
- **Uses**: InternalNotification.create()
- **Payload**: Title + message (can be markdown)
- **Audiences**: All staff, all applicants
- **Lifetime**: Expires after 30 days
- **Example**: `application_approved_applicant_internal`

### WhatsApp (future)
- **Status**: Reserved in registry
- **Channels**: Not yet active
- **Rollout**: Will follow email/telegram certification

---

## EXCEPTION HANDLING

### What happens if domain event publish fails?

```typescript
try {
  publishDomainEvent("application.approved", {...});
} catch (e) {
  console.error("Domain event publish failed", e);
  // Event bus should handle retries
  // But business logic already committed (user sees decision)
  // So failure is graceful degradation (communications retried)
}
```

**Policy**: Business logic commits first, communication is async fallback.

---

## VERIFICATION COMMANDS

### Enable runtime tracing:
```bash
NOTIFICATION_RUNTIME_TRACE=true npm run dev
```

### Watch runtime orchestrator output:
```
========== Notification Runtime (C.1 Integrated) ==========
EVENT: application.approved
Audiences: applicant, org_admin, reviewer
Plans: applicant→email, applicant→internal, org_admin→telegram, ...
Templates: application_approved_applicant_email, ...
Dispatch: applicant→email (sendgrid), org_admin→telegram (telegram_bot), ...
========================================================
```

### Query notification logs:
```typescript
const logs = await prisma.notificationLog.findMany({
  where: { eventName: "application.approved" },
  take: 10
});
```

---

## SUMMARY TABLE

| Pattern | Workflows | Transaction | Event Timing | Primary Key |
|---------|-----------|-------------|--------------|------------|
| Decision | Approval, Rejection, Conditional | ✅ Yes | After commit | userId + email |
| Staff | Invite, Accept, Role, Remove | ❌ No | Sync | email |
| Document | Request, Approve, Reject | ✅ Yes | After commit | userId + email |
| Message | message.created, admin.action | Varies | Sync | userId or email |
| User | Registration, Login | ❌ No | Sync | email |

---

**Pattern Reference Complete**

See PHASE-5.1-FRONTEND-INTEGRATION-CHECKLIST.md for full audit matrix.
