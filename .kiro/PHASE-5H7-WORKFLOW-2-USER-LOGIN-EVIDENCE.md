# WORKFLOW 2: USER LOGIN

## Expected Flow
User submits login → Authentication verified → user.login event published → Notification sent to user

## Observed Flow
[PENDING - Execute workflow and paste server console logs below]

### API Route
```
POST /auth/login
```

### Service
```
[Paste service execution logs here]
```

### Database
```
[Paste database operation logs here]
```

### Domain Event
```
Event published: YES / NO
Event name: user.login
```

### Notification Subscriber
```
Event received: YES / NO
```

### Audience Resolver
```
Audience resolved: YES / NO
User ID: [user ID]
Email: [email]
```

### Template Selected
```
Template: [template name]
```

### Channels Selected
```
[email / telegram / internal]
```

### Provider Used
```
Provider: [provider name]
Response: [response]
```

### Notification Log Entry
```
Created: YES / NO
```

### Final Delivery
```
User received: YES / NO
```

## PASS / FAIL
[PASS / FAIL]

## If FAIL
```
[Divergence evidence]
```
