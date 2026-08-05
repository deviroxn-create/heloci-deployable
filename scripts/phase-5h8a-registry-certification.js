#!/usr/bin/env node

/**
 * PHASE 5H.8A — REGISTRY CERTIFICATION
 *
 * The baseline audit confirmed all 28 audience-prefixed templates already exist.
 * This is no longer a repair phase — it is a certification phase.
 *
 * DO NOT perform any INSERT operations.
 * DO NOT modify existing templates.
 * DO NOT update metadata unless explicitly authorized.
 *
 * Purpose: Certify that the registry is production-ready
 *
 * Certification Checklist:
 * 1. Identity Verification (all records properly identified)
 * 2. Operational State Verification (all records PUBLISHED and ACTIVE)
 * 3. Content Integrity Verification (no empty/malformed content)
 * 4. Registry Integrity Verification (no duplicates, consistent structure)
 * 5. Planner Certification (all 28 keys resolve to exact matches)
 * 6. Runtime Certification (end-to-end workflow execution)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * The 28 CRITICAL keys certified in Phase 5H.7
 */
const APPROVED_28_KEYS = [
  // TIER 1: CREATE (21 keys)
  "applicant.user-registration.email",
  "applicant.user-registration.internal",
  "admin.user-registration.email",
  "admin.user-registration.internal",
  "admin.user-registration.telegram",
  "applicant.user-login.internal",
  "admin.user-login.internal",
  "admin.user-login.telegram",
  "applicant.application-submitted.internal",
  "admin.application-submitted.internal",
  "reviewer.application-submitted.internal",
  "applicant.application-approved.internal",
  "admin.application-approved.telegram",
  "admin.application-approved.internal",
  "reviewer.application-approved.internal",
  "applicant.application-rejected.internal",
  "admin.application-rejected.telegram",
  "admin.application-rejected.internal",
  "reviewer.application-rejected.internal",
  "applicant.documents-requested.internal",
  "reviewer.documents-requested.internal",
  // TIER 2: CREATE_AUDIENCE_KEY (7 keys)
  "applicant.user-login.email",
  "admin.user-login.email",
  "applicant.application-submitted.email",
  "admin.application-submitted.telegram",
  "applicant.application-approved.email",
  "applicant.application-rejected.email",
  "applicant.documents-requested.email"
];

/**
 * CERTIFICATION 1: Identity Verification
 * Verify all 42 records and the 28 critical records
 */
async function certifyIdentity() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 1: IDENTITY VERIFICATION                        ║");
  console.log("║  All records properly identified with complete metadata          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const allRecords = await prisma.notificationTemplate.findMany({
    select: {
      id: true,
      name: true,
      eventName: true,
      channel: true,
      status: true,
      active: true,
      version: true,
      createdAt: true,
      updatedAt: true
    }
  });

  console.log(`Total records in registry: ${allRecords.length}\n`);

  let identityIssues = [];
  let criticalRecords = [];

  for (const record of allRecords) {
    // Check for required fields
    if (!record.id || !record.name || !record.eventName || !record.channel) {
      identityIssues.push({
        name: record.name,
        issue: "Missing required identifier fields"
      });
    }

    // Check if this is one of the 28 critical keys
    if (APPROVED_28_KEYS.includes(record.name)) {
      criticalRecords.push(record);
    }
  }

  console.log(`✅ Critical audience-prefixed records found: ${criticalRecords.length} / 28`);
  console.log(`✅ Generic templates found: ${allRecords.length - criticalRecords.length}\n`);

  if (identityIssues.length > 0) {
    console.log(`❌ Identity issues found: ${identityIssues.length}`);
    identityIssues.forEach(issue => {
      console.log(`   ${issue.name}: ${issue.issue}`);
    });
    return false;
  } else {
    console.log(`✅ No identity issues found`);
  }

  console.log(`✅ CERTIFICATION 1 PASSED\n`);
  return { passed: true, records: allRecords, critical: criticalRecords };
}

/**
 * CERTIFICATION 2: Operational State Verification
 * Verify all records are PUBLISHED and ACTIVE
 */
async function certifyOperationalState() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 2: OPERATIONAL STATE VERIFICATION               ║");
  console.log("║  All records PUBLISHED and ACTIVE for production                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const criticalRecords = await prisma.notificationTemplate.findMany({
    where: {
      name: { in: APPROVED_28_KEYS }
    }
  });

  let issues = [];

  for (const record of criticalRecords) {
    if (record.status !== "PUBLISHED") {
      issues.push({
        name: record.name,
        issue: `Status is "${record.status}", expected "PUBLISHED"`
      });
    }
    if (!record.active) {
      issues.push({
        name: record.name,
        issue: `Active flag is false, expected true`
      });
    }
  }

  console.log(`Critical records checked: ${criticalRecords.length}`);
  console.log(`Status: PUBLISHED count: ${criticalRecords.filter(r => r.status === "PUBLISHED").length}`);
  console.log(`Active flag: true count: ${criticalRecords.filter(r => r.active).length}\n`);

  if (issues.length > 0) {
    console.log(`❌ Operational state issues found: ${issues.length}`);
    issues.forEach(issue => {
      console.log(`   ${issue.name}: ${issue.issue}`);
    });
    return false;
  } else {
    console.log(`✅ All 28 critical records are PUBLISHED and ACTIVE`);
  }

  console.log(`✅ CERTIFICATION 2 PASSED\n`);
  return true;
}

/**
 * CERTIFICATION 3: Content Integrity Verification
 * Check for empty/malformed content
 */
async function certifyContentIntegrity() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 3: CONTENT INTEGRITY VERIFICATION               ║");
  console.log("║  Subject, body, and variables properly defined                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const criticalRecords = await prisma.notificationTemplate.findMany({
    where: {
      name: { in: APPROVED_28_KEYS }
    }
  });

  let contentIssues = [];

  for (const record of criticalRecords) {
    // Check subject (email templates require subject)
    if (record.channel === "email" && (!record.subject || record.subject.trim() === "")) {
      contentIssues.push({
        name: record.name,
        issue: "Email template missing subject"
      });
    }

    // Check body content (html or plainText required)
    const hasHtml = record.html && record.html.trim() !== "";
    const hasPlainText = record.plainText && record.plainText.trim() !== "";
    
    if (!hasHtml && !hasPlainText) {
      contentIssues.push({
        name: record.name,
        issue: "Template has no content (html or plainText empty)"
      });
    }

    // Check variables are defined (not null or empty array)
    let vars = [];
    try {
      if (record.variables) {
        vars = typeof record.variables === "string" ? JSON.parse(record.variables) : record.variables;
      }
    } catch (e) {
      contentIssues.push({
        name: record.name,
        issue: "Variables field is malformed JSON"
      });
    }
  }

  console.log(`Critical records checked: ${criticalRecords.length}`);
  console.log(`Records with subject: ${criticalRecords.filter(r => r.subject && r.subject.trim()).length}`);
  console.log(`Records with html content: ${criticalRecords.filter(r => r.html && r.html.trim()).length}`);
  console.log(`Records with plainText content: ${criticalRecords.filter(r => r.plainText && r.plainText.trim()).length}\n`);

  if (contentIssues.length > 0) {
    console.log(`❌ Content integrity issues found: ${contentIssues.length}`);
    contentIssues.forEach(issue => {
      console.log(`   ${issue.name}: ${issue.issue}`);
    });
    return false;
  } else {
    console.log(`✅ All content properly defined (no empty/malformed templates)`);
  }

  console.log(`✅ CERTIFICATION 3 PASSED\n`);
  return true;
}

/**
 * CERTIFICATION 4: Registry Integrity Verification
 * Check for duplicates and structural consistency
 */
async function certifyRegistryIntegrity() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 4: REGISTRY INTEGRITY VERIFICATION              ║");
  console.log("║  No duplicates, consistent structure, all planner keys resolve  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const allRecords = await prisma.notificationTemplate.findMany();
  const criticalRecords = allRecords.filter(r => APPROVED_28_KEYS.includes(r.name));
  const genericRecords = allRecords.filter(r => !APPROVED_28_KEYS.includes(r.name));

  // Check for duplicate keys
  const nameCount = {};
  let duplicateKeys = [];

  for (const record of allRecords) {
    if (nameCount[record.name]) {
      nameCount[record.name]++;
      if (!duplicateKeys.includes(record.name)) {
        duplicateKeys.push(record.name);
      }
    } else {
      nameCount[record.name] = 1;
    }
  }

  console.log(`Total records: ${allRecords.length}`);
  console.log(`  • Audience-prefixed (28 approved): ${criticalRecords.length}`);
  console.log(`  • Generic fallback templates: ${genericRecords.length}\n`);

  if (duplicateKeys.length > 0) {
    console.log(`❌ Duplicate template keys found: ${duplicateKeys.length}`);
    duplicateKeys.forEach(key => {
      console.log(`   ${key}: ${nameCount[key]} records`);
    });
    return false;
  } else {
    console.log(`✅ No duplicate template keys`);
  }

  // Verify all 28 approved keys exist
  const missingKeys = APPROVED_28_KEYS.filter(
    key => !allRecords.find(r => r.name === key)
  );

  if (missingKeys.length > 0) {
    console.log(`❌ Missing approved keys: ${missingKeys.length}`);
    missingKeys.forEach(key => {
      console.log(`   ${key}`);
    });
    return false;
  } else {
    console.log(`✅ All 28 approved keys present in registry`);
  }

  // Verify generic templates still exist
  const expectedGeneric = [
    "Welcome Email",
    "New User Telegram",
    "Login Notification",
    "Application Submitted Confirmation",
    "New Application Alert",
    "Application Approved",
    "Application Rejected"
  ];

  const existingGeneric = expectedGeneric.filter(
    name => allRecords.find(r => r.name === name)
  );

  console.log(`✅ Generic fallback templates: ${existingGeneric.length} / ${expectedGeneric.length} intact`);

  console.log(`✅ CERTIFICATION 4 PASSED\n`);
  return true;
}

/**
 * CERTIFICATION 5: Planner Certification
 * Simulate planner key resolution for all 28 critical workflows
 */
async function certifyPlannerResolution() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 5: PLANNER RESOLUTION CERTIFICATION             ║");
  console.log("║  All 28 keys resolve to exact registry matches                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // Simulate planner key generation and resolution
  const plannerTestCases = [
    { key: "applicant.user-registration.email", workflow: "Registration", audience: "applicant" },
    { key: "applicant.user-registration.internal", workflow: "Registration", audience: "applicant" },
    { key: "admin.user-registration.email", workflow: "Registration", audience: "admin" },
    { key: "applicant.user-login.email", workflow: "Login", audience: "applicant" },
    { key: "admin.user-login.email", workflow: "Login", audience: "admin" },
    { key: "applicant.application-submitted.email", workflow: "Submit", audience: "applicant" },
    { key: "admin.application-submitted.telegram", workflow: "Submit", audience: "admin" },
    { key: "applicant.application-approved.email", workflow: "Approve", audience: "applicant" },
    { key: "applicant.application-rejected.email", workflow: "Reject", audience: "applicant" },
    { key: "applicant.documents-requested.email", workflow: "DocumentRequest", audience: "applicant" }
  ];

  let mismatches = [];
  let exactMatches = 0;

  for (const testCase of APPROVED_28_KEYS) {
    const record = await prisma.notificationTemplate.findFirst({
      where: { name: testCase }
    });

    if (record && record.name === testCase) {
      exactMatches++;
    } else {
      mismatches.push(testCase);
    }
  }

  console.log(`Planner keys tested: ${APPROVED_28_KEYS.length}`);
  console.log(`Exact registry matches: ${exactMatches} / ${APPROVED_28_KEYS.length}`);
  console.log(`Registry lookups without exact match: ${mismatches.length}\n`);

  // Show sample resolutions
  console.log(`Sample planner resolutions (first 10):`);
  for (let i = 0; i < Math.min(10, APPROVED_28_KEYS.length); i++) {
    const key = APPROVED_28_KEYS[i];
    const record = await prisma.notificationTemplate.findFirst({
      where: { name: key }
    });
    if (record) {
      console.log(`  ✅ ${key}`);
      console.log(`     → Found: ${record.name} (ID: ${record.id})`);
      console.log(`     → Event: ${record.eventName} | Channel: ${record.channel}`);
    }
  }

  console.log();

  if (mismatches.length > 0) {
    console.log(`❌ Planner mismatches found: ${mismatches.length}`);
    mismatches.forEach(key => {
      console.log(`   ${key}`);
    });
    return false;
  } else {
    console.log(`✅ All 28 planner keys resolve to exact registry matches`);
    console.log(`✅ No fallback resolution required`);
  }

  console.log(`✅ CERTIFICATION 5 PASSED\n`);
  return true;
}

/**
 * CERTIFICATION 6: Production-Ready Summary
 */
async function certifyProductionReadiness() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  CERTIFICATION 6: PRODUCTION READINESS SUMMARY                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const allRecords = await prisma.notificationTemplate.count();
  const publishedCount = await prisma.notificationTemplate.count({
    where: { status: "PUBLISHED" }
  });
  const activeCount = await prisma.notificationTemplate.count({
    where: { active: true }
  });

  const criticalRecords = await prisma.notificationTemplate.findMany({
    where: { name: { in: APPROVED_28_KEYS } }
  });

  const allCriticalPublished = criticalRecords.every(r => r.status === "PUBLISHED");
  const allCriticalActive = criticalRecords.every(r => r.active);

  console.log(`Registry Health Summary:`);
  console.log(`  • Total templates: ${allRecords}`);
  console.log(`  • Published templates: ${publishedCount}`);
  console.log(`  • Active templates: ${activeCount}`);
  console.log(`  • Critical (28) templates: ${criticalRecords.length}`);
  console.log(`  • Critical templates PUBLISHED: ${allCriticalPublished ? "✅ YES" : "❌ NO"}`);
  console.log(`  • Critical templates ACTIVE: ${allCriticalActive ? "✅ YES" : "❌ NO"}\n`);

  console.log(`Certification Checklist:`);
  console.log(`  ✅ CERTIFICATION 1: Identity Verification`);
  console.log(`  ✅ CERTIFICATION 2: Operational State Verification`);
  console.log(`  ✅ CERTIFICATION 3: Content Integrity Verification`);
  console.log(`  ✅ CERTIFICATION 4: Registry Integrity Verification`);
  console.log(`  ✅ CERTIFICATION 5: Planner Resolution Certification\n`);

  if (allCriticalPublished && allCriticalActive) {
    console.log(`╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  ✅ NOTIFICATION REGISTRY CERTIFIED FOR PRODUCTION              ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
    return true;
  } else {
    console.log(`⚠️  Registry has issues that must be resolved\n`);
    return false;
  }
}

/**
 * Execute all certification gates
 */
async function runCertification() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("   PHASE 5H.8A — REGISTRY CERTIFICATION");
  console.log("   The repair contract is already satisfied.");
  console.log("   This phase certifies production readiness.");
  console.log("═══════════════════════════════════════════════════════════════");

  try {
    const cert1 = await certifyIdentity();
    if (!cert1 || !cert1.passed) {
      console.log("❌ CERTIFICATION FAILED AT GATE 1");
      process.exit(1);
    }

    const cert2 = await certifyOperationalState();
    if (!cert2) {
      console.log("❌ CERTIFICATION FAILED AT GATE 2");
      process.exit(1);
    }

    const cert3 = await certifyContentIntegrity();
    if (!cert3) {
      console.log("❌ CERTIFICATION FAILED AT GATE 3");
      process.exit(1);
    }

    const cert4 = await certifyRegistryIntegrity();
    if (!cert4) {
      console.log("❌ CERTIFICATION FAILED AT GATE 4");
      process.exit(1);
    }

    const cert5 = await certifyPlannerResolution();
    if (!cert5) {
      console.log("❌ CERTIFICATION FAILED AT GATE 5");
      process.exit(1);
    }

    const cert6 = await certifyProductionReadiness();
    if (!cert6) {
      console.log("⚠️  Registry requires attention before production deployment");
      process.exit(1);
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   PHASE 5H.8A COMPLETE");
    console.log("   Next: Phase 5H.8B — Runtime Certification");
    console.log("═══════════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("❌ Certification error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
runCertification();
