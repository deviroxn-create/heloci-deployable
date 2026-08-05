// List all Supabase users
const SUPABASE_URL = "https://ufvmgijwozeydfxugjkw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdm1naWp3b3pleWRmeHVnamt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQwODcwMiwiZXhwIjoyMDk3OTg0NzAyfQ.zRksBENZIpLQtdjvGL7Wej0icNBgeu89YMa7MdCOuCc";

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
