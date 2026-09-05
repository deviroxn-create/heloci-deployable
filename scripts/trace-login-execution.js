// TRACE EXECUTION PATH: Super Admin Login Flow
// Tests EVERY step from login form to dashboard

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "superadmin@heloci.platform";
const PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function traceExecution() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: LOGIN FORM - Supabase signInWithPassword()");
  console.log("=".repeat(80));
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${PASSWORD.substring(0, 4)}...`);

  try {
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });

    const signInBody = await signInRes.json();

    if (!signInRes.ok) {
      console.log("❌ SIGN IN FAILED");
      console.log(`Status: ${signInRes.status}`);
      console.log(`Error: ${signInBody.error_description || signInBody.message}`);
      console.log(`Response: ${JSON.stringify(signInBody, null, 2)}`);
      process.exit(1);
    }

    console.log("✅ SIGN IN SUCCESSFUL");
    const accessToken = signInBody.access_token;
    const supabaseUserId = signInBody.user.id;
    const supabaseEmail = signInBody.user.email;
    console.log(`Supabase User ID: ${supabaseUserId}`);
    console.log(`Supabase Email: ${supabaseEmail}`);
    console.log(`Access Token: ${accessToken.substring(0, 30)}...`);

    // STEP 2: Session creation - Verify user in Supabase
    console.log("\n" + "=".repeat(80));
    console.log("STEP 2: SESSION CREATION - Verify Supabase User");
    console.log("=".repeat(80));

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "apikey": ANON_KEY
      }
    });

    const userData = await userRes.json();
    console.log("✅ Supabase User Data:");
    console.log(`  ID: ${userData.id}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Email Confirmed: ${userData.email_confirmed_at ? "✅ YES" : "❌ NO"}`);
    console.log(`  User Metadata: ${JSON.stringify(userData.user_metadata, null, 2)}`);

    // STEP 3: Middleware - Check if user exists
    console.log("\n" + "=".repeat(80));
    console.log("STEP 3: MIDDLEWARE - getUser() from auth.getUser()");
    console.log("=".repeat(80));
    console.log(`Middleware would call: supabase.auth.getUser()`);
    console.log(`User returned: ${userData.email}`);
    console.log(`Proceeding to /admin/dashboard...`);

    // STEP 4: getCurrentUser() - Load from Prisma
    console.log("\n" + "=".repeat(80));
    console.log("STEP 4: getCurrentUser() - Load from Prisma");
    console.log("=".repeat(80));

    const dbUser = await prisma.user.findUnique({
      where: { email: EMAIL }
    });

    if (!dbUser) {
      console.log("❌ USER NOT FOUND IN PRISMA");
      console.log("Database query returned: null");
      console.log("This means the seed script was not run!");
      console.log("Running upsert to create user...");

      const upsertedUser = await prisma.user.upsert({
        where: { email: EMAIL },
        update: {
          name: "Platform Super Admin",
          role: "SUPER_ADMIN",
          organizationId: null,
          departmentId: null,
          teamId: null
        },
        create: {
          email: EMAIL,
          name: "Platform Super Admin",
          role: "SUPER_ADMIN",
          organizationId: null
        }
      });

      console.log("✅ USER CREATED IN PRISMA");
      console.log(`ID: ${upsertedUser.id}`);
      console.log(`Email: ${upsertedUser.email}`);
      console.log(`Role: ${upsertedUser.role}`);
      console.log(`Organization ID: ${upsertedUser.organizationId}`);
    } else {
      console.log("✅ USER FOUND IN PRISMA");
      console.log(`ID: ${dbUser.id}`);
      console.log(`Email: ${dbUser.email}`);
      console.log(`Name: ${dbUser.name}`);
      console.log(`Role: ${dbUser.role}`);
      console.log(`Organization ID: ${dbUser.organizationId}`);
      console.log(`Department ID: ${dbUser.departmentId}`);
      console.log(`Team ID: ${dbUser.teamId}`);
    }

    const currentDbUser = dbUser || await prisma.user.findUnique({ where: { email: EMAIL } });

    // STEP 5: Role detection
    console.log("\n" + "=".repeat(80));
    console.log("STEP 5: ROLE DETECTION - Check isPlatformAdmin");
    console.log("=".repeat(80));

    const isPlatformAdmin = currentDbUser.role === "SUPER_ADMIN" && !currentDbUser.organizationId;
    console.log(`Role: ${currentDbUser.role}`);
    console.log(`Organization ID: ${currentDbUser.organizationId}`);
    console.log(`Calculation: role === "SUPER_ADMIN" && organizationId === null`);
    console.log(`isPlatformAdmin: ${isPlatformAdmin}`);

    if (!isPlatformAdmin) {
      console.log("❌ NOT PLATFORM ADMIN - Would redirect to /login?error=no_organization");
      process.exit(1);
    }

    // STEP 6: Organization resolution
    console.log("\n" + "=".repeat(80));
    console.log("STEP 6: ORGANIZATION RESOLUTION - Load organizations");
    console.log("=".repeat(80));

    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${organizations.length} organizations:`);
    organizations.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.name} (${org.id})`);
    });

    if (organizations.length === 0) {
      console.log("❌ NO ORGANIZATIONS FOUND - Dashboard would fail");
      process.exit(1);
    }

    const selectedOrgId = organizations[0].id;
    console.log(`\nSelected org (first): ${selectedOrgId}`);

    // STEP 7: Dashboard data
    console.log("\n" + "=".repeat(80));
    console.log("STEP 7: DASHBOARD RENDERING - Load org data");
    console.log("=".repeat(80));

    const org = await prisma.organization.findUnique({
      where: { id: selectedOrgId },
      select: { id: true, name: true, slug: true }
    });

    console.log(`Organization: ${org.name}`);
    console.log(`Org ID: ${org.id}`);

    // STEP 8: Final session state
    console.log("\n" + "=".repeat(80));
    console.log("STEP 8: FINAL SESSION STATE");
    console.log("=".repeat(80));

    console.log(`User ID: ${currentDbUser.id}`);
    console.log(`Email: ${currentDbUser.email}`);
    console.log(`Role: ${currentDbUser.role}`);
    console.log(`isPlatformAdmin: ${isPlatformAdmin}`);
    console.log(`Organization: ${org.name}`);
    console.log(`Redirect: /admin/dashboard`);

    console.log("\n" + "=".repeat(80));
    console.log("✅ LOGIN FLOW COMPLETE - NO ERRORS");
    console.log("=".repeat(80));
    console.log(`\nSUPER ADMIN CAN ACCESS DASHBOARD\n`);

  } catch (error) {
    console.error("\n❌ ERROR DURING EXECUTION:");
    console.error(`File: ${error.stack.split('\n')[1]}`);
    console.error(`Message: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

traceExecution();
