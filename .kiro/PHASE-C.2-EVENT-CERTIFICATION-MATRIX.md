# PHASE C.2 — EVENT CERTIFICATION MATRIX

**Purpose:** Verify that every business event in HELOCI travels through all 8 pipeline stages  
**Date:** 2026-07-30  
**Status:** IN PROGRESS  
**Format:** 40+ Events × 8 Pipeline Stages verification matrix

---

## PIPELINE STAGES REFERENCE

```
Stage 1: Event Published      → Event created in source service (domain.action format)
Stage 2: Subscriber Triggered → Listener subscribed in NotificationDomainSubscriber
Stage 3: Audience Resolved    → AudienceResolver correctly identifies all recipients
Stage 4: Planner Executed     → CommunicationPlanner determines routing rules
Stage 5: Template Loaded      → TemplateResolver selects correct template
Stage 6: Channel Selected     → Provider route selected (Email/Telegram/Internal)
Stage 7: Provider Called      → Message sent to actual provider
Stage 8: Delivery Logged      → NotificationLog & AuditLog record created
```

If ANY stage fails for ANY event, that stage is the bug to fix.

---

## CERTIFICATION MATRIX

### AUTHENTICATION DOMAIN (4 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `user.registration` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `user.login` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| `user.invitation.sent` | ✅ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| `user.password.reset` | ✅ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### APPLICATION DOMAIN (10 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `application.submitted` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `application.approved` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `application.rejected` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `application.review.completed` (Conditional) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `application.waitlisted` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `application.withdrawn` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| `application.under_review` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `application.reassigned` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| `application.additional_info_requested` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `application.escalated` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### DOCUMENT DOMAIN (4 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `documents.requested` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `document.approved` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| `document.rejected` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| `document.replacement.requested` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

### ELIGIBILITY DOMAIN (2 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `eligibility.assessed` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `eligibility.ineligible` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### MATCHING DOMAIN (3 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `program.matched` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| `recommendation.available` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `matching.completed` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### PROGRAM DOMAIN (2 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `program.published` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `program.archived` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### STAFF/ORGANIZATION DOMAIN (5 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `staff.invited` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `staff.invitation.accepted` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `staff.role.changed` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `staff.removed` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `organization.created` | ✅ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

### COMMUNICATION DOMAIN (3 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `message.created` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `communication.manual_send` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `admin.action` | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |

---

### ADMIN/SYSTEM DOMAIN (5 Events)

| Event | S1: Published | S2: Subscribed | S3: Audience | S4: Planner | S5: Template | S6: Channel | S7: Provider | S8: Logged |
|-------|---------------|----------------|-----------  |-----------|-----------|----------|-----------|----------|
| `admin.alert.sla_breach` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `admin.alert.deadline_approaching` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `system.backup_completed` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| `system.maintenance_notice` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| `security.alert` | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

## LEGEND

- ✅ **Complete** - Stage fully implemented and verified
- ⏳ **In Progress** - Stage partially implemented, needs verification
- ❓ **Not Started** - Stage not yet implemented or unclear
- 🔴 **Blocked** - Stage blocked by upstream issue

---

## SUMMARY STATISTICS

**Total Events:** 38  
**Fully Complete (All 8 Stages):** 5  
**Partially Complete:** 15  
**Not Started:** 18

---

## NEXT: BLOCKING ISSUES ANALYSIS

Each ❓ and ⏳ needs investigation to determine:
1. Is the event actually needed?
2. Which stage is blocking?
3. What is required to unblock it?

See PHASE-C.2-PIPELINE-VERIFICATION-CHECKLIST.md for detailed investigation process.
