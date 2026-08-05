# WORKFLOW 8: INTERNAL MESSAGING

## Expected Flow
User sends message → message.created event published → Recipients notified of new message

## Observed Flow
[PENDING]

### API Route
```
POST /api/messages
or
POST /api/conversations/{id}/messages
```

### Service
```
[Service logs]
```

### Database
```
Message created: YES / NO
Conversation ID: 
```

### Domain Event
```
Event published: YES / NO
Event name: message.created
Payload keys: 
```

### Notification Subscriber
```
Event received: YES / NO
Event mapped to: message_created
```

### Audience Resolver
```
Audiences:
  applicant - Email/Telegram: 
  org_admin - Email/Telegram: 
```

### Template Selected
```
Template: [message_created_notification]
```

### Channels Selected
```
Applicant: 
Org_admin: 
```

### Provider Used
```
[Providers used]
```

### Notification Log Entry
```
Created: YES / NO
For each recipient: YES / NO
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
