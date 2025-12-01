# Architecture

## Executive Summary

Architecture centers on a hybrid API (GraphQL for reads, REST for uploads/webhooks/health) on Next.js 16 + React 19 with PostgreSQL/Prisma for relational data and role-scoped access. Real-time draft board updates use SSE with polling fallback, and caching/ISR accelerate public schedule/standings reads while invalidating on writes. Vercel hosts the app; Neon provides managed Postgres with daily snapshots; RBAC via NextAuth sessions and audited writes enforces admin/manager/viewer boundaries.

## Project Context Understanding

- Source documents: PRD at ai-docs/prd.md; no epics/UX/design shards loaded.
- Scope overview: multi-league + multi-season web app with in-person draft board, schedule publishing, basic stats upload/display, roster/trade management, and role-based permissions (admins, team managers, viewers).
- Functional requirements: 21 total, grouped under Draft Board & Roster; Schedules; Stats & Results; Roles & Access; General (exports, multi-league/season support).
- Non-functional focus: near-real-time draft board responsiveness; fast schedule/stats reads; role-based auth with audit of overrides; HTTPS/secure sessions; responsive desktop-first UX with acceptable mobile; accessibility for readability/keyboard nav; no external integrations beyond exports.
- Complexity indicators: live draft workflow, multi-league/season scoping, approval flows for trades/stats, read-mostly browsing; no payments or notifications; no novel patterns flagged.

## Starter Template Decision

- Primary domain: web application; suitability: full-stack Next.js with API routes/GraphQL.
- Current baseline: repository already initialized as Next.js 16 + React 19 + Tailwind CSS 4 + Prisma (Postgres) + GraphQL Yoga/Apollo. Treat this as the starter; no new CLI init required.
- Equivalent init (recorded for reproducibility): `npx create-next-app@latest schultz-hockey-league --typescript --tailwind --eslint --app`
- Added layers beyond starter: Prisma 7 + Postgres adapter, GraphQL Yoga schema/resolvers with Apollo Client, Tailwind 4, HeroUI/Framer Motion.
- Version verification: now includes npm registry checks (2025-12-01T16:17:58Z UTC) plus local package.json.
- Verification search term for CLI (record for later): "create-next-app latest flags 2025-12-01".
- Starter coverage (from baseline repo): Next.js 16.0.1, React 19.2.0, TypeScript 5.x, ESLint 9.x, Tailwind CSS 4.1.17.

## Version Verification

- Sources: npm registry (external) as of 2025-12-01T16:17:58Z UTC + package.json.
- Verified versions (npm view): create-next-app 16.0.6, Next.js 16.0.6, React 19.2.0, next-auth 4.24.13 (latest stable; 5.x not adopted), GraphQL Yoga 5.17.0, @apollo/client 4.0.9, Prisma 7.0.1, pg 8.16.3, tailwindcss 4.1.17, @heroui/react 2.8.5, framer-motion 12.23.25.
- Local toolchain: TypeScript 5.x, ESLint 9.x, dotenvx 1.51.1, testing stack (Jest 30.2.0, @testing-library/react 16.3.0, ts-jest 29.4.5).
- LTS posture: Node 22.x LTS (local node v22.17.0). Align runtime to 22.x LTS; avoid older 18/20 unless required by hosting.
- Breaking note: next-auth 5.x not yet stable; stay on 4.24.13 until 5.x GA and migration notes reviewed.

## Decision Identification (mode: EXPERT)

- Total architectural decisions tracked: 12; starter already covers 5 (framework/runtime: Next.js 16, React 19, TypeScript, Tailwind 4, ESLint scaffolding).
- Remaining decisions by priority:
  - CRITICAL (blocks everything): database + ORM posture (Postgres + Prisma conventions, migrations, backups); API contract shape (GraphQL vs REST around current Yoga/Next); auth/authz (identity source, role model, session strategy, admin vs manager vs viewer enforcement); deployment target + secrets management (Vercel vs alt); real-time/near-real-time draft update pattern (polling vs WebSocket/SSE); data model boundaries for multi-league/multi-season and roles.
  - IMPORTANT (shapes architecture): caching strategy (page/data caching for schedules/stats, draft board freshness), file/import handling for stats uploads/exports, error/logging standards, testing strategy (unit/integration/E2E focus areas), background work (if any for stats validation/publishing), observability/light telemetry.
  - NICE-TO-HAVE: search/indexing (basic Postgres FTS for players/teams), analytics/metrics beyond MVP, feature flags.
- Starter-covered decisions tagged as PROVIDED BY STARTER; remaining 7 require explicit choices.

## Project Initialization

First implementation story should execute:

```bash
npx create-next-app@latest schultz-hockey-league --typescript --tailwind --eslint --app
```

Then layer in:

- Prisma 7 + Postgres adapter (Neon), migrations
- GraphQL Yoga + Apollo Client
- Tailwind 4, HeroUI, Framer Motion
- NextAuth configuration with role model (admin/manager/viewer)

## Decision Summary

| Category                       | Decision                                                                                                                                                         | Version                                                      | Affects Epics                 | Provided by Starter?       | Rationale                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework/runtime              | Next.js app router with React + TypeScript + ESLint baseline                                                                                                     | Next.js 16.0.6, React 19.2.0, TypeScript 5.x, ESLint 9.x     | All                           | Yes                        | Core app/runtime already in repo (starter coverage)                                                                                                     |
| Styling baseline               | Tailwind CSS utility-first styling                                                                                                                               | Tailwind 4.1.17                                              | Frontend                      | Yes                        | Matches starter; keeps UI lightweight                                                                                                                   |
| API contract                   | Hybrid: GraphQL (Yoga) for reads; REST endpoints for uploads/webhooks/health                                                                                     | GraphQL Yoga 5.17.0, Next.js 16.0.6                          | All                           | No                         | Flexible roster/schedule/stat queries with GraphQL; REST keeps uploads/webhooks simple and cacheable; aligns with Next.js platform                      |
| Authentication & Authorization | NextAuth.js with credentials/provider option; role-based enforcement (admin/manager/viewer) in API layer; session-backed via secure cookies                      | next-auth 4.24.13 (stable), Next.js 16.0.6                   | All write paths               | No                         | Fits Next.js, minimizes custom auth; RBAC matches roles; session cookies simplify SSR/CSR and API guards; hold on 4.x until 5.x GA                      |
| Database & ORM                 | PostgreSQL + Prisma with strict naming conventions, migrations, and backups; row scoping by league/season/team/user role                                         | PostgreSQL 16 (target), Prisma 7.0.1, pg 8.16.3              | All data                      | No                         | Relational fits rosters/schedules/stats; Prisma already in repo; naming/migration discipline avoids drift; row scoping enforces multi-league boundaries |
| Deployment & Secrets           | Vercel primary; managed Postgres (Neon/Railway) with daily snapshots; env via Vercel/CI secrets; local .env for dev                                              | Vercel platform, dotenvx 1.51.1                              | All                           | No                         | Vercel aligns with Next.js; managed DB reduces ops; secrets managed centrally; backups protect draft/schedule/state                                     |
| Real-time Draft Updates        | Server-Sent Events (SSE) via Next.js route handler for draft board; short-polling fallback                                                                       | Next.js 16.0.6 platform                                      | Draft board, roster updates   | No                         | SSE is lightweight on Vercel for 1→many updates; polling fallback keeps UX alive if SSE blocked; defer WebSockets unless needed                         |
| File Uploads / Stats Import    | REST upload endpoint with file-size limits and MIME validation; parse CSV/JSON server-side; store to Postgres; audit submissions; admin approval path            | Next.js 16.0.6 API route; Node streams                       | Stats & Results               | No                         | Keeps binary/files out of GraphQL; simple REST handler with validation; audit + approval matches FR14/FR13                                              |
| Caching Strategy               | Page-level caching for public schedules/standings; GraphQL response caching for read-heavy queries; SWR/ISR for roster/schedule/stat views; invalidate on writes | Next.js 16.0.6 (ISR/route cache), Apollo Client 4.0.9        | Schedules, stats, draft views | No                         | Reduces load and improves perceived speed; explicit invalidation on writes keeps data fresh; balances real-time draft with cacheable public views       |
| UI Layer                       | Tailwind CSS + HeroUI + Framer Motion                                                                                                                            | Tailwind 4.1.17, @heroui/react 2.8.5, Framer Motion 12.23.25 | Frontend                      | Partial (Tailwind starter) | Matches existing stack; balances utility classes with component library and motion hooks                                                                |
| Testing & QA                   | Unit/integration with Jest + Testing Library; API tests via Next.js test app; snapshot minimal                                                                   | Jest 30.2.0, @testing-library/react 16.3.0, ts-jest 29.4.5   | All                           | No                         | Ensures regressions are caught for draft/schedule/stats/auth; aligns with current toolchain                                                             |
| Background/Async Processing    | Inline processing in API routes; Prisma transactions; ISR revalidation on writes; no queue in MVP                                                                | N/A (process)                                                | Imports/approvals/caching     | No                         | Simpler ops footprint; avoids queue until scale requires; explicit revalidation keeps caches fresh                                                      |

Starter-provided items (covered by baseline): Next.js, React, TypeScript, ESLint, Tailwind CSS.

## Project Structure

```
schultz-hockey-league/
  app/
    api/
      graphql/route.ts            # GraphQL Yoga endpoint
      uploads/stats/route.ts      # REST upload handler (CSV/JSON)
      health/route.ts             # REST health
    draft/                        # Draft UI routes/pages
    schedule/                     # Schedule UI routes/pages
    stats/                        # Stats UI routes/pages
    auth/                         # Auth pages (if needed)
  src/
    draft/                        # Draft domain logic, components, hooks, repo
    schedule/                     # Schedule domain logic
    stats/                        # Stats domain logic
    auth/                         # Auth helpers (role checks, policies)
    shared/
      db/client.ts                # Prisma client singleton
      types/                      # Shared DTOs/types
      ui/                         # Shared UI primitives
      utils/                      # Helpers (dates, formatting)
    test/                         # Shared test utilities
  prisma/
    schema.prisma                 # Data model
    migrations/                   # Migration files
  public/                         # Static assets
  .env.example                    # Example env vars
  package.json
  tsconfig.json
  next.config.ts
  tailwind.config.ts
  eslint.config.mjs
```

## Epic to Architecture Mapping

FR Category to Architecture Mapping

- Draft Board & Roster (FR1–FR8): GraphQL reads for board/roster; REST for uploads/health; SSE stream per league/season; Prisma models for league/season/team/player/roster/pick/trade; RBAC enforced in resolvers/handlers.
- Schedules (FR9–FR12): GraphQL queries for league/team schedules; mutations for updates; caching/ISR for public views; Prisma models for game/schedule; RBAC guards.
- Stats & Results (FR13–FR15): REST upload endpoint with validation/audit; GraphQL reads for scores/standings; approval workflow via mutations; Prisma models for game_result/stats_entry; RBAC guards.
- Roles & Access (FR16–FR18): NextAuth session; RBAC checks at API boundary; policy helpers per role; audit trail on writes.
- General (FR19–FR21): Player profiles via GraphQL CRUD; exports via REST; multi-league/season scoping enforced in queries; Prisma schemas scoped by league/season IDs.

## Technology Stack Details

### Core Technologies

- Next.js 16.0.6 (app router), React 19.2.0, TypeScript 5.x
- GraphQL Yoga 5.17.0 for reads; REST handlers for uploads/health
- Prisma 7.0.1 with PostgreSQL (Neon managed), pg 8.16.3
- Tailwind CSS 4.1.17, HeroUI 2.8.5, Framer Motion 12.23.25
- NextAuth.js 4.24.13 (stable) with RBAC (admin/manager/viewer); revisit 5.x on GA
- Apollo Client 4.0.9 for GraphQL, SWR/ISR for caching/refresh

### Integration Points

- None in MVP beyond database and auth provider; webhooks limited to internal health/checks.

## Functional Requirement Coverage (FR-level)

- FR-001: Draft setup (order/keepers/tiebreakers) → Prisma models (Season/DraftPick) + admin mutations; guarded by RBAC.
- FR-002: Live draft board view → GraphQL draftBoard query + SSE stream for pick updates.
- FR-003: Record picks → GraphQL mutation `recordDraftPick`; Prisma transaction updates roster; SSE broadcast + cache invalidation.
- FR-004: Manager pick entry → Same mutation with role checks; admin override flag; audit log entry.
- FR-005: Publish finalized rosters → Mutation to publish roster; triggers ISR revalidation for draft/roster pages.
- FR-006: Post-draft roster changes → Mutations on roster entries; audit trail; cache invalidation.
- FR-007: Trade tracking/approval (Growth) → Trade model + mutations `proposeTrade`/`approveTrade`/`rejectTrade`; audit + RBAC.
- FR-008: Team manager roster/draft visibility → GraphQL queries scoped by league/season/team with RBAC.
- FR-009: Create/publish league schedule → Mutations for schedule CRUD; Prisma Game model; publish flag.
- FR-010: Update/republish schedules → Mutations update schedule entries; ISR revalidation for schedule pages.
- FR-011: League schedule view → GraphQL schedule query with league scope; cached page for public view.
- FR-012: Team schedule view → GraphQL team schedule query filtered by teamId; cached page.
- FR-013: Admin stats entry/publish → REST upload + GraphQL mutation for approval; Prisma StatsEntry/GameResult update; audit.
- FR-014: Manager stats submission with approval → REST upload endpoint with role check + approval mutation; audit and status.
- FR-015: View scores/standings/stats → GraphQL queries (standings/stats) + cached pages.
- FR-016: Admin full write access → RBAC middleware/policies enforce admin on mutations; audit.
- FR-017: Manager limited write access → RBAC policies restrict to team/season scope.
- FR-018: Viewer read-only → Queries allowed; mutations blocked; RBAC enforced at handlers/resolvers.
- FR-019: Player profile management → GraphQL CRUD for players; Prisma Player model; RBAC.
- FR-020: Multi-league/season scoping → All queries/mutations include leagueId/seasonId; indexes and tenancy fields.
- FR-021: Exports → REST export endpoint (CSV/JSON) scoped by league/season/team; audit download as needed.

### Acceptance/Test Hooks per FR

- FR-001–FR-006: Jest + Testing Library; mutation tests for draft setup/picks/roster publish; contract tests on GraphQL schema for inputs; SSE/poll fallback tested via mocked event stream; audit entries asserted.
- FR-007: Trade propose/approve/reject mutation tests; audit log and RBAC coverage; data integrity (no duplicate assets) checked in tests.
- FR-008: Access tests for manager views; RBAC denies writes outside team scope.
- FR-009–FR-012: Schedule CRUD mutation tests; ISR revalidation hook assertions; cached view snapshot tests; conflict detection unit tests.
- FR-013–FR-015: REST upload handler tests (MIME/size), approval mutation tests, GraphQL query tests for stats/standings; audit and role enforcement verified.
- FR-016–FR-018: RBAC middleware tests across mutations/REST; deny-by-default coverage.
- FR-019–FR-021: Player CRUD tests; export endpoint tests with scoping; multi-league/season tenancy enforced in queries.

## Novel Pattern Designs

None identified; standard patterns cover all FRs.

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

- API routes: REST routes kebab-case (`/api/draft-board`, `/api/uploads/stats`); GraphQL schema types/fields camelCase; route params `:id` snake_case in DB, camelCase in code.
- Database: snake_case tables and columns; primary keys `id`; foreign keys `<table>_id`; enum values lowercase with underscores.
- Files: React components PascalCase filenames; hooks/utilities camelCase; tests mirror source with `.test.ts(x)`.
- Events (SSE): event names kebab-case (`draft-update`, `roster-update`).

### Code Organization Patterns

- Feature-first structure under `src/` (e.g., `draft/`, `schedule/`, `stats/`, `auth/`, `shared/`), with colocated components, hooks, and tests.
- API: `app/api/*` for REST; `app/api/graphql/route.ts` for Yoga; shared DTOs/types in `src/shared/types`.
- Data access: Prisma client in `src/shared/db/client.ts`; repositories per feature (e.g., `src/draft/repo.ts`); no raw SQL outside repositories/migrations.
- UI: `src/draft/components/*`, `src/schedule/components/*`, etc.; shared UI primitives in `src/shared/ui`.
- Tests: colocate unit/integration tests with features; E2E (if added) under `test/e2e`.

### Error Handling

- REST: consistent JSON `{ error: { code, message, details? } }` with HTTP status codes; GraphQL: use typed errors mapped to extensions (code/message).
- Validation: Zod/Effect schemas at API boundary; reject invalid payloads with 400; log validation errors at debug level.
- Uploads: return 400 for invalid MIME/size; capture audit entry (who/when/file meta).
- Draft/SSE: client should reconnect with retry + backoff; server keeps last known state per league/season for replay on reconnect.

### Logging Strategy

- Structured logging (JSON) server-side with level + context (userId, leagueId, seasonId, requestId).
- Client: console logging only for dev; no PII in client logs.
- Request correlation: generate requestId per API request; include in responses and logs; propagate through GraphQL/REST handlers.
- Audit: writes to roster/draft/stats create audit trail table with actor, action, target, timestamp, delta/metadata.

### Format Patterns

- Dates/times: store UTC in DB; ISO 8601 in APIs; display with league-local timezone offset from settings.
- IDs: use UUID v7 for new entities; keep numeric season/year fields as ints.
- Currency: not used in MVP; if added, minor units integers.
- Pagination: cursor-based for GraphQL lists; REST uses `?cursor=` with `limit`.

### Communication Patterns

- GraphQL: queries for read; mutations for writes; avoid over-nesting; use input types for mutations.
- REST: uploads/webhooks/health only; 429 for rate limit; 401/403 for auth issues.
- SSE: one stream per league/season for draft board; event payload shape `{ type, leagueId, seasonId, payload, version }`.
- Vercel SSE constraints: prefer serverless functions with keep-alive headers; expect moderate fan-out (league-level) only; if sustained >100 concurrent streams or long-running drafts cause cold starts, move draft stream to edge/function with keep-alive tuning or introduce queue/socket service.

### Lifecycle Patterns

- Loading/error states standardized: `idle | loading | success | error`; UI shows skeletons for lists, inline errors for forms.
- Retry policy: idempotent GETs can retry; mutations not retried client-side unless explicitly idempotent.
- SSE reconnect with exponential backoff capped; fallback to polling if SSE fails repeatedly.
- ISR/cache invalidation: revalidate draft/schedule/stats pages after mutations or uploads.

### Location Patterns

- Config: `.env` for local; Vercel env vars for deploy; no secrets in repo.
- Static assets: `public/` for static logos/icons; uploaded stats stay in Postgres (no blob storage in MVP).
- Migrations: `prisma/migrations`; generated client in `node_modules/.prisma`.

### Consistency Patterns

- Dates in UI: use league-local timezone formatting helper; never show raw UTC.
- Error copy: user-facing messages concise, no stack traces; log details server-side.
- Role checks: guard at handler/resolver entry; deny by default.

### Testing Strategy

- Unit/integration: Jest 30.2.0 + ts-jest 29.4.5; colocate tests with features under `src/*/*.test.ts(x)`.
- Component/UI: @testing-library/react 16.3.0 for render/interaction; mock GraphQL via test client; snapshots only for stable UI primitives.
- API: Use next/jest test app to hit route handlers/resolvers with mocked Prisma; cover auth/RBAC, validation, and cache invalidation hooks.
- E2E (when added): add Playwright and run smoke against draft/schedule/stats flows; gate on CI optional until enabled.
- Coverage focus: draft pick/roster updates, schedule publish/update, stats upload/approval, RBAC guards, cache/SSE fallbacks.

### Background and Async Processing

- Default: inline processing in API handlers/resolvers with Prisma transactions; avoid external queue in MVP.
- ISR/cache invalidation: trigger revalidate for draft/schedule/stats pages on write paths.
- SSE stream: reuse in-memory state per league/season; fall back to polling for clients that disconnect.
- Future scale: if uploads/imports exceed API latency budgets, introduce queue worker (e.g., Inngest/worker thread) with the same audit/RBAC policies.

## Consistency Rules

### Naming Conventions

See Implementation Patterns → Naming Conventions.

### Code Organization

See Implementation Patterns → Code Organization Patterns.

### Error Handling

See Implementation Patterns → Error Handling.

### Logging Strategy

See Implementation Patterns → Logging Strategy.

## Data Architecture

- Entities:
  - League, Season (season belongs to league)
  - Team (belongs to league)
  - Player (belongs to league; optionally linked to team via roster)
  - RosterEntry (team, player, season, status)
  - DraftPick (season, team, player, pick_number, round, status)
  - Trade (from_team, to_team, assets, status, approval trail)
  - Game (season, home_team, away_team, date/time/location)
  - GameResult / StatsEntry (game, team, scores/penalties/key stats, submitted_by, approved_by, status)
  - User (auth identity), Role mapping (admin/manager/viewer scoped by league/team), Session (NextAuth)
  - AuditLog (actor, action, target, timestamp, metadata)
- Relationships emphasize league/season scoping on all queries and writes.

## API Contracts

- GraphQL (Yoga):
  - Queries: leagues, seasons(leagueId), teams(leagueId), players(leagueId), draftBoard(seasonId), rosters(teamId/seasonId), schedule(leagueId/seasonId/teamId), standings(leagueId/seasonId), stats(leagueId/seasonId/teamId), trades(leagueId/seasonId).
  - Mutations: create/update season/team/player; recordDraftPick; approveTrade/rejectTrade; updateSchedule; publishSchedule; submitStats; approveStats; updateRoster.
  - Pagination: cursor-based for list queries; includes leagueId/seasonId scoping and role checks.
- REST:
  - POST `/api/uploads/stats`: multipart/JSON upload with size/MIME validation; stores parsed stats and audit entry; requires auth (manager/admin) and approval flow.
  - GET `/api/health`: returns service status.
  - SSE `/api/draft/stream?leagueId=&seasonId=`: server-sent events for draft board updates; payload `{ type, leagueId, seasonId, payload, version }`.

## Security Architecture

- Auth: NextAuth sessions (secure cookies); provider choice open (credentials/oauth) but role model is enforced server-side.
- RBAC: admin/manager/viewer enforced at handler/resolver entry; deny by default; policies encapsulated per feature.
- Input validation: Zod/Effect schemas on all mutations/REST inputs; reject invalid payloads with 400; sanitize/escape as needed.
- Data scoping: all queries/writes scoped by league/season/team; user-role association checked for writes.
- Audit: AuditLog records for writes to draft/roster/trades/stats; includes actor and metadata.
- Transport: HTTPS enforced; secure cookies; no secrets in client.

## Performance Considerations

- Caching: ISR/page cache for public schedules/standings; GraphQL response cache for read-heavy queries; SWR for client revalidation; explicit invalidation on writes.
- Real-time: SSE for draft board; polling fallback; lightweight payloads.
- DB: indexes on leagueId/seasonId/teamId; composite indexes for draft picks (seasonId, round, pick_number) and schedules/games; pagination with cursors.
- Payloads: cursor pagination, limit sizes; avoid over-nesting GraphQL responses.
- Frontend: code-splitting via Next.js; image/static assets from `public/`.

## Deployment Architecture

- Vercel for app hosting; Next.js serverless/edge as appropriate.
- Neon for managed Postgres; daily snapshots; connection pooling.
- Secrets/config: Vercel env vars; local `.env` for dev; no secrets committed.
- Backups/restore: rely on Neon snapshots; document restore steps; pre-release backup before draft day.

## Development Environment

### Prerequisites

- Node 20+, npm
- PostgreSQL connection (Neon project) with connection string
- dotenvx (already in repo) for env management if desired
- Optional: Docker if running local Postgres

### Setup Commands

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Migration & Evolution

- Database migrations: use Prisma migrate; all schema changes go through migration files; no ad-hoc DB edits. Backup Neon before draft-day changes.
- API evolution: prefer additive GraphQL schema changes; deprecate fields before removal; REST endpoints versioned via path if breaking (`/api/v1/...`).
- Auth provider: finalize provider (credentials/OAuth) before production; ensure session cookie config matches provider requirements; record provider/version on adoption.
- Queue introduction criteria: add a worker if stats imports or draft audit processing regularly exceed API timeouts; reuse same RBAC/audit patterns.

## Architecture Decision Records (ADRs)

- API: Hybrid GraphQL (Yoga) + REST uploads/webhooks/health
- Auth: NextAuth sessions with RBAC (admin/manager/viewer)
- Data: PostgreSQL + Prisma with strict naming/migrations and league/season scoping
- Deployment: Vercel + Neon (managed Postgres), env via Vercel/local .env, daily snapshots
- Real-time: SSE for draft board with polling fallback
- Uploads: REST upload endpoint with validation/audit, approval workflow
- Caching: ISR/page cache + GraphQL response caching + SWR with invalidation on writes

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-01_
_For: Schultz_
