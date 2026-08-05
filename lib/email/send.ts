import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

/**
 * PHASE B.6 CANONICALIZATION FIX:
 * 
 * This function was previously calling notificationService.notify() directly,
 * bypassing the canonical domain event → subscriber → registry pipeline.
 * 
 * Now it publishes the domain event instead, allowing the notification system
 * to follow the proper flow:
 * - publishDomainEvent("user.registration")
 * - NotificationDomainSubscriber receives it
 * - Registry lookup finds "user_registration" communication event
 * - notificationService.notify() called via canonical path
 * 
 * BACKWARD COMPATIBILITY:
 * The domain event carries the same payload, so downstream handling is unchanged.
 * The registry maps "user.registration" → "user_registration" communication event.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  return publishDomainEvent("user.registration", {
    name,
    email,
    userEmail: email
  });
}

/**
 * PHASE B.6 CANONICALIZATION FIX:
 * 
 * This function was previously calling notificationService.notify() directly,
 * bypassing the canonical domain event → subscriber → registry pipeline.
 * 
 * Now it publishes the domain event instead, allowing the notification system
 * to follow the proper flow:
 * - publishDomainEvent("application.submitted")
 * - NotificationDomainSubscriber receives it
 * - Registry lookup finds "application_submitted" communication event
 * - notificationService.notify() called via canonical path
 * 
 * BACKWARD COMPATIBILITY:
 * The domain event carries the same payload, so downstream handling is unchanged.
 * The registry maps "application.submitted" → "application_submitted" communication event.
 * The audience intent is preserved in the event payload.
 */
export async function sendApplicationSubmittedEmail(email: string, name: string) {
  return publishDomainEvent("application.submitted", {
    name,
    email,
    userEmail: email,
    audience: "applicant",
    deliveryChannels: ["email"]
  });
}
