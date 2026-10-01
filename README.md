# TableTalk

A React voice-agent demo for a fictional Lagos restaurant. Browse a menu, talk through preferences, see recommendations highlighted, and assemble a draft order through voice or manual controls. No real orders or payments are placed.

## Local development

Requires Node.js 22.13+ and pnpm. The portable Next.js commands are the recommended path on your own computer:

```bash
pnpm install
cp .env.example .env.local
pnpm dev:next
```

Open http://localhost:3000. Menu browsing and manual order editing work without credentials. For live voice, follow [ElevenLabs setup](docs/elevenlabs-setup.md).

```bash
pnpm test
pnpm typecheck
pnpm build:next
node scripts/smoke-next.mjs
pnpm start:next
```

Production voice requires `DEMO_ACCESS_CODE`; configure it alongside the ElevenLabs server variables. Environment files are ignored except `.env.example`.

The project retains the Sites starter's Vinext/Vite scripts for the managed workspace. `dev:next`, `build:next`, and `start:next` use standard Next.js. This version is local-only and has no configured Git remote.

## Architecture

- `components/tabletalk.tsx`: menu, filters and draft-order UI; a synchronous order ref prevents successive agent/manual updates from using stale state.
- `components/voice-assistant.tsx`: ElevenLabs provider, granular SDK hooks, transcript, microphone controls, and registered client tools.
- `lib/tabletalk/menu.ts`: canonical items, integer NGN prices, dietary tags and availability.
- `lib/tabletalk/order.ts`: immutable order changes and deterministic totals. Agent-supplied prices are never accepted.
- `app/api/menu/route.ts`: validated menu search.
- `app/api/voice/session/route.ts`: server-side WebRTC token issuance with origin checks, demo-code gate, timeout, no-store responses and process-local burst guard.

Client tools search the menu through our API, highlight item IDs, and update the same draft state used by manual controls. Current draft state is sent back to the agent after changes. Recommendations do not silently add items.

## Agent configuration and evaluation

- [Agent setup and tool contracts](docs/elevenlabs-setup.md)
- [System prompt](docs/agent-prompt.md)
- [Parameter schemas](docs/agent-tools.json)
- [Evaluation checklist](docs/evaluation.md)

Live voice and browser interactions remain unverified until tested with a configured agent. Do not claim task-completion rates or latency improvements before recording the evaluation.

## Scope and limitations

Orders and transcripts live in memory and reset on refresh; transcripts are capped at 100 messages. There is no checkout, database, user account or real restaurant integration. Vegetarian tags are fictional fixture data and do not establish allergen safety. The transcript represents SDK messages and is not a guaranteed word-perfect recording.

A public deployment needs a shared rate limiter and provider-side usage/session limits. The process-local guard and client timer are demo protections, not production abuse controls.

The illustrative menu photo is sourced from the Dawa by Eric Adjepong listing on Uber Eats:
https://www.ubereats.com/store/dawa-by-eric-adjepong-elmina/_-6HULhLXLuJ-jWK60Y6eg
Its reuse license has not been verified. Replace it with an owned/licensed image before public publication.

## Git history

Work is committed incrementally with Conventional Commit messages. To connect your empty GitHub repository later:

```bash
git remote add origin https://github.com/unicdeve/YOUR_REPO.git
git push -u origin main
```
