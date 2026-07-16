export const welcomeTemplate = (name: string) => ({
  subject: `Welcome to Heloci, ${name}`,
  html: `<p>Hello ${name},</p><p>Welcome to Heloci — we are here to support your housing application.</p>`
});

export const applicationSubmittedTemplate = (name: string) => ({
  subject: "Your Heloci application has been submitted",
  html: `<p>Hi ${name},</p><p>Thank you for submitting your housing assistance application. Our team will review it shortly.</p>`
});
