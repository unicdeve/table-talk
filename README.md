# TableTalk

A React voice-agent demo for a fictional Lagos restaurant. Browse a menu, talk through preferences, see recommendations highlighted, and assemble a draft order through voice or manual controls. No real orders or payments are placed.

## Local development

Requires Node.js 22.13+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. Menu browsing and manual order editing work without credentials. For live voice, follow [ElevenLabs setup](docs/elevenlabs-setup.md).

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm smoke
pnpm start
```

Production voice requires `DEMO_ACCESS_CODE`; configure it alongside the ElevenLabs server variables. Environment files are ignored except `.env.example`.

## Architecture

- `components/tabletalk.tsx`: client workspace that creates the store and provides it to `menu-section.tsx`, `order-panel.tsx` and the voice assistant. The static header and footer are server components.
- `lib/tabletalk/store.ts`: [Legend State](https://legendapp.com/open-source/state/v3/) store for the draft order, notice, menu filters, highlights and voice transcript, plus computed summary and filtered menu. Observables update synchronously, so back-to-back agent tool calls never use stale state. `hooks/use-tabletalk-store.ts` exposes it to components, which read it with `useValue`.
- `components/voice-assistant.tsx`: ElevenLabs provider, granular SDK hooks, transcript, microphone controls, and registered client tools.
- `lib/tabletalk/menu.ts`: canonical items, integer NGN prices, dietary tags and availability.
- `lib/tabletalk/order.ts`: immutable order changes and deterministic totals. Agent-supplied prices are never accepted.
- `app/globals.css`: Tailwind theme tokens (colours, orb shadow and animation) plus a small base layer; components are styled with Tailwind utilities.
- `app/api/menu/route.ts`: validated menu search.
- `app/api/voice/session/route.ts`: server-side WebRTC token issuance with origin checks, demo-code gate, timeout, no-store responses and process-local burst guard.

React Compiler is enabled in `next.config.ts`, so components are memoized automatically; avoid manual `useMemo`/`useCallback` and keep throwing code out of component bodies so the compiler does not skip them.

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
