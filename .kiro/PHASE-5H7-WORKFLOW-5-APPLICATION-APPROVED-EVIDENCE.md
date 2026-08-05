# WORKFLOW 5: APPLICATION APPROVED

## Expected Flow
Application approved → application.approved event published → Applicant receives approval email → Admin receives approval telegram

## Observed Flow
[PENDING]

### API Route
```
PATCH /api/applications/{id}/status
Body: { status: 'approved' }
```

### Service
```
[Service execution logs]
```

### Database
```
Application record
  Status: approved
  Updated: YES / NO
```

### Domain Event
```
Event published: YES / NO
Event name: application.approved
```

### Notification Subscriber
```
Event received: YES / NO
Event mapped to: application_approved
```

### Audience Resolver
```
Step 5: Audience Resolution
  Audiences resolved: 

  Audience 0: applicant
    User ID: 
    Email: 
  
  Audience 1: org_admin
    User ID: 
    Email: 
  
  CRITICAL CHECK: Different emails? 
```

### Template Selected
```
For applicant: [template name]
For org_admin: [template name]
```

### Channels Selected
```
Applicant: [email / telegram / internal]
Org_admin: [email / telegram / internal]
```

### Provider Used
```
Email sent to: [email]
Telegram sent to: [chat ID]
```

### Notification Log Entry
```
Created: YES / NO
For applicant: YES / NO
For org_admin: YES / NO
```

### Final Delivery
```
Applicant received: YES / NO
Admin received: YES / NO
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
```
[Divergence evidence]
```
