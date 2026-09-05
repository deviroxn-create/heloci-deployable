#!/usr/bin/env node

/**
 * NUCLEAR OPTION: Delete Super Admin and recreate from scratch
 * Sometimes the simplest fix is to start fresh
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
const TEST_PASSWORD = envVars.DEFAULT_ADMIN_PASSWORD;
const TEST_EMAIL = 'superadmin@heloci.platform';

async function nukeAndRecreate() {
  console.log('\n💣 NUCLEAR OPTION: DELETE & RECREATE SUPER ADMIN\n');

  try {
    // Step 1: Find and delete existing Super Admin
    console.log('Step 1: Finding existing Super Admin...');
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=100`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await listRes.json();
    const existingUser = users.find(u => u.email === TEST_EMAIL);

    if (existingUser) {
      console.log(`✓ Found existing Super Admin: ${existingUser.email}`);
      console.log(`  ID: ${existingUser.id}`);
      
      console.log('\nStep 2: Deleting existing user...');
      const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });

      if (deleteRes.ok) {
        console.log('✓ User deleted successfully');
      } else {
        console.log(`⚠️  Delete returned status ${deleteRes.status}, continuing anyway...`);
      }
    } else {
      console.log('ℹ️  No existing Super Admin found');
    }

    // Step 2: Create fresh Super Admin with all the right settings
    console.log('\nStep 3: Creating fresh Super Admin with correct settings...');
    
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,  // Confirm immediately
        user_metadata: {
          full_name: 'Platform Super Admin',
          email_verified: true  // CRITICAL: Set this too!
        }
      })
    });

    const newUser = await createRes.json();

    if (!createRes.ok) {
      console.log(`❌ Failed to create user: ${createRes.status}`);
      console.log(`Error: ${newUser.message}`);
      return;
    }

    console.log(`✓ Super Admin created: ${newUser.email}`);
    console.log(`  ID: ${newUser.id}`);
    console.log(`  email_confirmed_at: ${newUser.email_confirmed_at}`);
    console.log(`  user_metadata.email_verified: ${newUser.user_metadata?.email_verified}`);

    // Step 3: Test login immediately
    console.log('\nStep 4: Testing login with new credentials...');
    
    const ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
      console.log(`   Access Token: ${loginData.access_token.substring(0, 30)}...`);
      console.log(`\n✅ SUPER ADMIN IS NOW WORKING!\n`);
      console.log('Credentials:');
      console.log(`  Email: ${TEST_EMAIL}`);
      console.log(`  Password: ${TEST_PASSWORD}`);
    } else {
      console.log(`❌ Login failed: ${loginRes.status}`);
      console.log(`   Error: ${loginData.error_description}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

nukeAndRecreate();
