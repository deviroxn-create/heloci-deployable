"use server";

import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function createPropertyAction(data: any) {
  publishDomainEvent("property.listing.submitted", {
    name: data?.ownerName || "Homeowner",
    recipientEmail: data?.email,
    userEmail: data?.email,
  });

  return { success: true, id: "property-stub" };
}
