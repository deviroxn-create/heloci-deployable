import { notificationService } from "@/lib/notifications/notification.service";

export async function triggerApplicationWorkflow(email: string, name: string) {
  return notificationService.notify("application_submitted", {
    name,
    recipientEmail: email,
    userEmail: email
  });
}
