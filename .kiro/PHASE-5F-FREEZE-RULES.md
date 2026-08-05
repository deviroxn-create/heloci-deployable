# PHASE 5F — Communication Subsystem Freeze Rules

**Effective**: July 30, 2026

---

## Status: FROZEN

The communication subsystem is verified and now in maintenance mode.

---

## What is Frozen

✅ Email sending system  
✅ Notification logging  
✅ Template system  
✅ Sender identity management  
✅ Audience resolution  
✅ Event-to-notification pipeline  

---

## What Changes Are Allowed

### ✅ Bug Fixes (No Change to Scope)

If a real bug is discovered during normal development:
- Fix it
- Add a test if needed
- No change to Phase 5F scope

Example: "Emails sent to wrong person" — fix immediately

### ❌ Feature Expansion (Not Allowed)

- New event types → Not allowed (unless part of core product)
- New notification templates → Not allowed (unless part of core product)
- New delivery channels → Not allowed (unless part of core product)
- Additional verification testing → Not allowed (expansion trap)
- New template keys → Not allowed without explicit product requirement
- New audience roles → Not allowed without explicit product requirement

### ❌ Redesign Work (Not Allowed)

- "What if we changed how templates work?" → Not allowed
- "What if we added rate limiting here?" → Infrastructure phase, not Phase 5F
- "What if we added retry logic?" → Infrastructure phase, not Phase 5F
- "What if we added monitoring?" → Infrastructure phase, not Phase 5F

---

## Important: Production Readiness is Separate

This freeze covers the **communication runtime subsystem** (sender, template, audience, delivery, logging).

**Production readiness** is handled in later infrastructure/security phases:
- Secrets management
- Rate limiting
- Monitoring and alerting
- Retry strategy
- Failure alerting
- Domain verification
- Deployment configuration
- Security audit

Do not conflate the two. Communication subsystem is frozen at runtime level.

---

## Maintenance Mode Rules

### What to Do If Issues Arise

1. **Real bug?** → Fix it. Add test if needed.
2. **Product needs new event?** → Handle in normal product development, not as Phase 5F work.
3. **Questions about how it works?** → Refer to `.kiro/PHASE-5F-VERIFICATION-COMPLETE.md`

### What NOT to Do

1. ❌ Don't reopen Phase 5F for improvements
2. ❌ Don't add "just one more verification"
3. ❌ Don't redesign subsystems
4. ❌ Don't treat bugs as new features
5. ❌ Don't expand scope under the guise of "robustness"

---

## Known Notes (Not Blocking)

### Template Key Alignment

Database templates currently use event-level fallback (e.g., `user_registration`).  
Runtime expects named templates (e.g., `applicant.user-registration.email`).  
This works correctly. Alignment is a content/template workflow task for later phases.

**Owner**: Product/Content team  
**Phase**: Later  
**Action**: Do not reopen Phase 5F

---

## Communication with Team

When someone asks "Can we add X to notifications?":

**Answer**: "The communication subsystem is frozen. If it's a bug in current functionality, we fix it. If it's a new product feature, we handle it in normal development. If it's infrastructure (monitoring, rate limits, retry logic), that's a separate infrastructure phase."

---

## Duration of Freeze

Until explicit decision to thaw. This will likely be:
- Never (unless major business pivot)
- Or only when building entirely new notification channel (SMS, Telegram, etc.) as planned product feature

---

## Subsystem Owner (Maintenance Phase)

Until explicitly reassigned:
- Bug fixes: Current development team
- Infrastructure work: Infrastructure team (future phase)
- Product feature expansion: Product team (if needed)

**Key point**: No one is exclusively working on Phase 5F improvements. Work happens only when real needs surface.

---

## Next Focus

Product development resumes on core Heloci features:

1. **Eligibility Engine** — Core business logic for housing qualification
2. **Application Workflow** — User-facing application process
3. **Decision Engine** — Approval/rejection decisions
4. **Listing Matching** — Connect applicants to available listings
5. **Case Management** — Staff operations and case workflow
6. **Applicant Journey** — User experience and tracking

Communication is now a platform capability that **these features depend on**, not a feature being built.

---

## Sign-Off

**Verified**: ✅ Runtime pipeline works  
**Frozen**: ✅ No expansion work  
**Maintenance**: ✅ Bug fixes only  
**Status**: Ready for product development to proceed

Do not reopen Phase 5F.
