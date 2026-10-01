# AGENTS.md

TableTalk is a Next.js 16 (App Router) + React 19 voice-agent demo for a fictional Lagos restaurant. Users browse a menu and build a draft order by voice (ElevenLabs) or manual controls. No real orders or payments exist. See [README.md](README.md) for the architecture overview.

## Next.js version

This project uses Next.js 16, which may differ from what you remember. Before relying on an API or convention, check the bundled docs in `node_modules/next/dist/docs/` rather than guessing.

## Commands

Use pnpm (Node 22.13+).

```bash
pnpm dev            # local dev server on :3000
pnpm test           # node:test via --experimental-strip-types (tests/*.test.ts)
pnpm typecheck
pnpm lint           # pnpm lint:fix to autofix
pnpm format:check   # pnpm format to write
pnpm build && pnpm smoke   # production build, then boots `next start` and hits routes
```

Before calling work done, run `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check`. Run `pnpm build` too when touching routes, config or server/client boundaries.

## Code conventions

- **React Compiler is on** (`next.config.ts`). Don't add `useMemo`/`useCallback`/`React.memo` for performance. Keep throwing code and other compiler bailout patterns out of component bodies.
- **Client state lives in Legend State** (`@legendapp/state` v3 beta, pinned). `lib/tabletalk/store.ts` creates one store per `<TableTalk>` mount, provided through `useTableTalkStore()`. Read observables in components with `useValue(obs$)` only. Don't use `observer()` or call `.get()` during render, because the compiler memoizes it and the component stops updating. Write with `.set()`/`.assign()` or a store action. Local `useState` is fine for state owned by a single component, and SDK state (ElevenLabs status, mute, speaking) stays in its own hooks.
- **Styling is Tailwind v4 utilities.** Theme tokens live in `app/globals.css`; prefer tokens over raw colours. Use `cn()` from `@/lib/utils` to merge classes. shadcn (new-york) primitives go in `components/ui/`.
- **Server components by default.** Only add `'use client'` where state, effects or browser APIs are needed (`tabletalk.tsx`, `voice-assistant.tsx` and their children).
- **Imports:** use the `@/` alias across folders. Files under `lib/tabletalk/` import each other with explicit `.ts` extensions, because tests run them directly in Node with type stripping. Keep them free of path aliases and Node-incompatible TypeScript syntax (enums, namespaces, parameter properties).
- ESLint enforces inline type imports, ordered import groups, `eqeqeq` (smart) and blank lines around declarations. Prettier uses single quotes and a 100-character line width.
- Commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`).

## Domain rules

- `lib/tabletalk/menu.ts` is the single source of truth for items. Prices are integer NGN.
- Order changes go through `updateOrder` in `lib/tabletalk/order.ts`, which is immutable. Totals are computed from the menu. Never accept prices from the agent.
- `changeOrder` in `lib/tabletalk/store.ts` reads the order with `peek()` and writes synchronously, so back-to-back agent tool calls never see stale state. Keep it that way, and don't route order changes through React state or effects. `tests/store.test.ts` covers this.
- Recommendations highlight items. They never add items to the order silently.
- Agent tool contracts are defined in three places that must stay in sync: `lib/tabletalk/tool-schemas.ts` (zod, runtime validation), `docs/agent-tools.json` (schemas pasted into ElevenLabs) and `docs/agent-prompt.md`. Changing a tool means updating all three and the tests.

## Security and secrets

- `ELEVENLABS_API_KEY` is server-only and is used solely in `app/api/voice/session/route.ts`. Never import it into client code or prefix it with `NEXT_PUBLIC_`.
- Preserve the session route's protections: origin check, `DEMO_ACCESS_CODE` gate, timeout, `no-store` responses and the burst guard. `tests/session.test.ts` covers them.
- Only `.env.example` is committed. Add new variables there with a comment.

## Verification honesty

Live voice behaviour can't be verified without a configured ElevenLabs agent. Don't claim voice flows, task-completion rates or latency improvements work unless they were tested. Record results in `docs/evaluation.md`.

## Agent skills

Project skills from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) are installed in `.claude/skills/` and pinned in `skills-lock.json`:

- `vercel-react-best-practices`: React/Next.js performance rules. Skip its manual memoization advice, since the React Compiler handles memoization here.
- `vercel-composition-patterns`: component API design (compound components, avoiding boolean props).
- `web-design-guidelines`: UI, UX and accessibility review against Vercel's Web Interface Guidelines.

Update them with `npx skills update -p`. Don't hand-edit the vendored files, which Prettier ignores.
