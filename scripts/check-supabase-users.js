// Check all users in the current Supabase project
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n🔍 CHECKING SUPABASE USERS IN CURRENT PROJECT\n");
console.log(`Supabase URL: ${SUPABASE_URL}`);

async function checkUsers() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch users: ${res.status}`);
      const body = await res.json().catch(() => null);
      console.error(body);
      process.exit(1);
    }

    const { users } = await res.json();
    console.log(`\n✅ Found ${users.length} users:\n`);

    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email Confirmed: ${user.email_confirmed_at ? "✅ YES" : "❌ NO"}`);
      console.log(`   - Email Verified (metadata): ${user.user_metadata?.email_verified ? "✅ YES" : "❌ NO"}`);
      console.log(`   - Created: ${user.created_at}`);
      console.log(`   - Last Sign In: ${user.last_sign_in_at || "Never"}\n`);
    });

    // Check specifically for super admin
    const superAdmin = users.find(u => u.email === "superadmin@heloci.platform");
    if (superAdmin) {
      console.log("✅ Super Admin EXISTS in this Supabase project");
      console.log(`   Status: Email confirmed = ${superAdmin.email_confirmed_at ? "✅" : "❌"}`);
    } else {
      console.log("❌ Super Admin NOT FOUND in this Supabase project");
      console.log("   You need to run the seed script to create users");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkUsers();
