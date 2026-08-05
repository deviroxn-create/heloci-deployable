/**
 * PHASE 5H — Initialize Communication Configuration
 * 
 * Creates minimal configuration needed for notifications to work properly.
 * This is data initialization, not code change.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeCommunicationConfig() {
  try {
    console.log('\n=== PHASE 5H: Communication Configuration Initialization ===\n');

    // 1. Create default CommunicationSettings
    console.log('1. Creating CommunicationSettings...');
    
    const existingSettings = await prisma.communicationSettings.findUnique({
      where: { id: 'default' }
    });

    if (existingSettings) {
      console.log('   ✓ CommunicationSettings already exists');
    } else {
      const settings = await prisma.communicationSettings.create({
        data: {
          id: 'default',
          enabled: true,
          channels: {
            email: true,
            telegram: true,
            internal: true,
            whatsapp: false
          },
          senderEmail: 'support@heloci.us',
          telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
          telegramChatId: process.env.TELEGRAM_CHAT_ID,
          events: {
            'user_registration': { email: true, telegram: true, internal: true },
            'user_login': { email: true, telegram: false, internal: true },
            'application_submitted': { email: true, telegram: true, internal: true },
            'application_approved': { email: true, telegram: false, internal: true },
            'application_rejected': { email: true, telegram: false, internal: true },
            'application_waitlisted': { email: true, telegram: false, internal: true },
            'documents_requested': { email: true, telegram: false, internal: true },
            'document_uploaded': { email: true, telegram: true, internal: true },
            'eligibility_result': { email: true, telegram: false, internal: true },
            'program_match': { email: true, telegram: false, internal: true },
            'message_created': { email: true, telegram: false, internal: true }
          }
        }
      });
      console.log('   ✓ Created CommunicationSettings record');
    }

    // 2. Create SenderIdentity for each organization
    console.log('\n2. Creating SenderIdentity records...');
    
    const orgs = await prisma.organization.findMany();
    console.log(`   Found ${orgs.length} organizations`);

    for (const org of orgs) {
      const existingSender = await prisma.senderIdentity.findFirst({
        where: { organizationId: org.id }
      });

      if (existingSender) {
        console.log(`   ✓ ${org.id} already has SenderIdentity`);
      } else {
        const sender = await prisma.senderIdentity.create({
          data: {
            organizationId: org.id,
            displayName: org.name || 'Heloci',
            emailAddress: 'support@heloci.us',
            replyTo: 'support@heloci.us',
            createdBy: org.createdBy || 'system'
          }
        });
        console.log(`   ✓ Created SenderIdentity for ${org.id}`);
      }
    }

    // 3. Seed NotificationTemplate records with all event types
    console.log('\n3. Seeding NotificationTemplate records...');
    
    const templates = [
      // Authentication
      {
        eventName: 'user_registration',
        channel: 'email',
        name: 'Welcome Email',
        title: 'Welcome to Heloci',
        subject: 'Welcome to Heloci',
        html: '<h3>Welcome to Heloci</h3><p>Hello {{firstName}}, your account has been created successfully.</p>',
        plainText: 'Welcome to Heloci. Your account has been created successfully.'
      },
      {
        eventName: 'user_registration',
        channel: 'telegram',
        name: 'New User Telegram',
        title: 'New Registration',
        subject: '',
        html: 'New user registered: {{email}}',
        plainText: 'New user: {{email}}'
      },
      {
        eventName: 'user_login',
        channel: 'email',
        name: 'Login Notification',
        title: 'Login Confirmation',
        subject: 'Your Heloci Login',
        html: '<p>Hello {{firstName}}, you logged in to Heloci.</p>',
        plainText: 'You logged in to Heloci.'
      },
      
      // Applications
      {
        eventName: 'application_submitted',
        channel: 'email',
        name: 'Application Submitted Confirmation',
        title: 'Application Submitted',
        subject: 'Your application has been submitted',
        html: '<p>Your application for {{programName}} has been submitted.</p>',
        plainText: 'Your application has been submitted.'
      },
      {
        eventName: 'application_submitted',
        channel: 'telegram',
        name: 'New Application Alert',
        title: 'New Application',
        subject: '',
        html: 'New application: {{applicationId}} from {{email}}',
        plainText: 'New application submitted'
      },
      {
        eventName: 'application_approved',
        channel: 'email',
        name: 'Application Approved',
        title: 'Congratulations',
        subject: 'Your application has been approved',
        html: '<p>Congratulations! Your application for {{programName}} has been approved.</p>',
        plainText: 'Your application has been approved.'
      },
      {
        eventName: 'application_rejected',
        channel: 'email',
        name: 'Application Rejected',
        title: 'Application Status',
        subject: 'Your application status',
        html: '<p>Your application for {{programName}} was not approved at this time.</p>',
        plainText: 'Your application was not approved.'
      },
      {
        eventName: 'application_waitlisted',
        channel: 'email',
        name: 'Application Waitlisted',
        title: 'Waitlist Status',
        subject: 'You are on the waitlist',
        html: '<p>Your application has been placed on the waitlist.</p>',
        plainText: 'Your application is on the waitlist.'
      },

      // Documents
      {
        eventName: 'documents_requested',
        channel: 'email',
        name: 'Documents Requested',
        title: 'Additional Documents Needed',
        subject: 'Please provide additional documents',
        html: '<p>We need {{documentType}} for your application.</p>',
        plainText: 'We need additional documents for your application.'
      },
      {
        eventName: 'document_uploaded',
        channel: 'email',
        name: 'Document Received',
        title: 'Document Received',
        subject: 'We received your document',
        html: '<p>Thank you for uploading {{documentType}}.</p>',
        plainText: 'Thank you for uploading your document.'
      },
      {
        eventName: 'document_uploaded',
        channel: 'telegram',
        name: 'Document Uploaded Alert',
        title: 'Document Received',
        subject: '',
        html: 'Document uploaded: {{documentType}} for {{applicationId}}',
        plainText: 'Document received'
      },

      // Eligibility & Programs
      {
        eventName: 'eligibility_result',
        channel: 'email',
        name: 'Eligibility Result',
        title: 'Eligibility Decision',
        subject: 'Your eligibility result',
        html: '<p>You are {{eligible ? "eligible" : "not eligible"}} for {{programName}}.</p>',
        plainText: 'Your eligibility result is available.'
      },
      {
        eventName: 'program_match',
        channel: 'email',
        name: 'Program Match',
        title: 'You Match a Program',
        subject: 'You match a housing program',
        html: '<p>You have been matched with {{programName}}.</p>',
        plainText: 'You have been matched with a program.'
      },

      // Messages
      {
        eventName: 'message_created',
        channel: 'email',
        name: 'New Message Notification',
        title: 'You Have a New Message',
        subject: 'New message from Heloci',
        html: '<p>You have received a new message. Log in to view it.</p>',
        plainText: 'You have a new message.'
      }
    ];

    let skipped = 0;
    for (const template of templates) {
      const exists = await prisma.notificationTemplate.findFirst({
        where: {
          eventName: template.eventName,
          channel: template.channel
        }
      });

      if (exists) {
        skipped++;
      } else {
        await prisma.notificationTemplate.create({
          data: {
            ...template,
            active: true,
            version: 1,
            locale: 'en',
            status: 'PUBLISHED'
          }
        });
      }
    }

    console.log(`   ✓ Processed ${templates.length} templates (${templates.length - skipped} created, ${skipped} skipped)`);

    console.log('\n✅ Communication configuration initialization complete\n');
    return true;

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initializeCommunicationConfig().then(success => {
  process.exit(success ? 0 : 1);
});
