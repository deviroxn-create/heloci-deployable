#!/usr/bin/env node

/**
 * Check Supabase project settings for email confirmation requirement
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

async function checkSettings() {
  console.log('\n🔍 SUPABASE PROJECT SETTINGS CHECK\n');

  try {
    // Check project info
    console.log('📋 Fetching project info from management API...\n');
    
    // The settings might be in different endpoints
    // Try getting user with full profile
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await userRes.json();
    const testUser = users[0];

    console.log('🔎 Analyzing Test User:\n');
    console.log(`Email: ${testUser.email}`);
    console.log(`email_confirmed_at: ${testUser.email_confirmed_at || 'NOT SET'}`);
    console.log(`confirmed_at: ${testUser.confirmed_at || 'NOT SET'}`);
    console.log(`identities: ${JSON.stringify(testUser.identities, null, 2)}`);

    // Check identity email_verified status
    if (testUser.identities && testUser.identities.length > 0) {
      const identity = testUser.identities[0];
      console.log(`\nIdentity email_verified: ${identity.identity_data?.email_verified}`);
      console.log(`\n⚠️  KEY ISSUE FOUND!`);
      console.log(`The identity.identity_data.email_verified is: ${identity.identity_data?.email_verified}`);
      console.log(`Even though we set email_confirmed_at, the identity still shows email_verified: false`);
      console.log(`\nThis might be the real issue - we need to update the IDENTITY, not just the user!`);
    }

    // Try to create a new user without confirmation requirement
    console.log('\n\n🧪 TESTING: Create new test user...\n');
    
    const newUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: { full_name: 'Test User' }
      })
    });

    const newUserData = await newUserRes.json();
    console.log(`Response Status: ${newUserRes.status}`);
    console.log(`New user email_confirmed_at: ${newUserData.email_confirmed_at || 'NOT SET'}`);
    console.log(`New user response:`, JSON.stringify(newUserData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSettings();
