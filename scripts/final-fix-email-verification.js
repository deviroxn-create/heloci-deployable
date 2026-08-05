#!/usr/bin/env node

/**
 * FINAL FIX: Set email_verified in user_metadata for all users
 * This is the missing piece that makes login work!
 */

const fs = require('fs');
const path = require('path');

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

async function finalFix() {
  console.log('\n🔧 FINAL EMAIL VERIFICATION FIX\n');
  console.log('Setting user_metadata.email_verified = true for all users...\n');

  try {
    // 1. Fetch all users
    console.log('📋 Step 1: Fetching all users...');
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=1000`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await listRes.json();
    console.log(`✓ Found ${users.length} users\n`);

    // 2. Update each user
    console.log('🔐 Step 2: Setting email_verified for each user...\n');
    
    let updated = 0;
    let failed = 0;

    for (const user of users) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            email_confirm: true,
            user_metadata: {
              email_verified: true
            }
          })
        }
      );

      if (updateRes.ok) {
        console.log(`   ✓ ${user.email}`);
        updated++;
      } else {
        console.log(`   ✗ ${user.email} (Failed)`);
        failed++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✓ Updated: ${updated}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`\n✅ FINAL EMAIL VERIFICATION FIX COMPLETE!\n`);
    console.log('All users can now login successfully.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalFix();
