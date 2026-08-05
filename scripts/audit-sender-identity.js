#!/usr/bin/env node
/**
 * SENDER IDENTITY DATA AUDIT SCRIPT
 * Checks database state of SenderIdentity table
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditSenderIdentity() {
  try {
    console.log('='.repeat(70));
    console.log('SENDER IDENTITY DATA AUDIT');
    console.log('='.repeat(70));

    // Count total senders
    const totalSenders = await prisma.senderIdentity.count();
    console.log(`\n1. TOTAL SENDER IDENTITIES: ${totalSenders}`);

    if (totalSenders === 0) {
      console.log('\n⚠️  WARNING: SenderIdentity table is EMPTY');
      console.log('   No sender records found in database');
    }

    // List all senders grouped by organization
    const allSenders = await prisma.senderIdentity.findMany({
      include: {
        organization: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ organizationId: 'asc' }, { createdAt: 'desc' }],
    });

    console.log(`\n2. SENDERS BY ORGANIZATION:\n`);

    const sendersByOrg = {};
    for (const sender of allSenders) {
      const orgId = sender.organizationId;
      if (!sendersByOrg[orgId]) {
        sendersByOrg[orgId] = {
          orgName: sender.organization?.name || 'UNKNOWN',
          senders: [],
        };
      }
      sendersByOrg[orgId].senders.push(sender);
    }

    for (const [orgId, data] of Object.entries(sendersByOrg)) {
      console.log(`   Organization: ${data.orgName} (${orgId})`);
      console.log(`   Sender Count: ${data.senders.length}`);

      for (const sender of data.senders) {
        const status = sender.isActive ? '✓ ACTIVE' : '✗ INACTIVE';
        const verified = sender.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : `✗ ${sender.verificationStatus}`;
        const isDefault = sender.isDefault ? ' [DEFAULT]' : '';

        console.log(`      - ${sender.emailAddress}`);
        console.log(`        Display Name: ${sender.displayName}`);
        console.log(`        Status: ${status} | Verification: ${verified}${isDefault}`);
        console.log(`        Created By: ${sender.creator?.email || 'UNKNOWN'} (${sender.creator?.name})`);
        console.log(`        Created At: ${sender.createdAt.toISOString()}`);
        console.log('');
      }
    }

    // Check for specific HELOCI senders
    console.log(`\n3. CHECKING FOR DEFAULT HELOCI SENDERS:\n`);

    const expectedSenders = [
      'support@heloci.us',
      'housing@heloci.us',
      'documents@heloci.us',
      'admin@heloci.us',
    ];

    const foundSenders = allSenders.map(s => s.emailAddress.toLowerCase());

    for (const expected of expectedSenders) {
      const found = foundSenders.includes(expected.toLowerCase());
      const status = found ? '✓ FOUND' : '✗ MISSING';
      console.log(`   ${status}: ${expected}`);
    }

    // Check database organizations to understand context
    console.log(`\n4. ORGANIZATIONS IN DATABASE:\n`);

    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orgs.length === 0) {
      console.log('   ⚠️  No organizations found in database!');
    } else {
      for (const org of orgs) {
        console.log(`   - ${org.name} (${org.id})`);
        console.log(`     Created: ${org.createdAt.toISOString()}`);
      }
    }

    // Get the HELOCI organization if it exists
    console.log(`\n5. CHECKING HELOCI ORGANIZATION:\n`);

    const heloiOrg = await prisma.organization.findFirst({
      where: { name: { contains: 'Heloci', mode: 'insensitive' } },
    });

    if (heloiOrg) {
      console.log(`   Found HELOCI Organization: ${heloiOrg.name}`);
      console.log(`   Organization ID: ${heloiOrg.id}`);

      // Count senders for this org
      const helociSenders = await prisma.senderIdentity.count({
        where: { organizationId: heloiOrg.id },
      });

      console.log(`   Sender Count: ${helociSenders}`);

      // List them
      if (helociSenders > 0) {
        const senders = await prisma.senderIdentity.findMany({
          where: { organizationId: heloiOrg.id },
        });

        console.log('   Senders:');
        for (const sender of senders) {
          console.log(`      - ${sender.emailAddress} (${sender.verificationStatus})`);
        }
      }
    } else {
      console.log('   ⚠️  No HELOCI organization found in database');
    }

    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditSenderIdentity();
