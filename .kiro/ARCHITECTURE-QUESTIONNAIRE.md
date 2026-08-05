# Heloci Multi-Tenant Email Architecture Questionnaire

## PART 1: MULTI-TENANT ARCHITECTURE & ISOLATION

### 1.1 Tenant Identification
- **Current Model:** Organization-based (multi-org, single platform)
- **How Identified:** Via `organizationId` in request context, session, or database records
- **Path Pattern:** `/admin/*` and `/platform/*` routes are organization-scoped
- **DB Model:** Single PostgreSQL database with `organizationId` foreign key on most tables (User, Program, Organization, etc.)

### 1.2 Data Isolation Strategy
- **Method:** Shared database with tenant_id (organizationId) column
- **Key Tables with organizationId:**
  - `Organization` (root tenant record)
  - `User` (organizationId nullable for platform admins)
  - `Program` (organizationId required)
  - `Department`, `Team` (organizationId required)
  - `OrganizationMember` (role-based access)
  - `SenderIdentity` (organization-specific email senders)
  - `NotificationLog` (implicit via userId/senderIdentityId)
  - `NotificationTemplate` (organizationId nullable, defaults to global)
  - `OrganizationCommunication` (email campaigns per org)

### 1.3 Authorization Layer
- **Session Model:** Supabase-based authentication + database User lookup
- **Role Hierarchy:**
  - `SUPER_ADMIN` (platform-level, no organizationId)
  - `ADMIN` (organization-level, has organizationId)
  - `STAFF` (department/team-level)
  - `APPLICANT` (end user, no org affiliation)
- **Multi-Org Access:** via `OrganizationMember` table with role mapping
- **Platform-Level Routes:** `/admin/*` (for platform operations)
- **Organization-Level Routes:** `/platform/*` (for org-specific operations)

---

## PART 2: EMAIL PROVIDER & ROUTING

### 2.1 Delivery Engine
- **Primary Provider:** Resend (API-based email service)
- **API Key:** `RESEND_API_KEY` environment variable
- **Configuration:** In `.env.local`, shared across all organizations
- **Backup/Secondary:** Telegram (admin alerts), WhatsApp (placeholder)
- **Internal:** In-database notifications for non-email channels

### 2.2 Domain & Identity Management

#### **Critical Issue Identified: Unverified Sender Domain**
```
COMMUNICATION_SENDER_EMAIL=support@heloci.us
(This is configured but may not be verified with Resend)
```

#### **Email Sender Resolution (Priority Order)**
1. **Context.sender** ← From `SenderIdentity` resolved in database (CORRECT ✓)
2. **settings.senderEmail** ← From organization config (CORRECT ✓)
3. **Fallback** `support@heloci.us` ← Verified Heloci domain (CORRECT ✓)
4. **Never use:** `COMMUNICATION_SENDER_EMAIL` env var directly (DANGEROUS ✗)

#### **SenderIdentity Management**
- **Model:** `SenderIdentity` table with organizationId
- **Fields:**
  - `emailAddress` (e.g., noreply@housing-org.gov)
  - `displayName` (e.g., "Housing Authority")
  - `replyTo` (optional, separate reply address)
  - `isVerified` (boolean)
  - `isDefault` (boolean per organization)
  - `createdBy` (User who added it)
  - `organizationId` (tenant isolation)

#### **Custom Domain Verification**
- **Capability:** Organizations can add their own verified domains
- **Requirements:** Organization admin must verify DKIM/SPF records with Resend
- **Flow:**
  1. Admin navigates to `/admin/communication/settings/sender-identities` (actually `/platform/communication/settings` for org level)
  2. Adds new `SenderIdentity` with custom domain
  3. System generates DKIM/SPF instructions
  4. Admin verifies records at domain registrar
  5. System polls Resend API to confirm verification
  6. Once verified, marks `isVerified=true` in database
  7. Admin can set as default for that organization

### 2.3 Email Credentials & Multi-Tenancy
- **Current Model:** Centralized credentials (single Resend API key)
- **All emails routed through:** Central `RESEND_API_KEY`
- **Verification:** Only sender domain needs verification with Resend, not API key per org
- **Limitation:** Cannot revoke individual org's email access without affecting all orgs
- **Future Enhancement:** Per-org API keys with org-specific sender verification

---

## PART 3: AUTOMATION, TRIGGERS & QUEUING

### 3.1 Email Event Types
- **Transactional Emails** (tied to application lifecycle):
  - `user_registration` → New applicant confirmation
  - `application_submitted` → Receipt confirmation
  - `application_approved` → Approval notification
  - `application_rejected` → Rejection notification
  - `application_under_review` → Status update
  - `document_requested` → Request for additional docs
  - `documents_uploaded` → Document received confirmation
  - `staff_invited` → Staff invitation to join org
  - `program_published` → New housing program available

- **Lifecycle Sequences** (workflow-triggered):
  - Eligibility assessment → Matched program → Recommendation email
  - Application withdrawal → Confirmation email
  - Waitlist promotion → Notification email
  - SLA breach (14-day decision deadline) → Staff reminder

- **Admin Notifications** (internal/telegram):
  - `admin_action` → Staff case updates
  - `ops_alert` → System errors/failures
  - `admin_test` → Test notification from UI

### 3.2 Background Processing & Queuing

#### **Current Architecture:**
- **Job Queue:** None implemented (BLOCKER)
- **Execution Model:** Synchronous from Server Actions or Next.js Route Handlers
- **Issue:** Email sent inline → If email provider fails, request fails → No retry mechanism

#### **Notification Flow:**
```
Server Action / Route Handler
  ↓
notify(eventName, payload)
  ↓
RuntimeOrchestrator.runWithTrace(eventName, context)
  ├─ AudienceResolver → Resolve recipients
  ├─ CommunicationPlanner → Select channels
  ├─ TemplateResolver → Load templates
  └─ Dispatcher → Create dispatch requests
  ↓
Provider adapter (Resend, Telegram, Internal)
  ↓
Provider.send(context)
  ↓
NotificationLog.create() → Log result
```

#### **Queue Candidates:**
- **Inngest** (serverless functions, built for Next.js)
- **Trigger.dev** (workflow orchestration, built for Next.js)
- **Upstash QStash** (HTTP-based queue, serverless-friendly)
- **BullMQ + Redis** (self-hosted, requires Redis infrastructure)
- **Next.js Server Actions** with Prisma background jobs (no external dependency)

**Recommendation:** Inngest or Trigger.dev for multi-tenant isolation and audit trail.

### 3.3 Templating System

#### **Template Storage:**
```prisma
model NotificationTemplate {
  id              String
  name            String
  eventName       String              // e.g., "application_submitted"
  channel         String              // "email", "telegram", "internal"
  subject         String
  html            String
  plainText       String
  variables       Json?               // Template variables {{name}}, {{applicationId}}
  active          Boolean
  version         Int
  locale          String              // "en", "es", etc.
  status          NotificationTemplateStatus  // PUBLISHED, DRAFT
  senderIdentityId String?             // Can override sender per template
  organizationId  String?              // null = platform-wide, filled = org-specific
}
```

#### **Template Rendering:**
- **Engine:** Custom regex-based variable substitution (no external library)
- **Pattern:** `{{variableName}}` matches `payload.variableName`
- **Multi-locale:** Templates stored per locale with fallback to "en"
- **Organization Override:** Org can have custom template for same event/channel

#### **Template Resolution Process:**
1. Check for org-specific template: `organizationId == request.organizationId AND eventName AND channel AND active`
2. Fallback to platform template: `organizationId == null AND eventName AND channel AND active`
3. If no match, hardcoded default template (defined in code)
4. Render with `renderTemplate(template, payload)`

#### **Customization Support:**
- **Currently:** Platform admins can edit templates in `/admin/communication/templates`
- **Organization admins:** Can view and customize templates at `/platform/communication/templates` (NEW, needs verification)
- **Variables:** Documented per event type
- **Branding:** Templates can include org's `brandColors`, `logoUrl` from Organization record

---

## PART 4: THE SPECIFIC ISSUE / BUG

### 4.1 Current Behavior vs. Expected Behavior

#### **Issue #1: Tenant Context Propagation in Background Jobs**
- **Symptom:** When email is sent, context may not include `organizationId`
- **Root Cause:** 
  - Server Actions (e.g., `email-infrastructure.actions.ts`) call `notify(eventName, payload)` 
  - If `payload.organizationId` is missing, falls back to `process.env.DEFAULT_ORGANIZATION_ID`
  - Background jobs (future Inngest/Trigger.dev) will need to carry orgId in message context
- **Impact:** Multi-org isolation breaks; email for one org may leak to another
- **Status:** CRITICAL - needs queuing architecture redesign

#### **Issue #2: Sender Identity Not Consistently Resolved**
- **Symptom:** Emails sent from `support@heloci.us` instead of org's custom domain
- **Root Cause:**
  - `resolveSender(scope, senderIdentityId)` function exists but not called in all paths
  - Fallback hierarchy not enforced consistently
  - Some code paths use `COMMUNICATION_SENDER_EMAIL` env var (unverified)
- **Impact:** 
  - Emails appear to come from platform, not organization
  - Organizations can't use their own verified domains
  - DKIM/SPF failures if sender not verified with Resend
- **Status:** HIGH - needs audit of all sender resolution code paths

#### **Issue #3: Missing Retry Logic & Dead Letter Handling**
- **Symptom:** Email fails silently; no retry; no alerting
- **Root Cause:**
  - No job queue = no built-in retry
  - If Resend returns error, logged to `NotificationLog` but not retried
  - No dead letter queue for investigation
  - No alerting to staff when high-priority emails fail (e.g., application approval)
- **Impact:** Applicants don't receive critical notifications; staff unaware
- **Status:** MEDIUM - blocking for production multi-tenant platform

#### **Issue #4: Multi-Org Template Management**
- **Symptom:** Organizations can't customize their notification templates
- **Root Cause:**
  - UI for org-level template customization not fully implemented
  - Template resolution may not properly prioritize org-specific templates
  - No audit log for who changed what template
- **Impact:** All orgs get identical email copy; no branding per org
- **Status:** MEDIUM - affects user experience but not data isolation

#### **Issue #5: Circular Reference in Runtime Authorization**
- **Symptom:** `RuntimeOrchestrator` requires `organizationId` in context
- **Root Cause:**
  - User-only events like `user_registration` have no `organizationId` yet (user not assigned to org)
  - But `RuntimeOrchestrator.run()` fails if `organizationId` missing
  - Current code throws error and returns empty dispatch requests
- **Impact:** New applicants don't get registration confirmation email
- **Status:** HIGH - breaks onboarding flow

---

## PART 5: CODE SNIPPETS & ERROR LOGS

### 5.1 Runtime Orchestrator Authorization Check (CURRENT)
```typescript
// lib/notifications/runtime/runtime-orchestrator.ts
static async runWithTrace(eventName: string, context?: AudienceResolutionContext | null): Promise<RuntimeTrace> {
  const traceId = this.generateTraceId();

  try {
    // CRITICAL: organizationId MUST be provided in context
    // EXCEPTION: user.registration and similar "user-only" events may not have organizationId
    if (!context?.organizationId && !this.isUserOnlyEvent(eventName)) {
      console.error(`[RuntimeOrchestrator] AUTHORIZATION VIOLATION: organizationId missing in context for event ${eventName}`);
      return {
        eventName,
        audiences: [],
        plans: [],
        resolutions: [],
        dispatchRequests: [],
      };
    }
    // ...
  }
}
```

**Problem:** The exception for user-only events exists but the logic may not be correctly handling cases where `organizationId` is legitimately missing.

### 5.2 Sender Resolution in Provider Adapter (CURRENT)
```typescript
// lib/notifications/provider-adapters.ts - createEmailProvider()
async send(context) {
  const apiKey = process.env.RESEND_API_KEY;
  
  // CRITICAL FIX: Resolution priority for sender email
  // Priority 1: context.sender (from resolved SenderIdentity in database)
  // Priority 2: settings.senderEmail (from organization configuration)
  // Priority 3: Fallback verified Heloci domain (support@heloci.us)
  // NEVER use ENV variables for sender - COMMUNICATION_SENDER_EMAIL may contain unverified Gmail
  const senderEmail = context.sender || settings.senderEmail || "support@heloci.us";
  
  // ... send via Resend
}
```

**Status:** Code comment indicates fix was applied, but needs verification that all callers follow this priority.

### 5.3 No Queue - All Inline
```typescript
// app/api/communications/route.ts or similar
export async function POST(request: Request) {
  const { eventName, payload } = await request.json();
  
  // SYNCHRONOUS - blocks request
  const result = await notify(eventName, payload);
  
  return Response.json(result);
}
```

**Problem:** If Resend is slow or down, request hangs. No retry on transient failures.

---

## PART 6: RECOMMENDED FIXES

### Priority 1: Multi-Tenant Context in Queue (BLOCKING)
1. Implement Inngest or Trigger.dev for background jobs
2. Ensure every job message includes `organizationId` in context
3. Queue notifications instead of sending inline
4. Add retry logic with exponential backoff
5. Create dead letter queue for failed notifications

### Priority 2: Sender Identity Resolution Audit (HIGH)
1. Find all callsites of `notify()` function
2. Verify each passes explicit `senderIdentityId` or `context.sender`
3. Add integration test for each org's custom domain
4. Block production deploy if sender resolution fails tests

### Priority 3: User-Only Event Handling (HIGH)
1. Fix `RuntimeOrchestrator.isUserOnlyEvent()` to properly handle user_registration
2. Allow `organizationId` to be optional for user-only events
3. Add test: "New user registration email sent even with no org assigned"

### Priority 4: Template Customization UI (MEDIUM)
1. Verify `/platform/communication/templates` page allows org-specific overrides
2. Add audit log when org admin changes template
3. Add template preview with real payload data

### Priority 5: Error Alerting & Monitoring (MEDIUM)
1. Alert staff when high-priority email fails (application_approved, documents_requested)
2. Dashboard showing email delivery status per organization
3. Retry failed notifications manually from UI

---

## PART 7: QUESTIONS FOR YOU

To help prioritize the fix, please answer:

1. **How many organizations** are currently in production?
   - Single dev org, or multiple live customers?

2. **What's your SLA for email delivery?**
   - Must confirm within 1 minute? 5 minutes? 1 hour?

3. **Has any organization reported:**
   - Missing emails (especially application approvals)?
   - Emails from wrong sender domain?
   - Custom templates not working?

4. **What's your current monitoring setup?**
   - Do you get alerts when Resend fails?
   - Can you see NotificationLog in production?

5. **Which issue is blocking you most?**
   - Multi-org isolation?
   - Sender domain customization?
   - Missing retry logic?
   - Template customization?

6. **Do you plan to:**
   - Self-host (Docker/Kubernetes)?
   - Stay on Vercel?
   - Multi-cloud?
   - (Affects queue choice)

---

## APPENDIX: File Inventory

### Communication / Notification Core
- `lib/notifications/notification.service.ts` — Main notify() function
- `lib/notifications/provider-adapters.ts` — Resend/Telegram/WhatsApp adapters
- `lib/notifications/runtime/runtime-orchestrator.ts` — Audience → channels → templates → dispatch
- `lib/notifications/runtime/communication-planner.ts` — Select channel per audience
- `lib/notifications/runtime/template-resolver.ts` — Load template by event/channel
- `lib/notifications/template.service.ts` — Template rendering engine

### Communication Request (C.1 Contract Layer)
- `lib/communications/contracts/CommunicationRequest.ts` — Request builders (deprecated, in migration)
- `lib/communications/contracts/CommunicationTypes.ts` — Type definitions
- `lib/communications/contracts/Recipient.ts` — Recipient model
- `lib/communications/runtime/AudienceResolver.ts` — Resolve recipients from context

### Sender Identity Management
- `lib/communications/sender-identity.service.ts` — Resolve SenderIdentity from database
- `actions/sender-identity.actions.ts` — Server actions for CRUD

### Database
- `prisma/schema.prisma` — Prisma ORM schema (SenderIdentity, NotificationLog, NotificationTemplate, etc.)

### UI / Pages
- `app/admin/communication/settings/sender-identities/page.tsx` — Platform-level sender identity management
- `app/platform/communication/settings/page.tsx` — Org-level communication settings
- `app/platform/communication/templates/page.tsx` — Org-level template customization
- `app/admin/communication/settings/email-infrastructure/page.tsx` — Email provider health dashboard

### Actions (Server-side)
- `actions/communication-dashboard.actions.ts` — Fetch communication stats
- `actions/email-infrastructure.actions.ts` — Email provider health check
- `actions/email-compose.actions.ts` — Send manual email

---

## MIGRATION PATH (Recommended)

**Phase 1 (This Week):** Fix tenant context propagation
- Audit all notify() callsites
- Ensure organizationId is always in payload
- Add org-scoped unit tests

**Phase 2 (Next Week):** Implement queuing (Inngest)
- Set up Inngest client
- Move notify() to background function
- Add retry and dead letter logic
- Test multi-org isolation

**Phase 3 (Following Week):** Sender identity fixes
- Audit sender resolution code paths
- Add integration test per org domain
- Implement DKIM/SPF verification polling
- Block sends from unverified senders

**Phase 4 (Following Month):** Template customization
- Implement org template overrides in UI
- Add template audit log
- Create template versioning

---

## Next Steps

1. **You answer the 6 questions in PART 7**
2. **I review your answers and prioritize**
3. **We pick Phase 1 OR 2 (whichever is most urgent)**
4. **I implement the fix with tests**
5. **You verify in your environment**
6. **We ship and move to next phase**

Please paste your answers below and we'll get started.
