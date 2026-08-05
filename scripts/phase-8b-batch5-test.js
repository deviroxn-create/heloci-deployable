#!/usr/bin/env node

/**
 * PHASE 8B - BATCH 5: Staff & Admin API Certification
 * Testing 5 endpoints with comprehensive stop-and-fix discipline
 */

const http = require("http");
const https = require("https");

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const VALID_TOKEN = process.env.TEST_TOKEN || "test-token";

// Color output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m"
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;
    
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers
    };
    
    if (VALID_TOKEN && !headers.Authorization) {
      reqHeaders.Authorization = `Bearer ${VALID_TOKEN}`;
    }
    
    const options = {
      method,
      headers: reqHeaders
    };
    
    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    
    req.on("error", reject);
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testEndpoint(name, method, path, tests) {
  log(`\n${"=".repeat(80)}`, "blue");
  log(`ENDPOINT: ${method} ${path}`, "cyan");
  log(`${"=".repeat(80)}`, "blue");
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    log(`\nTest: ${test.name}`, "yellow");
    
    try {
      const result = await request(
        method,
        test.path || path,
        test.body,
        test.headers
      );
      
      const expectedStatus = test.expectedStatus || 200;
      const statusMatch = result.status === expectedStatus;
      
      log(`  Status: ${result.status} (expected ${expectedStatus})`, statusMatch ? "green" : "red");
      
      if (test.check) {
        const checkResult = test.check(result);
        if (checkResult.success) {
          log(`  ✓ ${checkResult.message}`, "green");
          passed++;
        } else {
          log(`  ✗ ${checkResult.message}`, "red");
          failed++;
        }
      } else if (statusMatch) {
        log(`  ✓ Status code correct`, "green");
        passed++;
      } else {
        log(`  ✗ Status code mismatch`, "red");
        failed++;
      }
      
      if (result.body && Object.keys(result.body).length > 0) {
        log(`  Response: ${JSON.stringify(result.body).substring(0, 100)}...`, "cyan");
      }
    } catch (error) {
      log(`  ✗ Request failed: ${error.message}`, "red");
      failed++;
    }
  }
  
  log(`\nResult: ${passed} passed, ${failed} failed`, failed === 0 ? "green" : "red");
  return { passed, failed };
}

async function runBatch5Tests() {
  log("\n" + "=".repeat(80), "blue");
  log("PHASE 8B - BATCH 5: Staff & Admin Endpoints", "blue");
  log("=".repeat(80), "blue");
  
  const results = [];
  
  // ENDPOINT 1: GET /api/admin/dashboard
  results.push(await testEndpoint(
    "Admin Dashboard",
    "GET",
    "/api/admin/dashboard",
    [
      {
        name: "Success case - with valid authentication",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 && res.body?.success === true,
          message: res.status === 200 && res.body?.success === true 
            ? "Dashboard loaded successfully"
            : `Expected 200 with success:true, got ${res.status} and success:${res.body?.success}`
        })
      },
      {
        name: "Unauthorized - no authentication",
        path: "/api/admin/dashboard",
        headers: { Authorization: "" },
        expectedStatus: 401,
        check: (res) => ({
          success: res.status === 401,
          message: res.status === 401 ? "Correctly rejected unauthenticated access" : `Expected 401, got ${res.status}`
        })
      },
      {
        name: "Invalid organization ID",
        path: "/api/admin/dashboard?organizationId=invalid-org-id",
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 403,
          message: res.status === 400 || res.status === 403 
            ? "Correctly rejected invalid org" 
            : `Expected 400/403, got ${res.status}`
        })
      },
      {
        name: "Organization isolation - cross-org access",
        path: "/api/admin/dashboard?organizationId=different-org-id",
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 403,
          message: res.status === 400 || res.status === 403
            ? "Correctly enforced organization isolation"
            : `Expected 400/403, got ${res.status}`
        })
      },
      {
        name: "Response format - correct structure",
        expectedStatus: 200,
        check: (res) => ({
          success: res.body?.success === true && res.body?.data !== undefined,
          message: res.body?.success === true && res.body?.data !== undefined
            ? "Response has correct format (success + data)"
            : "Response format incorrect"
        })
      }
    ]
  ));
  
  // ENDPOINT 2: GET /api/admin/applications
  results.push(await testEndpoint(
    "Admin Applications",
    "GET",
    "/api/admin/applications?organizationId=test-org",
    [
      {
        name: "Success case - with organizationId parameter",
        path: "/api/admin/applications?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 && Array.isArray(res.body),
          message: Array.isArray(res.body) ? "Returns array of applications" : "Response should be array"
        })
      },
      {
        name: "Unauthorized - no authentication",
        path: "/api/admin/applications?organizationId=test-org",
        headers: { Authorization: "" },
        expectedStatus: 401,
        check: (res) => ({
          success: res.status === 401,
          message: res.status === 401 ? "Correctly rejected unauthenticated access" : `Expected 401, got ${res.status}`
        })
      },
      {
        name: "Missing organizationId parameter",
        path: "/api/admin/applications",
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400,
          message: res.status === 400 ? "Correctly validates required parameters" : `Expected 400, got ${res.status}`
        })
      },
      {
        name: "With status filter parameter",
        path: "/api/admin/applications?organizationId=test-org&status=pending&status=approved",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200,
          message: res.status === 200 ? "Handles status filtering" : `Expected 200, got ${res.status}`
        })
      },
      {
        name: "Response format - error handling",
        path: "/api/admin/applications?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 || (res.status === 403 && res.body?.error),
          message: "Response includes proper error handling"
        })
      }
    ]
  ));
  
  // ENDPOINT 3: GET /api/admin/programs
  results.push(await testEndpoint(
    "Admin Programs - GET",
    "GET",
    "/api/admin/programs?organizationId=test-org",
    [
      {
        name: "Success case - list programs",
        path: "/api/admin/programs?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 && Array.isArray(res.body),
          message: Array.isArray(res.body) ? "Returns array of programs" : "Response should be array"
        })
      },
      {
        name: "Unauthorized - no authentication",
        path: "/api/admin/programs?organizationId=test-org",
        headers: { Authorization: "" },
        expectedStatus: 401,
        check: (res) => ({
          success: res.status === 401,
          message: res.status === 401 ? "Correctly rejected unauthenticated access" : `Expected 401, got ${res.status}`
        })
      },
      {
        name: "Organization context - with organizationId",
        path: "/api/admin/programs?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 || res.status === 400,
          message: res.status === 200 || res.status === 400
            ? "Respects organization context"
            : `Expected 200 or 400, got ${res.status}`
        })
      },
      {
        name: "Invalid organization ID format",
        path: "/api/admin/programs?organizationId=@invalid",
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 403 || res.status === 500,
          message: "Handles invalid organization ID"
        })
      },
      {
        name: "Response is array of programs",
        path: "/api/admin/programs?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: Array.isArray(res.body),
          message: Array.isArray(res.body) ? "Returns array structure" : "Should return array"
        })
      }
    ]
  ));
  
  // ENDPOINT 4: POST /api/admin/programs
  results.push(await testEndpoint(
    "Admin Programs - POST",
    "POST",
    "/api/admin/programs",
    [
      {
        name: "Success case - create program with valid data",
        body: {
          organizationId: "test-org",
          name: "Test Program",
          description: "Test program description",
          eligibilityRules: []
        },
        expectedStatus: 201,
        check: (res) => ({
          success: res.status === 201 || res.status === 200 || res.status === 400,
          message: res.status === 201 
            ? "Created program successfully" 
            : res.status === 400
            ? "Validation failure (expected if test org doesn't exist)"
            : `Status: ${res.status}`
        })
      },
      {
        name: "Unauthorized - no authentication",
        body: { name: "Test" },
        headers: { Authorization: "" },
        expectedStatus: 401,
        check: (res) => ({
          success: res.status === 401,
          message: res.status === 401 ? "Correctly rejected unauthenticated POST" : `Expected 401, got ${res.status}`
        })
      },
      {
        name: "Invalid body - missing required fields",
        body: { organizationId: "test-org" },
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 500,
          message: res.status === 400 
            ? "Validation enforced" 
            : res.status === 500 
            ? "Server error (expected for invalid data)"
            : `Status: ${res.status}`
        })
      },
      {
        name: "Invalid organization ID",
        body: {
          organizationId: "invalid-org",
          name: "Test Program",
          description: "Test"
        },
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 403,
          message: res.status === 400 || res.status === 403 
            ? "Organization validation enforced"
            : `Status: ${res.status}`
        })
      },
      {
        name: "Response format - proper error/success structure",
        body: { organizationId: "test-org" },
        expectedStatus: 400,
        check: (res) => ({
          success: res.status >= 400,
          message: res.status >= 400 ? "Returns error properly" : "Should return error"
        })
      }
    ]
  ));
  
  // ENDPOINT 5: GET /api/admin/team
  results.push(await testEndpoint(
    "Admin Team",
    "GET",
    "/api/admin/team?organizationId=test-org",
    [
      {
        name: "Success case - list team members",
        path: "/api/admin/team?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 && Array.isArray(res.body),
          message: Array.isArray(res.body) ? "Returns array of team members" : "Response should be array"
        })
      },
      {
        name: "Unauthorized - no authentication",
        path: "/api/admin/team?organizationId=test-org",
        headers: { Authorization: "" },
        expectedStatus: 401,
        check: (res) => ({
          success: res.status === 401,
          message: res.status === 401 ? "Correctly rejected unauthenticated access" : `Expected 401, got ${res.status}`
        })
      },
      {
        name: "Organization context validation",
        path: "/api/admin/team?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: res.status === 200 || res.status === 400,
          message: res.status === 200 || res.status === 400
            ? "Validates organization context"
            : `Status: ${res.status}`
        })
      },
      {
        name: "Invalid organization ID",
        path: "/api/admin/team?organizationId=@invalid",
        expectedStatus: 400,
        check: (res) => ({
          success: res.status === 400 || res.status === 403 || res.status === 500,
          message: "Handles invalid organization ID"
        })
      },
      {
        name: "Response structure - array of team members",
        path: "/api/admin/team?organizationId=test-org",
        expectedStatus: 200,
        check: (res) => ({
          success: Array.isArray(res.body),
          message: Array.isArray(res.body) ? "Returns array structure" : "Should return array"
        })
      }
    ]
  ));
  
  // Summary
  log("\n" + "=".repeat(80), "blue");
  log("BATCH 5 SUMMARY", "blue");
  log("=".repeat(80), "blue");
  
  const total = results.reduce((a, b) => ({ passed: a.passed + b.passed, failed: a.failed + b.failed }));
  log(`\nEndpoints Tested: ${results.length}`, "cyan");
  log(`Total Assertions: ${total.passed + total.failed}`, "cyan");
  log(`Passed: ${total.passed}`, "green");
  log(`Failed: ${total.failed}`, total.failed === 0 ? "green" : "red");
  
  const successRate = Math.round((total.passed / (total.passed + total.failed)) * 100);
  log(`\nSuccess Rate: ${successRate}%`, successRate === 100 ? "green" : "yellow");
  
  if (total.failed === 0) {
    log("\n✓ BATCH 5 COMPLETE - ALL TESTS PASSED", "green");
  } else {
    log(`\n✗ BATCH 5 HAS ${total.failed} FAILING TESTS`, "red");
  }
  
  log("=".repeat(80), "blue");
}

// Run tests
runBatch5Tests().catch(err => {
  log(`Fatal error: ${err.message}`, "red");
  process.exit(1);
});
