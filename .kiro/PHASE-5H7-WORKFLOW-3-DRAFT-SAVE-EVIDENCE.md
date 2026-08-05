# WORKFLOW 3: APPLICATION DRAFT SAVE

## Expected Flow
User fills form → Saves draft → Data persisted → No event published (draft is interim state)

## Observed Flow
[PENDING]

### API Route
```
POST /api/applications/[id]/draft
or
PATCH /api/applications/[id]
```

### Service
```
[Service logs]
```

### Database
```
Application updated
Data persisted: YES / NO
Status: draft
```

### Domain Event
```
Event published: YES / NO
Expected: NO (draft save should not publish event)
```

### Notification Subscriber
```
Event received: YES / NO
Expected: NO
```

### Audience Resolver
```
Expected: N/A (no event)
```

### Template Selected
```
Expected: N/A
```

### Channels Selected
```
Expected: N/A
```

### Provider Used
```
Expected: N/A
```

### Notification Log Entry
```
Expected: NO (no event, no notification)
```

### Final Delivery
```
Expected: NO delivery
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
```
[Divergence evidence]
```
