import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/voice/session/route.ts';

test('session route rejects cross-origin access and fails cleanly without credentials', async () => {
  const previous = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  try {
    const forbidden = await POST(new Request('http://localhost:3000/api/voice/session', { method: 'POST', headers: { origin: 'https://other.example' } }));
    assert.equal(forbidden.status, 403);
    const missing = await POST(new Request('http://localhost:3000/api/voice/session', { method: 'POST', headers: { origin: 'http://localhost:3000' } }));
    assert.equal(missing.status, 503);
    assert.equal(missing.headers.get('cache-control'), 'no-store');
  } finally { if (previous !== undefined) process.env.ELEVENLABS_API_KEY = previous; }
});
test('session endpoint enforces its code, validates upstream responses and limits bursts', async () => {
  const saved = { key: process.env.ELEVENLABS_API_KEY, agent: process.env.ELEVENLABS_AGENT_ID, code: process.env.DEMO_ACCESS_CODE };
  const originalFetch = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = 'test-server-secret'; process.env.ELEVENLABS_AGENT_ID = 'test-agent'; process.env.DEMO_ACCESS_CODE = 'test-code';
  const request = (code = 'test-code') => new Request('http://localhost:3000/api/voice/session', { method: 'POST', headers: { origin: 'http://localhost:3000', 'x-demo-access-code': code } });
  try {
    assert.equal((await POST(request('wrong'))).status, 401);
    globalThis.fetch = async (_url, options) => { assert.equal(new Headers(options?.headers).get('xi-api-key'), 'test-server-secret'); return Response.json({ token: 'test-session' }); };
    const ok = await POST(request()); assert.equal(ok.status, 200); assert.deepEqual(await ok.json(), { token: 'test-session' });
    globalThis.fetch = async () => Response.json({ token: 5 }); assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () => new Response('', { status: 401 }); assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () => { throw new Error('network failure'); }; assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () => Response.json({ token: 'test-session' }); await POST(request()); assert.equal((await POST(request())).status, 429);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of [['ELEVENLABS_API_KEY', saved.key], ['ELEVENLABS_AGENT_ID', saved.agent], ['DEMO_ACCESS_CODE', saved.code]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
