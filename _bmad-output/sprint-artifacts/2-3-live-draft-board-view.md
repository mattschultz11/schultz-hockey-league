# Story 2.3: Live Draft Board View

Status: done

## Story

As an **admin**,
I want a live draft board showing the current pick, available players, draft order, and recent picks,
So that the draft runs smoothly.

**Epic Context:** Epic 2 — Draft Board & Rosters. This is the 3rd of 6 stories. Depends on Story 2.1 (draft structure) and 2.2 (player catalog). Provides the read-only board state that Story 2.4 (record picks) builds on.

## Acceptance Criteria

1. **Given** a draft exists for a season
   **When** the draft board query is called
   **Then** the response includes: current pick (next unfilled pick), picking team, remaining draft order, available players, and recent picks in reverse chronological order

2. **Given** a pick is recorded (via existing `createDraftPick` mutation)
   **When** the SSE stream is active
   **Then** connected clients receive the update within 500ms
   **And** the event payload includes the updated pick data

3. **Given** a client connects to the SSE stream
   **When** the connection is established
   **Then** the client receives an initial `connected` event
   **And** subsequent pick events are pushed as they occur

4. **Given** an SSE client disconnects
   **When** the client reconnects
   **Then** the client can refetch the full board state via the GraphQL query
   **And** no stale data is served

5. **Given** no draft exists for a season (no DraftPick rows)
   **When** the draft board query is called
   **Then** the response returns null for currentPick and empty arrays for order/recentPicks

6. **Given** any authenticated user (admin, manager, or viewer)
   **When** the draft board query or SSE stream is accessed
   **Then** the data is returned (read access for all roles)

## Tasks / Subtasks

- [x] Task 1: Add `DraftBoard` composite type and query to GraphQL schema (AC: #1, #5)
  - [x] Add `DraftBoard` type with currentPick, pickingTeam, draftOrder, recentPicks, availablePlayers
  - [x] Add query: `draftBoard(seasonId: ID!): DraftBoard!`
  - [x] Run codegen

- [x] Task 2: Implement `getDraftBoard` service function (AC: #1, #5)
  - [x] Queries all picks, partitions into unfilled (draftOrder) and filled (recentPicks)
  - [x] currentPick = first unfilled, recentPicks = last 10 filled reversed
  - [x] Delegates to `getPlayerCatalog({ seasonId, available: true })` for availablePlayers

- [x] Task 3: Wire up GraphQL resolver (AC: #1, #6)
  - [x] `draftBoard` query resolver — read-only, no withPolicy
  - [x] `DraftBoard.pickingTeam` field resolver resolves team from currentPick.teamId

- [x] Task 4: Create SSE endpoint for draft updates (AC: #2, #3, #4, #6)
  - [x] `src/app/api/draft/stream/route.ts` with ReadableStream
  - [x] In-memory Map<seasonId, Set<Client>> for client tracking
  - [x] Sends `connected` event on connect, cleans up on abort signal
  - [x] Exports `broadcastDraftUpdate(seasonId, event)` for fire-and-forget broadcasting

- [x] Task 5: Integrate SSE broadcast into pick mutations (AC: #2)
  - [x] `createDraftPick` broadcasts after transaction
  - [x] `updateDraftPick` broadcasts after transaction

- [x] Task 6: Write tests (AC: #1–#6)
  - [x] 7 getDraftBoard tests: full state, current pick, reverse order, limit 10, available players, all filled, no draft
  - [x] All 375 tests pass with 0 regressions

## Dev Notes

### Architecture Compliance

- **Auth Strategy**: `draftBoard` query and SSE stream are read-only — no RBAC wrapping needed. All authenticated users can view the board
- **Audit**: No audit for read queries or SSE connections
- **SSE Design**: Architecture specifies SSE at `/api/draft/stream?leagueId=&seasonId=` with payload `{ type, leagueId, seasonId, payload, version }`. Use in-memory client tracking (Map of seasonId → Set of ReadableStreamControllers). Vercel serverless functions support streaming responses
- **Error Handling**: Return empty/null state for missing draft — not an error condition

### Critical Codebase Context

**DraftPick model** (`prisma/schema.prisma:326-343`): Has `overall`, `round`, `pick`, `teamId` (nullable), `playerId` (nullable, unique). A pick is "unfilled" when `playerId` is null. A pick is "filled" when `playerId` is set.

**Existing queries** (`draftPickService.ts`):

- `getDraftPicksBySeason(seasonId, ctx)` — all picks ordered by overall
- `createDraftPick(data, ctx)` — records a pick, assigns player to team
- `updateDraftPick(id, data, ctx)` — updates a pick

**Player catalog** (`playerService.ts`):

- `getPlayerCatalog({ seasonId, available: true }, ctx)` — returns undrafted players

**Next.js route handlers** (`src/app/api/`): Existing patterns at `api/graphql/route.ts`. SSE route follows same pattern but returns a streaming response.

**SSE in Next.js App Router**: Use `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', ... } })`. The `ReadableStream` constructor with a controller allows pushing events.

### Library & Framework Requirements

- **Next.js 16** — App Router route handlers support streaming via `ReadableStream`
- **No external SSE library needed** — native Web Streams API is sufficient
- **Prisma 7.0.1** — use `findFirst` with `where: { playerId: null }` and `orderBy: { overall: "asc" }` for current pick
- **Jest 30** — SSE endpoint test can use a simple fetch against the route handler export

### File Structure

```
CREATED:
  src/app/api/draft/stream/route.ts            # SSE endpoint

MODIFIED:
  src/graphql/type-defs.mjs                     # Add DraftBoard type, draftBoard query
  src/graphql/resolvers.ts                      # Add draftBoard resolver
  src/service/models/draftPickService.ts        # Add getDraftBoard, integrate broadcastDraftUpdate
  test/service/models/draftPickService.test.ts  # Add getDraftBoard tests
```

### Testing Requirements

- **Location**: `test/service/models/draftPickService.test.ts`
- **Setup**: Create season → teams → createDraft → fill some picks to simulate mid-draft state
- **SSE testing**: Unit test the broadcast function; integration test the route handler with a fetch call is optional (can defer to E2E)

### Previous Story Intelligence (from 2.1, 2.2)

- `createDraft` generates placeholder DraftPick rows with `playerId: null` — these are the "unfilled" picks
- `playerCatalog` with `available: true` returns undrafted players — reuse this
- `randIceHockeyTeam()` slug collisions — use explicit team names
- SQLite test DB limitations — no `mode: "insensitive"`, no `String[]`

### Git Intelligence

Recent commits: playerCatalog query, createDraft mutation, audit log. Pattern: type-defs → codegen → service → resolver → tests.

### DO NOT

- Do NOT wrap `draftBoard` query with `withPolicy` — read-only, all authenticated users
- Do NOT add audit logging for reads
- Do NOT use WebSockets — architecture specifies SSE
- Do NOT create a new Prisma model — DraftBoard is a composite GraphQL type, not a database entity
- Do NOT add external SSE libraries — use native Web Streams API
- Do NOT block pick mutations on SSE broadcast failure — fire-and-forget (same pattern as audit logging)

### References

- [Source: _bmad-output/epics.md#Epic-2-Story-2.3]
- [Source: _bmad-output/architecture.md#Real-time-Updates] — SSE design decisions
- [Source: _bmad-output/architecture.md#API-Contracts] — SSE endpoint spec
- [Source: src/service/models/draftPickService.ts] — existing draft pick service
- [Source: src/service/models/playerService.ts] — getPlayerCatalog for available players
- [Source: src/graphql/type-defs.mjs] — DraftPick type, existing queries

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `DraftBoard` is a composite GraphQL type (not a DB entity) — no Prisma model needed
- `pickingTeam` resolved via field resolver using `teamService.getTeamById` from currentPick.teamId
- SSE uses native Web Streams API — no external libraries
- `broadcastDraftUpdate` is fire-and-forget — failures silently caught to avoid breaking pick mutations

### Completion Notes List

- `getDraftBoard` aggregates current pick, draft order, recent picks, and available players in a single query
- SSE endpoint at `/api/draft/stream?seasonId=` with in-memory client tracking
- `broadcastDraftUpdate` integrated into `createDraftPick` and `updateDraftPick`
- 375 tests passing across 20 suites (7 new getDraftBoard tests)

### Change Log

- 2026-03-21: Story 2.3 implemented — draftBoard query + SSE endpoint + broadcast integration
- 2026-03-22: Code review fixes — extracted broadcastDraftUpdate to service/draft/draftBroadcast.ts (H2), singleton TextEncoder (M1), cancel cleanup (M2). H1 (serverless SSE) accepted as known limitation.

### File List

**Created:**

- `src/service/draft/draftBroadcast.ts` — DraftEvent type + broadcastDraftUpdate with registerBroadcast pattern
- `src/app/api/draft/stream/route.ts` — SSE endpoint, registers broadcast function on import

**Modified:**

- `src/graphql/type-defs.mjs` — Added DraftBoard type, draftBoard query
- `src/graphql/generated.ts` — Regenerated
- `src/graphql/resolvers.ts` — Added draftBoard query resolver, DraftBoard.pickingTeam field resolver
- `src/service/models/draftPickService.ts` — Added getDraftBoard, integrated broadcastDraftUpdate into createDraftPick/updateDraftPick
- `test/service/models/draftPickService.test.ts` — Added 7 getDraftBoard tests
