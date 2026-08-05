/**
 * PHASE 5F-A — Supabase Signup Debug Script
 * 
 * Goal: Investigate why supabase.auth.signUp() fails
 * 
 * Steps:
 * 1. Verify Supabase client initialization
 * 2. Check environment variables
 * 3. Attempt a test signup
 * 4. Capture error details
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env file
dotenv.config();

async function debugSupabaseSignup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("\n=== PHASE 5F-A: Supabase Signup Debug ===\n");

  // Step 1: Verify environment variables
  console.log("[1] Environment Variables Check:");
  console.log(`    NEXT_PUBLIC_SUPABASE_URL present: ${!!url}`);
  console.log(`    NEXT_PUBLIC_SUPABASE_ANON_KEY present: ${!!anonKey}`);

  if (!url || !anonKey) {
    console.error("\n❌ FAILED: Missing Supabase environment variables!");
    process.exit(1);
  }

  // Step 2: Initialize Supabase client
  console.log("\n[2] Supabase Client Initialization:");
  try {
    const supabase = createClient(url, anonKey);
    console.log("    ✅ Client created successfully");
  } catch (error) {
    console.error(`    ❌ Client creation failed: ${error}`);
    process.exit(1);
  }

  // Step 3: Test signup with unique email
  const testEmail = `test-${Date.now()}@resend.dev`;
  const testPassword = "TempPassword123!";

  console.log("\n[3] Test Signup Request:");
  console.log(`    Email: ${testEmail}`);
  console.log(`    Password: ${testPassword}`);

  try {
    const supabase = createClient(url, anonKey);
    
    console.log("\n[4] Sending auth.signUp request...");
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: "Debug Test User" },
        emailRedirectTo: "http://localhost:3000/login"
      }
    });

    if (error) {
      console.error("\n❌ SIGNUP FAILED:");
      console.error(`    Error Code: ${error.status}`);
      console.error(`    Error Message: ${error.message}`);
      console.error(`    Error Details:`, JSON.stringify(error, null, 2));
    } else {
      console.log("\n✅ SIGNUP SUCCEEDED:");
      console.log(`    User ID: ${data?.user?.id}`);
      console.log(`    Email: ${data?.user?.email}`);
      console.log(`    Session: ${data?.session ? "Present" : "Not present"}`);
      console.log(`    Email confirmed: ${data?.user?.email_confirmed_at ? "Yes" : "No"}`);
    }
  } catch (error) {
    console.error("\n❌ UNEXPECTED ERROR:");
    console.error(error);
    process.exit(1);
  }

  console.log("\n=== Debug Complete ===\n");
}

debugSupabaseSignup();
