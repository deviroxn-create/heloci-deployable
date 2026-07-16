"use server";

import { notificationService } from "@/lib/notifications/notification.service";

export async function submitApplicationAction(data: any) {
  await notificationService.notify("application_submitted", {
    name: data?.applicantName || "Applicant",
    recipientEmail: data?.email,
    userEmail: data?.email,
    applicationId: data?.id
  });

  return { success: true, id: "application-stub" };
}
