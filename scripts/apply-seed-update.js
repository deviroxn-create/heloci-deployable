// Apply seed updates to database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applySeedUpdate() {
  console.log("\n🌱 APPLYING SEED UPDATES\n");

  try {
    // Get the department and team
    const helocicaseManagementDept = await prisma.department.findFirst({
      where: { organizationId: "org_heloci", code: "CASE" }
    });

    const helocicaseReviewTeam = await prisma.team.findFirst({
      where: { departmentId: helocicaseManagementDept?.id, name: "Case Review Team" }
    });

    if (!helocicaseManagementDept || !helocicaseReviewTeam) {
      console.error("❌ Department or team not found");
      process.exit(1);
    }

    console.log(`Department: ${helocicaseManagementDept.name} (${helocicaseManagementDept.id})`);
    console.log(`Team: ${helocicaseReviewTeam.name} (${helocicaseReviewTeam.id})\n`);

    // Update staff@heloci.ngo
    const updated = await prisma.user.update({
      where: { email: "staff@heloci.ngo" },
      data: {
        departmentId: helocicaseManagementDept.id,
        teamId: helocicaseReviewTeam.id,
        jobTitle: "Housing Case Worker",
        employeeId: "EMP-002",
        employmentStatus: "ACTIVE",
        hireDate: new Date("2024-01-15")
      }
    });

    console.log(`✅ Updated staff@heloci.ngo:`);
    console.log(`   Department: ${updated.departmentId}`);
    console.log(`   Team: ${updated.teamId}`);
    console.log(`   Job Title: ${updated.jobTitle}`);
    console.log(`   Employee ID: ${updated.employeeId}\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applySeedUpdate();
