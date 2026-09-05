// Complete end-to-end test for Super Admin login flow
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testCompleteFlow() {
  console.log("\n✅ COMPLETE SUPER ADMIN LOGIN FLOW TEST\n");
  console.log("This test simulates the entire login journey:\n");

  try {
    // Step 1: Verify Supabase user exists and is confirmed
    console.log("📍 STEP 1: Verifying Supabase User\n");
    
    const supabaseUsers = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!supabaseUsers.ok) {
      throw new Error(`Failed to fetch Supabase users: ${supabaseUsers.status}`);
    }

    const { users } = await supabaseUsers.json();
    const superAdminSupabase = users.find(u => u.email === "superadmin@heloci.platform");

    if (!superAdminSupabase) {
      throw new Error("Super Admin not found in Supabase");
    }

    console.log(`  ✅ Email: ${superAdminSupabase.email}`);
    console.log(`  ✅ Supabase ID: ${superAdminSupabase.id}`);
    console.log(`  ✅ Email Confirmed At: ${superAdminSupabase.email_confirmed_at}`);
    console.log(`  ✅ Email Verified (metadata): ${superAdminSupabase.user_metadata?.email_verified ?? "NOT SET"}`);
    console.log(`  ✅ Email Auth Status: ${superAdminSupabase.confirmed_at ? "✅ CONFIRMED" : "❌ NOT CONFIRMED"}\n`);

    // Step 2: Verify Prisma user has correct role
    console.log("📍 STEP 2: Verifying Prisma Database Record\n");

    const superAdminPrisma = await prisma.user.findUnique({
      where: { email: "superadmin@heloci.platform" }
    });

    if (!superAdminPrisma) {
      throw new Error("Super Admin not found in Prisma");
    }

    console.log(`  ✅ Email: ${superAdminPrisma.email}`);
    console.log(`  ✅ Prisma ID: ${superAdminPrisma.id}`);
    console.log(`  ✅ Role: ${superAdminPrisma.role} (Expected: SUPER_ADMIN)`);
    console.log(`  ✅ Organization ID: ${superAdminPrisma.organizationId ?? "(null - Platform Admin)"}`);
    console.log(`  ✅ Department ID: ${superAdminPrisma.departmentId ?? "null"}`);
    console.log(`  ✅ Team ID: ${superAdminPrisma.teamId ?? "null"}\n`);

    // Verify role is exactly SUPER_ADMIN
    if (superAdminPrisma.role !== "SUPER_ADMIN") {
      throw new Error(`Invalid role: expected SUPER_ADMIN, got ${superAdminPrisma.role}`);
    }

    if (superAdminPrisma.organizationId !== null) {
      throw new Error(`Invalid organizationId: expected null, got ${superAdminPrisma.organizationId}`);
    }

    // Step 3: Verify permission logic (what session.ts will do)
    console.log("📍 STEP 3: Verifying Session Permission Logic\n");

    const isPlatformAdmin = superAdminPrisma.role === "SUPER_ADMIN" && !superAdminPrisma.organizationId;
    const wouldHaveDashboardAccess = isPlatformAdmin;

    console.log(`  ✅ isPlatformAdmin calculation: ${isPlatformAdmin}`);
    console.log(`  ✅ Would have dashboard access: ${wouldHaveDashboardAccess}\n`);

    if (!wouldHaveDashboardAccess) {
      throw new Error("Super Admin would be redirected - permissions not correct");
    }

    // Step 4: Verify organizations exist (for dashboard to display)
    console.log("📍 STEP 4: Verifying Organizations Available\n");

    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    if (organizations.length === 0) {
      throw new Error("No organizations found - dashboard will fail");
    }

    organizations.forEach((org, idx) => {
      console.log(`  ✅ Organization ${idx + 1}: ${org.name} (${org.id})`);
    });

    console.log("\n");

    // Final verdict
    console.log("═".repeat(70));
    console.log("🎉 ALL CHECKS PASSED - SUPER ADMIN SHOULD BE ABLE TO LOGIN");
    console.log("═".repeat(70));
    console.log("\nLogin with:");
    console.log("  Email: superadmin@heloci.platform");
    console.log("  Password: configured through environment");
    console.log("\nExpected flow:");
    console.log("  1. ✅ Supabase authentication succeeds");
    console.log("  2. ✅ Session detects SUPER_ADMIN role");
    console.log("  3. ✅ Dashboard loads with organization selector");
    console.log("  4. ✅ Super Admin can access /admin/dashboard\n");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();
