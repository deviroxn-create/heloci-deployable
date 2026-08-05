# WORKFLOW 6: APPLICATION REJECTED

## Expected Flow
Application rejected → application.rejected event published → Applicant receives rejection email → Admin receives rejection telegram

## Observed Flow
[PENDING]

### API Route
```
PATCH /api/applications/{id}/status
Body: { status: 'rejected' }
```

### Service
```
[Service logs]
```

### Database
```
Application status: rejected
```

### Domain Event
```
Event published: YES / NO
Event name: application.rejected
```

### Notification Subscriber
```
Event received: YES / NO
Event mapped to: application_rejected
```

### Audience Resolver
```
Audiences:
  applicant - Email: 
  org_admin - Email: 
  [Different emails?]
```

### Template Selected
```
Applicant: 
Org_admin: 
```

### Channels Selected
```
Applicant: 
Org_admin: 
```

### Provider Used
```
Email to: 
Telegram to: 
```

### Notification Log Entry
```
Created: YES / NO
```

### Final Delivery
```
Applicant: YES / NO
Admin: YES / NO
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
```
[Divergence evidence]
```
