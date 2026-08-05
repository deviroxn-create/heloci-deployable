#!/usr/bin/env node

/**
 * Try to update identity email_verified status
 * This might be the missing piece!
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
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_PASSWORD = envVars.DEFAULT_ADMIN_PASSWORD || 'Super1234!';

const TEST_EMAIL = 'superadmin@heloci.platform';

async function updateIdentity() {
  console.log('\n🔍 TESTING: Update identity email_verified\n');

  try {
    // 1. Get user
    console.log('Step 1: Fetching user...');
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=100`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await listRes.json();
    const user = users.find(u => u.email === TEST_EMAIL);

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✓ Found user: ${user.email}`);
    console.log(`  Current email_confirmed_at: ${user.email_confirmed_at}`);

    // 2. Try updating with user_metadata containing email_verified
    console.log('\nStep 2: Trying to set email_verified in user_metadata...');
    
    const updateRes1 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        user_metadata: {
          email_verified: true
        }
      })
    });

    const updated1 = await updateRes1.json();
    console.log(`Response status: ${updateRes1.status}`);
    console.log(`user_metadata.email_verified: ${updated1.user_metadata?.email_verified}`);

    // 3. Try logging in now
    console.log('\nStep 3: Attempting login...');
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

    if (loginRes.status === 200) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log(`Access token: ${loginData.access_token.substring(0, 30)}...`);
    } else {
      console.log(`❌ Login failed: ${loginRes.status}`);
      console.log(`Error: ${loginData.error_description}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateIdentity();
