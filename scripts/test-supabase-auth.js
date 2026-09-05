#!/usr/bin/env node

/**
 * Diagnostic script to test Supabase auth configuration and verify email confirmation status
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

const TEST_EMAIL = 'superadmin@heloci.platform';
const TEST_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;

async function test() {
  console.log('\n🔍 SUPABASE AUTH DIAGNOSTIC TEST\n');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Test Email: ${TEST_EMAIL}`);
  console.log(`   Test Password: ${TEST_PASSWORD.substring(0, 4)}...`);

  try {
    // 1. Check if user exists via admin API
    console.log('\n📋 Step 1: Check if Super Admin exists in Supabase...');
    const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=10`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!adminRes.ok) {
      console.error(`❌ Failed to query users: ${adminRes.status}`);
      const body = await adminRes.json();
      console.error('   Response:', body);
      return;
    }

    const { users } = await adminRes.json();
    const superAdmin = users?.find((u) => u.email === TEST_EMAIL);

    if (!superAdmin) {
      console.warn(`⚠️  Super Admin not found in Supabase`);
      console.log('   Available users:', users?.map((u) => `${u.email} (confirmed: ${u.email_confirmed})`).join(', '));
      return;
    }

    console.log(`✓ Found Super Admin: ${superAdmin.email}`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Email Confirmed: ${superAdmin.email_confirmed}`);
    console.log(`   Created At: ${superAdmin.created_at}`);
    console.log(`   Last Sign In: ${superAdmin.last_sign_in_at || 'Never'}`);

    // 2. Try to confirm email if not confirmed
    if (!superAdmin.email_confirmed) {
      console.log('\n⚠️  Email not confirmed! Attempting to confirm via admin API...');
      const confirmRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${superAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email_confirm: true
        })
      });

      if (!confirmRes.ok) {
        console.error(`❌ Failed to confirm email: ${confirmRes.status}`);
        const body = await confirmRes.json();
        console.error('   Response:', body);
        return;
      }

      console.log('✓ Email confirmation updated via admin API');
    }

    // 3. Try to login with password
    console.log('\n🔐 Step 2: Test login with password...');
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginBody = await loginRes.json();

    if (!loginRes.ok) {
      console.error(`❌ Login failed: ${loginRes.status}`);
      console.error('   Message:', loginBody.error_description || loginBody.message || JSON.stringify(loginBody, null, 2));
      
      // Additional diagnostics
      if (loginBody.error_description?.toLowerCase().includes('email not confirmed')) {
        console.log('\n💡 DIAGNOSIS: Email confirmation is required by Supabase project settings');
        console.log('   SOLUTION: Manually confirm email via Admin API (done above) or disable requirement in Supabase project');
      }
      return;
    }

    console.log('✓ Login successful!');
    console.log(`   Access Token: ${loginBody.access_token.substring(0, 20)}...`);
    console.log(`   User ID: ${loginBody.user.id}`);
    console.log(`   Email: ${loginBody.user.email}`);

    // 4. Verify session can access API
    console.log('\n📡 Step 3: Verify session can call protected API...');
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginBody.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (!userRes.ok) {
      console.error(`❌ Failed to fetch user: ${userRes.status}`);
      return;
    }

    const userData = await userRes.json();
    console.log(`✓ Session verified for user: ${userData.email}`);

    console.log('\n✅ ALL TESTS PASSED - Super Admin auth is working!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

test();
