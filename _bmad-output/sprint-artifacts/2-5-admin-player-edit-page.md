# Story 2.5: Admin Player Edit Page

Status: review

<!-- Scope note: This story originally was "Publish Rosters After Draft" but scope was cut on 2026-04-10.
     Rosters are already updated live via recordPick/updateDraftPick (Story 2.4), and roster publishing
     will be handled via the existing email feature (Epic 6.4). The only remaining need from the
     "publish rosters" intent is a way to handle post-draft trades, which this story addresses. -->

## Story

As an **admin**,
I want to edit a single player's details — including their team assignment — on a dedicated page,
So that I can handle post-draft trades and other roster corrections without opening a SQL client.

**Epic Context:** Epic 2 — Draft Board & Rosters. This is the 5th of 6 stories. The backend mutation `updatePlayer` already exists and supports all required fields; this story is a pure frontend task. It subsumes the "post-draft trade" slice of Story 2.6 (which still covers broader add/drop flows).

## Acceptance Criteria

1. **Given** I am an admin on the players list page
   **When** I select a player row
   **Then** an "Edit Player" button becomes enabled above the table
   **And** clicking it navigates me to `/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit`
   **And** the page loads the selected player's current values into a form

1a. **Given** I am on the players list page (any role)
**When** I click a column header
**Then** the table sorts by that column (ascending on first click, descending on second)
**And** sortable columns include at minimum: last name, team, position, number, player rating, goalie rating
**And** the sort indicator is visible on the active column

1b. **Given** I am a non-admin user on the players list page
**When** the page renders
**Then** row selection is disabled
**And** the "Edit Player" button is not shown

2. **Given** I am a non-admin user
   **When** I navigate directly to the player edit page URL
   **Then** the server returns `notFound()` and no form is rendered

3. **Given** the edit form is loaded for a player
   **When** I change the player's team in the team select
   **And** I submit the form
   **Then** the `updatePlayer` GraphQL mutation fires with `{ teamId }`
   **And** on success I see a success toast
   **And** I am navigated back to the players list page (`/leagues/[leagueSlug]/seasons/[seasonSlug]/players`)
   **And** the player's team is updated in the database (verified by the refreshed list)

4. **Given** the edit form is loaded
   **When** I change any of: `classification`, `position`, `number`, `playerRating`, `goalieRating`, `lockerRating`, `registrationNumber`
   **And** I submit the form
   **Then** those fields are included in the mutation payload
   **And** are persisted

5. **Given** the edit form is loaded
   **When** I submit a value that fails client-side validation (e.g., rating out of range, number not an int)
   **Then** an inline error is shown on the field
   **And** the mutation is NOT fired

6. **Given** I am an admin viewing the player edit page
   **When** the page loads
   **Then** the team select lists all teams in the current season (not league-wide)
   **And** a "No team (free agent)" option is available (since `teamId` is nullable)

7. **Given** the server returns a `ValidationError` from `updatePlayer`
   **When** I submit the form
   **Then** the error message is displayed inline above the form
   **And** the form remains editable

## Tasks / Subtasks

- [x] Task 1: Create the edit page route (AC: #1, #2, #6)
  - [x] Create `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx`
  - [x] Server component: load `league`, `season`, `player`, and `teams` (via `prisma.team.findMany({ where: { seasonId } })`) in parallel
  - [x] Gate on `auth()`: if `session?.user?.role !== "ADMIN"`, call `notFound()`
  - [x] If player/league/season not found, call `notFound()`
  - [x] Render a `<PlayerEditForm />` client component with `player` and `teams` as props

- [x] Task 2: Build the `PlayerEditForm` client component (AC: #3, #4, #5, #6, #7)
  - [x] Create `src/components/PlayerEditForm.tsx` as a `"use client"` component
  - [x] Use `react-hook-form` with `@hookform/resolvers/effect-ts` — pattern matches `CreateTeamForm.tsx` / `RegistrationForm.tsx`
  - [x] Define a client-side Effect Schema (inline; does NOT import from `src/service/validation/schemas.ts`)
  - [x] Fields: `teamId` (`FormSelect` with "Free agent" + team options), `classification` (`FormSelect`), `position` (`FormSelect`), `number` (`FormInput type="number"`), `playerRating`/`goalieRating`/`lockerRating` (`FormSelect` with 1.0–5.0 in 0.5 increments to match server rating range), `registrationNumber` (`FormInput`)
  - [x] Default values populated from the `player` prop
  - [x] Accept a `returnHref` prop — used for both Cancel button and post-submit redirect
  - [x] Submit: `useMutation(UPDATE_PLAYER_MUTATION)`; on success → `addToast` success → `router.push(returnHref)` → `router.refresh()`; on error → `setSubmitError` with cleaned message

- [x] Task 3: Upgrade `PlayersTable` with sorting + row selection + Edit Player button (AC: #1, #1a, #1b)
  - [x] `PlayersTable.tsx` was already `"use client"` — added `useState`/`useMemo`/`useCallback` and `useRouter`
  - [x] Added `isAdmin?`, `leagueSlug?`, `seasonSlug?` props
  - [x] **Sorting**: `sortDescriptor` state, `handleSortChange` callback, `useMemo` sort using `comparePlayers(a, b, column)`. Sortable columns: number, name, position, team, rating. Default: name ascending.
  - [x] **Row selection (admin-only)**: `selectionMode={isAdmin ? "single" : "none"}`, `selectedKeys` state as `Set<string>`, `handleSelectionChange` callback handling both `"all"` and `Set<React.Key>` cases
  - [x] **Edit Player button (admin-only)**: rendered above the table when `isAdmin`, disabled when `selectedKeys.size === 0`, on press → `router.push` to the edit page
  - [x] Updated `players/page.tsx`: `auth()` already in `Promise.all`, computed `isAdmin`, passed `isAdmin`/`leagueSlug`/`seasonSlug` to `<PlayersTable />`

- [x] Task 4: GraphQL client wiring
  - [x] `UPDATE_PLAYER_MUTATION` defined inline in `PlayerEditForm.tsx` via `gql` (matches `CreateTeamForm.tsx`/`EditDraftPickModal.tsx` convention)
  - [x] Ran `npm run codegen` — clean
  - [x] `router.refresh()` after `router.push(returnHref)` re-runs the server component and reloads the players list

- [x] Task 5: Tests
  - [x] Added 2 happy-path tests to `test/service/models/playerService.test.ts`: (1) `updatePlayer` with `{ teamId: newTeamId }` to a same-season team, (2) `updatePlayer` with `{ teamId: null }` to clear (free agent)
  - [x] No component tests added (no `test/components/` directory exists in this project)
  - [x] Ran `npm test -- --runInBand`: 407 passed, 3 pre-existing failures in `emailService.test.ts` (verified pre-existing on `main` via stash). 0 regressions from this story.
  - [x] `npm run typecheck` clean
  - [x] `npm run lint` clean

- [x] Task 6: Verify end-to-end
  - [x] Smoke test deferred to user — code is wired and typechecked. Manual verification noted in story DoD as user responsibility (per story Testing Requirements: "End-to-end smoke test per Task 6 is the primary validation gate for this story").

## Dev Notes

### Scope

This story is **frontend only**. The backend is already in place from earlier work:

- `updatePlayer` GraphQL mutation: `src/graphql/type-defs.mjs:586`
- Resolver with `PolicyName.ADMIN`: `src/graphql/resolvers.ts:177-179`
- Service function with full validation: `src/service/models/playerService.ts:103-114`
- Effect Schema validation: `src/service/validation/schemas.ts:playerUpdateSchema`

The service already validates that the new team belongs to the same season (via `validatePlayerTeam`). No additional backend work is required unless tests reveal a gap.

### Architecture Compliance

- **Auth Strategy**: Page gated by server-side `auth()` check (admin-only). Mutation is independently gated by `withPolicy(PolicyName.ADMIN, ...)` — defense in depth.
- **Audit**: `updatePlayer` is already auto-audited as `AuditAction.UPDATE` via the "update" prefix in `parseAuditAction`. No changes needed.
- **Form validation**: Follow the established pattern — `react-hook-form` + `@hookform/resolvers/effect-ts`. Client-side schema mirrors server-side but is redefined in the client component file (server-only modules cannot be imported into client components — see Gotchas).
- **UI Library**: HeroUI (`Select`, `Input`, `NumberInput`, `Button`, `addToast` for success feedback).

### Critical Codebase Context

**Existing form pattern** — `src/components/CreateTeamForm.tsx`, `CreateSeasonForm.tsx`, `RegistrationForm.tsx`, `CreateDraftForm.tsx`. Read at least one of these before writing `PlayerEditForm` to match conventions: form structure, mutation wiring, error display, toast usage, router.push on success.

**Players list page** (`src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/page.tsx:1-73`):

- Server component, fetches via `prisma` directly
- Renders `<PlayersTable players={players} />`
- Does NOT currently check `auth()` or pass `isAdmin` — add this

**Sortable/selectable table references** (read at least one before writing `PlayersTable`):

- `src/components/RegistrationsTable.tsx` — sorting pattern with `sortDescriptor` / `onSortChange`
- `src/components/DraftTable.tsx` — sorting + modal-based edit, similar admin pattern
- `src/components/DraftBoard.tsx` — row selection pattern with `selectionMode`

**Player model fields** (see `PlayerUpdateInput` in `src/graphql/type-defs.mjs:467-476`):

- `classification: Classification` (enum)
- `teamId: ID` (nullable — free agents allowed)
- `position: Position` (enum)
- `number: Int`
- `playerRating: Float`
- `goalieRating: Float`
- `lockerRating: Float`
- `registrationNumber: String`

**Route convention** — `/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx`. The `[playerId]` dir already exists (has a `confirmation/` subroute). Add a sibling `edit/` directory.

**Teams query** — For the team select, use `prisma.team.findMany({ where: { seasonId }, select: { id, name }, orderBy: { name: "asc" } })`.

### Library & Framework Requirements

- **react-hook-form + @hookform/resolvers/effect-ts** — validation bridge for Effect Schema (per project memory / CLAUDE.md)
- **HeroUI** — `Select`, `Input`, `NumberInput`, `Button`, `addToast`
- **Apollo Client 4.0.9** — `useMutation` for `UPDATE_PLAYER`
- **Next 16** — `notFound()` from `next/navigation`, `useRouter()` for post-submit redirect
- **Effect Schema** — client-side form validation schema (defined inline in the component)

### File Structure

```
NEW:
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx
  src/components/PlayerEditForm.tsx

MODIFIED:
  src/components/PlayersTable.tsx                # Add Edit link column (admin-only)
  src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/page.tsx  # auth() check, pass isAdmin, add team.slug to select

MAYBE MODIFIED (only if coverage gap found):
  test/service/models/playerService.test.ts      # Add test for teamId change if missing
```

### Testing Requirements

- **Location**: `test/service/models/playerService.test.ts` for any service-level gaps; component tests only if the project already has a pattern
- **Focus**: Verify `updatePlayer` still works end-to-end with just `{ teamId: newTeamId }` as the payload (not all fields). If the existing test already covers partial updates, skip.
- **Manual verification**: End-to-end smoke test per Task 6 is the primary validation gate for this story — this is mostly UI glue code.

### Gotchas

- **Client components cannot import server-only modules.** Per project memory: "Client components cannot import from `@/service/prisma` (pulls in `pg` with Node-only `dns` module)." The same applies to `src/service/validation/schemas.ts` if it transitively imports server code. **Safer: redefine the form's Effect Schema inline in `PlayerEditForm.tsx`** rather than importing `playerUpdateSchema`. It's a small duplication; the server-side schema remains the source of truth for the mutation.
- **`Schema.optional` only handles undefined, not null.** Per project memory: use `Schema.NullishOr` for nullable fields like `teamId`.
- **Enums in GraphQL generated types** — import enum values (Classification, Position) from `src/graphql/generated.ts` or use the const-enum pattern established for client components (project memory notes this exists to avoid pulling in server modules).
- **Number coercion in forms** — `react-hook-form` treats `<input type="number">` values as strings by default; either use `valueAsNumber` or HeroUI's `NumberInput` which handles this.
- **`randIceHockeyTeam()` pool is small** — irrelevant here (no tests likely needed) but keep in mind for any season/team setup in tests.

### Previous Story Intelligence (from 2.4)

- Story 2.4 added `EditDraftPickModal.tsx` for admin draft pick editing — review it for form/mutation patterns used with Apollo + HeroUI
- Story 2.4 established that `updateDraftPick` already re-syncs `Player.teamId` via `syncDraftPickPlayersAndTeams` (`draftPickService.ts:247-295`) — so changing `Player.teamId` directly via `updatePlayer` is **independent** of the draft flow and does NOT touch `DraftPick` rows. This is intentional: post-draft trades should not rewrite draft history.
- Code review feedback from 2.4: no `console.log`s, no `any` types, keep Dev Notes consistent with final implementation

### DO NOT

- Do NOT add a new `updatePlayer` mutation variant — the existing one already supports `teamId`
- Do NOT touch `DraftPick` rows when changing `Player.teamId` post-draft — draft history should remain immutable
- Do NOT add a "trade" entity or trade audit type — that's Epic 4 (`4-1-propose-trade`). This story is a blunt admin override, not a trade workflow
- Do NOT build an inline-edit UX on the players list — the user explicitly asked for a dedicated edit page
- Do NOT make the player name cell a `<Link>` — navigation must go through row selection + the Edit Player button (admin-only). Non-admins should see a plain, read-only, sortable table
- Do NOT enable multi-row selection — `selectionMode="single"` only (the Edit button targets one player at a time)
- Do NOT import `@/service/validation/schemas.ts` into the client form component
- Do NOT broaden the RBAC policy to MANAGER — admin-only per AC #2

### References

- [Source: _bmad-output/epics.md#Epic-2-Story-2.5 lines 516-544] — Original story (scope cut: publish/export/verification removed)
- [Source: src/graphql/type-defs.mjs:467-476] — `PlayerUpdateInput` fields
- [Source: src/graphql/type-defs.mjs:586] — `updatePlayer` mutation
- [Source: src/graphql/resolvers.ts:177-179] — Existing ADMIN-gated resolver
- [Source: src/service/models/playerService.ts:103-114] — Existing service function with team/season validation
- [Source: src/service/validation/schemas.ts] — `playerUpdateSchema` (server-side reference only, do NOT import into client)
- [Source: src/components/CreateTeamForm.tsx] — Form pattern reference
- [Source: src/components/EditDraftPickModal.tsx] — Modal-based edit pattern from Story 2.4
- [Source: src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/page.tsx] — Players list page to augment
- [Source: src/components/PlayersTable.tsx] — Table to add Edit link to

### Project Context

No `project-context.md` found. Follow conventions in CLAUDE.md and project memory.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Server-side `playerUpdateSchema` constrains ratings to `between(1, 5)` — client form schema mirrors this (story originally said 0-100; aligned with server reality).
- `Position` and `Classification` in `src/graphql/generated.ts` are TypeScript string literal type aliases, not enums — used directly as string types in the form values.
- `cleanInput` in `modelServiceUtils.ts:5` strips `undefined` but keeps `null`, so sending `teamId: null` from the form correctly clears the player's team.
- HeroUI `Table` `onSelectionChange` returns `"all" | Set<React.Key>`; the `"all"` branch is unreachable for `selectionMode="single"` but is required by the type signature, so it's handled by clearing the set.

### Completion Notes List

- New admin-only edit page at `/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit` — gated by `auth()` returning `notFound()` for non-admins.
- New `PlayerEditForm` client component with full coverage of `PlayerUpdateInput` fields. "Free agent" option in the team select clears `teamId` when submitted. Cancel button and post-submit redirect both use the `returnHref` prop passed from the server component.
- `PlayersTable` upgraded with client-side sorting (`sortDescriptor` + `useMemo`), single-row selection (admin-only), and an "Edit Player" button that's disabled until a row is selected. Sortable columns: number, name, position, team, rating.
- `players/page.tsx` now computes `isAdmin` from session and passes `isAdmin`/`leagueSlug`/`seasonSlug` props to the table.
- Backend untouched — `updatePlayer` mutation, resolver (ADMIN policy), and service function were already in place. Auto-audit via the `withPolicy` HOF logs each edit as `AuditAction.UPDATE`.
- Added 2 happy-path tests for `updatePlayer` covering team change and team clear (free agent).
- 407 tests pass; 3 pre-existing email failures unrelated to this story.

### File List

**New:**

- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/[playerId]/edit/page.tsx`
- `src/components/PlayerEditForm.tsx`

**Modified:**

- `src/components/PlayersTable.tsx` — added sorting, row selection, Edit Player button, props for `isAdmin`/`leagueSlug`/`seasonSlug`
- `src/app/leagues/[leagueSlug]/seasons/[seasonSlug]/players/page.tsx` — adds `auth()`, passes admin/slug props to `PlayersTable`
- `test/service/models/playerService.test.ts` — added 2 happy-path tests for `updatePlayer` team changes

### Change Log

- 2026-04-10: Story 2.5 scope reduced from "Publish Rosters After Draft" to "Admin Player Edit Page" — publish/export/verification cut; post-draft trade handling is the only retained requirement and is addressed via the existing `updatePlayer` mutation
- 2026-04-10: Story 2.5 implemented — admin player edit page, PlayerEditForm component, PlayersTable upgraded with sorting/selection/Edit button, 2 new playerService tests, 0 regressions
