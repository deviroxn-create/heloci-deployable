/**
 * Database State Verification Script
 * 
 * Verifies that all required database relationships exist
 * for the seeded users and organizations.
 */

import { prisma } from "../lib/prisma/client";

async function verifyDatabaseState() {
  console.log("\n🔍 Verifying Database State...\n");
  
  let hasErrors = false;

  // 1. Check Users
  console.log("1. Checking Users...");
  const users = await prisma.user.findMany({
    include: {
      organization: true,
      department: true,
      team: true,
    }
  });
  
  console.log(`   Found ${users.length} users`);
  
  for (const user of users) {
    console.log(`\n   User: ${user.email}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - OrganizationId: ${user.organizationId || "NULL"}`);
    console.log(`   - DepartmentId: ${user.departmentId || "NULL"}`);
    console.log(`   - TeamId: ${user.teamId || "NULL"}`);
    
    // Platform Super Admin should have NULL organizationId
    if (user.role === "SUPER_ADMIN" && user.organizationId) {
      console.log(`   ⚠️  WARNING: Super Admin should have NULL organizationId`);
      hasErrors = true;
    }
    
    // Staff should have organizationId
    if ((user.role === "ADMIN" || user.role === "STAFF") && !user.organizationId) {
      console.log(`   ⚠️  WARNING: Staff member missing organizationId`);
      hasErrors = true;
    }
  }

  // 2. Check OrganizationMembers
  console.log("\n\n2. Checking OrganizationMembers...");
  const orgMembers = await prisma.organizationMember.findMany({
    include: {
      user: { select: { email: true, role: true } },
      organization: { select: { name: true } }
    }
  });
  
  console.log(`   Found ${orgMembers.length} organization memberships`);
  
  for (const member of orgMembers) {
    console.log(`\n   Membership:`);
    console.log(`   - User: ${member.user.email}`);
    console.log(`   - Organization: ${member.organization.name}`);
    console.log(`   - Role: ${member.role}`);
    console.log(`   - User Role: ${member.user.role}`);
  }

  // 3. Check for orphan staff (staff with organizationId but no OrganizationMember)
  console.log("\n\n3. Checking for orphan staff records...");
  const staffUsers = users.filter(u => 
    (u.role === "ADMIN" || u.role === "STAFF") && u.organizationId
  );
  
  for (const staff of staffUsers) {
    const membership = orgMembers.find(m => m.userId === staff.id && m.organizationId === staff.organizationId);
    if (!membership) {
      console.log(`   ⚠️  ERROR: ${staff.email} has organizationId but NO OrganizationMember record!`);
      hasErrors = true;
    } else {
      console.log(`   ✓ ${staff.email} has valid OrganizationMember record`);
    }
  }

  // 4. Check Organizations
  console.log("\n\n4. Checking Organizations...");
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          members: true,
          programs: true,
          departments: true
        }
      }
    }
  });
  
  for (const org of orgs) {
    console.log(`\n   Organization: ${org.name} (${org.slug})`);
    console.log(`   - ID: ${org.id}`);
    console.log(`   - Members: ${org._count.members}`);
    console.log(`   - Programs: ${org._count.programs}`);
    console.log(`   - Departments: ${org._count.departments}`);
    console.log(`   - Active: ${org.isActive}`);
  }

  // 5. Check Departments
  console.log("\n\n5. Checking Departments...");
  const departments = await prisma.department.findMany({
    include: {
      organization: { select: { name: true } },
      _count: { select: { staff: true, teams: true } }
    }
  });
  
  console.log(`   Found ${departments.length} departments`);
  for (const dept of departments) {
    console.log(`   - ${dept.name} (${dept.organization.name}): ${dept._count.staff} staff, ${dept._count.teams} teams`);
  }

  // 6. Check Teams
  console.log("\n\n6. Checking Teams...");
  const teams = await prisma.team.findMany({
    include: {
      department: { select: { name: true } },
      _count: { select: { staff: true } }
    }
  });
  
  console.log(`   Found ${teams.length} teams`);
  for (const team of teams) {
    console.log(`   - ${team.name} (${team.department.name}): ${team._count.staff} staff`);
  }

  // 7. Check Applications
  console.log("\n\n7. Checking Applications...");
  const apps = await prisma.programApplication.findMany({
    include: {
      program: { select: { name: true, organizationId: true } },
      user: { select: { email: true } }
    },
    take: 5
  });
  
  console.log(`   Found ${apps.length} applications (showing first 5)`);
  for (const app of apps) {
    console.log(`   - ${app.user.email} → ${app.program.name} (${app.status})`);
  }

  // 8. Check CaseConversations
  console.log("\n\n8. Checking CaseConversations...");
  const conversations = await prisma.caseConversation.findMany({
    include: {
      _count: { select: { messages: true } }
    },
    take: 5
  });
  
  console.log(`   Found ${conversations.length} conversations (showing first 5)`);
  for (const conv of conversations) {
    console.log(`   - Conversation ${conv.id}: ${conv._count.messages} messages`);
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  if (hasErrors) {
    console.log("❌ Database State: ERRORS FOUND");
    console.log("   Please review warnings above and fix data issues");
  } else {
    console.log("✅ Database State: ALL CHECKS PASSED");
  }
  console.log("=".repeat(60) + "\n");
  
  return !hasErrors;
}

// Run verification
verifyDatabaseState()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
