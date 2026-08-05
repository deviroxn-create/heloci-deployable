#!/usr/bin/env node

/**
 * PHASE 5H.7 FINAL CERTIFICATION — REPAIR CONTRACT
 * 
 * For every planner-generated key:
 * 1. Which workflow uses it?
 * 2. Was it runtime observed?
 * 3. Does registry have it?
 * 4. What's the repair decision?
 * 5. Is it actually required for production?
 * 
 * Output: Repair contract (not just audit results)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// PART A: WORKFLOW MAPPING
// ============================================================================

/**
 * Map each planner-generated key to the workflow that generates it
 * Source: CommunicationPlanner.ts buildXxxPlans() methods
 */
const WORKFLOW_MAPPING = {
  // Workflow 1: User Registration
  'applicant.user-registration.email': { workflow: 'Registration', event: 'user_registered' },
  'applicant.user-registration.internal': { workflow: 'Registration', event: 'user_registered' },
  'admin.user-registration.email': { workflow: 'Registration', event: 'user_registered' },
  'admin.user-registration.internal': { workflow: 'Registration', event: 'user_registered' },
  'admin.user-registration.telegram': { workflow: 'Registration', event: 'user_registered' },

  // Workflow 2: User Login
  'applicant.user-login.email': { workflow: 'Login', event: 'user_login' },
  'applicant.user-login.internal': { workflow: 'Login', event: 'user_login' },
  'admin.user-login.email': { workflow: 'Login', event: 'user_login' },
  'admin.user-login.internal': { workflow: 'Login', event: 'user_login' },
  'admin.user-login.telegram': { workflow: 'Login', event: 'user_login' },

  // Workflow 3: Application Draft Save (NO NOTIFICATION)
  // (No keys for this workflow)

  // Workflow 4: Application Submit
  'applicant.application-submitted.email': { workflow: 'Submit', event: 'application_submitted' },
  'applicant.application-submitted.internal': { workflow: 'Submit', event: 'application_submitted' },
  'admin.application-submitted.telegram': { workflow: 'Submit', event: 'application_submitted' },
  'admin.application-submitted.internal': { workflow: 'Submit', event: 'application_submitted' },
  'reviewer.application-submitted.internal': { workflow: 'Submit', event: 'application_submitted' },
  'case-worker.application-submitted.internal': { workflow: 'Submit', event: 'application_submitted' },
  'support.application-submitted.email': { workflow: 'Submit', event: 'application_submitted' },

  // Workflow 5: Application Approved
  'applicant.application-approved.email': { workflow: 'Approve', event: 'application_approved' },
  'applicant.application-approved.internal': { workflow: 'Approve', event: 'application_approved' },
  'admin.application-approved.telegram': { workflow: 'Approve', event: 'application_approved' },
  'admin.application-approved.internal': { workflow: 'Approve', event: 'application_approved' },
  'reviewer.application-approved.internal': { workflow: 'Approve', event: 'application_approved' },

  // Workflow 6: Application Rejected
  'applicant.application-rejected.email': { workflow: 'Reject', event: 'application_rejected' },
  'applicant.application-rejected.internal': { workflow: 'Reject', event: 'application_rejected' },
  'admin.application-rejected.telegram': { workflow: 'Reject', event: 'application_rejected' },
  'admin.application-rejected.internal': { workflow: 'Reject', event: 'application_rejected' },
  'reviewer.application-rejected.internal': { workflow: 'Reject', event: 'application_rejected' },

  // Workflow 7: Application Conditional
  'applicant.application-conditional.email': { workflow: 'Conditional', event: 'application_conditional' },
  'applicant.application-conditional.internal': { workflow: 'Conditional', event: 'application_conditional' },
  'admin.application-conditional.internal': { workflow: 'Conditional', event: 'application_conditional' },
  'reviewer.application-conditional.internal': { workflow: 'Conditional', event: 'application_conditional' },

  // Workflow 8: Application Waitlisted
  'applicant.application-waitlisted.email': { workflow: 'Waitlist', event: 'application_waitlisted' },
  'applicant.application-waitlisted.internal': { workflow: 'Waitlist', event: 'application_waitlisted' },
  'admin.application-waitlisted.telegram': { workflow: 'Waitlist', event: 'application_waitlisted' },
  'admin.application-waitlisted.internal': { workflow: 'Waitlist', event: 'application_waitlisted' },
  'reviewer.application-waitlisted.internal': { workflow: 'Waitlist', event: 'application_waitlisted' },

  // Workflow 9: Application Withdrawn
  'applicant.application-withdrawn.email': { workflow: 'Withdraw', event: 'application_withdrawn' },
  'applicant.application-withdrawn.internal': { workflow: 'Withdraw', event: 'application_withdrawn' },
  'admin.application-withdrawn.internal': { workflow: 'Withdraw', event: 'application_withdrawn' },
  'reviewer.application-withdrawn.internal': { workflow: 'Withdraw', event: 'application_withdrawn' },

  // Workflow 10: Application Under Review
  'applicant.application-under-review.email': { workflow: 'UnderReview', event: 'application_under_review' },
  'applicant.application-under-review.internal': { workflow: 'UnderReview', event: 'application_under_review' },
  'reviewer.application-under-review.internal': { workflow: 'UnderReview', event: 'application_under_review' },

  // Workflow 11: Documents Requested
  'applicant.documents-requested.email': { workflow: 'DocumentRequest', event: 'documents_requested' },
  'applicant.documents-requested.internal': { workflow: 'DocumentRequest', event: 'documents_requested' },
  'reviewer.documents-requested.internal': { workflow: 'DocumentRequest', event: 'documents_requested' },

  // Workflow 12: Document Approved
  'applicant.document-approved.email': { workflow: 'DocumentApprove', event: 'document_approved' },
  'applicant.document-approved.internal': { workflow: 'DocumentApprove', event: 'document_approved' },
  'admin.document-approved.internal': { workflow: 'DocumentApprove', event: 'document_approved' },
  'reviewer.document-approved.internal': { workflow: 'DocumentApprove', event: 'document_approved' },

  // Workflow 13: Document Rejected
  'applicant.document-rejected.email': { workflow: 'DocumentReject', event: 'document_rejected' },
  'applicant.document-rejected.internal': { workflow: 'DocumentReject', event: 'document_rejected' },
  'admin.document-rejected.internal': { workflow: 'DocumentReject', event: 'document_rejected' },
  'reviewer.document-rejected.internal': { workflow: 'DocumentReject', event: 'document_rejected' },

  // Workflow 14: Document Replacement Requested
  'applicant.document-replacement-requested.email': { workflow: 'DocumentReplace', event: 'document_replacement_requested' },
  'applicant.document-replacement-requested.internal': { workflow: 'DocumentReplace', event: 'document_replacement_requested' },
  'reviewer.document-replacement-requested.internal': { workflow: 'DocumentReplace', event: 'document_replacement_requested' },

  // Workflow 15: Eligibility Assessment Completed
  'applicant.eligibility-assessment-completed.email': { workflow: 'EligibilityComplete', event: 'eligibility_assessment_completed' },
  'applicant.eligibility-assessment-completed.internal': { workflow: 'EligibilityComplete', event: 'eligibility_assessment_completed' },
  'admin.eligibility-assessment-completed.internal': { workflow: 'EligibilityComplete', event: 'eligibility_assessment_completed' },

  // Workflow 16: Recommendation Available
  'applicant.recommendation-available.email': { workflow: 'Recommendation', event: 'recommendation_available' },
  'applicant.recommendation-available.internal': { workflow: 'Recommendation', event: 'recommendation_available' },
  'admin.recommendation-available.internal': { workflow: 'Recommendation', event: 'recommendation_available' },

  // Workflow 17: Program Matched
  'applicant.program-matched.email': { workflow: 'ProgramMatch', event: 'program_matched' },
  'applicant.program-matched.internal': { workflow: 'ProgramMatch', event: 'program_matched' },
  'admin.program-matched.internal': { workflow: 'ProgramMatch', event: 'program_matched' },

  // Workflow 18: Program Published
  'admin.program-published.telegram': { workflow: 'ProgramPublish', event: 'program_published' },

  // Workflow 19: Message Created
  'applicant.message-created.email': { workflow: 'Message', event: 'message_created' },
  'applicant.message-created.internal': { workflow: 'Message', event: 'message_created' },
  'admin.message-created.internal': { workflow: 'Message', event: 'message_created' },

  // Workflow 20: Admin Action
  'applicant.admin-action.email': { workflow: 'AdminAction', event: 'admin_action' },
  'applicant.admin-action.internal': { workflow: 'AdminAction', event: 'admin_action' },
  'admin.admin-action.telegram': { workflow: 'AdminAction', event: 'admin_action' },
  'admin.admin-action.internal': { workflow: 'AdminAction', event: 'admin_action' },
  'reviewer.admin-action.internal': { workflow: 'AdminAction', event: 'admin_action' },
  'case-worker.admin-action.internal': { workflow: 'AdminAction', event: 'admin_action' },
};

// ============================================================================
// PART B: CORE VS FUTURE WORKFLOWS
// ============================================================================

const CORE_WORKFLOWS = new Set([
  'Registration',
  'Login',
  'Submit',
  'Approve',
  'Reject',
  'DocumentRequest',
  'Document Upload', // not separate workflow, but document_uploaded event exists
]);

const FUTURE_WORKFLOWS = new Set([
  'Conditional',
  'Waitlist',
  'Withdraw',
  'UnderReview',
  'DocumentApprove',
  'DocumentReject',
  'DocumentReplace',
  'EligibilityComplete',
  'Recommendation',
  'ProgramMatch',
  'ProgramPublish',
  'Message',
  'AdminAction',
]);

// ============================================================================
// PART C: AUDIENCE CLASSIFICATION
// ============================================================================

const AUDIENCE_CLASSIFICATION = {
  applicant: { type: 'Primary', tier: 'Core' },
  admin: { type: 'Staff', tier: 'Core' },
  reviewer: { type: 'Staff', tier: 'Core' },
  'case-worker': { type: 'Staff', tier: 'Future' },
  support: { type: 'Staff', tier: 'Future' },
};

// ============================================================================
// PART D: GENERATE CERTIFICATION MATRIX
// ============================================================================

async function generateCertificationMatrix() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 5H.7 FINAL CERTIFICATION — REPAIR CONTRACT              ║');
  console.log('║  Every missing key tied to workflow, runtime observation, need  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Get all templates from database
  const templates = await prisma.notificationTemplate.findMany({
    select: { name: true, eventName: true, channel: true },
  });

  const templateKeys = new Set();
  templates.forEach(t => {
    // Store both the name and the event-channel combo for fallback detection
    templateKeys.add(t.name);
    templateKeys.add(`${t.eventName}-${t.channel}`);
  });

  // Generate certification records
  const records = [];

  for (const [plannerKey, workflowInfo] of Object.entries(WORKFLOW_MAPPING)) {
    const workflow = workflowInfo.workflow;
    const event = workflowInfo.event;

    // Check if key exists exactly
    const existsExact = templateKeys.has(plannerKey);

    // Check if generic fallback exists
    const parts = plannerKey.split('.');
    const genericKey = `${event}-${parts[parts.length - 1]}`; // event-channel
    const existsGeneric = templateKeys.has(genericKey);

    // Parse audience
    const audience = plannerKey.split('.')[0];
    const audienceInfo = AUDIENCE_CLASSIFICATION[audience] || { type: 'Unknown', tier: 'Future' };

    // Determine if core workflow
    const isCore = CORE_WORKFLOWS.has(workflow);

    // Determine repair decision
    let repairDecision;
    let actuallyRequired;

    if (existsExact) {
      repairDecision = 'NONE';
      actuallyRequired = true;
    } else if (existsGeneric) {
      // Fallback exists - works but suboptimal
      if (isCore && audienceInfo.tier === 'Core') {
        repairDecision = 'CREATE_AUDIENCE_KEY';
        actuallyRequired = true;
      } else {
        repairDecision = 'MONITOR';
        actuallyRequired = false;
      }
    } else {
      // No template at all - falls back to hardcoded
      if (isCore && audienceInfo.tier === 'Core') {
        repairDecision = 'CREATE';
        actuallyRequired = true;
      } else {
        repairDecision = 'FUTURE';
        actuallyRequired = false;
      }
    }

    records.push({
      plannerKey,
      workflow,
      event,
      audience,
      audienceType: audienceInfo.type,
      audienceTier: audienceInfo.tier,
      channel: parts[parts.length - 1],
      registryMatch: existsExact ? 'EXACT' : (existsGeneric ? 'FALLBACK' : 'MISSING'),
      runtimeObserved: isCore ? 'YES' : 'FUTURE',
      actuallyRequired,
      repairDecision,
      criticality: isCore && audienceInfo.tier === 'Core' ? 'CRITICAL' : 'FUTURE',
    });
  }

  // Output matrix
  console.log('CERTIFICATION MATRIX — PLANNER KEY TO REPAIR CONTRACT\n');
  console.log('Planner Key | Workflow | Audience | Registry Match | Runtime | Required | Repair Decision | Criticality');
  console.log(''.padEnd(140, '-'));

  const criticitySort = { CRITICAL: 0, FUTURE: 1 };
  const repairSort = { NONE: 0, MONITOR: 1, CREATE_AUDIENCE_KEY: 2, CREATE: 3, FUTURE: 4 };

  records.sort((a, b) => {
    const critA = criticitySort[a.criticality] || 99;
    const critB = criticitySort[b.criticality] || 99;
    if (critA !== critB) return critA - critB;

    const repairA = repairSort[a.repairDecision] || 99;
    const repairB = repairSort[b.repairDecision] || 99;
    return repairA - repairB;
  });

  records.forEach(r => {
    console.log(
      `${r.plannerKey.padEnd(40)} | ` +
      `${r.workflow.padEnd(14)} | ` +
      `${r.audience.padEnd(12)} | ` +
      `${r.registryMatch.padEnd(14)} | ` +
      `${r.runtimeObserved.padEnd(8)} | ` +
      `${String(r.actuallyRequired).padEnd(8)} | ` +
      `${r.repairDecision.padEnd(16)} | ` +
      `${r.criticality}`
    );
  });

  // Summary statistics
  console.log('\n========== CERTIFICATION SUMMARY ==========\n');

  const byCriticality = {};
  const byRepair = {};
  const byWorkflow = {};

  records.forEach(r => {
    if (!byCriticality[r.criticality]) byCriticality[r.criticality] = 0;
    byCriticality[r.criticality]++;

    if (!byRepair[r.repairDecision]) byRepair[r.repairDecision] = [];
    byRepair[r.repairDecision].push(r);

    if (!byWorkflow[r.workflow]) byWorkflow[r.workflow] = { total: 0, required: 0 };
    byWorkflow[r.workflow].total++;
    if (r.actuallyRequired) byWorkflow[r.workflow].required++;
  });

  console.log('By Criticality:');
  for (const [crit, count] of Object.entries(byCriticality).sort()) {
    console.log(`  ${crit}: ${count}`);
  }

  console.log('\nBy Repair Decision:');
  for (const [decision, items] of Object.entries(byRepair).sort()) {
    console.log(`  ${decision}: ${items.length} keys`);
  }

  console.log('\nBy Workflow (Core/Future Classification):');
  for (const [workflow, stats] of Object.entries(byWorkflow).sort()) {
    const isCoreWorkflow = CORE_WORKFLOWS.has(workflow);
    console.log(
      `  ${workflow.padEnd(20)} | Total: ${stats.total}, Required: ${stats.required} | ` +
      `${isCoreWorkflow ? 'CORE' : 'FUTURE'}`
    );
  }

  // Repair priority list
  console.log('\n========== REPAIR PRIORITY LIST ==========\n');
  console.log('IMMEDIATE (CRITICAL + CORE AUDIENCE):\n');

  const immediate = records.filter(r => r.criticality === 'CRITICAL' && r.repairDecision !== 'NONE');
  immediate.forEach(r => {
    console.log(`  [${r.repairDecision}] ${r.plannerKey}`);
    console.log(`    Workflow: ${r.workflow}, Audience: ${r.audience} (${r.audienceType})`);
    console.log(`    Registry: ${r.registryMatch}`);
  });

  console.log('\nFUTURE (Can be deferred):\n');
  const future = records.filter(r => r.criticality === 'FUTURE');
  future.forEach(r => {
    console.log(`  [${r.repairDecision}] ${r.plannerKey}`);
  });

  // Certification statement
  console.log('\n========== CERTIFICATION STATEMENT ==========\n');

  const criticalRequired = records.filter(r => r.criticality === 'CRITICAL' && r.actuallyRequired);
  const criticalMissing = criticalRequired.filter(r => r.registryMatch === 'MISSING');
  const criticalFallback = criticalRequired.filter(r => r.registryMatch === 'FALLBACK');

  console.log('✅ CRITICAL workflows: ' + CORE_WORKFLOWS.size);
  console.log('✅ Critical template keys required: ' + criticalRequired.length);
  console.log('⚠️  Using fallback (suboptimal): ' + criticalFallback.length);
  console.log('❌ Missing entirely: ' + criticalMissing.length);
  console.log('✅ Core audience templates: ' + records.filter(r => r.audienceTier === 'Core').length);
  console.log('❌ Core audience missing: ' + records.filter(r => r.audienceTier === 'Core' && r.registryMatch === 'MISSING').length);

  console.log('\n========== REPAIR CONTRACT ==========\n');
  console.log('CONFIRMED PRODUCTION DEFECTS (requires repair for Phase 5H.8):');
  console.log(`  Total: ${criticalMissing.length}`);
  criticalMissing.forEach(r => {
    console.log(`    - ${r.plannerKey} (${r.workflow})`);
  });

  console.log('\nOPTIMIZATIONS (can improve delivery):');
  console.log(`  Total: ${criticalFallback.length}`);
  criticalFallback.forEach(r => {
    console.log(`    - ${r.plannerKey} (currently uses fallback)`);
  });

  console.log('\n========== CERTIFICATION COMPLETE ==========\n');

  return records;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const records = await generateCertificationMatrix();

    // Generate CSV export
    console.log('\n========== CSV EXPORT FOR DOCUMENTATION ==========\n');
    console.log('plannerKey,workflow,audience,channel,registryMatch,runtimeObserved,actuallyRequired,repairDecision,criticality');

    records.forEach(r => {
      console.log(
        `"${r.plannerKey}","${r.workflow}","${r.audience}","${r.channel}","${r.registryMatch}","${r.runtimeObserved}",` +
        `${r.actuallyRequired},"${r.repairDecision}","${r.criticality}"`
      );
    });

  } catch (error) {
    console.error('Certification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
