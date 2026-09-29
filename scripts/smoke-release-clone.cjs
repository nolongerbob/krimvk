// Integration smoke against an isolated restored DB only. Never point at production.
const { PrismaClient } = require('@prisma/client');
const { encode } = require('next-auth/jwt');
const { randomUUID } = require('crypto');
const assert = require('node:assert/strict');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl !== 'postgresql://release_check@127.0.0.1:55439/release_check') throw new Error('Requires isolated release_check clone');
const base = 'http://localhost:3099';
const db = new PrismaClient({ datasources: { db: { url: dbUrl } } });
async function request(route, cookie, body, status = 200) {
  const r = await fetch(base + route, { headers: { origin: base, ...(cookie ? { cookie } : {}), 'Content-Type': 'application/json' }, method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  assert.equal(r.status, status, `${route}: ${r.status}`);
  return r.json();
}
async function fixture(role) {
  const user = await db.user.create({ data: { email: `release-${randomUUID()}@example.invalid`, name: 'Release smoke fixture', role, emailVerified: new Date() } });
  const token = await encode({ secret: 'isolated-candidate-not-live-secret', token: { id: user.id, sub: user.id, role, email: user.email }, maxAge: 3600 });
  return `next-auth.session-token=${token}`;
}
(async () => {
  const admin = await fixture('ADMIN'), user = await fixture('USER'), other = await fixture('USER');
  await request('/api/admin/site-settings', null, undefined, 401);
  await request('/api/admin/site-settings', user, undefined, 403);
  assert.deepEqual(await request('/api/site-settings'), { mascotEnabled: false, autumnEnabled: false });
  await request('/api/admin/site-settings', admin, { mascotEnabled: true, autumnEnabled: true });
  assert.deepEqual(await request('/api/site-settings'), { mascotEnabled: true, autumnEnabled: true });
  await request('/api/admin/site-settings', admin, { mascotEnabled: false, autumnEnabled: false });
  console.log('PASS global settings, guest and user permissions');
  await request('/api/assistant/handoff', user, { messages: [{ role: 'user', content: 'Release verification test in isolated clone' }] }, 201);
  const initial = await request('/api/questions/get-or-create', user);
  const id = initial.question.id;
  await request('/api/questions/create', user, { text: 'Follow-up in clone' }, 201);
  await request('/api/admin/questions/answer', admin, { questionId: id, text: 'Operator reply in clone' });
  const poll = await request('/api/admin/questions/list?since=' + encodeURIComponent(new Date(Date.now() - 60000).toISOString()), admin);
  assert.ok(poll.questions.some(q => q.id === id && q.messages.some(m => m.text === 'Operator reply in clone')));
  await request('/api/assistant/return-to-ai', other, { questionId: id }, 404);
  await request('/api/admin/questions/status', admin, { questionId: id, status: 'COMPLETED' });
  const completed = await request('/api/questions/get-or-create', user);
  assert.equal(completed.question.status, 'COMPLETED');
  assert.ok(completed.question.messages.length >= 4);
  await request('/api/assistant/return-to-ai', user, { questionId: id });
  console.log('PASS operator handoff, messaging, delta polling, completion history, ownership');
})().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
