const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n========== AUTOMATED SUBMISSION TEST ==========\n');
    
    // ============================================================
    // STEP 1: Find or create a draft application
    // ============================================================
    console.log('STEP 1: Locating draft application...\n');
    
    let draft = await prisma.programApplication.findFirst({
      where: { status: 'draft' },
      include: {
        user: { select: { id: true, email: true } },
        program: { select: { id: true, slug: true, name: true, organizationId: true } }
      }
    });
    
    if (!draft) {
      console.log('No draft found. Creating test setup...\n');
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: `test-submit-${Date.now()}@example.com`,
          name: 'Test Submitter',
          password: 'test-password-hash',
        }
      });
      
      // Get or create program
      let program = await prisma.program.findFirst({
        where: { slug: 'global-eligibility' }
      });
      
      if (!program) {
        console.error('ERROR: global-eligibility program not found');
        process.exit(1);
      }
      
      // Create draft application with full wizard data
      draft = await prisma.programApplication.create({
        data: {
          userId: user.id,
          programId: program.id,
          status: 'draft',
          data: {
            // Required fields for eligibility
            incomeRange: 'under_25k',
            householdSize: 3,
            isVeteran: 'false',
            hasDisability: 'false',
            isSenior: 'true',
            isStudent: 'false',
            currentHousing: 'renting',
            riskOfEviction: 'false',
            housingGoals: ['affordable_rent'],
            
            // Optional fields
            state: 'CA',
            zipCode: '90210',
            
            // Additional wizard fields (not in question set)
            'personal.firstName': 'John',
            'personal.lastName': 'Doe',
            'personal.email': 'john@example.com',
            'personal.phone': '5551234567',
            'housing.city': 'Los Angeles',
            'household.adults': 2,
            'household.children': 1,
          }
        },
        include: {
          user: { select: { id: true, email: true } },
          program: { select: { id: true, slug: true, name: true, organizationId: true } }
        }
      });
      
      console.log(`Created test application: ${draft.id}\n`);
    }
    
    console.log(`✅ Draft Application Found:`);
    console.log(`   ID: ${draft.id}`);
    console.log(`   User: ${draft.user.email}`);
    console.log(`   Program: ${draft.program.name} (${draft.program.slug})\n`);
    
    // ============================================================
    // STEP 2: Prepare submission payload
    // ============================================================
    console.log('STEP 2: Preparing submission payload...\n');
    
    // Extract the data as wizard payload
    const wizardPayload = draft.data || {};
    
    console.log(`Wizard payload keys: ${Object.keys(wizardPayload).length}`);
    console.log(`Keys: ${Object.keys(wizardPayload).join(', ')}\n`);
    
    // ============================================================
    // STEP 3: Execute the submission via HTTP
    // ============================================================
    console.log('STEP 3: Executing POST /submit...\n');
    console.log(`Endpoint: http://localhost:3000/api/applications/${draft.id}/submit`);
    console.log(`Method: POST`);
    console.log(`Payload: { data: {...} }\n`);
    
    const response = await fetch(
      `http://localhost:3000/api/applications/${draft.id}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test-token' // May need real token
        },
        body: JSON.stringify({ data: wizardPayload })
      }
    );
    
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers: ${JSON.stringify(Object.fromEntries(response.headers))}\n`);
    
    const responseBody = await response.json();
    console.log(`Response Body: ${JSON.stringify(responseBody, null, 2)}\n`);
    
    // ============================================================
    // STEP 4: Check application status
    // ============================================================
    console.log('STEP 4: Checking application status...\n');
    
    const updated = await prisma.programApplication.findUnique({
      where: { id: draft.id },
      select: { status: true, submittedAt: true }
    });
    
    console.log(`Application Status: ${updated?.status || 'UNKNOWN'}`);
    console.log(`Submitted At: ${updated?.submittedAt || 'NOT SET'}\n`);
    
    // ============================================================
    // STEP 5: Check for domain event
    // ============================================================
    console.log('STEP 5: Looking for domain events...\n');
    
    // Check NotificationLog for application.submitted events
    const logs = await prisma.notificationLog.findMany({
      where: {
        userId: draft.user.id,
        eventName: 'application.submitted'
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (logs.length > 0) {
      console.log(`✅ Domain event found: application.submitted`);
      console.log(`   ID: ${logs[0].id}`);
      console.log(`   Created: ${logs[0].createdAt}`);
    } else {
      console.log(`❌ No domain event found for application.submitted`);
    }
    
    // ============================================================
    // FINAL RESULT
    // ============================================================
    console.log('\n========== TEST RESULT ==========\n');
    
    if (response.status === 200 && updated?.status === 'submitted') {
      console.log('✅ SUBMISSION SUCCESSFUL');
      console.log('   HTTP 200 returned');
      console.log('   Application status: SUBMITTED');
      console.log('   Domain event published');
    } else {
      console.log('❌ SUBMISSION FAILED');
      console.log(`   HTTP ${response.status} returned`);
      console.log(`   Application status: ${updated?.status}`);
      console.log(`   Error: ${responseBody.error || responseBody.errors?.[0] || 'Unknown'}`);
    }
    
    console.log('\n================================\n');
    
    // Wait a moment for async logs to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (e) {
    console.error('\n❌ TEST ERROR:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
