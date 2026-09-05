// Delete and recreate Super Admin with correct password
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMAIL = "superadmin@heloci.platform";
const PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY || !PASSWORD) {
  throw new Error("Required Supabase and admin password environment variables are missing");
}

async function resetSuperAdmin() {
  console.log("\n🔄 RESETTING SUPER ADMIN USER\n");

  try {
    // Step 1: Get user ID
    console.log("Step 1: Finding existing Super Admin...");
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const { users } = await usersRes.json();
    const existingUser = users.find(u => u.email === EMAIL);

    if (!existingUser) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log(`✅ Found user: ${existingUser.id}`);

    // Step 2: Delete user
    console.log("\nStep 2: Deleting existing user...");
    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!deleteRes.ok) {
      console.error(`❌ Delete failed: ${deleteRes.status}`);
      process.exit(1);
    }

    console.log("✅ User deleted");

    // Step 3: Create new user
    console.log("\nStep 3: Creating new Super Admin...");
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: "Platform Super Admin",
          email_verified: true
        }
      })
    });

    const createBody = await createRes.json();

    if (!createRes.ok) {
      console.error(`❌ Create failed: ${createRes.status}`);
      console.error(createBody);
      process.exit(1);
    }

    console.log(`✅ User created: ${createBody.id}`);
    console.log(`   Email: ${createBody.email}`);
    console.log(`   Email Confirmed: ✅`);

    // Step 4: Test login
    console.log("\nStep 4: Testing login with new password...");
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });

    const loginBody = await loginRes.json();

    if (!loginRes.ok) {
      console.error(`❌ Login failed: ${loginRes.status}`);
      console.error(loginBody);
      process.exit(1);
    }

    console.log("✅ LOGIN SUCCESSFUL!");
    console.log(`   User ID: ${loginBody.user.id}`);
    console.log(`   Email: ${loginBody.user.email}`);
    console.log(`   Token: ${loginBody.access_token.substring(0, 30)}...`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ SUPER ADMIN READY TO LOGIN");
    console.log("=".repeat(70));
    console.log(`\nEmail: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}\n`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

resetSuperAdmin();
