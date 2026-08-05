# WORKFLOW 1: USER REGISTRATION

## Expected Flow
User submits registration form → User created → user.registration event published → Notification sent to user

## Observed Flow
[PENDING - Execute workflow and paste server console logs below]

### API Route
```
POST /auth/register
```

### Service
```
[Paste service execution logs here]
```

### Database
```
[Paste database operation logs here]
User created: YES / NO
```

### Domain Event
```
Event published: YES / NO
Event name: [event name]
Payload: [event payload]
```

### Notification Subscriber
```
Event received: YES / NO
[Paste subscriber logs here]
```

### Audience Resolver
```
Audience resolved: YES / NO
Audience: [applicant / org_admin / other]
User ID: [user ID]
Email: [email]
```

### Template Selected
```
Template: [template name]
Status: [selected / not found / error]
```

### Channels Selected
```
[email / telegram / internal]
```

### Provider Used
```
Provider: [Resend / Telegram / Internal DB]
Response: [HTTP status / API response]
```

### Notification Log Entry
```
Created: YES / NO
Status: [pending / delivered / failed]
```

### Final Delivery
```
User received notification: YES / NO
Channel: [email / telegram / internal]
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
Exact runtime step where divergence begins:
```
[Copy exact console output showing divergence]
```

Console evidence:
```
[Full console output from divergence point]
```

Payload evidence:
```
[Exact payload at divergence]
```

Database evidence:
```
[Database state at divergence]
```
