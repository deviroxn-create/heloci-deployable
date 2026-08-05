#!/usr/bin/env node

/**
 * PHASE 5H.8 — STEP 1.5: DATABASE BASELINE CAPTURE
 *
 * Required forensic gate before any INSERT operations.
 *
 * Captures:
 * 1. Current total NotificationTemplate count
 * 2. List of all existing template keys
 * 3. Comparison against 28 approved keys
 * 4. Missing vs Already Exists report
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * The 28 CRITICAL keys from Phase 5H.7 Certification
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

async function captureBaseline() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║  PHASE 5H.8 — STEP 1.5: DATABASE BASELINE CAPTURE              ║");
  console.log("║  Required forensic gate before INSERT operations                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    // ===== BASELINE 1: Total count =====
    const totalCount = await prisma.notificationTemplate.count();
    console.log(`📊 BASELINE 1: Total NotificationTemplate records`);
    console.log(`   Current count: ${totalCount} templates\n`);

    // ===== BASELINE 2: All existing keys =====
    console.log(`📋 BASELINE 2: All existing template keys`);
    
    const allTemplates = await prisma.notificationTemplate.findMany({
      select: { name: true, eventName: true, channel: true, active: true, status: true }
    });

    if (allTemplates.length === 0) {
      console.log(`   ⚠️  Database is empty - no templates exist\n`);
    } else {
      console.log(`   Found ${allTemplates.length} templates:\n`);
      allTemplates.forEach(t => {
        console.log(`   • ${t.name}`);
        console.log(`     Event: ${t.eventName} | Channel: ${t.channel} | Status: ${t.status} | Active: ${t.active}`);
      });
      console.log();
    }

    // ===== BASELINE 3: Comparison against approved keys =====
    console.log(`🔍 BASELINE 3: Comparing against 28 approved keys\n`);

    const existingKeys = new Set(allTemplates.map(t => t.name));
    const missingKeys = [];
    const alreadyExistKeys = [];

    for (const key of APPROVED_28_KEYS) {
      if (existingKeys.has(key)) {
        alreadyExistKeys.push(key);
      } else {
        missingKeys.push(key);
      }
    }

    // ===== BASELINE 4: Missing vs Already Exists Report =====
    console.log(`╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  FORENSIC GATE 1.5 REPORT                                      ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    console.log(`✅ Already exist (no insert needed):     ${alreadyExistKeys.length} keys`);
    if (alreadyExistKeys.length > 0) {
      alreadyExistKeys.forEach(key => {
        console.log(`   ✓ ${key}`);
      });
      console.log();
    }

    console.log(`❌ Missing (INSERT required):           ${missingKeys.length} keys`);
    if (missingKeys.length > 0) {
      // Sort by workflow for readability
      const sortedMissing = missingKeys.sort();
      sortedMissing.forEach(key => {
        console.log(`   ✗ ${key}`);
      });
      console.log();
    }

    // ===== SUMMARY =====
    console.log(`╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  SUMMARY                                                       ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    console.log(`Current state:`);
    console.log(`  • Total templates in database: ${totalCount}`);
    console.log(`  • Approved 28 keys: ${APPROVED_28_KEYS.length}`);
    console.log(`  • Already exist: ${alreadyExistKeys.length}`);
    console.log(`  • Need to create: ${missingKeys.length}`);

    const canProceed = missingKeys.length > 0;
    console.log();

    if (canProceed) {
      console.log(`✅ DATABASE BASELINE CAPTURED — Safe to proceed with ${missingKeys.length} CREATE operations`);
    } else if (alreadyExistKeys.length === APPROVED_28_KEYS.length) {
      console.log(`✅ DATABASE BASELINE CAPTURED — All 28 keys already exist (no repairs needed)`);
    } else {
      console.log(`⚠️  DATABASE BASELINE CAPTURED — Mixed state requires verification`);
    }

    console.log();

    // Export baseline for audit trail
    const baseline = {
      timestamp: new Date().toISOString(),
      totalTemplatesInDatabase: totalCount,
      approvedKeysForRepair: APPROVED_28_KEYS.length,
      alreadyExisting: alreadyExistKeys,
      missingKeys: missingKeys,
      readyToRepair: canProceed,
      repairCount: missingKeys.length
    };

    console.log(`╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  FORENSIC GATE 1.5 RESULT                                      ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    console.log(JSON.stringify(baseline, null, 2));

    console.log();
    return baseline;

  } catch (error) {
    console.error("❌ ERROR during baseline capture:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
captureBaseline()
  .then(() => {
    console.log("\n✅ Step 1.5 complete. Baseline captured.\n");
  })
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
