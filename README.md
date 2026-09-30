# ExplainX

A dark-first, bilingual interactive learning workspace built with Next.js, React, TypeScript and Zod. It structures explanations into reading sections, progressively requested reasoning, concept maps, and knowledge checks—not a chat transcript.

## Run

```sh
npm install
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local for general-topic explanations.
npm run dev -- --hostname 0.0.0.0
```

`OPENAI_MODEL` defaults to `gpt-4o-mini`. `OPENAI_BASE_URL` can point to a trusted OpenAI-compatible provider supporting JSON-object chat completions. Keys are read only by the server. Do not use `NEXT_PUBLIC_` for credentials.

Without a provider, the app shows an honest configuration message. **There are no simulated AI answers, seeded histories, artificial delays, or fabricated citations.** A deterministic local solver supports `ax + b = c` with finite decimal coefficients, including zero-coefficient cases. Try `2x + 5 = 15`, `-2x + 4 = 10`, or `0x + 5 = 5`. It is intentionally not a general symbolic algebra engine.

## Implemented

- Five explanation depths, category detection by the provider, and optional inline concept visualization.
- Validated structured sections: ideas, steps, examples, labeled analogies, code, equations, misconceptions, limitations, summaries.
- Understand / Go deeper / Explore views, contextual follow-ups, and alternate-explanation requests.
- On-demand hierarchical WHY requests. Local algebra exposes its deterministic reasoning once rather than pretending to generate further discoveries.
- Data-derived SVG concept map with zoom, pointer pan, reset and keyboard-operable nodes. Relationships are associations, not automatically asserted causation.
- Multiple-choice checks with answer feedback and explanations.
- Searchable/filterable history, favorites, reopen and delete. Validated local storage; storage failures are surfaced.
- Seven-day normalized cache including depth, category, language, mode, visualization preference and relevant context; regeneration bypasses cache.
- Cancellation, timeout, bounded requests/responses, controlled retry on malformed provider output, safe React text rendering.
- English/Arabic UI and generated content, RTL, mobile drawer, reduced-motion handling, accessible dialogs and focus states.
- Markdown and text download; print stylesheet for browser Print / Save PDF. Exports use content, not screenshots.

## Architecture

- `src/app/api/explain/route.ts`: request bounds, validation, origin check, local-solver dispatch, provider availability, timeout and per-instance rate limiting.
- `src/lib/ai.ts`: server-side provider adapter with depth/mode-specific instructions and one controlled schema-repair attempt.
- `src/lib/schema.ts`: shared request/content schemas and inferred types.
- `src/lib/algebra.ts`: narrow deterministic grammar and calculated educational explanations; never evaluates user code.
- `src/lib/storage.ts`: cache identity, persisted library validation and the single client API adapter.
- `src/components/`: reusable home, sidebar, history, reader, quiz/reasoning and lazy-loaded map components.
- `src/lib/i18n.ts`: centralized bilingual UI dictionary.
- `src/app/globals.css`: design tokens, responsive layouts, reduced-motion and print styles.

Unfavorited history is bounded to 100 entries; favorites are retained until explicitly removed. Local storage is device-specific, not an account or cloud backup. Saved content remains usable when the provider fails, but a fresh page load still requires the application server (no service worker/offline shell is installed).

## Verification

```sh
npm run lint
npm test
npm run build
npm run start -- --hostname 0.0.0.0
# In another terminal:
npx playwright install --with-deps chromium
npm run test:browser
npm run test:a11y
```

For restricted Linux sandboxes where the Playwright browser CDN is unavailable, `BUNDLED_CHROMIUM=1 npm run test:browser` (and `test:a11y`) uses the dev-only bundled Chromium fallback. Screenshots are written to `/tmp`, not Git.

Unit tests cover solver edge cases, all depths/languages, malformed nested output, fenced JSON, cache collisions, storage failure, exports and provider-schema recovery. Provider tests use explicit test fixtures, never application fallback content. Browser checks cover input errors, unavailable AI, calculated explanations, favorites/reload, quiz, WHY, map navigation, depth, simplification, downloads, follow-ups, history search/delete, mobile drawer, RTL persistence and overflow. Axe checks WCAG A/AA on home and reader.

## Deployment boundaries

The AI provider requires a real server-side key and billing; a live provider call cannot be verified without one. Live web retrieval is **not implemented** and the UI states that clearly. Schema validation catches malformed structure, not factual truth or arbitrary mathematical validity. Review important AI-generated content against authoritative sources.

Before a public multi-user launch, add authentication, a distributed user-based rate limiter and spending controls at your trusted edge. The included in-memory limiter is per instance and trusts forwarding headers from your deployment proxy; it is not an abuse-proof public billing boundary. Configure your proxy to strip untrusted forwarding headers. Safety instructions are included in the provider prompt, but are not a substitute for a dedicated moderation policy/service where required.
