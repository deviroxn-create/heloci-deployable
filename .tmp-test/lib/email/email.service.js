"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const resend_1 = require("resend");
const email_templates_1 = require("./email.templates");
const email_renderer_1 = require("./email.renderer");
class EmailService {
    resend = new resend_1.Resend(process.env.RESEND_API_KEY || "");
    async sendEmail(payload) {
        const template = email_templates_1.emailTemplates[payload.template];
        if (!template) {
            throw new Error(`Email template not found: ${payload.template}`);
        }
        const subject = (0, email_renderer_1.renderTemplate)(template.subject, payload.data);
        const body = (0, email_renderer_1.renderTemplate)(template.body, payload.data);
        return this.resend.emails.send({
            from: "Heloci <noreply@heloci.com>",
            to: payload.to,
            subject,
            html: `<div>${body.replace(/\n/g, "<br />")}</div>`,
        });
    }
}
exports.EmailService = EmailService;
