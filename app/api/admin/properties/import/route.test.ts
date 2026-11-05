import assert from 'node:assert/strict';
import test from 'node:test';

const sessionModule = require('@/lib/auth/session');
const organizationModule = require('@/lib/auth/organization-context');
const rbacModule = require('@/lib/auth/rbac');
const { prisma } = require('@/lib/prisma/client');
const propertyImportModule = require('@/lib/properties/property-import.service');

test('multipart Zillow JSON upload returns the import service result for partial success', async () => {
  const originalGetCurrentUser = sessionModule.getCurrentUser;
  const originalGetOrganizationContext = organizationModule.getOrganizationContext;
  const originalRequireOrgRole = rbacModule.requireOrgRole;
  const originalFindUnique = prisma.property.findUnique;
  const originalFindFirst = prisma.property.findFirst;
  const roleChecks: unknown[][] = [];

  sessionModule.getCurrentUser = async () => ({ id: 'admin-1', email: 'admin@example.test' });
  organizationModule.getOrganizationContext = async (user: unknown, organizationId: unknown) => {
    assert.deepEqual(user, { id: 'admin-1', email: 'admin@example.test' });
    assert.equal(organizationId, null);
    return 'org-admin';
  };
  rbacModule.requireOrgRole = async (...args: unknown[]) => { roleChecks.push(args); };
  prisma.property.findUnique = (async () => null) as typeof prisma.property.findUnique;
  prisma.property.findFirst = (async () => null) as typeof prisma.property.findFirst;

  try {
    const { POST } = require('./route');
    const listings = [
      { property_id: 'zillow-1', listing_type: 'For Sale', price: 725000, address: '1 Main St', city: 'Los Angeles', state: 'CA' },
      { property_id: '', listing_type: 'For Sale', price: 500000 }
    ];
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(listings)], { type: 'application/json' }), 'listings.json');
    formData.set('dryRun', 'true');

    const response = await POST(new Request('http://localhost/api/admin/properties/import', { method: 'POST', body: formData }));
    const body = await response.json();

    assert.equal(response.status, 207);
    assert.deepEqual(body.summary, { received: 2, created: 1, updated: 0, skipped: 0, failed: 1 });
    assert.equal(body.results[0].status, 'CREATED');
    assert.equal(body.results[1].status, 'FAILED');
    assert.ok(Array.isArray(body.warnings));
    assert.ok(Array.isArray(body.errors));
    assert.ok(Array.isArray(body.results[0].warnings));
    assert.ok(Array.isArray(body.results[1].errors));
    assert.deepEqual(roleChecks[0], ['admin-1', 'org-admin', ['org_admin']]);
  } finally {
    sessionModule.getCurrentUser = originalGetCurrentUser;
    organizationModule.getOrganizationContext = originalGetOrganizationContext;
    rbacModule.requireOrgRole = originalRequireOrgRole;
    prisma.property.findUnique = originalFindUnique;
    prisma.property.findFirst = originalFindFirst;
  }
});

test('role rejection returns forbidden and does not invoke the import service', async () => {
  const originalGetCurrentUser = sessionModule.getCurrentUser;
  const originalGetOrganizationContext = organizationModule.getOrganizationContext;
  const originalRequireOrgRole = rbacModule.requireOrgRole;
  const originalImportProperties = propertyImportModule.importProperties;
  let importCalls = 0;

  sessionModule.getCurrentUser = async () => ({ id: 'user-1', email: 'user@example.test' });
  organizationModule.getOrganizationContext = async () => 'org-admin';
  rbacModule.requireOrgRole = async () => { throw new Error('Unauthorized'); };
  propertyImportModule.importProperties = async () => {
    importCalls++;
    throw new Error('Import service must not run for a rejected role');
  };

  try {
    const { POST } = require('./route');
    const response = await POST(new Request('http://localhost/api/admin/properties/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ properties: [] })
    }));

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
    assert.equal(importCalls, 0);
  } finally {
    sessionModule.getCurrentUser = originalGetCurrentUser;
    organizationModule.getOrganizationContext = originalGetOrganizationContext;
    rbacModule.requireOrgRole = originalRequireOrgRole;
    propertyImportModule.importProperties = originalImportProperties;
  }
});