#!/usr/bin/env node

/**
 * Check if Super Admin exists in Prisma database
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  console.log('\n🔍 CHECKING SUPER ADMIN IN PRISMA DATABASE\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: "superadmin@heloci.platform" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ Super Admin NOT found in Prisma database!');
      console.log('\nThis is the problem - the user exists in Supabase but not in Prisma.');
      console.log('The app syncs from Supabase → Prisma on first login.');
      console.log('Try logging in again - it should auto-create the Prisma record.');
      return;
    }

    console.log('✅ Super Admin found in Prisma:\n');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Organization ID: ${user.organizationId || '(null - Platform Admin)'}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log(`  Updated: ${user.updatedAt}`);

    if (user.role === 'SUPER_ADMIN' && !user.organizationId) {
      console.log('\n✅ User is correctly identified as Platform Super Admin');
    } else {
      console.log('\n⚠️  User role or organization not correct');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
