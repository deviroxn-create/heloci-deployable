"use server";

import { notificationService } from "@/lib/notifications/notification.service";

export async function createPropertyAction(data: any) {
  await notificationService.notify("homeowner_listing_submitted", {
    name: data?.ownerName || "Homeowner",
    recipientEmail: data?.email,
    userEmail: data?.email
  });

  return { success: true, id: "property-stub" };
}
