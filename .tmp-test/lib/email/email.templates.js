"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
exports.emailTemplates = {
    welcome: {
        subject: "Welcome to Heloci",
        body: "Hi {{firstName}}, Welcome to Heloci. We're here to help you find housing that fits your needs. Heloci Team"
    },
    application_received: {
        subject: "Application Received - {{programName}}",
        body: "Hi {{firstName}}, We received your application for {{programName}}. Application ID: {{applicationId}}. Status: {{status}}. Heloci Team"
    },
    application_status: {
        subject: "Application Status Update",
        body: "Hi {{firstName}}, Your application status is now: {{status}}. We'll keep you posted with next steps. Heloci Team"
    }
};
