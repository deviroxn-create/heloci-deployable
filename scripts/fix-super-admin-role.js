// Quick fix: Update the Super Admin role from ADMIN to SUPER_ADMIN in Prisma
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixSuperAdminRole() {
  console.log("\n🔧 FIXING SUPER ADMIN ROLE IN PRISMA...\n");

  try {
    const superAdmin = await prisma.user.findUnique({
      where: { email: "superadmin@heloci.platform" }
    });

    if (!superAdmin) {
      console.error("❌ Super Admin not found in database");
      process.exit(1);
    }

    console.log(`Found Super Admin:
  Email: ${superAdmin.email}
  Current Role: ${superAdmin.role}
  Organization ID: ${superAdmin.organizationId ?? "(null - Platform Admin)"}
`);

    if (superAdmin.role === "SUPER_ADMIN") {
      console.log("✅ Role is already SUPER_ADMIN — no fix needed");
      process.exit(0);
    }

    // Fix the role
    const updated = await prisma.user.update({
      where: { email: "superadmin@heloci.platform" },
      data: {
        role: "SUPER_ADMIN",
        organizationId: null,  // Ensure it's null for platform admin
        departmentId: null,
        teamId: null,
        jobTitle: null,
        employeeId: null,
        employmentStatus: null,
        hireDate: null
      }
    });

    console.log(`✅ FIXED! Super Admin role updated:
  Role: ${updated.role}
  Organization ID: ${updated.organizationId ?? "(null - Platform Admin)"}
`);

    console.log("🎉 Super Admin should now be able to access the platform!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperAdminRole();
