import { z } from 'zod';

export const dynamic = 'force-dynamic';
// A local, process-wide burst guard. A public multi-instance deployment needs a shared limiter.
let windowStart = 0;
let issued = 0;
const response = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const expectedOrigin =
    process.env.APP_ORIGIN ||
    `${requestUrl.protocol}//${request.headers.get('host') || requestUrl.host}`;
  if (!origin || origin !== expectedOrigin)
    return response({ error: 'Please start the session from this app.' }, 403);
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId)
    return response(
      {
        error:
          'Voice is not configured yet. Add the ElevenLabs API key and agent ID on the server, then restart the app.',
      },
      503,
    );
  const accessCode = process.env.DEMO_ACCESS_CODE;
  if (process.env.NODE_ENV === 'production' && !accessCode)
    return response({ error: 'Voice access is not configured for this deployment.' }, 503);
  if (accessCode && request.headers.get('x-demo-access-code') !== accessCode)
    return response({ error: 'Enter the correct demo access code.' }, 401);
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    issued = 0;
  }
  if (issued >= 5)
    return response({ error: 'Too many session requests. Try again in a minute.' }, 429);
  issued++;
  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { 'xi-api-key': key },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!upstream.ok)
      return response(
        {
          error:
            'Could not start voice. Check the server credentials and agent configuration, then retry.',
        },
        502,
      );
    const result = z.object({ token: z.string().min(1) }).safeParse(await upstream.json());
    if (!result.success)
      return response(
        { error: 'The voice service returned an invalid session. Please retry.' },
        502,
      );
    return response({ token: result.data.token });
  } catch {
    return response({ error: 'The voice service did not respond. Please retry.' }, 502);
  }
}
