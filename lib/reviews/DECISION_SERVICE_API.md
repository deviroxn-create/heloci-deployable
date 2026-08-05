# Decision Service API Documentation

**Module:** `lib/reviews/decision.service.ts`  
**Purpose:** Single source of truth for all reviewer decisions  
**Status:** Production Ready  
**Phase:** 2 Complete

---

## Public Methods

### Approve Decision

```typescript
async function approveApplication(
  input: ApproveDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required - who is approving
  internalNotes?: string;       // Optional - staff only
  effectiveDate?: Date;         // Optional - defaults to now
  applicantMessage?: string;    // Optional - sent to applicant
  templateId?: string;          // Optional - template to use
}
```

**Output:**
```typescript
{
  success: boolean;
  decisionId?: string;          // If successful
  error?: string;               // If failed
  message?: string;             // Status message
}
```

**Side Effects:**
- ✅ CaseDecision created
- ✅ ProgramApplication.status = "approved"
- ✅ Removed from waitlist
- ✅ Timeline event created
- ✅ Audit log created
- ✅ Notification published
- ✅ Message posted to Communication Center

**RBAC:** org_admin, reviewer, case_worker

**Errors:**
- "Application not found"
- "Authentication required" (via requireOrgRole)
- "Cannot make 'approved' decision on application with status X" (invalid transition)

---

### Conditional Approval

```typescript
async function conditionallyApproveApplication(
  input: ConditionalApprovalInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  conditions: string[];         // Required - minimum 1 condition
  expirationDate?: Date;        // Optional
  applicantMessage: string;     // Required - explain conditions
  internalNotes?: string;       // Optional
  templateId?: string;          // Optional
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created with conditions JSON
- ✅ ProgramApplication.status = "conditional_approval"
- ✅ Conditions stored for tracking
- ✅ Message includes all conditions
- ✅ All integration points activated

**RBAC:** org_admin, reviewer

**Errors:**
- "Conditions are required for conditional approval"
- (Plus standard errors)

---

### Reject Application

```typescript
async function rejectApplication(
  input: RejectDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  reason: string;               // Required - why rejected
  applicantMessage?: string;    // Optional
  internalNotes?: string;       // Optional
  templateId?: string;          // Optional
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created with reason
- ✅ ProgramApplication.status = "rejected"
- ✅ Removed from waitlist
- ✅ All integration points activated

**RBAC:** org_admin, reviewer, case_worker

**Errors:**
- "Rejection reason is required"
- (Plus standard errors)

---

### Waitlist Application

```typescript
async function waitlistApplication(
  input: WaitlistDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  reason?: string;              // Optional
  expectedReviewDate?: Date;    // Optional
  applicantMessage?: string;    // Optional
  templateId?: string;          // Optional
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created
- ✅ ProgramApplication.status = "waitlisted"
- ✅ WaitlistEntry created (with automatic position)
- ✅ Message shows position in waitlist
- ✅ All integration points activated

**RBAC:** org_admin, reviewer

**Errors:**
- (Standard errors only)

---

### Escalate Application

```typescript
async function escalateApplication(
  input: EscalateDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  reason: string;               // Required - why escalate
  escalateToUserId?: string;    // Optional - defaults to supervisor
  applicantMessage?: string;    // Optional (not sent to applicant)
  internalNotes?: string;       // Optional
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created
- ✅ ProgramApplication reassigned to escalation target
- ✅ Timeline event created (internal)
- ✅ Message posted internally only (NOT to applicant)
- ✅ All audit integration points activated

**Note:** Escalate does NOT change application status. It reassigns the case.

**RBAC:** org_admin, reviewer, case_worker

**Errors:**
- "Escalation reason is required"
- (Plus standard errors)

---

### Request Additional Information

```typescript
async function requestAdditionalInfo(
  input: RequestAdditionalInfoInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;              // Required
  staffUserId: string;                // Required
  informationNeeded: string[];        // Required - min 1 item
  deadline?: Date;                    // Optional - defaults to 7 days
  instructions?: string;              // Optional - sent to applicant
  applicantMessage?: string;          // Optional
  templateId?: string;                // Optional
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created with info list
- ✅ ProgramApplication.status = "needs_info"
- ✅ DocumentRequest created for each item
- ✅ Deadline set on all requests
- ✅ Message includes instructions and deadline
- ✅ All integration points activated

**RBAC:** org_admin, reviewer, case_worker

**Errors:**
- "Information needed is required"
- (Plus standard errors)

---

### Withdraw Application

```typescript
async function withdrawApplication(
  input: WithdrawDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  reason: string;               // Required
  applicantMessage?: string;    // Optional
  internalNotes?: string;       // Optional
  withdrawnByApplicant?: boolean; // Optional - track source
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created
- ✅ ProgramApplication.status = "withdrawn"
- ✅ Removed from waitlist
- ✅ Message posted to Communication Center
- ✅ All integration points activated
- ✅ Audit tracks if applicant-initiated

**RBAC:** org_admin, reviewer, case_worker (staff), or applicant (self)

**Errors:**
- "Withdrawal reason is required"
- (Plus standard errors)

---

### Close Case

```typescript
async function closeCase(
  input: CloseDecisionInput
): Promise<DecisionResult>
```

**Input:**
```typescript
{
  applicationId: string;        // Required
  staffUserId: string;          // Required
  reason: string;               // Required
  internalNotes?: string;       // Optional - stored with decision
  finalNotes?: string;          // Optional - same as internalNotes
}
```

**Output:** Same as ApproveApplication

**Side Effects:**
- ✅ CaseDecision created
- ✅ ProgramApplication.status = "closed"
- ✅ Internal message posted (NOT visible to applicant)
- ✅ Timeline event created (internal flag set)
- ✅ All audit integration points activated

**Note:** Close case is ADMIN ONLY. Does NOT notify applicant.

**RBAC:** org_admin only

**Errors:**
- (Plus standard errors with org_admin requirement)

---

## Helper Methods

### Get Decision History

```typescript
async function getDecisionHistory(
  applicationId: string
): Promise<DecisionHistoryRecord[]>
```

**Returns:** Array of all decisions (chronologically newest first)

```typescript
{
  id: string;
  decision: DecisionType;
  reason: string;
  decidedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  decidedAt: Date;
  applicantMessage?: string;
  isActive: boolean;
  supersededBy?: string;
}
```

---

### Get Latest Decision

```typescript
async function getLatestDecision(
  applicationId: string
): Promise<CaseDecisionRecord | null>
```

**Returns:** Most recent active decision, or null if none

```typescript
{
  id: string;
  applicationId: string;
  decision: DecisionType;
  reason: string;
  internalNotes?: string;
  applicantMessage?: string;
  effectiveDate?: Date;
  expiresAt?: Date;
  decidedBy: string;
  decidedAt: Date;
  templateUsed?: string;
  conditions?: Record<string, unknown>;
  supersededBy?: string;
  isActive: boolean;
}
```

---

### Supersede Previous Decision

```typescript
async function supercedePreviousDecision(
  previousDecisionId: string,
  newDecisionId: string,
  reason: string
): Promise<void>
```

**Effect:**
- Marks previous decision as inactive
- Links previous to new decision
- Maintains decision history

**Use Case:** When a decision needs to be corrected or replaced

---

### Get Application Readiness

```typescript
async function getApplicationReadiness(
  applicationId: string
): Promise<ApplicationReadinessCheck>
```

**Returns:** Readiness assessment

```typescript
{
  isReady: boolean;           // True if all checks pass
  warnings: string[];         // List of issues found
  recommendations: string[];  // What to fix
  checklistCompletion?: number; // 0-100 percentage
  documentsVerified?: number;   // Count of verified docs
  documentsTotal?: number;      // Total docs
}
```

---

## Type Definitions

### DecisionType

```typescript
type DecisionType = 
  | "approved"
  | "conditional_approval"
  | "rejected"
  | "waitlisted"
  | "escalated"
  | "needs_info"
  | "withdrawn"
  | "closed"
```

### DecisionResult

```typescript
interface DecisionResult {
  success: boolean;
  decisionId?: string;
  error?: string;
  message?: string;
}
```

### Input Types

See type definitions in `decision.types.ts` for complete interfaces:
- `ApproveDecisionInput`
- `ConditionalApprovalInput`
- `RejectDecisionInput`
- `WaitlistDecisionInput`
- `EscalateDecisionInput`
- `RequestAdditionalInfoInput`
- `WithdrawDecisionInput`
- `CloseDecisionInput`

---

## Error Handling

All methods return a `DecisionResult` object:

```typescript
{
  success: false,
  error: "Human-readable error message"
}
```

**Common Errors:**
- "Application not found"
- "Rejection reason is required"
- "Conditions are required for conditional approval"
- "Cannot make 'X' decision on application with status Y"
- RBAC errors from `requireOrgRole()`

---

## Transaction Safety

All operations use Prisma transactions:
- Atomicity guaranteed
- All-or-nothing execution
- Automatic rollback on error
- No partial state updates

---

## Integrations

Every decision operation automatically:

1. ✅ **RBAC Check** - Verifies user permission
2. ✅ **Org Isolation** - Prevents cross-org access
3. ✅ **Audit Log** - Creates AuditLog record
4. ✅ **Timeline Event** - Creates ApplicationEvent
5. ✅ **Notification** - Publishes to notification service
6. ✅ **Communication Center** - Posts decision message
7. ✅ **Database Update** - Updates ProgramApplication status
8. ✅ **Waitlist Mgmt** - Adds/removes from waitlist as needed
9. ✅ **Document Requests** - Creates requests if needed (needs_info)

---

## Usage Examples

### Approve an Application

```typescript
import { approveApplication } from "@/lib/reviews/decision.service";

const result = await approveApplication({
  applicationId: "app_123",
  staffUserId: "staff_456",
  applicantMessage: "Congratulations! Your application has been approved.",
});

if (result.success) {
  console.log(`Decision ID: ${result.decisionId}`);
} else {
  console.error(result.error);
}
```

### Request Additional Information

```typescript
const result = await requestAdditionalInfo({
  applicationId: "app_123",
  staffUserId: "staff_456",
  informationNeeded: [
    "Proof of employment letter",
    "Recent pay stubs (last 3 months)",
    "Proof of residency"
  ],
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  instructions: "Please upload supporting documents through your application portal.",
});
```

### Check Decision History

```typescript
const history = await getDecisionHistory("app_123");

for (const decision of history) {
  console.log(`${decision.decidedAt}: ${decision.decision} by ${decision.decidedBy.name}`);
}
```

---

## Next Steps

- **Phase 3:** Template Service (for decision message templates)
- **Phase 4:** API Routes (REST endpoints wrapping this service)
- **Phase 5:** UI Components (React components using these methods via APIs)

This service is the single source of truth. All API routes and UI components will call these methods.

