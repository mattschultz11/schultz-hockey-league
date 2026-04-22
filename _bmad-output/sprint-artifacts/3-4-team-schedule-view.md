# Story 3.4: Team Schedule View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **viewer or manager**,
I want a team-specific schedule view with the team's next game highlighted and clickable game rows,
so that I can focus on my team's games without filtering the full league schedule, and drill into any single game for details.

**Epic Context:** Epic 3 — Schedules (story 4 of 5). Stories 3.1/3.2/3.3 shipped the full league schedule experience (unified public/admin list, email publish flow, status chips). The league list already supports a `teamId` filter (`?teamId=<id>`), so a viewer _could_ get a team-scoped schedule today by filtering. This story closes three remaining gaps from the epic AC:

1. A dedicated **team schedule route** (`/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games`) so a team's schedule has its own URL for bookmarking and sharing — not a filter-param deep-link.
2. A "**Next Up**" visual cue on the soonest upcoming game so viewers don't have to scan the list for "what's next" — this is epic AC #2's "upcoming games highlighted".
3. A **public game detail page** (`/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]`) reached by clicking a row, showing location/time/opponent/round/status + scores (if set) — this satisfies epic AC #3.

No new Prisma fields, no GraphQL work, no schema migration. The team schedule page is ~50 LOC (server component reusing `GamesTable` with a team-scoped `where`). The game detail page is ~40 LOC (server component, one Prisma call). The NextUp chip is a small addition to `GamesTable`.

## Acceptance Criteria

1. **Given** a viewer is on the public teams page `/leagues/[leagueSlug]/seasons/[seasonSlug]/teams`
   **When** they click a team card
   **Then** they navigate to `/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games`
   **And** the page renders a schedule with ONLY games where `homeTeamId === team.id OR awayTeamId === team.id`
   **And** games are sorted chronologically by `datetime` ascending (same convention as the league schedule)

2. **Given** the team has at least one game with `datetime >= now` AND status is `Upcoming` (per the `getGameStatus` helper from Story 3.3)
   **When** the team schedule renders
   **Then** the earliest such game displays a secondary "Next Up" chip inline with (or near) the Status chip
   **And** no other game row shows this chip
   **And** if the team has zero upcoming games (all past, or all Final), no row shows "Next Up"

3. **Given** I click any row in the team schedule table
   **When** the row navigates
   **Then** I land on `/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]`
   **And** the game detail page shows round, home team, away team, date, time, location, status (via the shared `getGameStatus`), and scores (`homeTeamPoints` + `awayTeamPoints`) WHEN both results are set
   **And** if results are not set, no score UI is shown (no `0-0` placeholder)

4. **Given** I am a viewer (or any non-admin role, or signed out)
   **When** I view either the team schedule or the game detail page
   **Then** no Edit / publish / admin-only controls appear
   **And** if I navigate directly to the admin edit URL for the same game, the existing ADMIN gate still returns `notFound()` (unchanged from 3.1)

5. **Given** a league has several teams, each with 10–20 games in the current season
   **When** I visit any team's schedule
   **Then** the page renders within 2s P75
   **And** pagination is NOT added — team schedules are small enough to fit on one page (set `take: 100` as a safety ceiling; most teams will have ≤30)

6. **Given** the season schedule is edited after I've loaded a team page
   **When** I reload
   **Then** the updated games reflect the changes (server component reads Prisma on every request — no cache invalidation needed; inherited from 3.1's no-ISR posture)

7. **Given** the team's slug is URL-safe (e.g. `red-wings`)
   **When** the dev agent implements the team schedule route
   **Then** the team is looked up by the compound unique `(seasonId, slug)` — NOT by `findFirst` + post-filter, and NOT by a global `slug` match (slugs are unique per season, not per-league)
   **And** missing team → `notFound()` (matches the existing `notFound()` convention for league/season)

## Tasks / Subtasks

- [x] **Task 1: `findNextUpcomingId` helper** (AC: #2)
  - [x] Extended `src/components/gameStatus.ts` with `findNextUpcomingId(games, now = new Date()): string | null`
  - [x] Single-pass O(n) scan using `getGameStatus` for the "Upcoming" filter — avoids the filter+sort allocation path
  - [x] Pure function; JSDoc explains Final-precedence (skip games whose status is Final even when datetime is future)
  - [x] Also extracted `STATUS_COLOR` from `GamesTable.tsx` into `gameStatus.ts` as an `export const` so the game detail page can reuse the same mapping (recommended in Task 6 subtask — done now to avoid a near-term second duplication)

- [x] **Task 2: Extend `GamesTable` with optional "Next Up" chip** (AC: #2)
  - [x] Added `nextUpId?: string | null` prop. Rendered as a secondary `<Chip size="sm" variant="flat" color="primary">Next Up</Chip>` wrapped alongside the existing Status chip in a `flex flex-wrap items-center gap-1` container
  - [x] Guarded by `nextUpId === row.key && row.status === "Upcoming"` — defensive against stale nextUpId (e.g., game flipped to Final between fetch and render)
  - [x] League schedule usage unchanged — `nextUpId` is undefined in that code path; no NextUp chips appear
  - [x] Bypassed `GamesSection` on the team page per the story's guidance (team schedule doesn't need filters/pagination)

- [x] **Task 3: Team schedule page** (AC: #1, #2, #4, #5, #6, #7)
  - [x] Created `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games/page.tsx` (server component)
  - [x] Compound unique `@@unique([seasonId, slug])` confirmed at `prisma/schema.prisma:109` → used `prisma.team.findUnique({ where: { seasonId_slug: { seasonId: season.id, slug: teamSlug } } })`
  - [x] `where`: `{ seasonId, OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] }`; `select` same fields as the league page; `orderBy: { datetime: "asc" }`; `take: 100` (flagged as future concern if a season grows past that — MVP scale ≤30 per team)
  - [x] Computes `nextUpId = findNextUpcomingId(games)` and `isAdmin` via `auth()`; passes both to `GamesTable`
  - [x] Parallelized `auth()` + `params` per the 3.1 convention; league → season → team still sequential because each depends on the previous

- [x] **Task 4: `TeamGamesHeader` component** (AC: #1, #4)
  - [x] Created `src/components/TeamGamesHeader.tsx` as a server component (no interactivity needed)
  - [x] Breadcrumb: `Leagues → League → Season → Teams → Team`
  - [x] No admin actions (viewer-first page)

- [x] **Task 5: Clickable rows on `GamesTable`** (AC: #3)
  - [x] Added `rowHref?: (gameId: string) => string` prop
  - [x] When set, `TableRow` becomes interactive: `onClick` navigates via `router.push(href)`; `onKeyDown` handles Enter + Space; `tabIndex={0}`; `role="link"`; `cursor-pointer` class
  - [x] When unset, zero change from Story 3.3's behavior (league schedule uses this path)
  - [x] Admin Edit button in its own cell uses HeroUI `onPress` — React-Aria press events don't synthesize native click bubbling to the parent row's `onClick`, so no conflict in practice. No stopPropagation needed.
  - [x] Accessibility: role="link" + tabIndex + keyboard handling covers the screen-reader + keyboard-only case flagged in 2.5's review

- [x] **Task 6: Public game detail page** (AC: #3, #4, #6)
  - [x] Created `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/page.tsx` (server component, no auth gate — public read)
  - [x] `findFirst({ where: { id, seasonId } })` pattern (season-scoped per 3.1 M4)
  - [x] Renders: breadcrumb, round header with Status chip, two `Matchup` cards (home/away) linking back to each team's schedule, date/time/location detail fields
  - [x] **Scores labeled "pts" rather than "score"**: `homeTeamPoints` / `awayTeamPoints` are standings points (W=2/T=1/L=0), not goal counts. Goal counts would require a `_count: { goals: { where: { teamId } } }` aggregation — out of scope for this story. Labeling as "pts" is honest. If the product wants true scores (goal counts), carve out a follow-up story.
  - [x] Points only render when BOTH results are set; no "TBD" placeholder

- [x] **Task 7: Link `TeamCard` → team schedule** (AC: #1)
  - [x] Wrapped the team name in `TeamCard`'s `CardHeader` with a Next `<Link>` to the team schedule URL
  - [x] `TeamCard` now takes `leagueSlug` + `seasonSlug` props; `TeamsPage` passes them through
  - [x] Hover + focus-visible underline for affordance and keyboard users
  - [x] NOTE: made the heading the clickable target rather than the entire Card — wrapping the whole Card in a `<Link>` would swallow the embedded `TeamTable` content for screen readers (everything becomes a link). The header-link is a safer accessibility trade.

- [x] **Task 8: Tests** (AC: #2, #3)
  - [x] 5 new unit tests for `findNextUpcomingId` in `test/utils/gameStatus.test.ts`: empty, all-past, mixed, all-upcoming, Final precedence
  - [x] No component tests (per project convention)
  - [x] `npm test -- --runInBand` — 439/439 pass (was 434; +5 new, 0 regressions)
  - [x] `npm run typecheck` clean; `npm run lint` clean (two import-sort autofixes applied by eslint-fix)

- [ ] **Task 9: Manual verification** _(user-owned per project convention)_ (AC: #1, #2, #3, #4, #5)
  - [ ] Click a team name on the teams page → confirm navigation to team schedule URL
  - [ ] Verify only that team's games appear (no other teams' games leak in)
  - [ ] Verify the Next Up chip appears on exactly one row (the earliest upcoming) — or on no rows if the team has no upcoming games
  - [ ] Click a game row → confirm landing on game detail page
  - [ ] Verify points appear only when both results are set
  - [ ] Log in as non-admin — confirm no admin controls on either page
  - [ ] Test keyboard navigation: Tab to a row, press Enter, confirm it navigates
  - [ ] Mobile: resize to ≤640px — confirm both pages degrade gracefully (table scrolls, detail card stacks)

## Dev Notes

### Scope — what this story does NOT do

- **No schema changes.** Team schedule is a `where` filter on existing data; game detail is a single-row read.
- **No GraphQL.** Pages read Prisma directly, consistent with 3.1.
- **No pagination on team schedule.** One season's team has ≤30 games realistically. `take: 100` safety ceiling, no UI pagination.
- **No filters on team schedule.** Filters (date range, location) aren't in the AC. Let the list be simple.
- **No score entry / publishing UI.** This story only _reads_ scores when set. Entering / approving scores is 5.x's concern.
- **No team overview dashboard.** That's Story 6.3. This story is the schedule view, nothing else.
- **No new navigation in the top nav.** Discovery is through the existing teams page.

### Existing infrastructure

- **`getGameStatus`** (from 3.3): pure, imports `Result` from `@/service/prisma/generated/enums`. Reuse directly. If extracting `STATUS_COLOR` from `GamesTable.tsx` into `gameStatus.ts`, keep the map in the same module so both consumers (league table + game detail) stay consistent.
- **`GamesTable`**: extend with two optional props (`nextUpId`, `rowHref`). Do not duplicate the table for the team use-case.
- **`GamesSection`**: league-only. Not used on team schedule (no filters/pagination).
- **Server component pattern**: `src/app/admin/leagues/.../games/[gameId]/edit/page.tsx` is the canonical "game-by-id" lookup — copy its `findFirst({ id, seasonId })` structure for the new public detail page. Remove the ADMIN gate.
- **`TeamsPage`**: already enumerates teams. Add `league` + `season` slugs to the `TeamCard` prop surface OR precompute hrefs in the page.

### Architecture Compliance

- **Client bundle safety**: new pages are server components. `GamesTable` remains a client component; new `nextUpId` / `rowHref` props don't change that.
- **Route structure**: new routes live under the public `/leagues/[leagueSlug]/seasons/[seasonSlug]/` tree — consistent with 3.1's "public reads under `/leagues/...`, admin writes under `/admin/leagues/...`" convention.
- **RBAC**: no auth required for team schedule or game detail (consistent with league schedule's public-read posture). The admin edit URL (`/admin/.../games/[gameId]/edit`) continues to 404 for non-admins — untouched.
- **Audit**: no mutations, no new audit entries.
- **Testing**: pure functions → unit tests in `test/utils/`. No component tests.
- **Performance**: team schedule issues 3 serial + 1 parallel query (league → season → team → games). Still well under 500ms for MVP scale. Can parallelize league + session + params resolution (mirrors 3.1's `Promise.all`).

### Library & Framework Requirements

- **No new packages.** HeroUI `Chip` (reused for NextUp), Next `<Link>`, Prisma — all in place.

### File Structure

```
NEW:
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games/page.tsx  # Team schedule server component
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/page.tsx          # Public game detail server component
  src/components/TeamGamesHeader.tsx                                                  # Breadcrumbs + title for team schedule

MODIFIED:
  src/components/GamesTable.tsx          # +nextUpId prop (NextUp chip), +rowHref prop (clickable rows)
  src/components/TeamCard.tsx            # Wrap in Next <Link> to team schedule
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/page.tsx
                                         # Pass league + season slug down to TeamCard
  src/components/gameStatus.ts           # OPTIONAL: +findNextUpcomingId helper, +STATUS_COLOR export (if extracting)
  test/utils/gameStatus.test.ts          # +5 tests for findNextUpcomingId

NOT MODIFIED (explicitly):
  prisma/schema.prisma                   # No schema changes
  src/graphql/type-defs.mjs              # No GraphQL changes
  src/graphql/resolvers.ts               # No resolver changes
  src/service/**                         # No service changes
  src/components/GamesSection.tsx        # League-only; team page bypasses it
  src/components/GamesHeader.tsx         # League-only; team page has its own header
```

### Testing Requirements

- **Location**: `test/utils/gameStatus.test.ts` (existing file — add to it, don't fragment)
- **New cases for `findNextUpcomingId`**:
  1. Empty array → null
  2. All games past, no results → null (all Awaiting)
  3. Mix: 1 past no result + 2 upcoming → returns earliest upcoming id
  4. 3 upcoming games at different datetimes → returns earliest
  5. 2 Final games + 1 Upcoming game → returns the Upcoming id (ignores Final even if datetime is future)
- 5 new tests. Pure functions; no DB, no mocks.
- Coverage: gameStatus utilities already well-covered via 3.3's 9 tests; these additions bring the file to 14 tests.
- Regression: `npm test -- --runInBand` must stay at the current 434 passing baseline + N new, zero regressions.

### Gotchas

- **Team slug uniqueness**: verify in `prisma/schema.prisma` how team slugs are scoped — almost certainly `@@unique([seasonId, slug])` (per convention). If the compound unique is NOT present, use `findFirst({ where: { seasonId, slug } })` to avoid a global-slug lookup.
- **`rowHref` vs Edit button conflict**: the admin `Edit` button's `onPress` could bubble up if you wire an `onClick` on the whole row. Use `e.stopPropagation()` on the Edit button OR (cleaner) make the row non-clickable when an action column is present and the click target would overlap. Simpler still: when `rowHref` AND `showActions` are both set (admin on team schedule — a real scenario), the Status/link cell gets a dedicated "View" icon button rather than a row-wide click. Scope call during implementation.
- **Back navigation**: if user lands on game detail via direct URL (no referrer), don't assume which schedule to link back to. Simplest: always link back to the league schedule. Don't use `router.back()` in a server component.
- **Scores display math**: use `homeTeamPoints` for home score, `awayTeamPoints` for away score. Points in this league's model are derived from the result (W=2, T=1, L=0) — confirm with `teamService.ts:181-183` before displaying. If `Points` is NOT the score but a standings points value, rethink this — the epic AC says "scores", which typically means goals. **The schema does NOT store goals on `Game`**; goals live in the `Goal` model. Rendering "scores" may require `_count: { goals: { where: { teamId } } }` per team, OR a different interpretation.
  - **RECOMMENDED APPROACH**: for this story, show `homeTeamPoints` and `awayTeamPoints` as "Pts" with a label to disambiguate from "Score", NOT as "Score: X–Y". This avoids pretending we have goal counts when we don't. If the user pushes back and wants true scores, scope-creep into a goal-count aggregation call. Flag this ambiguity in the Dev Agent Record for user review.
- **Timezone on detail page**: use the same `toLocaleDateString()` / `toLocaleTimeString()` conventions as `GamesTable` (post-commit `66bcd5f` — local time, NOT UTC). Don't reintroduce the `timeZone: "UTC"` that 3.3's code review commit stripped.
- **Team slug availability in TeamsPage**: `TeamsPage` already selects `team.slug` (line 42 of the file). Good. Just pass it through.
- **Missing team case**: a team that has been deleted or never existed should 404, not redirect. Use `notFound()` from `next/navigation`.
- **Next `<Link>` inside `Card`**: HeroUI `Card` supports `as` prop (`<Card as={Link} href={...}>`) OR you can wrap `<Link><Card>...</Card></Link>`. Pick one; don't do both. Verify with HeroUI docs since this is the first Card-link combo in the app.
- **a11y on clickable row**: if implementing `rowHref` via `onClick`, also add `role="link"` + `tabIndex={0}` + `onKeyDown` for Enter/Space. Safer pattern: wrap the first cell's content in a `<Link>` and style it to fill the cell (`block w-full h-full`); screen readers will announce it as a link naturally.

### Previous Story Intelligence

From **3.3 (League Schedule View)**:

- `getGameStatus` is the canonical derivation for game state. Reuse — don't reimplement.
- `STATUS_COLOR` currently lives in `GamesTable.tsx`. Story 3.4 introduces a second consumer (game detail page). Either extract to `gameStatus.ts` (one-line export) or duplicate the small map. Extraction is cleaner — recommend it.
- Client-side `Result` import works via `@/service/prisma/generated/enums` (established by `StandingsTable` + reinforced in 3.3's code review).
- No-cache posture: server components read Prisma on every request. AC #6 (republish → update reflected on reload) is satisfied automatically.

From **3.2 (Publish and Republish Schedules)**:

- No `published` flag on `Game`. A game exists → it's visible on the schedule. Same posture applies here — team schedule shows all games the team is home/away in.

From **3.1 (Create Season Schedule)**:

- `findFirst({ where: { id, seasonId } })` (season-scoped) is the preferred pattern over `findUnique({ id })` + post-filter for game-by-id lookups. Follow for the game detail page.
- Location filter lowercases both sides — irrelevant here (no filter) but a reminder that Postgres vs SQLite test DB divergence exists.
- `Promise.all` for session + params + league lookup — minor perf win, copy the pattern.

From **2.5 (Admin Player Edit)** and related review cycles:

- Apollo error messages scrubbed via `err.message.replace(/^[^:]+:\s*/, "")` — irrelevant here (no mutations).
- Client components cannot import from `@/service/prisma` directly (pulls `pg`). Use `@/service/prisma/generated/enums` for enums only.

### Git Intelligence Summary

- `66bcd5f Add game status column to league schedule` — story 3.3. Adds Status chip + extracts `getGameStatus` helper. This story reuses both directly.
- `83c92df Add schedule published email template` — story 3.2. Adds the publish-email template. Not directly relevant; referenced only for the CTA URL convention (the email CTA links to the LEAGUE schedule, not team schedules — don't retrofit to include team schedules from the email).
- `aab3b43 Add game schedule admin + combine date/time into single datetime` — story 3.1. Schema shifted to a single `datetime` field. Use `game.datetime` exclusively.

### Project Context Reference

No `**/project-context.md` at project root. Follow conventions in `CLAUDE.md` and project memory:

- Next 16 server components + Prisma 7 — established pattern
- No `test/components/` directory — pure-function tests go in `test/utils/`
- Client components must not import from `@/service/prisma` (use `generated/enums` subpath)
- HeroUI for all UI primitives; no new component libraries

### References

- [Source: _bmad-output/epics.md#Story-3.4 lines 672–698] — Original epic ACs
- [Source: _bmad-output/sprint-artifacts/3-3-league-schedule-view.md] — Status chip pattern + `getGameStatus` helper (reuse)
- [Source: _bmad-output/sprint-artifacts/3-1-create-season-schedule.md] — `findFirst({ id, seasonId })` convention; public-under-`/leagues`, admin-under-`/admin` route split
- [Source: prisma/schema.prisma:160-186] — `Game` model + `Result` enum (for confirming score/points field names)
- [Source: src/app/admin/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/edit/page.tsx] — Canonical game-by-id lookup structure to mirror (minus the ADMIN gate)
- [Source: src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx] — League schedule page; team schedule is a simpler variant
- [Source: src/components/GamesTable.tsx] — Table to extend with `nextUpId` + `rowHref` props
- [Source: src/components/gameStatus.ts] — Reuse `getGameStatus`; optionally add `findNextUpcomingId`; optionally extract `STATUS_COLOR`
- [Source: src/components/TeamCard.tsx, src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/page.tsx] — Team list to link from
- [Source: src/service/models/teamService.ts:165-185] — Confirm `homeTeamPoints` / `awayTeamPoints` semantics before labeling them "Score" in the detail page

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

- Team slug uniqueness confirmed: `@@unique([seasonId, slug])` at `prisma/schema.prisma:109`. Used `findUnique({ where: { seasonId_slug: ... } })` — no need for `findFirst`.
- Made `TeamCard`'s header text the clickable target rather than wrapping the full Card in a `<Link>`. Wrapping the whole Card would make the embedded `TeamTable` announce as a link to screen readers, which is worse. Header-link keeps the table's own semantics intact.
- `Matchup` display uses "pts" label (not "Score") because `homeTeamPoints`/`awayTeamPoints` are standings points (W=2/T=1/L=0 per `teamService.ts:181-185`), NOT goal counts. Goal counts would require aggregating the `Goal` model via `_count: { goals: { where: { teamId } } }` — larger scope; flagged for a follow-up story if the product wants real scores.
- Lint auto-fixed two `simple-import-sort/imports` violations in the two new page files (expected from adding many `@/` imports in one shot).
- Browser verification deferred — can't render a UI from this session. Task 9 is user-owned.

### Completion Notes List

- **Task 1 (helper + color extract)**: `findNextUpcomingId(games, now)` scans once, returns the earliest-`datetime` game whose `getGameStatus` is Upcoming. `STATUS_COLOR` extracted from `GamesTable.tsx` to `gameStatus.ts` so the new game detail page can reuse it without duplication.
- **Task 2 (NextUp chip)**: `GamesTable` gained `nextUpId?: string | null`. Status cell now renders a two-chip group (`Status` + `Next Up`) inside a `flex flex-wrap` container to degrade on narrow cells. Guarded by `nextUpId === row.key && row.status === "Upcoming"` (defensive against a stale nextUpId if the game flipped to Final between query + render).
- **Task 3 (team schedule page)**: ~80 LOC server component under `/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games`. Parallelized what can be (auth + params), sequenced what must be (league → season → team). No filters, no pagination, `take: 100` safety ceiling. Passes `nextUpId` + `rowHref` to `GamesTable`.
- **Task 4 (TeamGamesHeader)**: 35-line server component with breadcrumbs back to Leagues → League → Season → Teams. No admin actions (viewer-first page).
- **Task 5 (clickable rows)**: `GamesTable` gained `rowHref?: (id) => string`. When set, rows get `onClick` + `onKeyDown` (Enter/Space) + `tabIndex={0}` + `role="link"` + `cursor-pointer`. HeroUI Button `onPress` doesn't bubble as native click, so no propagation conflict with the admin Edit column. League schedule (no rowHref) is unchanged.
- **Task 6 (game detail page)**: ~150 LOC server component. Public read (no auth gate). Renders round header + Status chip + two Matchup cards (with team-name links back to each team's schedule) + date/time/location. Points display gated on `homeTeamResult != null && awayTeamResult != null`. Labeled "pts" not "Score" per the ambiguity flag.
- **Task 7 (TeamCard link)**: team name in `CardHeader` wrapped in a Next `<Link>` to team schedule. `TeamCard` props extended with `leagueSlug` + `seasonSlug`; `TeamsPage` passes them.
- **Task 8 (tests)**: 5 new unit tests pin the `findNextUpcomingId` branches (empty, all-past, mixed, all-upcoming ordering, Final-precedence). Pure-function, no DB, no mocks. Run time ~1s.
- **Task 9 (manual verification)**: deferred to Matt — UI-heavy changes need browser confirmation.

**Scope outcome**: 3 new files (helper extended, team schedule page, game detail page, TeamGamesHeader) + 3 modified (GamesTable, TeamCard, TeamsPage) + 1 test file extended. Net diff ~300 lines.

## Senior Developer Review (AI)

**Reviewer:** Matt
**Date:** 2026-04-21
**Outcome:** Approved after all findings fixed.

**Findings summary (pre-fix):**

- **H1** (HIGH) — Row onClick + admin Edit button native-click race (both fire on Edit click).
- **H2** (HIGH) — `role="link"` on `<tr>` is invalid ARIA; bypasses HeroUI Table's built-in interaction support.
- **M1** (MEDIUM) — Space key triggering navigation mixes link/button activation contracts.
- **M2** (MEDIUM) — Only visual affordance for clickable rows is `cursor-pointer`; touch users see no signal.
- **L1** (LOW) — Clickable row had no `aria-label`; accessible name concatenated every cell.
- **L2** (LOW) — Game detail page had no "Back" button; users relied on breadcrumb.

**Action Items:**

- [x] [AI-Review][HIGH] H1: Moved the Edit button out of `GamesTable` entirely. Added an admin-only "Edit Game" button on the game detail page instead (user decision). [GamesTable.tsx, games/[gameId]/page.tsx]
- [x] [AI-Review][HIGH] H2: Replaced manual `onClick` + `tabIndex` + `role="link"` + `onKeyDown` on `TableRow` with HeroUI Table's `onRowAction` prop. [GamesTable.tsx]
- [x] [AI-Review][MEDIUM] M1: Moot after H2 — `onRowAction` uses React-Aria standard activation.
- [x] [AI-Review][MEDIUM] M2: Moot after H2 — HeroUI applies standard row hover styling when `onRowAction` is set.
- [x] [AI-Review][LOW] L1: Moot after H2 — React-Aria derives the row name from structured cell content.
- [x] [AI-Review][LOW] L2: Added "← Back to Schedule" button below the detail card. [games/[gameId]/page.tsx]
- [x] [AI-Review][CLEANUP] Dropped the dead `isAdmin` / `league` / `season` props from `GamesTable` and propagated the removal through `GamesSection` + page callers. Clickable rows now work on the league schedule too (consistent with team schedule). [GamesTable.tsx, GamesSection.tsx, games/page.tsx, teams/[teamSlug]/games/page.tsx]

**Ambiguity surfaced for user review**: "scores" in AC #3 maps to `points` in the schema. I labeled the display "pts" to avoid lying about the semantics. If you want true goal-count scores, that's a follow-up — would need a `Goal` aggregation on the detail page and probably a game summary query in the league/team list tables too.

### File List

**New:**

- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games/page.tsx` — team schedule server component
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/page.tsx` — public game detail server component
- `src/components/TeamGamesHeader.tsx` — breadcrumb header for team schedule

**Modified:**

- `src/components/gameStatus.ts` — added `findNextUpcomingId`; extracted `STATUS_COLOR` as named export
- `src/components/GamesTable.tsx` — added `nextUpId` + `rowHref` props; dropped local `STATUS_COLOR` (now imported); post-review: dropped `isAdmin` / `league` / `season` props and the Edit button column; migrated to HeroUI `onRowAction` for interactive rows
- `src/components/GamesSection.tsx` — post-review: dropped `isAdmin` prop; internally passes `rowHref` to `GamesTable` so league-schedule rows are also clickable into the detail page
- `src/components/TeamCard.tsx` — team name wrapped in `<Link>`; new `leagueSlug` / `seasonSlug` props
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/page.tsx` — passes slugs to `TeamCard`
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/page.tsx` — post-review: stopped passing `isAdmin` to `GamesSection`
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/teams/[teamSlug]/games/page.tsx` — post-review: dropped unused `isAdmin` / `auth()` wiring
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/games/[gameId]/page.tsx` — post-review: added `auth()` + admin-only "Edit Game" button + "← Back to Schedule" button
- `test/utils/gameStatus.test.ts` — +5 tests for `findNextUpcomingId`

**Not modified (explicitly):**

- `prisma/schema.prisma` — no schema changes
- `src/graphql/**` — no GraphQL changes
- `src/service/**` — no service changes
- `src/components/GamesSection.tsx` + `GamesHeader.tsx` — league-only; team page bypasses them

### Change Log

- 2026-04-21: Story 3.4 implemented — team schedule route (`/teams/[teamSlug]/games`) + public game detail route (`/games/[gameId]`) + Next Up chip on the earliest upcoming game + clickable rows + TeamCard → team schedule link. 5 new tests; 439 total passing (was 434); 0 regressions. Typecheck + lint clean. Manual UI verification deferred to Task 9.
- 2026-04-21: Code review (adversarial). 2 HIGH + 2 MEDIUM + 2 LOW. All fixed.
  - **H1 (user decision)**: Dropped the Edit button from `GamesTable` entirely and moved it to the game detail page as an admin-only action. Eliminates the onClick race on admin-viewed rows. Cleaner separation of concerns: list = navigation, detail = actions.
  - **H2**: Replaced the hand-rolled row `onClick` + `tabIndex` + `role="link"` + `onKeyDown` with HeroUI Table's `onRowAction` prop. React-Aria now handles keyboard navigation, focus, and screen-reader semantics. `<tr>` retains its native `role="row"`.
  - **M1**: Moot — the Space-key handler was part of the native-onClick path; `onRowAction` uses React-Aria's standard activation semantics.
  - **M2**: Moot — HeroUI's `onRowAction` applies standard row hover styling automatically when the row becomes interactive.
  - **L1**: Moot — React-Aria derives the accessible name from the table's structured cell content correctly when `onRowAction` is active.
  - **L2**: Added a "← Back to Schedule" button below the game detail card (flat variant, next to the admin-only "Edit Game" button).
  - **Prop cleanup**: Removed `isAdmin` / `league` / `season` from `GamesTable` (dead props after H1). Propagated the removal through `GamesSection` + both caller pages. Made `GamesSection` compute the league schedule row href internally so clicking a league-schedule row also opens the game detail — consistent behavior across both schedules.
  - Tests: 439/439 still passing (no new tests required — pure-function tests already covered the helpers; the `onRowAction` migration is framework-handled). Typecheck + lint clean.
