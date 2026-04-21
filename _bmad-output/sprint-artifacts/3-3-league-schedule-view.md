# Story 3.3: League Schedule View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **viewer**,
I want a league-wide schedule view that shows each game's status at a glance,
so that I can see which games are upcoming, which are final, and which are past but not yet finalized — without clicking into each game.

**Epic Context:** Epic 3 — Schedules (story 3 of 5). The public league schedule page at `/leagues/[leagueSlug]/seasons/[seasonSlug]/games` already exists — it was built in Story 3.1 and serves both admins and viewers via an `isAdmin` conditional. **Most of this story's acceptance criteria are already satisfied by 3.1's deliverable** (chronological order, date/team/location filters with debounce, pagination at 25/page, viewer read-only via hidden Edit/New Game controls). The net-new work is a **Status column** — today the table shows `round | home | away | date | time | location` with no indicator of whether a game is upcoming or final. Viewers have to infer from the date, which is fragile around the current moment and impossible for historical seasons. This story adds a derived status (Upcoming / Final / Awaiting) rendered as a color-cued `Chip` in the existing table. Scores are explicitly out of scope — they belong to Story 5.3 (Publish Scores and Standings).

## Acceptance Criteria

1. **Given** a viewer navigates to `/leagues/[leagueSlug]/seasons/[seasonSlug]/games`
   **When** the table renders
   **Then** each row displays a new `Status` column alongside the existing columns (round, home, away, date, time, location)
   **And** the column fits within the existing `overflow-x-auto` wrapper so mobile degrades to horizontal scroll identically to today

2. **Given** a game's `datetime` is in the future (≥ now)
   **When** the row is rendered
   **Then** the status displays `Upcoming` in a neutral-color `Chip` (HeroUI `color="default"` or `"primary"`)
   **And** the score/result is NOT displayed (out of scope for this story)

3. **Given** a game has both `homeTeamResult` AND `awayTeamResult` set to non-null `Result` enum values
   **When** the row is rendered
   **Then** the status displays `Final` in a success-color `Chip` (HeroUI `color="success"`)
   **And** this classification takes precedence over the datetime check — a Final game stays Final even if someone edits the datetime to the future

4. **Given** a game's `datetime` is in the past (< now) AND at least one of `homeTeamResult` / `awayTeamResult` is null
   **When** the row is rendered
   **Then** the status displays `Awaiting` in a warning-color `Chip` (HeroUI `color="warning"`)
   **And** this signals to viewers that the game was scheduled to be played but results haven't been finalized yet

5. **Given** the status derivation is a pure function `getGameStatus(datetime, homeTeamResult, awayTeamResult)`
   **When** unit tests run
   **Then** all three branches are covered (Upcoming, Final, Awaiting)
   **And** the boundary case `datetime === now` is explicitly tested (resolves to Upcoming — `>=` not `>`)
   **And** the "Final takes precedence over datetime" case is tested (future datetime + both results set → Final)
   **And** the asymmetric case (only one team's result set) is tested → Awaiting if past, Upcoming if future

6. **Given** a viewer with role MANAGER or viewer-without-session
   **When** they view the page
   **Then** no Edit button is visible on any row (AC enforced by existing 3.1 logic — no new code)
   **And** no "New Game" / "Email Schedule" admin actions appear in the header

7. **Given** the viewer loads the page with a full season (~100 games)
   **When** the page server-renders
   **Then** P75 latency stays ≤2s per the epic NFR-002 target
   **And** the existing pagination (25 per page) keeps per-request DB work bounded to a single paginated `findMany` + one `count` + one `findMany` for the team filter list — all scoped by `seasonId`

## Tasks / Subtasks

- [x] **Task 1: Add pure `getGameStatus` helper** (AC: #2, #3, #4, #5)
  - [x] Created `src/components/gameStatus.ts` — 14 lines total. Kept as its own module (not co-located in `GamesTable.tsx`) to keep the test import path clean
  - [x] Signature: `getGameStatus(datetime, homeTeamResult, awayTeamResult, now = new Date())` returning `"Upcoming" | "Final" | "Awaiting"`
  - [x] Final-precedence → Upcoming (boundary `>=`) → Awaiting, per ACs #2/#3/#4
  - [x] `now` defaulted — tests inject a fixed clock
  - [x] Client-safe: exports a local `GameResult = "WIN" | "LOSS" | "TIE"` literal union. Chose this over importing `Result` from `@/service/prisma/generated/enums` (StandingsTable's approach) because this function is pure and has no reason to couple to the generated Prisma enum. At the table layer the same literal union is reused. If a consumer needs the actual Prisma enum, they can narrow/widen at the boundary.

- [x] **Task 2: Extend `GamesTable` row type and columns** (AC: #1, #2, #3, #4, #6)
  - [x] Extended `GamesTableGame` with `homeTeamResult: GameResult | null` + `awayTeamResult: GameResult | null`
  - [x] Added `{ key: "status", label: "Status" }` to the `columns` const
  - [x] Row mapping computes `status: getGameStatus(game.datetime, game.homeTeamResult, game.awayTeamResult)`
  - [x] `TableCell` render switches on `col.key === "status"` to render a `<Chip size="sm" color={STATUS_COLOR[row.status]}>` vs plain text for other columns. `STATUS_COLOR` is a local `Record<GameStatus, ...>` mapping `Upcoming → default`, `Final → success`, `Awaiting → warning`.
  - [x] Status column placed last in the `columns` const but still before the optional `actions` column in the render (the `...showActions ? [...] : []` spread keeps the Edit cell rightmost)

- [x] **Task 3: Update the page's Prisma select to include result fields** (AC: #2, #3, #4)
  - [x] Added `homeTeamResult: true` and `awayTeamResult: true` to the existing `select` block in `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx`
  - [x] Did NOT add `homeTeamPoints` / `awayTeamPoints` — scores are 5.3's concern
  - [x] All existing `select` keys preserved

- [x] **Task 4: Unit tests for `getGameStatus`** (AC: #5)
  - [x] Created `test/utils/gameStatus.test.ts` (respected the 3.1-established convention — no `test/components/`)
  - [x] 8 test cases: Upcoming (3 variants including boundary + partial), Final (2 variants including precedence), Awaiting (2 variants including partial), and one default-`now` determinism check
  - [x] No DB, no mocks; pure-function tests run in ~1s

- [ ] **Task 5: Manual verification** _(user-owned per project convention)_ (AC: #1, #6, #7)
  - [ ] Open `/leagues/<league>/seasons/<season>/games` as an admin — confirm Status column renders for all rows with Edit column still rightmost
  - [ ] Open the same URL as a non-admin (or signed-out) — confirm Status column is visible; Edit column is NOT
  - [ ] Seed at least one game with both `homeTeamResult` + `awayTeamResult` set and confirm the row renders `Final` in green
  - [ ] Set a past `datetime` on a game with results still null — confirm `Awaiting` renders in warning color
  - [ ] Resize to ≤640px — confirm table scrolls horizontally
  - [ ] With ~100 seeded games, verify page loads under 2s from a cold Vercel region

## Dev Notes

### Scope — what this story does NOT do

The epic's AC text (`_bmad-output/epics.md` lines 642–669) lists four ACs for this story. Three of them are **already delivered by 3.1 and need no new code**:

- **Filters (date range, location)**: `GamesSection` already wires `startDate`, `endDate`, `teamId`, and `location` to server-side `searchParams` with a 300ms location debounce. Filter changes respond well under 500ms on the server round-trip (typical LAN latency plus a single indexed-ish Prisma query).
- **Pagination**: HeroUI `Pagination` component already paginates at 25/page with URL-preserved `page` query param.
- **Read-only for viewers**: The `isAdmin = session?.user?.role === "ADMIN"` check at the page level hides the `Edit` action column (via `GamesTable`'s `showActions` flag) and both admin header buttons (via `GamesHeader`'s `isAdmin` prop).

This story's only net-new scope is the **Status column** (derived, not stored) and the supporting pure-function helper + tests.

Other items explicitly out of scope:

- **Scores**: The epic AC says "date/time, location, and status" — no scores. Scores belong to Story 5.3 (Publish Scores and Standings).
- **Click-through to game detail page**: Not in AC. Belongs to Story 3.4 (Team Schedule View) per the epic's phrasing "When I click on a game, game details are shown".
- **"Live" / "In Progress" status**: Not derivable from current schema (no start-time-plus-duration, no real-time game tracking). Two-state past/future + results gives enough information.
- **Composite `(seasonId, datetime)` index on `Game`**: Not added in this story. Current scale is ~100 games/season and the existing FK on `seasonId` is enough. Flag for a separate perf story if a season ever grows past ~1000 games.

### Existing infrastructure (already in place, from 3.1)

- **Page**: `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — server component, server-side `auth()` gate computes `isAdmin`, reads `searchParams` for filters + page, runs parallel `findMany` + `count` + `findMany` (teams). This story just extends the `select` object.
- **Filter/pagination UI**: `src/components/GamesSection.tsx` — client component with debounced location input and immediate-push date/team filters. Reuses `useRouter().push` + URL `searchParams` as the single source of truth. No changes needed.
- **Table**: `src/components/GamesTable.tsx` — displays rows + conditionally renders an Edit action column. This story adds one column and extends the row type.
- **Wrapper**: `src/components/DataTable.tsx` — 12 lines, wraps HeroUI `Table` in `overflow-x-auto`. Handles mobile overflow natively. No changes needed.
- **Header**: `src/components/GamesHeader.tsx` — breadcrumb + admin-only "New Game" button. No changes needed.

### Architecture Compliance

- **No GraphQL / no new resolver**: The page reads Prisma directly in the server component (established in 3.1). This story does NOT introduce a GraphQL query for games. If a future story needs this data on the client (e.g. for client-side live updates), that migration is a separate concern.
- **Client bundle safety**: `GamesTable.tsx` is `"use client"`. It must not import `Result` from `@/service/prisma` (pulls in `pg` / `dns` — per project memory). Check how `StandingsTable.tsx` already handles the `Result` enum on the client — follow that exact pattern (likely a local string-literal union or a re-exported const enum).
- **Audit log**: Not applicable — read-only view, no mutations.
- **RBAC**: Viewer role is the default read-only role. The current page has no role-gated content for non-admins beyond the Edit/New Game / Email Schedule hiding via `isAdmin`. Adding the Status column doesn't change any access patterns.
- **Tests**: Pure function → unit test. Follows the `@ngneat/falso` + Jest 30 conventions. No DB fixtures needed (the `Result` type is static).
- **Performance**: The additional two scalar fields (`homeTeamResult`, `awayTeamResult`) add negligible row bytes to the existing `findMany` query. No new DB round-trips, no new joins.

### Library & Framework Requirements

- **No new packages.** HeroUI `Chip` is already in use (`PlayersTable.tsx`, `StandingsTable.tsx`). Prisma Result enum already in use (`teamService.ts`).
- **No new migrations.** Schema is unchanged.

### File Structure

```
NEW:
  src/components/gameStatus.ts          # Pure getGameStatus helper (if extracted — decide during dev)
  test/components/gameStatus.test.ts    # OR test/utils/gameStatus.test.ts — check convention

MODIFIED:
  src/components/GamesTable.tsx         # +status column + Chip rendering + extended row type
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx
                                        # Select adds homeTeamResult + awayTeamResult

NOT MODIFIED (explicitly):
  prisma/schema.prisma                  # No index add; no new fields
  src/components/GamesSection.tsx       # Filters + pagination already sufficient
  src/components/GamesHeader.tsx        # Admin controls unchanged
  src/components/DataTable.tsx          # Mobile overflow already handled
  src/graphql/type-defs.mjs             # No GraphQL changes
  src/graphql/resolvers.ts              # No resolver changes
```

### Testing Requirements

- **Location**: `test/components/gameStatus.test.ts` if `test/components/` is allowed, else `test/utils/gameStatus.test.ts`. Check with `ls test/` before creating the directory. Note: 3.1's story explicitly said "no component tests (no `test/components/` directory exists — per project convention)". Respecting that convention, **put the test under `test/utils/`** OR co-locate with `src/components/gameStatus.ts` as a `.test.ts` sibling if Jest is configured to pick those up. Verify by checking `jest.config.*` / `package.json` test glob.
- **Coverage**: 7 test cases → high statement/branch coverage on the pure function. No DB, no mocks, no component render tests.
- **Regression**: Run `npm test -- --runInBand` after changes; ensure 425 → 425+7 passing, 0 regressions. The existing `teamService.test.ts` uses the same `Result` enum — verify Status cases don't inadvertently break that suite.

### Gotchas

- **`Result` on the client**: `GamesTable.tsx` is a client component. Importing `Result` from `@prisma/client` or `@/service/prisma` will try to load `pg` → fails at build. Use a string-literal union (`"WIN" | "LOSS" | "TIE"`) or a client-safe const enum. `StandingsTable.tsx` already solved this — copy its exact approach. **Do not invent a new pattern**.
- **Timezone**: `datetime` is stored as UTC (`DateTime @default` with Prisma's convention). The existing `GamesTable` renders dates/times with `timeZone: "UTC"` explicitly. The `getGameStatus` comparison uses `Date.now()` which is also a UTC instant — no conversion needed for the status derivation itself. Don't let the `toLocaleDateString({ timeZone: "UTC" })` display convention bleed into the status logic.
- **`Result` null vs undefined**: Prisma returns `null` for unset optional scalars (not `undefined`). Test cases should use `null` literally, and the function signature should type the param as `Result | null` (not `Result | undefined`) to match.
- **Boundary equality**: `datetime === now` → Upcoming per AC #5. Use `datetime >= now`, not `datetime > now`. Explicit test case in Task 4.
- **Precedence**: Final wins over datetime. A past-scheduled game with both results set is Final; a future-scheduled game with both results set (edge case — someone set results too early?) is also Final. AC #3 pins this explicitly.
- **Symmetric vs asymmetric results**: AC #3 requires BOTH `homeTeamResult` AND `awayTeamResult` to be non-null to qualify as Final. One-side-set games are Awaiting (if past) or Upcoming (if future). Rationale: a complete game always has results on both sides (one WIN + one LOSS, or two TIEs). A partial state means stats entry is still in progress.
- **Chip import**: `import { Chip } from "@heroui/react"` — already used in `PlayersTable.tsx`. Don't re-import or re-style; pick matching size/variant.
- **Admin column remains rightmost**: The Status column MUST be inserted before the optional `actions` column in both `columns` and `TableCell` render so admin users see `... | location | status | Edit` in that order. AC #1.

### Previous Story Intelligence

From **3.1 (Create Season Schedule)**:

- Public page + `GamesSection` + `GamesTable` are already public-viewer-safe. No auth-gating changes needed.
- `datetime` is a single `DateTime` field (post-`aab3b43` commit — no more split date/time). Use `game.datetime` for both display and status derivation.
- Location filter uses case-sensitive `contains` with lowercased values on both sides to work on SQLite tests and Postgres prod. Irrelevant to this story (no location-based logic) but don't accidentally "clean up" that filter.

From **3.2 (Publish and Republish Schedules)**:

- No `published` flag exists. The "Given a published schedule exists" AC phrasing in the epic is a vestige — interpret it as "given games exist for the season".
- Code-review lesson: don't claim a file was modified if git doesn't reflect it. Keep the Dev Agent Record's File List 1:1 with `git diff --name-only`.

From **2.5 (Admin Player Edit)** via 3.1:

- `Schema.Literal` for enum-like strings (applied to client-side Result union).
- `FormValues` derived from schema — not directly applicable here (no form), but pattern holds for the Result literal union.

### Git Intelligence Summary

- `83c92df Add schedule published email template` — story 3.2. Adds the template + improves `htmlToPlainText`. Doesn't touch schedule view code.
- `aab3b43 Add game schedule admin + combine date/time into single datetime` — story 3.1. Establishes the unified public/admin schedule page + `GamesSection` + `GamesTable`. Use as the canonical reference for how `Result` is consumed on the client side.
- `2cbe2b2 Some small changes` — preceding unrelated tweak; skip.

### Project Context Reference

No `**/project-context.md` file exists at the project root. Follow conventions in `CLAUDE.md` and project memory:

- Next.js 16 + React 19 + HeroUI + Tailwind
- Prisma 7 — `findMany` select syntax is the canonical pattern for server components
- Client components cannot import from `@/service/prisma` — verified constraint
- Jest 30 + `@ngneat/falso` — prefer explicit values over `falso` for enum/literal tests (falso doesn't know about `Result`)
- No `test/components/` directory by convention — put pure-function tests under `test/utils/` or co-locate with source

### References

- [Source: _bmad-output/epics.md#Story-3.3 lines 642–669] — Original epic ACs (mostly already delivered by 3.1; this story adds the Status column)
- [Source: _bmad-output/sprint-artifacts/3-1-create-season-schedule.md] — Unified public/admin schedule page delivery
- [Source: _bmad-output/sprint-artifacts/3-2-publish-and-republish-schedules.md] — No-published-flag, real-time-schedule posture
- [Source: prisma/schema.prisma:160-186] — `Game` model and `Result` enum
- [Source: src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx] — Server component to extend
- [Source: src/components/GamesTable.tsx] — Table to extend with Status column
- [Source: src/components/GamesSection.tsx] — Existing filter/pagination (no changes expected)
- [Source: src/components/StandingsTable.tsx] — Canonical example of consuming `Result` enum on the client (mirror its pattern)
- [Source: src/service/models/teamService.ts:165-185] — Server-side `Result` consumption reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- `StandingsTable.tsx` imports `Result` from `@/service/prisma/generated/enums` — client-safe enum path. For `gameStatus.ts` chose a local `GameResult = "WIN" | "LOSS" | "TIE"` literal union instead; the pure function has no need to couple to the generated enum, and the same union is reused at the table layer. Narrower, zero-dependency module.
- Lint auto-fixed a `simple-import-sort/imports` violation in `GamesTable.tsx` after adding the `./gameStatus` imports (type + value) alongside HeroUI and `./DataTable`. `@heroui/react` destructure grew by one symbol (`Chip`), triggered the ordering rule.
- Could not browser-verify the UI from this session. Per CLAUDE.md's UI-change rule: flagging Task 5 manual verification as the gate. Typecheck + lint + 433 tests (8 new) all pass — runtime risk is low because every primitive used (`Chip`, color map, server-side `select` extension) is an existing pattern elsewhere in the app.

### Completion Notes List

- **Task 1 (helper)**: `src/components/gameStatus.ts` (new, 14 lines). Pure function with injectable `now`. Exports `GameResult` and `GameStatus` type aliases for reuse. Precedence: Final > Upcoming (`>=` boundary) > Awaiting.
- **Task 2 (GamesTable)**: Added `Chip` import, local `STATUS_COLOR` mapping, extended `GamesTableGame` type with `homeTeamResult` + `awayTeamResult`. `TableCell` render switches on `col.key === "status"` to swap plain text for a color-cued `<Chip>`. Status column is last in `columns` const; optional `actions` column stays rightmost via the existing spread.
- **Task 3 (Prisma select)**: Two new scalar selects (`homeTeamResult`, `awayTeamResult`) added to the existing `findMany` in the public schedule page. No new queries, no new joins.
- **Task 4 (tests)**: `test/utils/gameStatus.test.ts` (new). 8 cases covering all three status branches plus boundary, precedence, partial-results, and default-`now` determinism.
- **Task 5 (manual verification)**: Deferred to Matt. Cannot browser-test from this session.

**Scope outcome**: Exactly one pure helper + one table column + one Prisma field pair, driven by the reality that 3.1 already delivered the route, filters, pagination, chronological ordering, and viewer-read-only behavior. Net diff: 4 files (1 new module, 1 new test, 2 modified).

## Senior Developer Review (AI)

**Reviewer:** Matt
**Date:** 2026-04-21
**Outcome:** Approved after all findings fixed.

**Findings summary (pre-fix):**

- 0 HIGH — no AC gaps, no file-list discrepancies.
- **M1** (MEDIUM) — `GameResult` literal union duplicated the Prisma `Result` enum → silent drift risk.
- **M2** (MEDIUM) — `getGameStatus` `!== null` fragile to `undefined` (e.g., callsite omits Prisma `select` field).
- **L1** (LOW) — No JSDoc on `getGameStatus` explaining the Final-over-datetime precedence rule.
- **L2** (LOW) — Default-`now` test used ±24h deltas; trivially hardened.

**Action Items:**

- [x] [AI-Review][MEDIUM] M1: Replaced local `GameResult` with `import type { Result } from "@/service/prisma/generated/enums"`. [gameStatus.ts:1, GamesTable.tsx:14]
- [x] [AI-Review][MEDIUM] M2: `getGameStatus` uses `!= null` and widened params to `Result | null | undefined`. [gameStatus.ts:13-17]
- [x] [AI-Review][LOW] L1: Added JSDoc documenting precedence rule. [gameStatus.ts:5-10]
- [x] [AI-Review][LOW] L2: Default-`now` test uses ±60 000ms deltas + 9th test case pins defensive behavior on `undefined`. [gameStatus.test.ts:36-49]

### File List

**New:**

- `src/components/gameStatus.ts` — pure `getGameStatus` helper + `GameStatus` type; imports `Result` from `@/service/prisma/generated/enums` (post-review)
- `test/utils/gameStatus.test.ts` — 9 unit tests (post-review); covers all branches, boundary, precedence, partial-results, default-`now`, and `undefined`-result defense

**Modified:**

- `src/components/GamesTable.tsx` — added Status column with color-cued `<Chip>`; extended `GamesTableGame` row type
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — extended Prisma `select` with `homeTeamResult` + `awayTeamResult`

**Not modified (explicitly):**

- `prisma/schema.prisma` — no schema changes, no new index
- `src/components/GamesSection.tsx` — existing filters + pagination already sufficient
- `src/components/GamesHeader.tsx` — existing admin/viewer conditional unchanged
- `src/components/DataTable.tsx` — existing `overflow-x-auto` handles mobile
- `src/graphql/type-defs.mjs`, `src/graphql/resolvers.ts` — no GraphQL changes (page reads Prisma directly)

### Change Log

- 2026-04-21: Story 3.3 implemented — public league schedule now shows a per-game Status chip (Upcoming / Final / Awaiting). 8 new tests; 433 total passing (was 425); 0 regressions. Typecheck + lint clean. Manual UI verification deferred to Task 5 per project convention.
- 2026-04-21: Code review (adversarial). 0 HIGH + 2 MEDIUM + 2 LOW. All fixed.
  - **M1** Replaced local `GameResult = "WIN" | "LOSS" | "TIE"` union with `import type { Result } from "@/service/prisma/generated/enums"` in both `gameStatus.ts` and `GamesTable.tsx`. Matches `StandingsTable`'s precedent and eliminates drift risk if the Prisma enum ever grows.
  - **M2** `getGameStatus` now uses `!= null` for result checks (catches both `null` and `undefined`) and the parameter types widened to `Result | null | undefined`. Defends against a callsite omitting `homeTeamResult`/`awayTeamResult` from its Prisma `select`.
  - **L1** Added JSDoc on `getGameStatus` documenting the Final-over-datetime precedence rule so future readers don't "fix" the intentional ordering.
  - **L2** Default-`now` test tightened from ±24h to ±60 000ms deltas — resilient to CI suspension.
  - Added a 9th test case asserting `undefined` results are treated as null (pins M2's defensive behavior). Full suite: 434/434. Typecheck + lint clean.
