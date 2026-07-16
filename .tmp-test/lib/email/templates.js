"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSubmittedTemplate = exports.welcomeTemplate = void 0;
const welcomeTemplate = (name) => ({
    subject: `Welcome to Heloci, ${name}`,
    html: `<p>Hello ${name},</p><p>Welcome to Heloci — we are here to support your housing application.</p>`
});
exports.welcomeTemplate = welcomeTemplate;
const applicationSubmittedTemplate = (name) => ({
    subject: "Your Heloci application has been submitted",
    html: `<p>Hi ${name},</p><p>Thank you for submitting your housing assistance application. Our team will review it shortly.</p>`
});
exports.applicationSubmittedTemplate = applicationSubmittedTemplate;
