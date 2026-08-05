const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const REQUIRED_TEMPLATES = [
  // Applicant - Registration & Verification
  { eventName: "user_registration", channel: "email" },
  // Applicant - Application Lifecycle
  { eventName: "application_submitted", channel: "email" },
  { eventName: "application_under_review", channel: "email" },
  { eventName: "documents_requested", channel: "email" },
  { eventName: "document_approved", channel: "email" },
  { eventName: "document_rejected", channel: "email" },
  // Applicant - Decision Outcomes
  { eventName: "application_approved", channel: "email" },
  { eventName: "application_rejected", channel: "email" },
  { eventName: "application_waitlisted", channel: "email" },
  { eventName: "application_conditional", channel: "email" }, // Conditional approval
  // Staff
  { eventName: "staff_invited", channel: "email" },
  { eventName: "staff_assignment_notification", channel: "email" },
  { eventName: "staff_role_changed", channel: "email" },
  // Admin & System
  { eventName: "admin_alert", channel: "email" },
  { eventName: "system_error", channel: "email" },
  { eventName: "admin_test", channel: "email" },
  { eventName: "ops_alert", channel: "email" }, // Platform alert
];

async function checkTemplates() {
  console.log("Checking notification templates...\n");

  const existing = await prisma.notificationTemplate.findMany({
    select: { eventName: true, channel: true }
  });

  const existingSet = new Set(existing.map(t => `${t.eventName}:${t.channel}`));

  const missing = [];
  const found = [];

  for (const template of REQUIRED_TEMPLATES) {
    const key = `${template.eventName}:${template.channel}`;
    if (existingSet.has(key)) {
      found.push(template.eventName);
      console.log(`✓ ${template.eventName}`);
    } else {
      missing.push(template);
      console.log(`✗ MISSING: ${template.eventName}`);
    }
  }

  console.log(`\nSUMMARY:`);
  console.log(`Found: ${found.length}/${REQUIRED_TEMPLATES.length}`);
  console.log(`Missing: ${missing.length}/${REQUIRED_TEMPLATES.length}`);

  if (missing.length > 0) {
    console.log(`\nMISSING TEMPLATES TO CREATE:`);
    missing.forEach(t => {
      console.log(`  - ${t.eventName} (${t.channel})`);
    });
  }

  await prisma.$disconnect();
  process.exit(missing.length > 0 ? 1 : 0);
}

checkTemplates();
