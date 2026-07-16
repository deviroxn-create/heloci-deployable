import { notificationService } from "@/lib/notifications/notification.service";

export async function sendWelcomeEmail(email: string, name: string) {
  return notificationService.notify("user_registration", {
    name,
    recipientEmail: email,
    userEmail: email
  });
}

export async function sendApplicationSubmittedEmail(email: string, name: string) {
  return notificationService.notify("application_submitted", {
    name,
    recipientEmail: email,
    userEmail: email
  });
}
