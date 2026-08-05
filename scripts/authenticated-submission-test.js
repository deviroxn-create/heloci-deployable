const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n========== AUTHENTICATED SUBMISSION TEST ==========\n');
    
    // ============================================================
    // STEP 1: Find existing user with draft application
    // ============================================================
    console.log('STEP 1: Finding existing user with draft application...\n');
    
    const draft = await prisma.programApplication.findFirst({
      where: { status: 'draft' },
      include: {
        user: { select: { id: true, email: true } },
        program: { select: { id: true, slug: true, name: true, organizationId: true } }
      }
    });
    
    if (!draft) {
      console.error('ERROR: No draft application found');
      process.exit(1);
    }
    
    console.log(`✅ Draft Application Found:`);
    console.log(`   ID: ${draft.id}`);
    console.log(`   User: ${draft.user.email}`);
    console.log(`   Program: ${draft.program.name}\n`);
    
    // ============================================================
    // STEP 2: Prepare submission payload from saved draft data
    // ============================================================
    console.log('STEP 2: Preparing submission payload...\n');
    
    const wizardPayload = draft.data || {};
    console.log(`Wizard payload keys: ${Object.keys(wizardPayload).length}`);
    console.log(`Sample keys: ${Object.keys(wizardPayload).slice(0, 10).join(', ')}\n`);
    
    // ============================================================
    // STEP 3: Create an authenticated session
    // ============================================================
    console.log('STEP 3: Creating authenticated session...\n');
    
    // Create a session for this user
    const session = await prisma.session.create({
      data: {
        sessionToken: `test-token-${Date.now()}`,
        userId: draft.user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    
    console.log(`✅ Session created:`);
    console.log(`   Token: ${session.sessionToken}`);
    console.log(`   User: ${draft.user.id}\n`);
    
    // ============================================================
    // STEP 4: Execute submission with authentication
    // ============================================================
    console.log('STEP 4: Executing authenticated POST /submit...\n');
    console.log(`Endpoint: http://localhost:3000/api/applications/${draft.id}/submit`);
    console.log(`Auth: next-auth.session-token=${session.sessionToken}\n`);
    
    const response = await fetch(
      `http://localhost:3000/api/applications/${draft.id}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${session.sessionToken}`
        },
        body: JSON.stringify({ data: wizardPayload })
      }
    );
    
    console.log(`Response Status: ${response.status}\n`);
    
    const responseBody = await response.json();
    
    if (response.status !== 200) {
      console.log(`Response Error: ${JSON.stringify(responseBody, null, 2)}\n`);
    } else {
      console.log(`Response Success: ${JSON.stringify(responseBody, null, 2)}\n`);
    }
    
    // ============================================================
    // STEP 5: Check if application was submitted
    // ============================================================
    console.log('STEP 5: Checking application status...\n');
    
    const updated = await prisma.programApplication.findUnique({
      where: { id: draft.id },
      select: { status: true, submittedAt: true }
    });
    
    console.log(`Application Status: ${updated?.status}`);
    console.log(`Submitted At: ${updated?.submittedAt}\n`);
    
    // ============================================================
    // STEP 6: Final result
    // ============================================================
    console.log('========== FINAL RESULT ==========\n');
    
    if (response.status === 200) {
      console.log('✅ HTTP 200 RETURNED');
    } else {
      console.log(`❌ HTTP ${response.status} RETURNED`);
    }
    
    if (updated?.status === 'submitted') {
      console.log('✅ Application status: SUBMITTED');
    } else {
      console.log(`❌ Application status: ${updated?.status} (expected SUBMITTED)`);
    }
    
    console.log('\n==================================\n');
    
    // Cleanup
    await prisma.session.delete({
      where: { sessionToken: session.sessionToken }
    }).catch(() => {});
    
    // Wait for async logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (e) {
    console.error('\n❌ ERROR:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
