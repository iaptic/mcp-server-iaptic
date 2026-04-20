import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncateLongStrings } from '../dist/tools/events.js';

// ---------------------------------------------------------------
// Helper under test: mirrors what _handleTool does for event_details.
// Truncates only details.raw; leaves details.analysis and any other
// top-level keys untouched. This is the exact contract we want to
// lock in with the regression tests below.
// ---------------------------------------------------------------
function truncateEventDetails(details) {
  // Truncate only raw HTTP data; analysis stays full-length so users see
  // full product IDs, transaction IDs, error messages, etc.
  if (details.raw) {
    details.raw = truncateLongStrings(details.raw, 128);
  }
  return details;
}

const LONG = 'A'.repeat(500);                    // > 128, should truncate
const EXACTLY_128 = 'B'.repeat(128);             // boundary, should NOT truncate
const ONE_OVER_128 = 'C'.repeat(129);            // boundary + 1, should truncate
const SHORT = 'short-value';                     // < 128, should NOT truncate

// --- truncateLongStrings helper: boundary behavior ---------------

test('truncateLongStrings: string of exactly 128 chars is NOT truncated', () => {
  const out = truncateLongStrings(EXACTLY_128, 128);
  assert.equal(out, EXACTLY_128);
  assert.equal(out.length, 128);
});

test('truncateLongStrings: string of 129 chars IS truncated', () => {
  const out = truncateLongStrings(ONE_OVER_128, 128);
  assert.equal(out, 'C'.repeat(128) + '... [truncated]');
});

test('truncateLongStrings: short strings pass through unchanged', () => {
  assert.equal(truncateLongStrings(SHORT, 128), SHORT);
});

test('truncateLongStrings: recurses into nested objects and arrays', () => {
  const input = { a: [{ b: LONG }, SHORT], c: { d: LONG } };
  const out = truncateLongStrings(input, 128);
  assert.equal(out.a[0].b, 'A'.repeat(128) + '... [truncated]');
  assert.equal(out.a[1], SHORT);
  assert.equal(out.c.d, 'A'.repeat(128) + '... [truncated]');
});

// --- truncateEventDetails: selective-raw contract ----------------

test('selective: long strings in raw ARE truncated', () => {
  const details = {
    analysis: { context: { eventType: 'validate' } },
    raw: {
      request: { body: { appStoreReceipt: LONG } },
    },
  };
  const out = truncateEventDetails(details);
  assert.equal(
    out.raw.request.body.appStoreReceipt,
    'A'.repeat(128) + '... [truncated]'
  );
});

test('selective: long strings in analysis are NOT truncated', () => {
  const details = {
    analysis: { note: LONG, productId: LONG },
    raw: { request: {} },
  };
  const out = truncateEventDetails(details);
  assert.equal(out.analysis.note, LONG);
  assert.equal(out.analysis.productId, LONG);
  assert.equal(out.analysis.note.length, 500);
});

test('selective: other top-level keys are NOT truncated', () => {
  const details = {
    analysis: {},
    raw: { request: { body: LONG } },
    receipts: { someToken: LONG }, // sibling key, should pass through
  };
  const out = truncateEventDetails(details);
  assert.equal(out.receipts.someToken, LONG);
  assert.equal(
    out.raw.request.body,
    'A'.repeat(128) + '... [truncated]'
  );
});

test('selective: missing raw key (pre-3.12 fallback) is a no-op', () => {
  const details = { analysis: { note: LONG } };
  const out = truncateEventDetails(details);
  assert.equal(out.analysis.note, LONG);
  assert.equal(out.raw, undefined);
});

test('selective: null raw is a no-op (truthy guard covers it)', () => {
  const details = { analysis: { note: LONG }, raw: null };
  const out = truncateEventDetails(details);
  assert.equal(out.analysis.note, LONG);
  assert.equal(out.raw, null);
});

// --- shape-agnostic verification across platforms ----------------

test('selective: Apple-shaped raw (appStoreReceipt + certificates) truncates', () => {
  const details = {
    analysis: { platform: 'app_store' },
    raw: {
      request: { body: { appStoreReceipt: LONG, password: 'secret' } },
      response: { receipt: { in_app: [{ transaction_id: '1000' }] } },
      externalRequests: [{ url: 'https://buy.itunes.apple.com/verifyReceipt', body: LONG }],
    },
  };
  const out = truncateEventDetails(details);
  assert.ok(out.raw.request.body.appStoreReceipt.endsWith('... [truncated]'));
  assert.equal(out.raw.request.body.password, 'secret');
  assert.ok(out.raw.externalRequests[0].body.endsWith('... [truncated]'));
  assert.equal(out.analysis.platform, 'app_store');
});

test('selective: Google-shaped raw (purchaseToken) truncates', () => {
  const details = {
    analysis: { platform: 'google_play' },
    raw: {
      request: { body: { purchaseToken: LONG, productId: 'premium' } },
      externalRequests: [{ url: 'https://androidpublisher.googleapis.com/...', response: LONG }],
    },
  };
  const out = truncateEventDetails(details);
  assert.ok(out.raw.request.body.purchaseToken.endsWith('... [truncated]'));
  assert.equal(out.raw.request.body.productId, 'premium');
  assert.ok(out.raw.externalRequests[0].response.endsWith('... [truncated]'));
});

test('selective: Stripe-shaped raw (session/customer ids + event body) truncates', () => {
  const details = {
    analysis: { platform: 'stripe' },
    raw: {
      request: { body: { sessionId: 'cs_test_short', signature: LONG } },
      response: { customer: 'cus_short', rawEvent: LONG },
    },
  };
  const out = truncateEventDetails(details);
  assert.equal(out.raw.request.body.sessionId, 'cs_test_short');
  assert.ok(out.raw.request.body.signature.endsWith('... [truncated]'));
  assert.equal(out.raw.response.customer, 'cus_short');
  assert.ok(out.raw.response.rawEvent.endsWith('... [truncated]'));
});