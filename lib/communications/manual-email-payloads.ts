export interface OrganizationEmailRecipient {
  id?: string;
  email: string;
  name?: string;
}

export interface BuildOrganizationEmailNotificationPayloadsInput {
  subject: string;
  content: string;
  organizationId: string;
  senderId: string;
  senderIdentityId?: string;
  recipients: OrganizationEmailRecipient[];
}

export function buildOrganizationEmailNotificationPayloads(input: BuildOrganizationEmailNotificationPayloadsInput) {
  return input.recipients.map((recipient) => ({
    userId: input.senderId,
    recipientEmail: recipient.email,
    recipient: recipient.email,
    userEmail: recipient.email,
    organizationId: input.organizationId,
    senderIdentityId: input.senderIdentityId,
    sender: input.senderId,
    title: input.subject,
    body: input.content,
    content: input.content,
    name: recipient.name,
  }));
}
