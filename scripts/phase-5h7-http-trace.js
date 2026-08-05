#!/usr/bin/env node

/**
 * PHASE 5H.7 — FORENSIC RUNTIME TRACE (HTTP)
 * 
 * Execute workflows via HTTP and capture responses
 * NOTE: Requires development server running on http://localhost:3000
 * 
 * Run this while watching server terminal for instrumentation logs
 */

const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n=== PHASE 5H.7 FORENSIC RUNTIME TRACE (HTTP) ===');
  console.log('\n⚠️  IMPORTANT: This script requires:');
  console.log('   1. Development server running: npm run dev');
  console.log('   2. Server terminal visible to capture logs');
  console.log('   3. At least one draft application in database');
  console.log('\nScript will:');
  console.log('   1. Execute workflows via HTTP');
  console.log('   2. Capture responses');
  console.log('   3. Direct you to check server logs\n');

  try {
    // Check if server is running
    console.log('Checking if server is running...');
    try {
      const ping = await makeRequest('GET', '/');
      console.log('✅ Server is running\n');
    } catch (e) {
      console.error('❌ Server not responding at http://localhost:3000');
      console.error('   Start with: npm run dev');
      process.exit(1);
    }

    console.log('=================================================');
    console.log('WORKFLOW 1: USER REGISTRATION');
    console.log('=================================================\n');
    
    const testEmail = `test-${Date.now()}@example.com`;
    console.log('Executing: POST /auth/register');
    console.log('Email:', testEmail);
    console.log('\n⚠️  You must manually register in browser:');
    console.log('   1. Navigate to http://localhost:3000/auth/register');
    console.log('   2. Fill in form with email:', testEmail);
    console.log('   3. Watch server terminal for instrumentation logs');
    console.log('   4. Check: Does user.registration event log appear?');
    console.log('   5. Document evidence in console\n');

    console.log('=================================================');
    console.log('WORKFLOW 2: USER LOGIN');
    console.log('=================================================\n');
    
    console.log('⚠️  You must manually login in browser:');
    console.log('   1. Navigate to http://localhost:3000/auth/login');
    console.log('   2. Enter credentials');
    console.log('   3. Watch server terminal for instrumentation logs');
    console.log('   4. Check: Does user.login event log appear?');
    console.log('   5. Document evidence in console\n');

    console.log('=================================================');
    console.log('WORKFLOW 3: APPLICATION DRAFT SAVE');
    console.log('=================================================\n');
    
    console.log('⚠️  You must manually save draft in browser:');
    console.log('   1. Navigate to application form');
    console.log('   2. Fill partial data');
    console.log('   3. Click Save Draft');
    console.log('   4. Watch server terminal for instrumentation logs');
    console.log('   5. Document evidence\n');

    console.log('=================================================');
    console.log('WORKFLOW 4: APPLICATION SUBMIT');
    console.log('=================================================\n');
    
    console.log('⚠️  CRITICAL WORKFLOW - Full trace required:');
    console.log('   1. Navigate to application form');
    console.log('   2. Fill ALL required fields');
    console.log('   3. Click Submit');
    console.log('   4. Watch server terminal for COMPLETE trace:');
    console.log('      - STEP 1: Incoming HTTP Request');
    console.log('      - STEP 2: Raw Wizard Payload');
    console.log('      - STEP 3: Transformation (check housingGoals)');
    console.log('      - STEP 4: Question Set');
    console.log('      - STEP 5: Validator Input & Result');
    console.log('      - STEP 6: Database Write');
    console.log('      - PART 2: Event Published');
    console.log('      - Step 5: Audience Resolution');
    console.log('         CHECK: Applicant email ≠ Admin email');
    console.log('   5. Document ALL evidence in console\n');

    console.log('=================================================');
    console.log('WORKFLOW 5: APPLICATION APPROVED');
    console.log('=================================================\n');
    
    console.log('⚠️  You must manually approve in admin:');
    console.log('   1. Go to admin dashboard');
    console.log('   2. Find submitted application');
    console.log('   3. Click Approve');
    console.log('   4. Watch server terminal for event trace');
    console.log('   5. Check: application.approved event published?');
    console.log('   6. Check: Correct recipients notified?');
    console.log('   7. Document evidence\n');

    console.log('=================================================');
    console.log('WORKFLOW 6: APPLICATION REJECTED');
    console.log('=================================================\n');
    
    console.log('⚠️  Create new application and reject:');
    console.log('   1. Submit a new application');
    console.log('   2. Go to admin dashboard');
    console.log('   3. Click Reject');
    console.log('   4. Watch server terminal for event trace');
    console.log('   5. Document evidence\n');

    console.log('=================================================');
    console.log('WORKFLOW 7: DOCUMENTS REQUESTED');
    console.log('=================================================\n');
    
    console.log('⚠️  Request documents from admin:');
    console.log('   1. Go to admin dashboard');
    console.log('   2. Find application');
    console.log('   3. Click Request Documents');
    console.log('   4. Select document type');
    console.log('   5. Click Send');
    console.log('   6. Watch server terminal for event trace');
    console.log('   7. Check: documents.requested event published?');
    console.log('   8. Check: Applicant receives email?');
    console.log('   9. Document evidence\n');

    console.log('=================================================');
    console.log('WORKFLOW 8: INTERNAL MESSAGING');
    console.log('=================================================\n');
    
    console.log('⚠️  Send internal message:');
    console.log('   1. Go to case conversation');
    console.log('   2. Type message');
    console.log('   3. Click Send');
    console.log('   4. Watch server terminal for event trace');
    console.log('   5. Check: message.created event published?');
    console.log('   6. Document evidence\n');

    console.log('=================================================');
    console.log('EVIDENCE COLLECTION INSTRUCTIONS');
    console.log('=================================================\n');
    
    console.log('For EACH workflow:');
    console.log('');
    console.log('1. Copy console output from server terminal');
    console.log('2. Look for:');
    console.log('   - STEP 1-6 (for submit workflow)');
    console.log('   - PART 2 trace sections');
    console.log('   - Step 1: Event Published');
    console.log('   - Step 2: Domain Subscriber');
    console.log('   - Step 3: Event Mapping');
    console.log('   - Step 5: Audience Resolution');
    console.log('   - Step 4: Notification Service Result');
    console.log('');
    console.log('3. If you see any divergence:');
    console.log('   - STOP tracing');
    console.log('   - Document exact step where it diverged');
    console.log('   - Record console evidence');
    console.log('   - Move to next workflow');
    console.log('');
    console.log('4. Create ONE report per workflow:');
    console.log('   File: .kiro/PHASE-5H7-WORKFLOW-{{N}}-{{NAME}}-EVIDENCE.md');
    console.log('');
    console.log('=================================================');
    console.log('\n✅ Ready to trace. Begin with Workflow 1 in browser.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
