#!/usr/bin/env node

/**
 * Debug script to understand Supabase email confirmation field names
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

async function debug() {
  console.log('\n🔍 SUPABASE EMAIL CONFIRMATION DEBUG\n');

  try {
    // Get one user with full details
    console.log('📋 Fetching one user with full details...\n');
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await res.json();
    const user = users[0];

    console.log('User Fields:');
    Object.keys(user).forEach(key => {
      const value = user[key];
      const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
      console.log(`  ${key}: ${displayValue}`);
    });

    console.log('\n🔑 Key Finding:');
    console.log(`  email_confirmed field exists: ${user.hasOwnProperty('email_confirmed') ? 'YES' : 'NO'}`);
    console.log(`  Current value: ${user.email_confirmed}`);
    console.log(`  Type: ${typeof user.email_confirmed}`);

    // Try to update and see what happens
    console.log('\n🔄 Testing confirmation update...\n');
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email_confirm: true
      })
    });

    const updatedUser = await updateRes.json();
    
    console.log('After calling email_confirm: true:');
    console.log(`  Status Code: ${updateRes.status}`);
    console.log(`  Response email_confirmed: ${updatedUser.email_confirmed}`);
    console.log(`  Response:`, JSON.stringify(updatedUser, null, 2));

    // Check if there's a different field name
    console.log('\n🔎 Checking all response fields:\n');
    Object.keys(updatedUser).forEach(key => {
      if (key.toLowerCase().includes('confirm') || key.toLowerCase().includes('email')) {
        console.log(`  ${key}: ${updatedUser[key]}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debug();
