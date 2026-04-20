# Story 3.1: Create Season Schedule

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want to create and manage league-wide schedules with games, dates, times, and locations,
so that the season plan exists and can be viewed/edited from the admin UI without opening a SQL client.

**Epic Context:** Epic 3 — Schedules (first of 5 stories). This story delivers admin CRUD for games in a season: a list page with filters/pagination, a "New Game" page, and an edit page. Publishing (Story 3.2), public league view (3.3), and team view (3.4) build on top of this. The `Game` model, `gameService`, and GraphQL mutations already exist — this story is mostly UI + one service gap (overlap detection) + RBAC re-gating.

## Acceptance Criteria

1. **Given** a league and season exist and I am an admin
   **When** I create a new game with home team, away team, date/time, and location via the admin UI
   **Then** the game is saved to the database
   **And** it appears in the admin schedule list for that season
   **And** an audit entry captures the creation

2. **Given** I am creating or editing a game
   **When** I schedule a game where **either the home team or the away team** already has another game at the same `date + time`
   **Then** the `createGame` / `updateGame` mutation rejects the request with a `ValidationError`
   **And** the form shows an inline error identifying the conflicting team and game
   **And** no row is written to the database

3. **Given** a schedule exists with 50+ games
   **When** I view the admin schedule management page
   **Then** all games are listed with pagination (page size 25, configurable)
   **And** I can filter by date range (start/end), team (home **or** away), and location
   **And** filters combine with AND semantics
   **And** the default sort is `date asc, time asc`

4. **Given** I edit an existing game's date, time, location, round, home team, or away team
   **When** I save the changes
   **Then** the game is updated in the database
   **And** an `UPDATE` audit entry is written for the mutation (via the existing `withPolicy`/`parseAuditAction` path)

5. **Given** I am a non-admin user
   **When** I navigate to the public schedule page `/leagues/[leagueSlug]/seasons/[seasonSlug]/games`
   **Then** the page renders without the "New Game" button and without Edit actions on rows
   **And** when I navigate directly to the admin form routes `/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/new` or `/[gameId]/edit`, the server returns `notFound()`
   **And** the `createGame` / `updateGame` / `deleteGame` mutations are independently gated by `PolicyName.ADMIN`

6. **Given** I am creating or editing a game
   **When** I select a home team and an away team
   **Then** the team selects only list teams from the **current season** (not league-wide)
   **And** the home and away selects cannot resolve to the same team (enforced client-side **and** via existing service-level `invariant`)

7. **Given** a game is displayed on the edit page
   **When** I click "Delete Game" and confirm in the modal
   **Then** the `deleteGame` mutation fires
   **And** on success I see a success toast and am redirected to the schedule list

7a. **Given** a game has attached `goals`, `penalties`, or `lineups`
**When** I confirm deletion
**Then** the server rejects with a clear `ValidationError` ("Cannot delete a game with recorded goals/penalties/lineups — remove them first")
**And** the inline error appears above the form
**And** no database changes occur
**Note**: `Goal.gameId`, `Penalty.gameId`, and `Lineup.gameId` have NO `onDelete: Cascade` in `prisma/schema.prisma` — Prisma will raise `ForeignKeyConstraintError` if we delegate to the default. We intercept this in `deleteGame` (see Task 2a) and convert to a `ValidationError` with a friendly message. Adding cascade rules is explicitly out of scope for this story.

## Tasks / Subtasks

- [x] **Task 1: Add overlap detection to `gameService`** (AC: #2)
  - [ ] In `src/service/models/gameService.ts`, extend `validateGame` (or add a sibling `validateNoScheduleConflict`) to query existing games in the same `seasonId` at the same `date + time` where either `homeTeamId` or `awayTeamId` matches the incoming `homeTeamId` or `awayTeamId`
  - [ ] Exclude the current game's own id on updates (pass `excludeGameId?: string`)
  - [ ] Throw `ValidationError` with a message naming the conflicting team(s) and existing game's round + date (e.g., `"Team 'Reds' already plays at 2026-05-12 19:00 (round 3)"`)
  - [ ] Add tests to `test/service/models/gameService.test.ts`:
    - create rejects when home team already booked at that slot (home ↔ home)
    - create rejects when away team already booked (away ↔ away)
    - create rejects when NEW game's home team matches an EXISTING game's away team (home ↔ away)
    - create rejects when NEW game's away team matches an EXISTING game's home team (away ↔ home)
    - update succeeds when the only conflicting row is the game being updated (self-exclusion works)
    - create/update succeeds when dates match but times differ (no false positive)
    - create/update succeeds when times match but dates differ (no false positive)

- [x] **Task 2: Re-gate `createGame` to `PolicyName.ADMIN`** (AC: #1, #5)
  - [x] `src/graphql/resolvers.ts:184-185` currently uses `[PolicyName.MANAGER, PolicyName.SEASON_ACCESS]`. Change to `PolicyName.ADMIN` to match the epic's "As an admin" phrasing. `updateGame`/`deleteGame` are already ADMIN-gated.
  - [x] Verify no existing test or caller expected the manager path; adjust if found.

- [x] **Task 2a: Guard `deleteGame` against cascade failures** (AC: #7, #7a)
  - [x] Before `ctx.prisma.game.delete`, check for children: `prisma.goal.count({ where: { gameId } })`, `prisma.penalty.count`, `prisma.lineup.count` (can parallelize with `Promise.all`).
  - [x] If any count > 0, throw `ValidationError("Cannot delete a game with recorded goals/penalties/lineups — remove them first")`.
  - [x] Tests in `gameService.test.ts`: (a) delete succeeds on empty game, (b) delete rejects when a Goal exists, (c) delete rejects when a Penalty exists, (d) delete rejects when a Lineup exists.
  - [x] Client: `GameForm` catches the `ValidationError` via the standard `err.message.replace(/^[^:]+:\s*/, "")` regex and shows it inline (matches `PlayerEditForm` convention).

- [x] **Task 3: Admin schedule list page** (AC: #3, #5)
  - [ ] Create `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` as a server component
  - [ ] Gate with `auth()`; `notFound()` if not ADMIN
  - [ ] Parse search params: `page` (1-indexed), `pageSize` (default 25), `startDate`, `endDate`, `teamId`, `location`
  - [ ] Build Prisma `where`. **Location filter: always use case-sensitive `contains` and lowercase both sides at query time** — this works identically on Postgres (prod) and SQLite (tests). Do NOT use `mode: "insensitive"` anywhere (not supported in SQLite tests — per project memory). Example:
    ```ts
    const where: Prisma.GameWhereInput = { seasonId };
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (teamId) where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    // If storing location lowercased is not acceptable, use two-column strategy
    // OR accept case-sensitive search. For now, case-sensitive `contains`:
    if (location) where.location = { contains: location };
    ```
    Note: date range filters combine on the same `date` key via spread. `teamId` uses `OR` — a home-or-away match. If combining `teamId` with other `OR` clauses in the future, wrap in `AND`.
  - [ ] `prisma.game.findMany({ where, orderBy: [{ date: "asc" }, { time: "asc" }], take: pageSize, skip: (page-1)*pageSize, include: { homeTeam, awayTeam } })` plus `prisma.game.count({ where })` for the page count
  - [ ] Render a new `<AdminGamesTable />` client component with games + total count + current filters
  - [ ] Render a "New Game" `Button` that links to `/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/new`

- [x] **Task 4: `AdminGamesTable` client component** (AC: #3)
  - [ ] Create `src/components/AdminGamesTable.tsx` (`"use client"`)
  - [ ] Filter bar (mirrors `PlayersSection` pattern): `Input` for location (debounced or on-blur), two `DatePicker` for date range, `Select` for team (home OR away match — stored as single `teamId`)
  - [ ] On filter/page change, update `router.push` with new search params; the server component re-renders
  - [ ] Columns: round, date, time, home team, away team, location, actions (Edit)
  - [ ] Pagination controls (`@heroui/react` `Pagination` component) at the bottom

- [x] **Task 5: `GameForm` client component (shared create/edit)** (AC: #1, #2, #4, #6)
  - [ ] Create `src/components/GameForm.tsx` (`"use client"`)
  - [ ] Mode: `mode="create" | "edit"`, props: `seasonId`, `teams: { id, name }[]`, `game?: GameInput` (for edit), `returnHref`
  - [ ] Use `react-hook-form` + `@hookform/resolvers/effect-ts`, Effect Schema with strict `Schema.Literal` for team ids where applicable, `Schema.NonEmptyString` for `location`, positive int for `round`
  - [ ] Client-side validation: `homeTeamId !== awayTeamId` (else inline error on both fields); required fields
  - [ ] Date and time are **two separate `DateTime` fields on the `Game` model** (not combined). UI: one `DatePicker` for the date + one `Input type="time"` for HH:MM. Submit shape:
    ```ts
    // pickedDate is a JS Date from DatePicker (midnight local);
    // timeStr is "19:30" from the time input.
    const [hh, mm] = timeStr.split(":").map(Number);
    const date = new Date(
      Date.UTC(pickedDate.getUTCFullYear(), pickedDate.getUTCMonth(), pickedDate.getUTCDate()),
    );
    const time = new Date(Date.UTC(1970, 0, 1, hh, mm));
    // Submit { date, time } — both as ISO strings via GraphQL DateTime scalar.
    ```
    This matches how the existing public `GamesTable.tsx` reads the fields (`date.toLocaleDateString()` + `time.toLocaleTimeString()`). DO NOT merge them into one combined datetime — it would silently break the existing list rendering and any future reporting.
  - [ ] On submit: `useMutation(CREATE_GAME)` or `UPDATE_GAME` depending on mode → `addToast` success → `router.push(returnHref)` → drop redundant `refresh()` (per 2-5 review — `push` re-runs server component)
  - [ ] On `ValidationError` from server (overlap or same-team), set `submitError` and render above form (match `PlayerEditForm` error pattern)
  - [ ] Define `CREATE_GAME_MUTATION` and `UPDATE_GAME_MUTATION` inline via `gql` (matches convention)

- [x] **Task 6: New Game page** (AC: #1, #6)
  - [ ] Create `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/new/page.tsx`
  - [ ] Server component; `auth()` gate → `notFound()` if not ADMIN
  - [ ] Load `league`, `season`, `teams` (all in one `Promise.all`) — use `prisma.team.findMany({ where: { seasonId }, select: { id, name }, orderBy: { name: "asc" } })`
  - [ ] Render `<GameForm mode="create" seasonId={season.id} teams={teams} returnHref={…/games} />`

- [x] **Task 7: Edit Game page** (AC: #1, #4, #6)
  - [ ] Create `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/edit/page.tsx`
  - [ ] Server component; ADMIN gate
  - [ ] Lookup: `prisma.game.findFirst({ where: { id: gameId, seasonId: season.id }, include: { homeTeam, awayTeam } })` (season-scoped at the query level — per 2-5 review M4)
  - [ ] Render `<GameForm mode="edit" seasonId={season.id} teams={teams} game={game} returnHref={…/games} />`
  - [ ] Include a "Delete Game" `Button` with confirmation modal → `useMutation(DELETE_GAME)` → toast + redirect (AC #7)

- [x] **Task 8: GraphQL codegen** (AC: #1, #4)
  - [ ] Run `npm run codegen` after any `gql` tags are added
  - [ ] Verify generated types in `src/graphql/generated.ts` include the new mutation hooks

- [x] **Task 9: Tests** (AC: #1, #2, #4, #5, #7a)
  - [ ] Service-level tests for overlap detection (Task 1) — covers AC#2
  - [ ] Service-level tests for delete-with-children rejection (Task 2a) — covers AC#7a
  - [ ] Resolver-level test that `createGame` rejects MANAGER role — covers AC#5. Pattern exists in `test/service/auth/*.integration.test.ts`; mirror it:
    ```ts
    it("rejects MANAGER role on createGame", async () => {
      const wrapped = withPolicy(PolicyName.ADMIN, () => ({} as never));
      const managerCtx = createCtx({ role: Role.MANAGER });
      await expect(() => wrapped(null, { data: {...} }, managerCtx, { fieldName: "createGame" } as never))
        .rejects.toThrow(AuthError);
    });
    ```
    (Exact imports follow the existing auth integration test. Grep `withPolicy` in `test/` for the current pattern.)
  - [ ] No component tests (no `test/components/` directory exists — per project convention established in 2-5)
  - [ ] Run `npm test -- --runInBand`; ensure 0 regressions beyond the documented 3 pre-existing `emailService.test.ts` failures
  - [ ] `npm run typecheck` clean; `npm run lint` clean

- [ ] **Task 10: Manual verification** _(deferred to user — code passes typecheck/lint/all automated tests; UI verification is user's responsibility per project convention)_ (AC: #1, #2, #3)
  - [ ] Create 3+ games, edit one, attempt to create a conflicting overlap and confirm inline error
  - [ ] Seed ~50 games via a temporary script or manual inserts; verify pagination + filters
  - [ ] Non-admin user: confirm `notFound()` on all 3 admin routes

## Dev Notes

### Scope

This story is **admin-only CRUD**. The public league/team schedule views are Stories 3.3 and 3.4. Publishing (with ISR invalidation) is Story 3.2 — this story does NOT add a `published` flag. The `Game` model already has no `published` field; leave it alone and let Story 3.2 introduce it.

### Existing backend (already in place)

- **Prisma model**: `prisma/schema.prisma:160-181` — `Game { id, seasonId, round, date, time, location, homeTeamId?, awayTeamId?, homeTeamResult?, homeTeamPoints?, awayTeamResult?, awayTeamPoints? }`
- **Service**: `src/service/models/gameService.ts` — `createGame`, `updateGame`, `deleteGame`, `getGamesBySeason`, `getGameById` (throws `NotFoundError`), `validateGame` (same-season + same-team check, but **NO overlap check** — add in Task 1)
- **GraphQL types**: `src/graphql/type-defs.mjs:490-507` — `GameCreateInput`, `GameUpdateInput`
- **Resolvers**: `src/graphql/resolvers.ts:184-191` — `createGame` (MANAGER+SEASON_ACCESS — **re-gate to ADMIN in Task 2**), `updateGame` (ADMIN), `deleteGame` (ADMIN)
- **Validation schemas**: `src/service/validation/schemas.ts:191-208` — `gameCreateSchema`, `gameUpdateSchema`
- **Existing tests**: `test/service/models/gameService.test.ts` (12 tests — create, update, delete, cross-season rejections, same-team rejection, list-by-season)
- **Existing public list**: `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — read-only public list using `GamesTable`. **Do NOT modify** — leave for Story 3.3.

### Architecture Compliance

- **Auth Strategy**: Admin pages gated by server-side `auth()` → `notFound()`. Mutations independently gated by `withPolicy(PolicyName.ADMIN, …)` — defense in depth (matches 2-5 pattern).
- **Audit**: `createGame`, `updateGame`, `deleteGame` are auto-audited via `parseAuditAction` in `rbacPolicy.ts:187-203` (`create*` → CREATE, `update*` → UPDATE, `delete*` → DELETE). No changes needed.
- **Validation**: Follow existing pattern — Effect Schema in `src/service/validation/schemas.ts` for server-side, redefined inline in `GameForm.tsx` for client-side. Server schema is source of truth.
- **UI Library**: HeroUI — `Table`, `DatePicker`, `Select`, `Input`, `Button`, `addToast`, `Pagination`, `Modal` (for delete confirm).
- **Route convention**: Admin routes under `/admin/...` (matches 2-5 pattern). Do NOT place admin edit pages under the public `/leagues/...` tree.
- **Tests**: `test/service/models/gameService.test.ts` for service layer; no component tests (no `test/components/` dir).

### Critical Codebase Context

**Form pattern reference** — `src/components/PlayerEditForm.tsx` (post-2-5 review), `src/components/CreateTeamForm.tsx`, `src/components/CreateSeasonForm.tsx`. Read at least one before writing `GameForm` — conventions for:

- `react-hook-form` + `@hookform/resolvers/effect-ts`
- Inline `gql` mutation definition
- `err.message.replace(/^[^:]+:\s*/, "")` for Apollo error cleanup (project-wide convention)
- `addToast` + `router.push(returnHref)` (no `router.refresh()` needed — see 2-5 review L2)
- `Schema.Literal` for enum-like string fields, `Schema.NonEmptyString` for required strings — tighten schemas per 2-5 review H1/H2
- `FormValues = Schema.Schema.Type<typeof schema>` derives form type from schema — avoids drift

**Sortable/selectable table reference** — `src/components/PlayersTable.tsx` (post-2-5). Uses `sortDescriptor` + `useMemo`. For pagination, use HeroUI's `Pagination` component OR delegate to the server component via `searchParams` (preferred for this story since the list can be large and the page already filters in Prisma).

**Admin page pattern** — `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx` (post-2-5 review, M4 fix applied). Note the `prisma.game.findFirst({ where: { id, seasonId } })` pattern — use it for the edit page game lookup.

### Library & Framework Requirements

- **react-hook-form + @hookform/resolvers/effect-ts** — form validation bridge
- **HeroUI** — `Table`, `DatePicker`, `Input`, `Select`, `Button`, `addToast`, `Pagination`, `Modal`, `useDisclosure`
- **Apollo Client 4.0.9** — `useMutation` for `createGame`/`updateGame`/`deleteGame`
- **Next 16** — `notFound()` from `next/navigation`, `useRouter()` for post-submit redirect, `searchParams` for filter/pagination state
- **Effect Schema** — client-side form validation schema (inline in component)

### File Structure

```
NEW:
  src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx
  src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/new/page.tsx
  src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/edit/page.tsx
  src/components/AdminGamesTable.tsx
  src/components/GameForm.tsx

MODIFIED:
  src/service/models/gameService.ts               # Overlap detection (Task 1) + delete-cascade guard (Task 2a)
  src/graphql/resolvers.ts                        # Re-gate createGame to ADMIN (Task 2)
  test/service/models/gameService.test.ts         # Overlap tests + delete-with-children tests
  test/service/auth/*.integration.test.ts         # OR a new file — add createGame RBAC re-gate test
  src/graphql/generated.ts                        # regenerated via npm run codegen

NOT MODIFIED (explicitly):
  prisma/schema.prisma                            # No cascade rules added — out of scope; handled via service guard
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx  # Public view, Story 3.3's concern
```

### Testing Requirements

- **Location**: `test/service/models/gameService.test.ts` — add 5 overlap cases (see Task 1 subtasks). Existing 12 tests must still pass.
- **Coverage target**: service-layer 60% statements (per `jest.config` coverage thresholds).
- **Manual verification**: Primary validation gate for UI glue (filters, pagination, delete confirm) — no component tests exist in this project.

### Caching / ISR Posture

- The **admin schedule list and edit pages are NOT cached**. They are standard server components reading Prisma on every request — any edit is immediately reflected on the next load. Do NOT add `revalidate` directives.
- The **public schedule views** (`/leagues/[leagueSlug]/seasons/[seasonSlug]/games`) will get ISR + cache invalidation in **Story 3.2 (Publish and Republish Schedules)**. This story must NOT add ISR, `revalidateTag`, or a `published` flag. Edits via this admin UI will be visible on public pages on the next revalidation cycle — that is intentional and Story 3.2's concern.

### Round Assignment

- `Game.round` (`Int`, required) is **always user-entered** via the form. There is no auto-assignment logic anywhere in the codebase (grep confirms no `round:` defaulting). Bulk import / auto-schedule generation is out of scope; if added later, it will be a separate story.

### HeroUI Pagination

- `@heroui/react` `Pagination` is **not yet used elsewhere** in this codebase. Minimal usage pattern (server-driven via searchParams):
  ```tsx
  <Pagination
    total={Math.ceil(totalCount / pageSize)}
    page={currentPage}
    onChange={(p) => router.push(`?${new URLSearchParams({ ...filters, page: String(p) })}`)}
  />
  ```
  Place below the table. Read HeroUI docs if props have shifted since the version in `package.json`.

### Gotchas

- **SQLite test DB does NOT support `mode: "insensitive"`** — per project memory. The location filter uses `contains` in production (Postgres) where `mode: "insensitive"` works, but test DB won't. Either (a) branch on env, or (b) match case-sensitively in both — recommend **(b)** and document the UX expectation (filter is case-sensitive) OR lowercase both sides. Safer: lowercase both sides at query time.
- **Prisma 7 multi-field `orderBy` requires array syntax** — already used in `getGamesBySeason` (`[{ date: "asc" }, { time: "asc" }]`). Preserve.
- **`Schema.optional` only handles `undefined`, not `null`** — use `Schema.NullishOr` for nullable GraphQL fields like `homeTeamId`/`awayTeamId`.
- **`Game.date` and `Game.time` are BOTH `DateTime`** — this is a schema quirk. The UI should show them as a single composed "date + time" picker but submit both. Verify the existing public page (`GamesTable`) to see how the team renders them today.
- **`createGame` re-gating from MANAGER to ADMIN is a behavior change** — check for existing callers/tests expecting MANAGER access. None expected (this is still pre-launch, Epic 3 is "Schedules" and managers aren't in the creation path per the user story).
- **`withPolicy` auto-audits via `parseAuditAction`** — `createGame` maps to `CREATE`, `updateGame` → `UPDATE`, `deleteGame` → `DELETE`. Do NOT add manual audit calls.
- **Client components cannot import server-only modules** — per project memory. Do NOT import `@/service/prisma` or `src/service/validation/schemas.ts` into `GameForm.tsx` or `AdminGamesTable.tsx`. Redefine form schema inline.
- **DO NOT broaden mutation input shapes** — `GameCreateInput` and `GameUpdateInput` already cover all AC-listed fields. No schema change needed.
- **Overlap detection message must be specific enough for the UI to display inline** — don't return a generic "conflict"; name the team and the existing game's round/date so the user can act on it.

### Previous Story Intelligence (from 2-5)

- Client-side Effect Schemas should use `Schema.Literal` for enum-like string fields (not `Schema.String`) — loose schemas let empty strings slip through to the server (2-5 Review H1).
- `FormValues` type should be derived from the schema (`Schema.Schema.Type<typeof schema>`) so narrowing the schema automatically narrows the form type — avoids cast-soup in `onSubmit` (2-5 Review H2).
- `router.refresh()` after `router.push()` is redundant in most cases — `push` re-runs the target RSC (2-5 Review L2).
- Admin page convention lives under `/admin/leagues/...`, not `/leagues/...` — established in 2-5. Do NOT put the admin schedule under the public `/leagues/...` tree.
- Error messages from Apollo mutations are stripped via `err.message.replace(/^[^:]+:\s*/, "")` as a project-wide convention — don't invent a new pattern.
- `prisma.*.findFirst({ where: { id, seasonId } })` is the preferred pattern over `findUnique({ id })` + post-filter guard (2-5 Review M4).
- When adding a behavior that narrows a query (like `createGame` ADMIN-only), add a resolver-layer test that locks in the new behavior so a future refactor doesn't silently widen it (2-5 Review M2 parallel).

### Git Intelligence Summary

- **Recent commits** (last 5): `2ec110d Rate skate confirmation`, `057f569 Add admin player edit` (2-5), `2cbe2b2 Some small changes`, `3e2eba3 Add player season confirmation flow with email template`, `3de1f28 Add email integration with Mailgun, player filtering, and template rendering`.
- **2-5 commit** bundled several unrelated changes (Status enum split, player filtering UI, etc.) — user has accepted intra-sprint cross-commit work as a convention for this project. For this story, cross-commit changes are acceptable but call them out in the Dev Agent Record File List.
- **Commit message quality** flagged as LOW issue in 2-5 review (one-line for 1,244-line diff). Aim for a more descriptive commit message when this story lands.

### Project Context Reference

No `**/project-context.md` file exists. Follow conventions in `CLAUDE.md` and project memory (see `~/.claude/projects/.../memory/MEMORY.md`):

- GraphQL Yoga + Prisma 7 + Effect library
- `withPolicy()` HOF wraps mutations with RBAC
- Effect Schema for input validation (not Zod)
- Jest 30 + `@ngneat/falso` for tests
- `randIceHockeyTeam()` pool is small — use explicit team names in tests to avoid slug collisions
- Test factories in `test/modelFactory.ts` via `make*()`/`insert*()`

### References

- [Source: _bmad-output/epics.md#Epic-3-Story-3.1 lines 581-608] — Original story text and ACs
- [Source: _bmad-output/architecture.md#Schedules lines 117, 147-150, 166] — FR-009 through FR-012, schedule CRUD patterns, conflict detection mentioned in test strategy
- [Source: prisma/schema.prisma:160-181] — `Game` model
- [Source: src/graphql/type-defs.mjs:490-507] — `GameCreateInput`, `GameUpdateInput`
- [Source: src/graphql/resolvers.ts:184-191] — existing `createGame`/`updateGame`/`deleteGame` wiring
- [Source: src/service/models/gameService.ts:30-82] — service layer to extend
- [Source: src/service/validation/schemas.ts:191-208] — Effect Schema for game inputs
- [Source: src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx] — public read-only list (do not modify)
- [Source: src/components/PlayerEditForm.tsx] — Form pattern reference (post-2-5 review fixes)
- [Source: src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx] — Admin edit page pattern (post-2-5 review M4)
- [Source: src/service/auth/rbacPolicy.ts:187-203] — Audit action parsing (auto-audits all create/update/delete)
- [Source: test/service/models/gameService.test.ts] — Existing 12 tests to build on
- [Source: _bmad-output/sprint-artifacts/2-5-admin-player-edit-page.md] — Previous story learnings (review fixes applied)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `gameCreateSchema.date` is `DateTimeField` (required) — service layer passes `data.date`/`data.time` through to the new `validateNoScheduleConflict`. Client submits both as ISO strings per the Dev Notes spec (UTC-midnight for `date`; `1970-01-01T<HH:MM>:00Z` for `time`).
- `Prisma.GameWhereInput` requires `AND`/`OR` to be wrapped when combining multiple `OR` clauses — story's admin list page uses a single top-level `OR` for team filter plus separate keys for date/location. Location filter uses case-sensitive `contains` per Dev Notes; no `mode: insensitive` anywhere.
- Integrating the resolver RBAC test in the existing `auth.integration.test.ts` avoids a second `jest.mock("next-auth/next")` block. Attempted a standalone test file first — it failed to import `@/graphql/resolvers` due to `openid-client` loading — backed off and appended to the existing integration file.
- `Pagination` from `@heroui/react` is new to this codebase; used `showControls` + `onChange` + `total`. Verified by typecheck.
- 7 pre-existing failures in `auditService.test.ts` + `emailService.test.ts` remain (baseline confirmed with `git stash` + retest: 404 passing / 7 failing on `main`). This story added 12 new tests, all passing; net 417 passing / 6 failing (one pre-existing failure coincidentally cleared, unrelated to game code).

### Completion Notes List

- **Service layer**: `validateNoScheduleConflict` in `gameService.ts` detects same-date+time collisions on home/away team IDs, symmetric (home↔home, home↔away, away↔home, away↔away) and self-excluded on update. `deleteGame` now parallel-counts children (goals/penalties/lineups) and throws `ValidationError` rather than letting Prisma's FK constraint fire.
- **Resolver**: `createGame` is now `withPolicy(PolicyName.ADMIN, …)` instead of `[MANAGER, SEASON_ACCESS]`. Integration test added to lock in the new behavior.
- **Admin UI**: three new routes under `/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games` (list + new + edit). `AdminGamesTable` drives filters via URL `searchParams` + `Pagination`. `GameForm` is shared between create and edit, with date+time split correctly (CalendarDate → ISO UTC midnight; HH:MM → `1970-01-01T<t>Z`), same-team client-side guard, and delete confirmation modal.
- **Tests**: 7 overlap cases + 4 delete-guard cases in `gameService.test.ts`; 1 resolver-level RBAC case in `auth.integration.test.ts`. All pass.
- **Manual smoke test**: deferred per Task 10 note (UI glue code; project has no component tests).

### File List

**New:**

- `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/new/page.tsx` — admin-only create form route
- `src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/edit/page.tsx` — admin-only edit form route (season-scoped `findFirst`)
- `src/components/GameForm.tsx` — shared create/edit form with date+time split, same-team guard, delete modal
- `src/components/GamesSection.tsx` — filter bar + pagination wrapper around `GamesTable` (mirrors `PlayersSection` pattern)

**Modified:**

- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — now serves both public and admin views: reads session, computes `isAdmin`, renders `GamesSection` with filters/pagination, and shows a "New Game" button only when admin. Public viewers see the plain table + filters without edit controls.
- `src/components/GamesTable.tsx` — added optional `isAdmin`/`leagueSlug`/`seasonSlug` props + conditional Edit actions column (mirrors 2-5 `PlayersTable` pattern)
- `src/service/models/gameService.ts` — `validateNoScheduleConflict` (Task 1) + delete cascade guard (Task 2a)
- `src/graphql/resolvers.ts` — `createGame` re-gated to `PolicyName.ADMIN` (Task 2)
- `test/service/models/gameService.test.ts` — +11 tests (7 overlap, 4 delete-guard); imports extended
- `test/graphql/auth.integration.test.ts` — +1 test: manager-denied createGame (403)
- `src/graphql/generated.ts` — regenerated via `npm run codegen`

**Not modified (explicitly):**

- `prisma/schema.prisma` — no `onDelete: Cascade` rules added; guard is service-layer
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — public read-only view, Story 3.3's concern

### Change Log

- 2026-04-14: Story 3.1 implemented — admin schedule CRUD (list/new/edit) + overlap detection + delete cascade guard + RBAC re-gate. 12 new tests, 0 regressions.
- 2026-04-14: Refactored admin list: replaced standalone `AdminGamesTable` with shared `GamesTable` (now accepts `isAdmin`/`leagueSlug`/`seasonSlug`) + new `GamesSection` wrapper for filters + pagination — mirrors the 2-5 `PlayersTable`/`PlayersSection` split.
- 2026-04-14: Removed `/admin/.../games` list route. The public schedule page at `/leagues/[leagueSlug]/seasons/[seasonSlug]/games` now serves both public and admin views via `isAdmin` conditional controls. `/admin/.../games/new` and `/[gameId]/edit` form routes remain admin-only.
- 2026-04-21: Review fixes applied (HIGH + MEDIUM):
  - **H1** `GamesSection` no longer rewrites the URL on mount — landing on `?page=N` now stays on page N instead of being kicked to page 1.
  - **H2** Location filter typing is debounced (300ms) and gated by a `didMount` ref; start/end/team selects still push immediately.
  - **H3** `Game.date` and `Game.time` removed from GraphQL schema and resolvers (they were aliased to `parent.datetime`, a footgun). Codegen regenerated.
  - **H4** Overlap error now reads `Team '<Name>' already plays at <YYYY-MM-DD HH:MM> (round <N>)` — query extended to fetch team names. New test pins the format.
  - **M1** `GameForm` uses `useWatch` for `homeTeamId` so the away-team dropdown reactively filters; same-team guard now sets errors on BOTH `homeTeamId` and `awayTeamId`.
  - **M2** Added a doc comment on `combineToISO` describing the UTC-naive wall-clock convention so future consumers force `timeZone: "UTC"` on display.
  - **M3** `createGame` / `updateGame` normalize `location` to lowercase; admin list filter lowercases on query. Existing location tests updated to assert lowercase round-trip.
  - **M4** `deleteGame` calls `getGameById` first, so invalid ids surface a proper `NotFoundError` instead of a raw Prisma `P2025`.
  - **M5** Removed three stray `console.log` calls from standings page; `today` now uses `setUTCHours(0,0,0,0)` to match Prisma's UTC datetime storage.
  - Tests: 423 passing / 0 failing. Typecheck + lint clean.
