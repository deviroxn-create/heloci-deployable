# WORKFLOW 4: APPLICATION SUBMIT

## Expected Flow
Application submitted → Status = SUBMITTED → application.submitted event published → Applicant receives email → Admin receives Telegram

## Observed Flow
[PENDING - Execute workflow and paste COMPLETE server console logs below]

### API Route
```
POST /api/applications/{id}/submit
```

### Service
```
STEP 1: Incoming HTTP Request
  URL: 
  User ID: 
  Organization ID: 
  Application ID: 

STEP 2: Raw Wizard Payload
  Total keys: 
  housingGoals present: 

STEP 3: Transformation
  BEFORE - Total keys: 
  housingGoals in BEFORE: 
  AFTER - Total keys: 
  housingGoals in AFTER: 

STEP 4: Question Set
  Total questions: 
  Questions: [list them]

STEP 5: Validator Result
  Validation: PASSED / FAILED
  [If FAILED, list errors]

STEP 6: Database
  Status update: 
  Application status: 
```

### Database
```
Application record
  ID: 
  Status: 
  submittedAt: 
```

### Domain Event
```
Event published: YES / NO
Event name: application.submitted
Payload keys: 
User ID: 
Organization ID: 
Application ID: 
```

### Notification Subscriber
```
Step 2: Domain Subscriber
  Event received: YES / NO
  Event name: 

Step 3: Event Mapping
  Domain event → Communication event: application.submitted → application_submitted
  
Step 4: Notification Service Result
  Delivered: YES / NO
  Channels: [list]
```

### Audience Resolver
```
Step 5: Audience Resolution
  Event: application_submitted
  
  Audience 0: applicant
    Type: user
    User ID: 
    Email: 
  
  Audience 1: org_admin
    Type: user
    User ID: 
    Email: 
  
  CRITICAL CHECK: Applicant email ≠ Admin email? 
```

### Template Selected
```
For applicant: 
For org_admin: 
For reviewer: 
```

### Channels Selected
```
Applicant channels: 
Org_admin channels: 
Reviewer channels: 
```

### Provider Used
```
Email provider: 
  To: [applicant email]
  Status: 
  
Telegram provider: 
  Chat ID: [admin chat ID]
  Status: 
```

### Notification Log Entry
```
Entries created: [number]
For applicant: YES / NO
For org_admin: YES / NO
For reviewer: YES / NO
```

### Final Delivery
```
Applicant received email: YES / NO
Admin received telegram: YES / NO
No cross-contamination: YES / NO
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
Exact runtime step where divergence begins:
```
[Copy exact console output showing first divergence]
```

Console evidence:
```
[Full output from divergence point onward]
```

Payload evidence:
```
[Exact payload values at divergence]
```

Database evidence:
```
[Database state at divergence]
```
