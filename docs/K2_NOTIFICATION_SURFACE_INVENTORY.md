# K2 Notification Surface Inventory

This inventory documents the browser and API surfaces that trigger notification-domain events in the Heloci application.

## Auth

- `app/(auth)/register/page.tsx`
  - Component: `components/auth/register-form.tsx`
  - Flow: Supabase signup via `supabase.auth.signUp()` then server action `registerUser()`
  - Backend: `actions/auth.actions.ts` → `lib/auth/user-profile.service.ts`
  - Event: publishes `user.registration` only for newly created Prisma users
  - Notification runtime: `lib/notifications/notification-domain-subscriber.ts` maps `user.registration` → `user_registration`

- `app/(auth)/login/page.tsx`
  - Component: `components/auth/login-form.tsx`
  - Flow: Supabase password login via `supabase.auth.signInWithPassword()`
  - Backend: `actions/notifications.actions.ts` server action `trackLoginNotificationAction()`
  - Event: publishes `user.login`
  - Notification runtime: `lib/notifications/notification-domain-subscriber.ts` maps `user.login` → `user_login`

## Application workflows

- `app/apply/[slug]/page.tsx`
  - Flow: applicant clicks submit and POSTs to `/api/applications/{applicationId}/submit`
  - Backend: `app/api/applications/[id]/submit/route.ts` → `lib/applications/application-service.ts`
  - Event: publishes `application.submitted`
  - Notification runtime maps `application.submitted` → `application_submitted`

## Document requests and case communication

- `app/admin/cases/[id]/page.tsx`
  - Flow: admin sends a message via `/api/communications/messages`
  - Backend: `app/api/communications/messages/route.ts` → `lib/communications/case-communication.service.ts` → `sendCaseMessage()`
  - Event: publishes `admin.action` or `message.created` through `publishDomainEvent(...)`
  - Notification runtime: shared event bus subscriber maps to `admin_action` or `message_created`

- `app/admin/cases/[id]/page.tsx`
  - Flow: admin requests documents via `/api/communications/document-requests`
  - Backend: `app/api/communications/document-requests/route.ts` → `lib/communications/case-communication.service.ts` → `requestDocumentsInCase()`
  - Event: publishes `documents.requested` through `publishDomainEvent(...)`
  - Notification runtime maps to `documents_requested`

## Admin notification actions

- `actions/notifications.actions.ts`
  - `sendTestNotificationAction()` publishes `admin.action`
  - `emitNotificationAction()` maps underscore event names to domain event names and publishes those events
  - Additional admin notification-related behaviors are exposed through the communication dashboard and notification settings UI

## Notification runtime subscriber

- `lib/notifications/notification-domain-subscriber.ts`
  - Subscribes to business events:
    - `user.registration`
    - `user.login`
    - `application.submitted`
    - `application.review.completed`
    - `application.approved`
    - `application.rejected`
    - `application.waitlisted`
    - `documents.requested`
    - `message.created`
    - `admin.action`
  - Maps domain event names to notification event names for delivery

## Certification test entry points

- Browser surfaces:
  - `/login`
  - `/register`
  - `/apply/{slug}`
  - `/admin/applications`
  - `/admin/cases/{id}?tab=communication`

- API/behavior surfaces:
  - `actions/auth.actions.ts`
  - `actions/notifications.actions.ts`
  - `app/api/applications/[id]/submit/route.ts`
  - `app/api/communications/messages/route.ts`
  - `app/api/communications/document-requests/route.ts`

## Notes

- `user.login` is now explicitly emitted through a server action in the browser login flow.
- `user.registration` is already protected from duplicate event emissions by only publishing on new Prisma user creation.
- Some communication workflows still bypass the domain event subscriber and call `notificationService.notify()` directly, so their certification tests should validate the actual API surfaces used by those flows.
