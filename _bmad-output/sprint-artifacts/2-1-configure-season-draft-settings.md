# Story 2.1: Create Draft

Status: done

## Story

As an **admin**,
I want to create a draft for a season by specifying teams in starting order, number of rounds, and rotation type,
So that placeholder draft picks are generated and ready for the live draft.

**Epic Context:** Epic 2 — Draft Board & Rosters. This is the 1st of 6 stories. It generates the draft pick structure that Stories 2.2–2.6 build on.

## Acceptance Criteria

1. **Given** a season with teams
   **When** an admin creates a draft with team IDs (in order), rounds count, and rotation type (CYCLICAL/SNAKE/HYBRID)
   **Then** placeholder DraftPick rows are generated with correct overall, round, pick, and teamId
   **And** playerId is null on all generated picks

2. **Given** CYCLICAL rotation
   **When** the draft is created
   **Then** every round has the same team order

3. **Given** SNAKE rotation
   **When** the draft is created
   **Then** odd rounds use the original order and even rounds reverse it

4. **Given** HYBRID rotation with snakeStartRound
   **When** the draft is created
   **Then** rounds before snakeStartRound use cyclical order and rounds from snakeStartRound onward use snake order

5. **Given** a season with existing draft picks
   **When** createDraft is called again
   **Then** existing picks are cleared and replaced with the new configuration

6. **Given** duplicate team IDs or teams not in the season
   **When** createDraft is called
   **Then** a validation error is returned

7. **Given** HYBRID rotation without snakeStartRound
   **When** createDraft is called
   **Then** a validation error is returned

8. **Given** a non-admin user
   **When** createDraft is called
   **Then** access is denied per RBAC policy

## Tasks / Subtasks

- [x] Task 1: Revert draft settings fields from Season model (AC: N/A)
  - [x] Remove draftOrder, keeperSlots, tiebreaker from Season in prisma/schema.prisma and tmp/schema.prisma
  - [x] Run migration to remove fields
  - [x] Regenerate both Prisma clients

- [x] Task 2: Add GraphQL schema types for createDraft (AC: #1, #4, #7)
  - [x] Add `DraftRotation` enum (CYCLICAL, SNAKE, HYBRID) to type-defs.mjs
  - [x] Add `CreateDraftInput` input type with seasonId, teamIds, rounds, rotation, snakeStartRound
  - [x] Add mutation: `createDraft(data: CreateDraftInput!): [DraftPick!]!`
  - [x] Run codegen

- [x] Task 3: Create validation schema for createDraft (AC: #6, #7)
  - [x] Add `createDraftSchema` to schemas.ts
  - [x] Validate teamIds as array of UUIDs with minimum 2 items
  - [x] Validate rounds as integer between 1-30
  - [x] Validate rotation as enum literal
  - [x] Validate snakeStartRound as optional integer >= 2

- [x] Task 4: Implement createDraft service function (AC: #1–#7)
  - [x] Add `createDraft(data, ctx)` to draftPickService.ts
  - [x] Validate season exists
  - [x] Validate no duplicate team IDs, all teams belong to season
  - [x] Validate HYBRID requires snakeStartRound, snakeStartRound <= rounds
  - [x] Generate picks with correct order per rotation type
  - [x] Clear existing picks and create new ones in transaction
  - [x] Return generated picks ordered by overall

- [x] Task 5: Wire up GraphQL resolver (AC: #1, #8)
  - [x] Add `createDraft` resolver wrapped with `withPolicy(PolicyName.ADMIN, ...)`
  - [x] Audit logging automatic via withPolicy (parseAuditAction handles "create" prefix)

- [x] Task 6: Write tests (AC: #1–#8)
  - [x] Test CYCLICAL rotation — same order every round
  - [x] Test SNAKE rotation — reverses even rounds
  - [x] Test HYBRID rotation — cyclical then snake from snakeStartRound
  - [x] Test clears existing picks when re-creating
  - [x] Test rejects duplicate team IDs
  - [x] Test rejects teams not in season
  - [x] Test NotFoundError for non-existent season
  - [x] Test HYBRID requires snakeStartRound
  - [x] Test snakeStartRound cannot exceed rounds
  - [x] Test correct pick numbers within rounds
  - [x] Test playerId is null on generated picks
  - [x] All 354 tests pass with 0 regressions

## Dev Notes

### Architecture Compliance

- **RBAC**: Admin-only mutation via `withPolicy(PolicyName.ADMIN, ...)`
- **Audit**: Automatic via withPolicy post-resolver hook — `createDraft` starts with "create" so `parseAuditAction` maps to CREATE
- **Validation**: Effect Schema via `validate()` + manual business rule validation in service
- **Error Handling**: `NotFoundError` for missing season, `ValidationError` for invalid input

### References

- [Source: src/service/models/draftPickService.ts] — createDraft function + getTeamOrderForRound helper
- [Source: src/service/validation/schemas.ts] — createDraftSchema
- [Source: src/graphql/type-defs.mjs] — DraftRotation enum, CreateDraftInput, createDraft mutation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initially implemented as "configure draft settings" with fields on Season model — user redirected to "create draft" approach that generates DraftPick rows
- SQLite doesn't support String[] — discovered during first approach, avoided in revised approach
- `randIceHockeyTeam()` has limited pool — test team names must be explicit to avoid slug collisions

### Completion Notes List

- Revised story from "configure draft settings" to "create draft" based on user feedback
- Reverted Season schema changes (net-zero migrations removed from history)
- createDraft clears existing DraftPick rows, unassigns drafted players, and generates new placeholder rows in a transaction
- 3 rotation types: CYCLICAL (same order), SNAKE (alternating), HYBRID (cyclical then snake)
- getTeamOrderForRound helper function handles rotation logic
- snakeStartRound validated: required for HYBRID, rejected for other rotations
- 355 tests passing across 20 suites (13 new createDraft tests)
- Code review: fixed player-team orphaning (H1), squashed migrations (H2), snakeStartRound validation (M1), dead code removal (L2)

### Change Log

- 2026-03-21: Story 2.1 implemented — createDraft mutation with rotation types
- 2026-03-21: Code review fixes — player unassignment, migration cleanup, snakeStartRound validation

### File List

**Modified:**

- `src/graphql/type-defs.mjs` — Added DraftRotation enum, CreateDraftInput, createDraft mutation
- `src/graphql/generated.ts` — Regenerated via codegen
- `src/graphql/resolvers.ts` — Added createDraft resolver
- `src/service/models/draftPickService.ts` — Added createDraft function + getTeamOrderForRound helper
- `src/service/validation/schemas.ts` — Added createDraftSchema
- `test/service/models/draftPickService.test.ts` — Added 13 createDraft tests
