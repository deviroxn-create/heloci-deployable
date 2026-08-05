const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n========== DIRECT SUBMISSION TEST (BYPASSING AUTH) ==========\n');
    
    // Find existing draft
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
    
    console.log(`✅ Draft Application:`);
    console.log(`   ID: ${draft.id}`);
    console.log(`   User: ${draft.user.email}`);
    console.log(`   Program: ${draft.program.name}\n`);
    
    console.log(`Wizard Payload Keys (${Object.keys(draft.data || {}).length} total):`);
    console.log(`  ${Object.keys(draft.data || {}).join(', ')}\n`);
    
    // Call submitApplication directly (bypasses HTTP auth)
    console.log('Calling submitApplication() directly...\n');
    
    // We need to import and call the service
    // Since we can't use ES modules, we'll make an HTTP call with an auth bypass
    // For now, let's monitor the server logs manually
    
    console.log('To capture validation logs:');
    console.log('1. The server is running at http://localhost:3000');
    console.log('2. Check the server terminal for instrumentation output');
    console.log('3. The logs will appear after the submission is processed\n');
    
    // Make HTTP request to trigger the submission
    console.log('Making HTTP POST request...\n');
    
    // Make HTTP request with test user header
    const testUrl = `http://localhost:3000/api/applications/${draft.id}/submit`;
    console.log(`Making HTTP POST to: ${testUrl}`);
    console.log(`With test user header: X-Test-User-Id=${draft.user.id}\n`);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User-Id': draft.user.id
      },
      body: JSON.stringify({ data: draft.data })
    });
    
    console.log(`Response Status: ${response.status}`);
    
    const body = await response.json();
    console.log(`Response Body: ${JSON.stringify(body, null, 2)}\n`);
    
    console.log('\n==== MANUAL TEST REQUIRED ====\n');
    console.log('Since the API requires authentication, please:\n');
    console.log('1. Open http://localhost:3000 in a browser');
    console.log('2. Log in with an account that has draft applications');
    console.log('3. Open a draft application');
    console.log('4. Fill any missing fields (mark required fields)');
    console.log('5. Click the Submit button\n');
    console.log('The server logs will show:');
    console.log('  - Instrumentation before validation');
    console.log('  - Validation result table');
    console.log('  - Exact field errors\n');
    console.log('===============================\n');
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
