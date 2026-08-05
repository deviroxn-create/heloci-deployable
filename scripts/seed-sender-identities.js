#!/usr/bin/env node
/**
 * SEED SENDER IDENTITIES
 * Creates default sender identities for HELOCI organization
 * 
 * This script:
 * 1. Finds or creates the HELOCI organization
 * 2. Creates default sender identities (support@heloci.us, etc.)
 * 3. Marks them as active and verified
 * 4. Sets the first one as default
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SENDERS = [
  {
    emailAddress: 'support@heloci.us',
    displayName: 'Heloci Support',
    department: 'Support',
    isDefault: true,
  },
  {
    emailAddress: 'housing@heloci.us',
    displayName: 'Heloci Housing Programs',
    department: 'Housing',
    isDefault: false,
  },
  {
    emailAddress: 'documents@heloci.us',
    displayName: 'Heloci Documents',
    department: 'Documents',
    isDefault: false,
  },
  {
    emailAddress: 'admin@heloci.us',
    displayName: 'Heloci Administration',
    department: 'Administration',
    isDefault: false,
  },
];

async function seedSenderIdentities() {
  try {
    console.log('='.repeat(70));
    console.log('SEEDING SENDER IDENTITIES');
    console.log('='.repeat(70));

    // Find HELOCI organization
    console.log('\n1. Finding HELOCI Organization...');
    let heloiOrg = await prisma.organization.findFirst({
      where: { slug: 'heloci' },
    });

    if (!heloiOrg) {
      heloiOrg = await prisma.organization.findFirst({
        where: { name: { contains: 'Heloci', mode: 'insensitive' } },
      });
    }

    if (!heloiOrg) {
      throw new Error('HELOCI organization not found! Please create it first.');
    }

    console.log(`   ✓ Found: ${heloiOrg.name} (${heloiOrg.id})`);

    // Get a user to be the creator (use the organization creator or any admin)
    console.log('\n2. Finding creator user...');
    let creator = await prisma.user.findFirst({
      where: { id: heloiOrg.createdBy },
    });

    if (!creator) {
      creator = await prisma.user.findFirst({
        where: { email: { contains: 'admin', mode: 'insensitive' } },
      });
    }

    if (!creator) {
      creator = await prisma.user.findFirst();
    }

    if (!creator) {
      throw new Error('No user found in database to use as creator!');
    }

    console.log(`   ✓ Using creator: ${creator.email} (${creator.id})`);

    // Create sender identities
    console.log(`\n3. Creating sender identities for ${heloiOrg.name}...\n`);

    const createdSenders = [];
    for (const senderData of DEFAULT_SENDERS) {
      // Check if already exists
      const existing = await prisma.senderIdentity.findFirst({
        where: {
          organizationId: heloiOrg.id,
          emailAddress: senderData.emailAddress,
        },
      });

      if (existing) {
        console.log(`   ⚠️  Already exists: ${senderData.emailAddress}`);
        createdSenders.push(existing);
        continue;
      }

      const sender = await prisma.senderIdentity.create({
        data: {
          organizationId: heloiOrg.id,
          emailAddress: senderData.emailAddress,
          displayName: senderData.displayName,
          department: senderData.department,
          replyTo: senderData.emailAddress,
          isActive: true,
          isDefault: senderData.isDefault,
          verificationStatus: 'VERIFIED', // Development: mark as verified immediately
          createdBy: creator.id,
        },
      });

      console.log(`   ✓ Created: ${sender.emailAddress}`);
      console.log(`     - Display Name: ${sender.displayName}`);
      console.log(`     - Department: ${sender.department}`);
      console.log(`     - Default: ${sender.isDefault ? 'YES' : 'NO'}`);
      console.log(`     - Verification: ${sender.verificationStatus}`);

      createdSenders.push(sender);
    }

    // Verify creation
    console.log(`\n4. Verifying creation...\n`);

    const verifyCount = await prisma.senderIdentity.count({
      where: { organizationId: heloiOrg.id },
    });

    console.log(`   Total senders for ${heloiOrg.name}: ${verifyCount}`);

    const senders = await prisma.senderIdentity.findMany({
      where: { organizationId: heloiOrg.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    for (const sender of senders) {
      const defaultBadge = sender.isDefault ? ' [DEFAULT]' : '';
      console.log(`   ✓ ${sender.emailAddress} - ${sender.verificationStatus}${defaultBadge}`);
    }

    // Also seed for other organizations if they exist
    console.log(`\n5. Checking other organizations...\n`);

    const allOrgs = await prisma.organization.findMany({
      where: { id: { not: heloiOrg.id } },
    });

    for (const org of allOrgs) {
      const senderCount = await prisma.senderIdentity.count({
        where: { organizationId: org.id },
      });

      if (senderCount === 0) {
        console.log(`   Organization: ${org.name} (${org.id}) - NO SENDERS`);

        // Create a default sender for this org too
        const sender = await prisma.senderIdentity.create({
          data: {
            organizationId: org.id,
            emailAddress: `support@${org.slug.toLowerCase()}.local`,
            displayName: `${org.name} Support`,
            department: 'Support',
            replyTo: `support@${org.slug.toLowerCase()}.local`,
            isActive: true,
            isDefault: true,
            verificationStatus: 'VERIFIED',
            createdBy: creator.id,
          },
        });

        console.log(`   ✓ Created default sender: ${sender.emailAddress}`);
      } else {
        console.log(`   Organization: ${org.name} (${org.id}) - HAS ${senderCount} SENDER(S)`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('SEEDING COMPLETE ✓');
    console.log('='.repeat(70));
    console.log('\nSenderIdentities are now available in the database.');
    console.log('The SenderSelector dropdown should now show these senders.\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('ERROR DURING SEEDING');
    console.error('='.repeat(70));
    console.error(error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSenderIdentities();
