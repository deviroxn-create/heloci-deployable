# PHASE B: RULES - DO NOT BREAK IN PHASE C/D/E

**Critical Constraints for Future Phases**

Phases C, D, and E build on Phase B. These rules must be maintained to preserve the guarantees established in Phase B.

---

## Rule 1: NotificationDomainSubscriber is the Single Subscriber ✅

### DO NOT
```typescript
❌ Create alternative subscribers (RuntimeSubscriber, LegacySubscriber, etc.)
❌ Have multiple handlers for the same event
❌ Subscribe to events in individual services
❌ Bypass NotificationDomainSubscriber to call NotificationService directly
```

### DO
```typescript
✅ All events flow through NotificationDomainSubscriber
✅ NotificationDomainSubscriber maps to registry
✅ Only NotificationDomainSubscriber calls notificationService.notify()
✅ Alternative components (Resolver, Planner) are post-notification, not subscribers
```

### Why
If you create alternative subscribers:
- Events get delivered multiple times (duplicates)
- Some audiences miss events (gaps)
- Audit trail breaks (multiple paths)
- Debugging becomes impossible

**Enforce:** Code review must verify no new subscribers added.

---

## Rule 2: Registry is Authoritative ✅

### DO NOT
```typescript
❌ Hardcode event lists in subscribers
❌ Create side-car mappings outside registry
❌ Let subscribers have their own event subscriptions
❌ Check NotificationService directly for what events exist
```

### DO
```typescript
✅ All mappings in COMMUNICATION_REGISTRY
✅ Subscriber reads from registry via getAllDomainEvents()
✅ Downstream components query registry for configuration
✅ Registry is source of truth
```

### Why
If registry is not authoritative:
- Inconsistent behavior across components
- Impossible to audit completeness
- New events might be missed
- Configuration drift over time

**Enforce:** All event configuration must be in COMMUNICATION_REGISTRY.

---

## Rule 3: All Events Must Have Registry Entries ✅

### DO NOT
```typescript
❌ Publish domain events that don't have registry entries
❌ Create "temporary" events without mapping
❌ Skip registry for "simple" notifications
```

### DO
```typescript
✅ Add registry entry BEFORE publishing event
✅ Set implemented: false initially
✅ Set implemented: true when tested
✅ Run event audit script to verify coverage
```

### Why
If events lack registry entries:
- Silent drops occur (defeats Phase B goal)
- Audit warns about unmapped events
- Notificationservice.notify() receives wrong event name
- Downstream components fail silently

**Enforce:** Audit script must pass with 0 unregistered domain events.

---

## Rule 4: Mapping is 1:1 (Domain → Communication) ✅

### DO NOT
```typescript
❌ Map multiple domain events to same communication event (aliasing)
❌ Split single domain event into multiple communication events
❌ Create wrapper events
```

### DO
```typescript
✅ Each domain event maps to exactly one communication event
✅ Use same communication event name consistently
✅ If needs differ, handle in downstream stages (Resolver, Planner)
✅ Multiple triggers → same event name is OK
  (e.g., admin.action from workflows, team service, deadline service)
```

### Why
If mapping is not 1:1:
- Registry becomes ambiguous
- Audit becomes impossible
- Downstream stages get confused
- Recovery is nearly impossible

**Enforce:** Validation check: `domain events.size == communication events.size`

---

## Rule 5: No Silent Drops ✅

### DO NOT
```typescript
❌ Let unregistered events pass silently
❌ Catch errors in subscriber without logging
❌ Remove warning logs
❌ Suppress console output
```

### DO
```typescript
✅ Unregistered events generate console.warn()
✅ Warning includes event name and remediation
✅ All errors logged (never swallowed)
✅ Logs visible in both dev and production
```

### Why
If silent drops resume:
- Notifications disappear without trace
- Impossible to debug missing events
- Users get no communication
- Audit trail is broken

**Enforce:** Audit script must report 0 silent drops.

---

## Rule 6: No Duplicate Subscribers ✅

### DO NOT
```typescript
❌ Call subscriber.register() more than once
❌ Create multiple subscriber instances
❌ Subscribe same event twice
❌ Remove registered flag check
```

### DO
```typescript
✅ NotificationDomainSubscriber.register() idempotent
✅ registered flag prevents double-subscription
✅ Single global subscriber instance
✅ One subscription per event
```

### Why
If duplicate subscriptions occur:
- Events delivered multiple times
- Duplicative notifications sent
- Resources wasted
- User confusion

**Enforce:** Test: `register() twice → same result`

---

## Rule 7: Preserve Backward Compatibility ✅

### DO NOT
```typescript
❌ Change publishDomainEvent() signature
❌ Change event payload format
❌ Remove events from registry
❌ Modify channel assignments for existing events
❌ Break provider adapter contracts
```

### DO
```typescript
✅ All additions are additive only
✅ Existing events unchanged
✅ Existing payloads unchanged
✅ Existing channels unchanged
✅ Provider adapters work as before
```

### Why
If backward compatibility breaks:
- Existing services fail
- Deployments roll back
- Entire communication stops
- Phase investment wasted

**Enforce:** Each Phase C/D/E change must be tested with Phase B code unchanged.

---

## Rule 8: All Events Must Reach NotificationService ✅

### DO NOT
```typescript
❌ Create events that never reach NotificationService
❌ Add "internal only" events that skip NotificationService
❌ Let any event bypass NotificationDomainSubscriber
```

### DO
```typescript
✅ All subscribed events must reach NotificationService
✅ NotificationService.notify() called exactly once per event
✅ Pipeline flow: Event → Subscriber → Registry → Service
```

### Why
If events bypass NotificationService:
- They're not counted in audit
- They're not formatted consistently
- They bypass all downstream processing
- They can't be observed/monitored

**Enforce:** Audit: `all events must reach NotificationService`

---

## Rule 9: Registry Validation Never Fails ✅

### DO NOT
```typescript
❌ Remove validateRegistry() function
❌ Disable registry validation in startup
❌ Ignore validation errors
❌ Add invalid entries to registry
```

### DO
```typescript
✅ validateRegistry() runs at startup
✅ All validation checks pass
✅ Validation errors fatal (fail-fast)
✅ CI/CD runs validation on every commit
```

### Why
If validation is disabled:
- Invalid entries creep in
- Inconsistencies accumulate
- System gradually degrades
- Becomes impossible to fix

**Enforce:** Startup fails if registry invalid.

---

## Rule 10: Event Names Follow Convention ✅

### DO NOT
```typescript
❌ Use inconsistent naming (camelCase, PascalCase, etc.)
❌ Change domain event naming structure
❌ Create communication events without underscores
❌ Abbreviate event names
```

### DO
```typescript
✅ Domain events: lowercase.with.dots
  Examples: user.registration, application.approved
✅ Communication events: lowercase_with_underscores
  Examples: user_registration, application_approved
✅ Transformation: dots → underscores (automatic)
```

### Why
If naming inconsistent:
- Impossible to parse automatically
- Error-prone manual mapping
- Sorting/filtering breaks
- Readability suffers

**Enforce:** Lint check: event names must match patterns.

---

## Rule 11: No New Direct NotificationService Calls ✅

### DO NOT
```typescript
❌ Import and call notificationService directly
❌ new NotificationService() in new places
❌ Bypass subscriber path to notify
❌ Create new notification channels that don't go through subscriber
```

### DO
```typescript
✅ Publish domain event via publishDomainEvent()
✅ Subscriber handles notification
✅ All notifications flow through NotificationDomainSubscriber
```

### Why
If new NotificationService calls appear:
- Silent duplicates possible
- Audit breaks
- Multiple subscribers re-appear
- Phase B guarantees lost

**Enforce:** Code review catches direct NotificationService imports.

---

## Rule 12: Registry Must Support Querying ✅

### DO NOT
```typescript
❌ Change registry data structure
❌ Make registry immutable/unchangeable
❌ Remove helper functions (getAllDomainEvents, etc.)
❌ Make registry lookup expensive (O(n) or worse)
```

### DO
```typescript
✅ Registry remains queryable object
✅ Helper functions available for all queries
✅ Lookups remain O(1)
✅ New helpers can be added as needed
```

### Why
If registry becomes hard to query:
- Downstream components forced to duplicate logic
- Performance degrades
- Coverage checks fail
- Maintenance becomes nightmare

**Enforce:** All queries go through helper functions.

---

## Rule 13: Implementation Flags Must Accurately Reflect Status ✅

### DO NOT
```typescript
❌ Mark events as implemented: true before they work
❌ Leave implemented: true for broken events
❌ Use implemented flag for anything else
```

### DO
```typescript
✅ implemented: true = Event is fully tested and working
✅ implemented: false = Event is reserved/planned
✅ Only change implemented flag when status actually changes
✅ Update notes when changing implementation status
```

### Why
If implementation flags lie:
- Audit reports become useless
- Coverage appears better than it is
- Debugging is misleading
- Trust in system erodes

**Enforce:** Code review verifies implemented flag accuracy.

---

## Rule 14: All Audiences Must Have Channels Defined ✅

### DO NOT
```typescript
❌ Leave any audience without channel definition
❌ Have undefined/null channels in channelsByAudience
❌ Assume channels for undefined audiences
```

### DO
```typescript
✅ All 8 audiences always defined in channelsByAudience
✅ Empty array [] for unused audiences (valid)
✅ Never undefined/null
✅ Supported channels: email, telegram, internal, whatsapp
```

### Why
If channels are undefined:
- Code crashes trying to use them
- Validation fails
- Runtime errors occur
- Notifications fail

**Enforce:** Registry validation requires all audiences defined.

---

## Rule 15: Test Coverage Never Decreases ✅

### DO NOT
```typescript
❌ Remove tests from phase-b-subscriber-coverage.test.ts
❌ Skip tests that are "always passing"
❌ Disable audit verification
❌ Comment out validation checks
```

### DO
```typescript
✅ Keep all Phase B tests running
✅ Add new tests for Phase C/D/E features
✅ Run full test suite before every commit
✅ Audit script must report 100% coverage
```

### Why
If tests are removed:
- Regressions go undetected
- Silent drops might return
- Duplicates might reappear
- System degrades gradually

**Enforce:** CI/CD fails if test count decreases.

---

## Summary: The Core Guarantee

**Phase B Guarantee:**

> Every published domain event has exactly ONE subscriber that routes it to NotificationService, with complete audit trail and zero silent drops.

**To maintain this guarantee in Phase C/D/E:**

1. ✅ Keep NotificationDomainSubscriber as sole subscriber
2. ✅ Keep registry as single source of truth
3. ✅ Ensure all events have registry entries
4. ✅ Maintain 1:1 domain → communication mapping
5. ✅ Never allow silent drops
6. ✅ Prevent duplicate subscriptions
7. ✅ Preserve backward compatibility
8. ✅ Route ALL events through subscriber
9. ✅ Keep registry validation enabled
10. ✅ Follow naming conventions
11. ✅ Never call NotificationService directly
12. ✅ Keep registry queryable
13. ✅ Keep implementation flags accurate
14. ✅ Define all audiences and channels
15. ✅ Maintain test coverage

**If any rule breaks, Phase B is compromised and the system returns to fragmented state.**

---

## Checklist for Phase C PR Review

When reviewing Phase C pull requests:

- [ ] No new subscribers added
- [ ] All events in registry
- [ ] Registry is sole source of truth
- [ ] 1:1 mapping maintained
- [ ] No silent drops
- [ ] No duplicate subscriptions
- [ ] Backward compatibility verified
- [ ] All events reach NotificationService
- [ ] Registry validation passes
- [ ] Naming conventions followed
- [ ] No direct NotificationService calls
- [ ] Registry still queryable
- [ ] Implementation flags accurate
- [ ] All audiences and channels defined
- [ ] Test coverage not decreased
- [ ] Phase B tests still passing

---

**Violation of any of these rules is a Phase B regression and must be fixed before merge.**

**Phase B rules are not suggestions—they are architectural constraints.**
