#!/usr/bin/env node

/**
 * Direct test of Supabase Super Admin authentication
 * Reads .env file directly and tests auth flow
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
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_PASSWORD = envVars.DEFAULT_ADMIN_PASSWORD || 'Super1234!';

const TEST_EMAIL = 'superadmin@heloci.platform';

console.log('\n🔍 SUPER ADMIN AUTHENTICATION DIAGNOSTIC\n');
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log(`Test Password: ${TEST_PASSWORD.substring(0, 4)}...`);

async function diagnose() {
  try {
    // 1. Check if user exists
    console.log('\n📋 STEP 1: Checking if Super Admin exists...');
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=10`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const listData = await listRes.json();
    
    if (!listRes.ok) {
      console.log('❌ Failed to list users:', listData);
      return;
    }

    console.log(`✓ Found ${listData.users?.length || 0} users in Supabase`);
    
    const superAdmin = listData.users?.find(u => u.email === TEST_EMAIL);
    if (!superAdmin) {
      console.log('❌ Super Admin not found!');
      console.log('Available users:');
      listData.users?.forEach(u => {
        console.log(`   - ${u.email} (confirmed: ${u.email_confirmed})`);
      });
      return;
    }

    console.log(`✓ Found Super Admin: ${superAdmin.email}`);
    console.log(`   Email Confirmed: ${superAdmin.email_confirmed}`);
    console.log(`   User ID: ${superAdmin.id}`);

    // 2. If not confirmed, confirm it
    if (!superAdmin.email_confirmed) {
      console.log('\n⚠️  Email not confirmed. Confirming via admin API...');
      const confirmRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${superAdmin.id}`,
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

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        console.log('❌ Failed to confirm email:', err);
        return;
      }

      console.log('✓ Email confirmed via admin API');
    }

    // 3. Try to login
    console.log('\n🔐 STEP 2: Testing login with credentials...');
    const loginRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      }
    );

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.log(`❌ Login failed (${loginRes.status}):`);
      console.log(`   Error: ${loginData.error_description || loginData.message || JSON.stringify(loginData)}`);
      
      // Diagnose the issue
      const msg = (loginData.error_description || '').toLowerCase();
      if (msg.includes('email not confirmed') || msg.includes('confirm')) {
        console.log('\n💡 ROOT CAUSE: Email confirmation required by project settings');
        console.log('   This means the Supabase project has "Require email confirmation" enabled');
        console.log('   even though we set email_confirm: true in the admin API.');
        console.log('\n✅ SOLUTION: Email was just confirmed above. Try logging in again.');
      } else if (msg.includes('invalid')) {
        console.log('\n💡 ROOT CAUSE: Invalid credentials');
      }
      return;
    }

    console.log('✅ LOGIN SUCCESSFUL!');
    console.log(`   Access Token: ${loginData.access_token.substring(0, 20)}...`);
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnose();
