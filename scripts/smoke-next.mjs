import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let output = '';
server.stdout.on('data', (data) => (output += data));
server.stderr.on('data', (data) => (output += data));
const base = 'http://127.0.0.1:3000';
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Production server starts');
  const page = await (await fetch(base)).text();
  assert.ok(page.includes('What sounds good?'));
  assert.ok(page.includes('Talk to the assistant'));
  assert.ok(page.includes('Your draft order'));
  const menu = await fetch(`${base}/api/menu?vegetarian=true&maxPrice=5000&category=Mains`);
  assert.equal(menu.status, 200);
  assert.deepEqual(
    (await menu.json()).items.map((item) => item.id),
    ['jollof', 'beans'],
  );
  assert.equal((await fetch(`${base}/api/menu?maxPrice=invalid`)).status, 400);
  assert.equal((await fetch(`${base}/jollof.jpg`)).status, 200);
  const session = await fetch(`${base}/api/voice/session`, {
    method: 'POST',
    headers: { origin: base },
  });
  assert.equal(session.status, 503);
  assert.equal(session.headers.get('cache-control'), 'no-store');
  console.log(
    'Production smoke checks passed: page, menu constraints, invalid filters, image and unconfigured voice.',
  );
} finally {
  server.kill('SIGTERM');
}
