import { Resend } from "resend";
import { emailTemplates } from "./email.templates";
import { renderTemplate } from "./email.renderer";
import type { EmailPayload } from "./email.types";

export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY || "");

  async sendEmail(payload: EmailPayload) {
    const template = emailTemplates[payload.template];

    if (!template) {
      throw new Error(`Email template not found: ${payload.template}`);
    }

    const subject = renderTemplate(template.subject, payload.data);
    const body = renderTemplate(template.body, payload.data);

    return this.resend.emails.send({
      from: "Heloci <noreply@heloci.com>",
      to: payload.to,
      subject,
      html: `<div>${body.replace(/\n/g, "<br />")}</div>`,
    });
  }
}
