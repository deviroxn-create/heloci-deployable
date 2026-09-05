#!/usr/bin/env node

/**
 * Test login using Supabase client SDK to see actual error message
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
const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_PASSWORD = envVars.DEFAULT_ADMIN_PASSWORD;

const TEST_EMAIL = 'superadmin@heloci.platform';

console.log('\n🔐 SUPABASE CLIENT LOGIN TEST\n');

// Using direct Supabase auth endpoint (same as SDK uses)
async function testLogin() {
  try {
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD.substring(0, 4)}...`);
    console.log('\nAttempting login...\n');

    const res = await fetch(
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

    const data = await res.json();

    console.log(`Status: ${res.status}`);
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (res.status === 200) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log(`Access token received: ${data.access_token.substring(0, 30)}...`);
    } else {
      console.log('\n❌ LOGIN FAILED!');
      console.log(`Error: ${data.error_description || data.message}`);
      
      // Parse error for hints
      const msg = (data.error_description || '').toLowerCase();
      if (msg.includes('email not confirmed') || msg.includes('confirm')) {
        console.log('\n💡 ISSUE: Supabase requires email confirmation');
        console.log('   Possible causes:');
        console.log('   1. email_confirmed_at field not set properly');
        console.log('   2. Auth session needs refresh');
        console.log('   3. Supabase project settings require email verification');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
