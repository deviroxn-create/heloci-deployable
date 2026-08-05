# WORKFLOW 7: DOCUMENTS REQUESTED

## Expected Flow
Document request created → documents.requested event published → Applicant receives email with document request details

## Observed Flow
[PENDING]

### API Route
```
POST /api/documents/request
or
POST /api/applications/{id}/request-documents
```

### Service
```
[Service logs]
Document type: 
Request ID: 
```

### Database
```
DocumentRequest created: YES / NO
Status: pending
```

### Domain Event
```
Event published: YES / NO
Event name: documents.requested
Payload keys: 
```

### Notification Subscriber
```
Event received: YES / NO
Event mapped to: documents_requested
```

### Audience Resolver
```
Audiences:
  applicant - Email: 
  reviewer - [if present]: 
```

### Template Selected
```
Template: [applicant_documents_requested]
Variables: [deadline, document_types, etc]
```

### Channels Selected
```
Applicant: [email / internal]
Reviewer: [internal]
```

### Provider Used
```
Email sent to: [applicant email]
Status: 
```

### Notification Log Entry
```
Created: YES / NO
For applicant: YES / NO
```

### Final Delivery
```
Applicant received email: YES / NO
Email includes deadline: YES / NO
Email includes document types: YES / NO
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
```
[Divergence evidence]
```
