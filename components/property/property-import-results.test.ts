import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PropertyImportResponse } from '@/lib/properties/property-import.service';
import { PropertyImportResults } from './property-import-results';

test('renders import summaries and every result using the service response shape', () => {
  const response: PropertyImportResponse = {
    importId: 'import-1',
    status: 'IMPORTED',
    summary: { received: 4, created: 1, updated: 1, skipped: 1, failed: 1 },
    warnings: ['zillow:created-1: review warning'],
    errors: [],
    results: [
      { externalId: 'zillow:created-1', title: 'Created listing', status: 'CREATED', warnings: ['review warning'], errors: [] },
      { externalId: 'zillow:updated-1', title: 'Updated listing', status: 'UPDATED', propertyId: 'property-2', changes: ['price', 'images'], warnings: [], errors: [] },
      { externalId: 'zillow:skipped-1', title: 'Skipped listing', status: 'SKIPPED', warnings: [], errors: ['Already exists'] },
      { externalId: 'zillow:failed-1', status: 'FAILED', warnings: ['check source data'], errors: ['Invalid price'] }
    ]
  };

  const markup = renderToStaticMarkup(createElement(PropertyImportResults, { response }));

  assert.match(markup, />4<\/p>/);
  assert.match(markup, />2<\/p>/);
  assert.match(markup, /Warnings<\/p><p[^>]*>2<\/p>/);
  assert.match(markup, /Errors<\/p><p[^>]*>2<\/p>/);
  assert.match(markup, /Created<\/p><p[^>]*>1<\/p>/);
  assert.match(markup, /Updated<\/p><p[^>]*>1<\/p>/);
  assert.match(markup, /Skipped<\/p><p[^>]*>1<\/p>/);
  assert.match(markup, /Failed<\/p><p[^>]*>1<\/p>/);
  assert.match(markup, /CREATED/);
  assert.match(markup, /UPDATED/);
  assert.match(markup, /SKIPPED/);
  assert.match(markup, /FAILED/);
  assert.match(markup, /Created listing/);
  assert.match(markup, /Property ID: property-2/);
  assert.match(markup, /Updated: price, images/);
  assert.match(markup, /Already exists/);
  assert.match(markup, /Invalid price/);
  assert.match(markup, /check source data/);
});

test('renders an empty successful result without assuming a details array', () => {
  const response: PropertyImportResponse = {
    importId: 'import-empty',
    status: 'IMPORTED',
    summary: { received: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
    warnings: [],
    errors: [],
    results: []
  };

  const markup = renderToStaticMarkup(createElement(PropertyImportResults, { response }));

  assert.match(markup, /Import Summary/);
  assert.match(markup, /Import Results/);
});

test('counts payload-level errors when the service returns no row results', () => {
  const response: PropertyImportResponse = {
    importId: 'import-invalid-payload',
    status: 'IMPORTED',
    summary: { received: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
    warnings: [],
    errors: ['properties must be an array'],
    results: []
  };

  const markup = renderToStaticMarkup(createElement(PropertyImportResults, { response }));

  assert.match(markup, /Errors<\/p><p[^>]*>1<\/p>/);
  assert.match(markup, /properties must be an array/);
});