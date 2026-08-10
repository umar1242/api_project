/**
 * Integration Test: Bot → API → Database
 * Stage 1 — End-to-end connectivity verification
 *
 * This script simulates what the Admin Bot does and verifies:
 *   1. API is reachable
 *   2. ServiceTokenGuard accepts the correct token
 *   3. User can be created (POST /users/upsert)
 *   4. User is persisted and retrievable (GET /users/by-telegram/:id)
 *   5. User can be updated (PUT /users/:id)
 *   6. List endpoint returns paginated results
 *
 * Run: node test/integration/stage1.test.js
 * (inside the running api container or with the API accessible on localhost:3000)
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const TOKEN = process.env.SERVICE_TOKEN ?? 'change_me_to_a_long_random_string';

const FAKE_TELEGRAM_ID = 999_888_777;

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Token': TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, actual) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label} — got:`, actual);
    failed++;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\n🧪 Stage 1 Integration Test\n   Target: ${BASE_URL}\n`);

  // ── Test 1: Health check ──────────────────────────────────────────────────
  console.log('Test 1: Health check');
  const health = await request('GET', '/health');
  assert('Status 200', health.status === 200, health.status);
  assert('DB connected', health.data?.db === 'connected', health.data?.db);
  assert('Redis connected', health.data?.redis === 'connected', health.data?.redis);

  // ── Test 2: Auth guard — reject missing token ─────────────────────────────
  console.log('\nTest 2: ServiceTokenGuard rejects missing token');
  const noAuth = await fetch(`${BASE_URL}/users`);
  assert('Status 401 without token', noAuth.status === 401, noAuth.status);

  // ── Test 3: Auth guard — reject wrong token ───────────────────────────────
  console.log('\nTest 3: ServiceTokenGuard rejects wrong token');
  const badAuth = await fetch(`${BASE_URL}/users`, {
    headers: { 'X-Service-Token': 'wrong-token' },
  });
  assert('Status 401 with wrong token', badAuth.status === 401, badAuth.status);

  // ── Test 4: Create / upsert user ─────────────────────────────────────────
  console.log('\nTest 4: POST /users/upsert — create user');
  const upsert = await request('POST', '/users/upsert', {
    telegramId: FAKE_TELEGRAM_ID,
    fullName: 'Integration Test User',
    phone: '+79990000000',
    role: 'ADMIN',
  });
  assert('Status 200', upsert.status === 200, upsert.status);
  assert('Has id', !!upsert.data?.id, upsert.data?.id);
  assert('telegramId matches', String(upsert.data?.telegramId) === String(FAKE_TELEGRAM_ID), upsert.data?.telegramId);
  assert('fullName correct', upsert.data?.fullName === 'Integration Test User', upsert.data?.fullName);
  assert('Role is ADMIN', upsert.data?.role === 'ADMIN', upsert.data?.role);
  assert('Status is ACTIVE', upsert.data?.status === 'ACTIVE', upsert.data?.status);

  const userId = upsert.data?.id;

  // ── Test 5: Idempotency — upsert again, same result ──────────────────────
  console.log('\nTest 5: POST /users/upsert — idempotency check');
  const upsert2 = await request('POST', '/users/upsert', {
    telegramId: FAKE_TELEGRAM_ID,
    fullName: 'Integration Test User Updated',
  });
  assert('Status 200', upsert2.status === 200, upsert2.status);
  assert('Same id as first upsert', upsert2.data?.id === userId, upsert2.data?.id);
  assert('fullName updated', upsert2.data?.fullName === 'Integration Test User Updated', upsert2.data?.fullName);

  // ── Test 6: Find by telegramId ────────────────────────────────────────────
  console.log('\nTest 6: GET /users/by-telegram/:telegramId');
  const byTg = await request('GET', `/users/by-telegram/${FAKE_TELEGRAM_ID}`);
  assert('Status 200', byTg.status === 200, byTg.status);
  assert('Correct user returned', String(byTg.data?.telegramId) === String(FAKE_TELEGRAM_ID), byTg.data?.telegramId);

  // ── Test 7: Get by internal ID ────────────────────────────────────────────
  console.log('\nTest 7: GET /users/:id');
  const byId = await request('GET', `/users/${userId}`);
  assert('Status 200', byId.status === 200, byId.status);
  assert('Same id', byId.data?.id === userId, byId.data?.id);

  // ── Test 8: Update user (ban) ─────────────────────────────────────────────
  console.log('\nTest 8: PUT /users/:id — set status BANNED');
  const update = await request('PUT', `/users/${userId}`, { status: 'BANNED' });
  assert('Status 200', update.status === 200, update.status);
  assert('Status is BANNED', update.data?.status === 'BANNED', update.data?.status);

  // ── Test 9: Update user (restore) ────────────────────────────────────────
  console.log('\nTest 9: PUT /users/:id — restore to ACTIVE');
  const restore = await request('PUT', `/users/${userId}`, { status: 'ACTIVE' });
  assert('Status 200', restore.status === 200, restore.status);
  assert('Status is ACTIVE', restore.data?.status === 'ACTIVE', restore.data?.status);

  // ── Test 10: List users ───────────────────────────────────────────────────
  console.log('\nTest 10: GET /users — list all users');
  const list = await request('GET', '/users?take=10');
  assert('Status 200', list.status === 200, list.status);
  assert('Has data array', Array.isArray(list.data?.data), list.data?.data);
  assert('Has total count', typeof list.data?.total === 'number', list.data?.total);
  assert('Our user is in list', list.data?.data?.some(u => u.id === userId), false);

  // ── Test 11: 404 for unknown user ─────────────────────────────────────────
  console.log('\nTest 11: GET /users/99999999999 — 404 for unknown ID');
  const notFound = await request('GET', '/users/99999999999');
  assert('Status 404', notFound.status === 404, notFound.status);

  // ── Cleanup: delete test user ─────────────────────────────────────────────
  console.log('\nCleanup: DELETE /users/:id');
  const del = await request('DELETE', `/users/${userId}`);
  assert('Status 204', del.status === 204, del.status);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('❌ Some tests FAILED');
    process.exit(1);
  } else {
    console.log('✅ All tests PASSED — Bot → API → Database flow verified');
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
