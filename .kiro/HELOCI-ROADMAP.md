# Heloci Development Roadmap

---

## Current Phase: PHASE 5F — Runtime Verification

**Status:** Ready to begin  
**Duration:** 1-2 weeks  
**Next:** Phase 6 — Production Lock

### What's Happening
Verifying the notification system works correctly.

### Deliverables
- 6 verification tests
- Verification report
- Defect list (if any)

### Entry Point
`.kiro/PHASE-5F-SPECIFICATION.md`

---

## After Phase 5F

### PHASE 6 — Communication System Production Lock

**Goal:** Freeze the communication subsystem  
**Duration:** 3-5 days

Deliverables:
- Communication Architecture documentation
- Communication API reference
- Communication maintenance guide
- Production checklist

Exit: Communication system is frozen for feature development

---

## After Phase 6

### Core Product Roadmap

Once the communication system is locked and verified, focus returns to Heloci's actual product features:

1. **Eligibility Engine**
   - Rule engine for housing program eligibility
   - Policy configuration
   - Assessment workflow

2. **Application Workflow**
   - Multi-step application process
   - Document collection
   - Status tracking
   - Staff review workflow

3. **Listing Management**
   - Property and unit listings
   - Availability tracking
   - Application matching

4. **Case Management**
   - Case assignment to staff
   - Notes and timeline
   - Decision documentation
   - Appeal handling

5. **Document Management**
   - Document upload and validation
   - Version control
   - Archive and retrieval

6. **Admin Dashboard**
   - Organization management
   - Staff management
   - Analytics and reporting
   - System health monitoring

7. **AI Assistant**
   - Application recommendations
   - Eligibility predictions
   - Workflow optimization

8. **Security Hardening**
   - Access control audit
   - Data encryption
   - Rate limiting
   - Audit logging

9. **Production Deployment**
   - Infrastructure setup
   - Database migration
   - Performance optimization
   - Launch checklist

---

## Why This Order

**Phase 5F (Runtime Verification):**
- Current focus on communication reliability
- Must be done before scaling
- Unlocks confidence in Phase 6

**Phase 6 (Production Lock):**
- Freezes communication system
- Prevents scope creep
- Creates stable foundation

**Core Product Features:**
- Where users interact with Heloci
- Where most product value lives
- Can now build with stable communication backbone

---

## Key Principle

Each phase ends with a clear handoff to the next phase.

No ambiguity about what comes next.

No drifting into unnecessary work.

---

## Current Status

✅ Notification architecture complete  
✅ Runtime orchestrator working  
✅ Multi-tenant isolation implemented  
✅ Sender identity system built  
✅ Template system functional  
⏳ **Runtime verification in progress (Phase 5F)**  

---

## Next Action

Open `.kiro/PHASE-5F-SPECIFICATION.md`

Begin Phase 5F Runtime Verification.
