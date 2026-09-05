// List all Supabase users
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase environment variables are required");

async function listUsers() {
  console.log("\n🔍 SUPABASE USERS IN PROJECT:");
  console.log(`URL: ${SUPABASE_URL}\n`);

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      console.error(`❌ Failed: ${res.status}`);
      process.exit(1);
    }

    const { users } = await res.json();
    console.log(`Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log("❌ NO USERS FOUND IN SUPABASE");
      console.log("Run: npm run seed\n");
      process.exit(1);
    }

    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? "✅" : "❌"}`);
      console.log(`   Created: ${user.created_at}\n`);
    });

    const superAdmin = users.find(u => u.email === "superadmin@heloci.platform");
    if (!superAdmin) {
      console.log("⚠️  superadmin@heloci.platform NOT FOUND");
      console.log("Need to create it with seed script\n");
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

listUsers();
