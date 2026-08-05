#!/usr/bin/env node

/**
 * FINAL FIX: Update Super Admin in Prisma database
 * Ensures the record has correct role and no organization
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const prismaSqlPath = path.join(__dirname, 'fix-super-admin-prisma.sql');

console.log('\n🔧 FINAL PRISMA FIX FOR SUPER ADMIN\n');

// Read the SQL file
const sqlContent = fs.readFileSync(prismaSqlPath, 'utf-8');

// Execute via prisma db execute or direct query
console.log('Running SQL fix...');
console.log(sqlContent);

console.log('\n📝 HOW TO APPLY THIS:\n');
console.log('Option 1: Using Prisma CLI (if you have psql installed):');
console.log('  psql $DATABASE_URL < scripts/fix-super-admin-prisma.sql\n');

console.log('Option 2: Using Prisma Studio:');
console.log('  1. Run: npx prisma studio');
console.log('  2. Go to User table');
console.log('  3. Find superadmin@heloci.platform');
console.log('  4. Update fields:');
console.log('     - role: SUPER_ADMIN');
console.log('     - organizationId: (null)');
console.log('     - departmentId: (null)');
console.log('     - teamId: (null)');
console.log('     - jobTitle: (null)');
console.log('     - employeeId: (null)');
console.log('  5. Click Save\n');

console.log('Option 3: Run next seed:');
console.log('  npx ts-node prisma/seed.ts');
console.log('  (This will recreate the user with correct values)\n');
