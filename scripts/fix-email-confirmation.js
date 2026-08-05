#!/usr/bin/env node

/**
 * URGENT FIX: Confirm all user emails in Supabase
 * 
 * This script confirms all user emails to unblock login issues.
 * Use when: Users cannot login due to "email not confirmed" error
 * 
 * Usage:
 *   node scripts/fix-email-confirmation.js
 */

const fs = require('fs');
const path = require('path');

// Read .env file directly
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function fixEmailConfirmation() {
  console.log('\n🔧 EMAIL CONFIRMATION FIX SCRIPT\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  try {
    // 1. List all users
    console.log('📋 STEP 1: Fetching all users from Supabase...');
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=1000`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!listRes.ok) {
      console.error('❌ Failed to fetch users:', listRes.status);
      return;
    }

    const { users } = await listRes.json();
    console.log(`✓ Found ${users.length} users\n`);

    // 2. Identify unconfirmed users
    const unconfirmedUsers = users.filter(u => !u.email_confirmed);
    console.log(`📊 Status:`);
    console.log(`   Confirmed: ${users.length - unconfirmedUsers.length}`);
    console.log(`   Unconfirmed: ${unconfirmedUsers.length}\n`);

    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users have confirmed emails! No action needed.\n');
      return;
    }

    // 3. Confirm each unconfirmed user
    console.log('🔐 STEP 2: Confirming email for each unconfirmed user...\n');
    
    let confirmed = 0;
    let failed = 0;

    for (const user of unconfirmedUsers) {
      const confirmRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ email_confirm: true })
        }
      );

      if (confirmRes.ok) {
        console.log(`   ✓ ${user.email}`);
        confirmed++;
      } else {
        console.log(`   ✗ ${user.email} (${confirmRes.status})`);
        failed++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✓ Confirmed: ${confirmed}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log('\n✅ EMAIL CONFIRMATION FIX COMPLETE!\n');

    if (failed === 0) {
      console.log('All users can now login without email confirmation issues.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixEmailConfirmation();
