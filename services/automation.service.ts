import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function triggerApplicationWorkflow(email: string, name: string) {
  publishDomainEvent("application.submitted", {
    name,
    email,
  });

  return { success: true };
}
