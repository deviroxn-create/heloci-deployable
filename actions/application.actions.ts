"use server";

import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function submitApplicationAction(data: any) {
  publishDomainEvent("application.submitted", {
    name: data?.applicantName || "Applicant",
    recipientEmail: data?.email,
    userEmail: data?.email,
    applicationId: data?.id,
  });

  return { success: true, id: "application-stub" };
}
