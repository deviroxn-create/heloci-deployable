// Complete Notification Template Seeding for Phase 7
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedNotifications() {
  console.log("Seeding complete notification templates for Phase 7...\n");

  // Template records: combines eventName, channel, and audience in the key
  // Format: {eventName, channel, audienceRole, subject, html, plainText, title}
  // These create NotificationTemplate records with name = "{audiencePrefix}.{eventKey}.{channel}"
  // Examples:
  //   - applicant.user-registration.email
  //   - admin.user-registration.telegram
  //   - admin.user-login.email
  
  const templates = [
    // ==================== USER EVENTS ====================
    // CRITICAL FIX: Missing templates for user_login (both email and telegram)
    { eventName: "user_login", channel: "email", audienceRole: "applicant", subject: "You've logged in to Heloci", html: "Hello {{name}}, you've successfully logged into your Heloci account.", plainText: "Hello {{name}}, you've successfully logged into your Heloci account.", title: "Login Confirmed" },
    { eventName: "user_login", channel: "email", audienceRole: "organization_admin", subject: "Staff login to Heloci", html: "Staff member {{name}} has logged into {{organizationName}}.", plainText: "Staff member {{name}} has logged into {{organizationName}}.", title: "Staff Login" },
    { eventName: "user_login", channel: "telegram", audienceRole: "organization_admin", subject: "Staff login to Heloci", html: "Staff member {{name}} has logged into {{organizationName}}.", plainText: "Staff member {{name}} has logged into {{organizationName}}.", title: "Staff Login" },
    
    { eventName: "user_registration", channel: "email", audienceRole: "applicant", subject: "Welcome to Heloci", html: "Hello {{name}}, welcome to Heloci! Your account has been successfully created.", plainText: "Hello {{name}}, welcome to Heloci! Your account has been successfully created.", title: "Account Created" },
    { eventName: "user_registration", channel: "email", audienceRole: "organization_admin", subject: "New applicant registered", html: "A new applicant {{name}} has registered for {{organizationName}}.", plainText: "A new applicant {{name}} has registered for {{organizationName}}.", title: "New Registration" },
    { eventName: "user_registration", channel: "telegram", audienceRole: "organization_admin", subject: "New applicant registered", html: "A new applicant {{name}} has registered for {{organizationName}}.", plainText: "A new applicant {{name}} has registered for {{organizationName}}.", title: "New Registration" },
    
    // ==================== APPLICANT - REGISTRATION ====================
    
    // ==================== APPLICANT - APPLICATION LIFECYCLE ====================
    { eventName: "application_started", channel: "email", audienceRole: "applicant", subject: "Application started for {{programName}}", html: "You have started an application for {{programName}}, {{name}}. You can save your progress and return anytime.", plainText: "You have started an application for {{programName}}, {{name}}. You can save your progress and return anytime." },
    { eventName: "application_submitted", channel: "email", audienceRole: "applicant", subject: "Application submitted for {{programName}}", html: "Thank you {{name}} for submitting your application for {{programName}}. We will review it and contact you soon.", plainText: "Thank you {{name}} for submitting your application for {{programName}}. We will review it and contact you soon." },
    { eventName: "application_submitted", channel: "email", audienceRole: "organization_admin", subject: "New application submitted: {{applicantName}}", html: "A new application has been submitted by {{applicantName}} for {{programName}}.", plainText: "A new application has been submitted by {{applicantName}} for {{programName}}." },
    { eventName: "application_under_review", channel: "email", audienceRole: "applicant", subject: "Your application is under review", html: "Hi {{name}}, your application for {{programName}} is now under review. We'll notify you of any updates.", plainText: "Hi {{name}}, your application for {{programName}} is now under review. We'll notify you of any updates." },
    
    // ==================== APPLICANT - DOCUMENTS ====================
    { eventName: "documents_requested", subject: "Additional documents needed for your application", html: "Hi {{name}}, we need additional documents to review your application. Please submit them by {{deadline}}.", plainText: "Hi {{name}}, we need additional documents to review your application. Please submit them by {{deadline}}." },
    { eventName: "document_approved", subject: "Document approved: {{documentType}}", html: "Your {{documentType}} ({{fileName}}) has been approved, {{name}}. Thank you!", plainText: "Your {{documentType}} ({{fileName}}) has been approved, {{name}}. Thank you!" },
    { eventName: "document_rejected", subject: "Document requires revision: {{documentType}}", html: "Your {{documentType}} ({{fileName}}) was rejected: {{rejectionReason}}. Please upload a corrected version.", plainText: "Your {{documentType}} ({{fileName}}) was rejected: {{rejectionReason}}. Please upload a corrected version." },
    { eventName: "document_replacement_requested", subject: "Document replacement needed: {{documentType}}", html: "Please replace your {{documentType}} ({{fileName}}). Reason: {{reason}}. Deadline: {{deadline}}.", plainText: "Please replace your {{documentType}} ({{fileName}}). Reason: {{reason}}. Deadline: {{deadline}}." },
    
    // ==================== APPLICANT - DECISIONS ====================
    { eventName: "application_approved", subject: "Congratulations! Your application was approved", html: "Congratulations {{name}}! Your application for {{programName}} has been APPROVED. Effective date: {{effectiveDate}}.", plainText: "Congratulations {{name}}! Your application for {{programName}} has been APPROVED. Effective date: {{effectiveDate}}." },
    { eventName: "application_rejected", subject: "Application decision notification", html: "Thank you for applying, {{name}}. Unfortunately, your application for {{programName}} was not approved. Reason: {{reason}}", plainText: "Thank you for applying, {{name}}. Unfortunately, your application for {{programName}} was not approved. Reason: {{reason}}" },
    { eventName: "application_waitlisted", subject: "Application waitlisted", html: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up. Position: {{position}}", plainText: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up. Position: {{position}}" },
    { eventName: "application_conditional", subject: "Conditional approval for {{programName}}", html: "Your application for {{programName}} has been conditionally approved, {{name}}. Please review the conditions: {{conditions}}", plainText: "Your application for {{programName}} has been conditionally approved, {{name}}. Please review the conditions: {{conditions}}" },
    { eventName: "application_withdrawn", subject: "Application withdrawn: {{programName}}", html: "Your application for {{programName}} has been withdrawn, {{name}}. Reason: {{reason}}", plainText: "Your application for {{programName}} has been withdrawn, {{name}}. Reason: {{reason}}" },
    
    // ==================== APPLICANT - ELIGIBILITY & MATCHING ====================
    { eventName: "eligibility_assessment_completed", subject: "Your eligibility assessment is complete", html: "Hi {{name}}, your eligibility assessment is complete. You match {{matchCount}} program(s). Check your recommendations.", plainText: "Hi {{name}}, your eligibility assessment is complete. You match {{matchCount}} program(s). Check your recommendations." },
    { eventName: "program_matched", subject: "New program match: {{programName}}", html: "Great news {{name}}! You match {{programName}} with a {{score}}/100 match. {{matchDescription}}", plainText: "Great news {{name}}! You match {{programName}} with a {{score}}/100 match. {{matchDescription}}" },
    { eventName: "new_recommendation_available", subject: "New housing programs available for you", html: "Hi {{name}}, we found {{programCount}} new program(s) that you may qualify for. Check your recommendations.", plainText: "Hi {{name}}, we found {{programCount}} new program(s) that you may qualify for. Check your recommendations." },
    
    // ==================== STAFF NOTIFICATIONS ====================
    { eventName: "staff_invited", subject: "You're invited to join {{organizationName}}", html: "You've been invited to join {{organizationName}} as a staff member. Click the link to accept: {{invitationLink}}", plainText: "You've been invited to join {{organizationName}} as a staff member. Click the link to accept: {{invitationLink}}" },
    { eventName: "staff_invitation_accepted", subject: "Staff invitation accepted", html: "A staff member has accepted their invitation to join {{organizationName}}.", plainText: "A staff member has accepted their invitation to join {{organizationName}}." },
    { eventName: "staff_assignment_notification", subject: "Application assigned to you", html: "Hi {{assignedOfficer}}, application {{applicationId}} has been assigned to you for {{programName}}.", plainText: "Hi {{assignedOfficer}}, application {{applicationId}} has been assigned to you for {{programName}}." },
    { eventName: "staff_role_changed", subject: "Your role has been updated", html: "Your role in {{organizationName}} has been updated to {{newRole}}. Review your new permissions.", plainText: "Your role in {{organizationName}} has been updated to {{newRole}}. Review your new permissions." },
    { eventName: "staff_removed", subject: "Staff member removed", html: "A staff member has been removed from {{organizationName}}.", plainText: "A staff member has been removed from {{organizationName}}." },
    
    // ==================== ADMIN & ORGANIZATION ====================
    { eventName: "program_published", subject: "Program published: {{programName}}", html: "The program {{programName}} is now published and applicants can apply.", plainText: "The program {{programName}} is now published and applicants can apply." },
    { eventName: "admin_action", subject: "Admin action: {{actionType}}", html: "An admin action has been performed: {{actionType}}. Details: {{details}}", plainText: "An admin action has been performed: {{actionType}}. Details: {{details}}" },
    { eventName: "admin_alert", subject: "Admin alert: {{alertType}}", html: "Alert for {{organizationName}}: {{alertDetails}}. Action required: {{actionRequired}}", plainText: "Alert for {{organizationName}}: {{alertDetails}}. Action required: {{actionRequired}}" },
    
    // ==================== SYSTEM & OPERATIONS ====================
    { eventName: "system_error", subject: "System error occurred", html: "A system error was reported for {{name}}. Error: {{errorMessage}}. Time: {{timestamp}}", plainText: "A system error was reported for {{name}}. Error: {{errorMessage}}. Time: {{timestamp}}" },
    { eventName: "ops_alert", subject: "Operations alert: {{eventName}}", html: "Alert: {{eventName}} for {{programName}} (application {{applicationId}}) requires immediate attention.", plainText: "Alert: {{eventName}} for {{programName}} (application {{applicationId}}) requires immediate attention." },
    { eventName: "admin_test", subject: "Heloci notification test", html: "This is a test notification for {{name}}. If you received this, email delivery is working correctly.", plainText: "This is a test notification for {{name}}. If you received this, email delivery is working correctly." }
  ];

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      // CRITICAL FIX: Build template name from audienceRole + eventName + channel
      // This creates keys like: applicant.user-login.email, admin.user-login.telegram
      // These match the format expected by TemplateResolver.resolveTemplateKey()
      const audienceRole = template.audienceRole || "applicant";  // Default to applicant
      const audiencePrefix = audienceRole === "organization_admin" ? "admin" : 
                              audienceRole === "applicant" ? "applicant" :
                              audienceRole;
      const channel = template.channel || "email";
      const name = `${audiencePrefix}.${template.eventName}.${channel}`;
      const title = template.title || template.subject;
      
      const existing = await prisma.notificationTemplate.findFirst({
        where: { name, eventName: template.eventName, channel }
      });

      if (existing) {
        await prisma.notificationTemplate.update({
          where: { id: existing.id },
          data: { 
            subject: template.subject, 
            html: template.html, 
            plainText: template.plainText,
            title,
            active: true, 
            status: "PUBLISHED" 
          }
        });
        updatedCount++;
      } else {
        await prisma.notificationTemplate.create({
          data: { 
            name, 
            eventName: template.eventName, 
            channel,
            subject: template.subject, 
            html: template.html, 
            plainText: template.plainText, 
            title,
            active: true, 
            version: 1, 
            locale: "en", 
            status: "PUBLISHED"
          }
        });
        createdCount++;
      }
      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${template.eventName}.${template.channel}: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\nConfiguring communication settings...");
  try {
    await prisma.communicationSettings.upsert({
      where: { id: "default" },
      update: { enabled: true, senderEmail: "support@heloci.us", channels: { email: true, telegram: true, internal: true } },
      create: { id: "default", enabled: true, senderEmail: "support@heloci.us", channels: { email: true, telegram: true, internal: true } }
    });
    console.log("✓ Communication settings configured");
  } catch (error) {
    console.error(`✗ Communication settings: ${error.message}`);
    errorCount++;
  }

  console.log(`\n✓ Notification seeding complete!`);
  console.log(`  - Created: ${createdCount}`);
  console.log(`  - Updated: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`  - Total: ${templates.length} templates processed`);
}

seedNotifications()
  .catch((error) => { console.error("❌ Seed failed:", error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
