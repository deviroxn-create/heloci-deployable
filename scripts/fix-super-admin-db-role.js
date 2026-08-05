// Fix Super Admin role in Prisma database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixRole() {
  console.log("\n🔧 FIXING SUPER ADMIN ROLE IN DATABASE\n");

  try {
    const user = await prisma.user.findUnique({
      where: { email: "superadmin@heloci.platform" }
    });

    console.log(`Before: Role = ${user.role}`);

    const updated = await prisma.user.update({
      where: { email: "superadmin@heloci.platform" },
      data: { role: "SUPER_ADMIN" }
    });

    console.log(`After: Role = ${updated.role}`);
    console.log("\n✅ FIXED\n");

  } finally {
    await prisma.$disconnect();
  }
}

fixRole();
