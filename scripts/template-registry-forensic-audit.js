#!/usr/bin/env node

/**
 * PHASE 5H.7 CONTINUATION — TEMPLATE REGISTRY FORENSIC AUDIT
 * 
 * Purpose: Enumerate ACTUAL database state vs. ACTUAL planner generation
 * 
 * This script:
 * 1. Queries database for all notification templates (actual)
 * 2. Simulates planner generation for all events (expected)
 * 3. Creates comparison table
 * 4. Classifies each mismatch with root cause
 * 
 * NO CODE MODIFICATIONS - AUDIT ONLY
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// PART A: ACTUAL DATABASE STATE
// ============================================================================

async function getActualTemplates() {
  console.log('\n========== PART A: ACTUAL DATABASE TEMPLATES ==========\n');
  
  const templates = await prisma.notificationTemplate.findMany({
    select: {
      id: true,
      name: true,
      eventName: true,
      channel: true,
      status: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ eventName: 'asc' }, { channel: 'asc' }, { name: 'asc' }],
  });

  console.log(`Total templates in database: ${templates.length}\n`);
  
  // Display in table format
  console.log('ID | Name | Event | Channel | Status | Active | Created');
  console.log(''.padEnd(120, '-'));
  
  templates.forEach(t => {
    console.log(
      `${t.id.substring(0, 8)} | ` +
      `${(t.name || '').padEnd(40)} | ` +
      `${(t.eventName || '').padEnd(30)} | ` +
      `${(t.channel || '').padEnd(10)} | ` +
      `${(t.status || '').padEnd(10)} | ` +
      `${String(t.active).padEnd(6)} | ` +
      `${t.createdAt.toISOString().substring(0, 10)}`
    );
  });

  return templates;
}

// ============================================================================
// PART B: EXPECTED PLANNER GENERATION
// ============================================================================

function getExpectedPlans() {
  console.log('\n========== PART B: EXPECTED PLANNER GENERATION ==========\n');

  /**
   * Simulate TemplateResolver key generation
   * Mirrors the actual logic in:
   * lib/notifications/runtime/template-resolver.ts
   */
  function getAudiencePrefix(role) {
    const mapping = {
      applicant: 'applicant',
      organization_admin: 'admin',
      org_admin: 'admin',
      reviewer: 'reviewer',
      case_worker: 'case-worker',
      support: 'support',
      staff_member: 'staff-member',
      staff_admin: 'staff-admin',
      system: 'system',
    };
    return mapping[role] || null;
  }

  function getEventKey(event) {
    const mapping = {
      user_registration: 'user-registration',
      user_login: 'user-login',
      application_submitted: 'application-submitted',
      application_approved: 'application-approved',
      application_rejected: 'application-rejected',
      application_conditional: 'application-conditional',
      application_waitlisted: 'application-waitlisted',
      application_withdrawn: 'application-withdrawn',
      application_under_review: 'application-under-review',
      documents_requested: 'documents-requested',
      document_approved: 'document-approved',
      document_rejected: 'document-rejected',
      document_replacement_requested: 'document-replacement-requested',
      eligibility_assessment_completed: 'eligibility-assessment-completed',
      recommendation_available: 'recommendation-available',
      program_matched: 'program-matched',
      program_published: 'program-published',
      message_created: 'message-created',
      admin_action: 'admin-action',
    };
    return mapping[event] || null;
  }

  function generateTemplateKey(event, audience, channel) {
    const audiencePrefix = getAudiencePrefix(audience);
    if (!audiencePrefix) return null;

    const eventKey = getEventKey(event);
    if (!eventKey) return null;

    return `${audiencePrefix}.${eventKey}.${channel}`;
  }

  /**
   * Define what planner generates for each event
   * Based on: lib/notifications/runtime/communication-planner.ts
   */
  const plannerMappings = {
    user_registration: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'email' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
    ],
    user_login: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'email' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
    ],
    application_submitted: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
      { audience: 'case_worker', channel: 'internal' },
      { audience: 'support', channel: 'email' },
    ],
    application_approved: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    application_rejected: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    application_conditional: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    application_waitlisted: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    application_withdrawn: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    application_under_review: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    documents_requested: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    document_approved: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    document_rejected: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    document_replacement_requested: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
    ],
    eligibility_assessment_completed: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
    ],
    recommendation_available: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
    ],
    program_matched: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
    ],
    program_published: [
      { audience: 'organization_admin', channel: 'telegram' },
    ],
    message_created: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'internal' },
    ],
    admin_action: [
      { audience: 'applicant', channel: 'email' },
      { audience: 'applicant', channel: 'internal' },
      { audience: 'organization_admin', channel: 'telegram' },
      { audience: 'organization_admin', channel: 'internal' },
      { audience: 'reviewer', channel: 'internal' },
      { audience: 'case_worker', channel: 'internal' },
    ],
  };

  // Generate all expected keys
  const expectedPlans = [];
  for (const [event, plans] of Object.entries(plannerMappings)) {
    for (const plan of plans) {
      const templateKey = generateTemplateKey(event, plan.audience, plan.channel);
      expectedPlans.push({
        event,
        audience: plan.audience,
        channel: plan.channel,
        templateKey,
        prefix: getAudiencePrefix(plan.audience),
        eventKey: getEventKey(event),
      });
    }
  }

  console.log(`Total expected plans: ${expectedPlans.length}\n`);
  console.log('Event | Audience | Channel | Generated Key');
  console.log(''.padEnd(120, '-'));
  
  expectedPlans.forEach(p => {
    console.log(
      `${(p.event || '').padEnd(35)} | ` +
      `${(p.audience || '').padEnd(20)} | ` +
      `${(p.channel || '').padEnd(10)} | ` +
      `${p.templateKey || 'NULL'}`
    );
  });

  return expectedPlans;
}

// ============================================================================
// PART C: COMPARISON & CLASSIFICATION
// ============================================================================

async function compareAndClassify(actualTemplates, expectedPlans) {
  console.log('\n========== PART C: COMPARISON TABLE ==========\n');

  // Build lookup maps
  const actualByKey = new Map();
  const actualByEventChannel = new Map();
  
  actualTemplates.forEach(t => {
    actualByKey.set(t.name, t);
    actualByEventChannel.set(`${t.eventName}-${t.channel}`, t);
  });

  const mismatches = [];
  const matches = [];

  // Compare each expected plan against actual
  expectedPlans.forEach(plan => {
    const audiencePrefixedKey = plan.templateKey;
    const genericKey = `${plan.event}-${plan.channel}`;
    
    let actual = actualByKey.get(audiencePrefixedKey);
    let classification = 'UNKNOWN';
    let matchStatus = '❌ MISSING';
    let foundKey = null;
    let rootCause = null;

    if (actual) {
      // Exact match found
      matchStatus = '✅ FOUND';
      classification = 'EXACT_MATCH';
      foundKey = actual.name;
    } else {
      // Check for generic key (without audience prefix)
      actual = actualByEventChannel.get(genericKey);
      if (actual) {
        matchStatus = '⚠️ FALLBACK';
        classification = 'GENERIC_FALLBACK';
        foundKey = actual.name;
        rootCause = 'Generic template available via fallback lookup';
      } else {
        // No match at all
        matchStatus = '❌ MISSING';
        classification = 'MISSING_TEMPLATE';
        foundKey = 'N/A';
        rootCause = 'Template not in database at all';
      }
    }

    const record = {
      event: plan.event,
      audience: plan.audience,
      channel: plan.channel,
      requestedKey: audiencePrefixedKey,
      existingKey: foundKey,
      status: matchStatus,
      classification,
      rootCause,
      databaseStatus: actual ? `${actual.status}/${actual.active ? 'active' : 'inactive'}` : 'N/A',
    };

    if (matchStatus === '✅ FOUND') {
      matches.push(record);
    } else {
      mismatches.push(record);
    }
  });

  // Display comparison table
  console.log('Requested Key | Existing Key | Match | Classification | Root Cause');
  console.log(''.padEnd(150, '-'));

  expectedPlans.forEach(plan => {
    const record = [...matches, ...mismatches].find(
      r => r.event === plan.event && r.audience === plan.audience && r.channel === plan.channel
    );
    
    if (record) {
      console.log(
        `${(record.requestedKey || '').padEnd(45)} | ` +
        `${(record.existingKey || '').padEnd(40)} | ` +
        `${record.status.padEnd(12)} | ` +
        `${record.classification.padEnd(20)} | ` +
        `${record.rootCause || ''}`
      );
    }
  });

  return { matches, mismatches };
}

// ============================================================================
// PART D: CLASSIFICATION SUMMARY
// ============================================================================

function summarizeClassifications(matches, mismatches) {
  console.log('\n========== PART D: MISMATCH CLASSIFICATION SUMMARY ==========\n');

  const classifications = {};
  mismatches.forEach(m => {
    if (!classifications[m.classification]) {
      classifications[m.classification] = [];
    }
    classifications[m.classification].push(m);
  });

  console.log(`Total matches: ${matches.length}`);
  console.log(`Total mismatches: ${mismatches.length}\n`);

  for (const [classification, records] of Object.entries(classifications)) {
    console.log(`\n${classification}: ${records.length} mismatches`);
    console.log(''.padEnd(80, '-'));
    records.forEach(r => {
      console.log(`  ${r.event.padEnd(35)} | ${r.audience.padEnd(20)} | ${r.channel}`);
    });
  }

  // Root cause analysis
  console.log('\n========== ROOT CAUSE ANALYSIS ==========\n');

  const rootCauses = {};
  mismatches.forEach(m => {
    if (!rootCauses[m.rootCause]) {
      rootCauses[m.rootCause] = 0;
    }
    rootCauses[m.rootCause]++;
  });

  for (const [cause, count] of Object.entries(rootCauses)) {
    console.log(`${cause}: ${count} mismatches`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PHASE 5H.7 CONTINUATION — TEMPLATE REGISTRY FORENSIC AUDIT    ║');
    console.log('║  Evidence-Based Investigation (No Code Changes)                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    // Execute audit
    const actualTemplates = await getActualTemplates();
    const expectedPlans = getExpectedPlans();
    const { matches, mismatches } = await compareAndClassify(actualTemplates, expectedPlans);
    summarizeClassifications(matches, mismatches);

    // Generate final report
    console.log('\n========== FINAL CERTIFICATION REPORT ==========\n');
    console.log(`✅ Database templates enumerated: ${actualTemplates.length}`);
    console.log(`✅ Planner plans enumerated: ${expectedPlans.length}`);
    console.log(`✅ Exact matches: ${matches.length} (${Math.round(matches.length / expectedPlans.length * 100)}%)`);
    console.log(`❌ Mismatches: ${mismatches.length} (${Math.round(mismatches.length / expectedPlans.length * 100)}%)`);
    console.log(`✅ Generic fallbacks available: ${mismatches.filter(m => m.classification === 'GENERIC_FALLBACK').length}`);
    console.log(`❌ Missing entirely: ${mismatches.filter(m => m.classification === 'MISSING_TEMPLATE').length}`);

    console.log('\n========== AUDIT COMPLETE ==========\n');
    console.log('Evidence collected. No code modified. Ready for Phase 5H.8 repair planning.\n');

  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
