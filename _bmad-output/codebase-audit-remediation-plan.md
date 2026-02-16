# Codebase Audit Remediation Plan

**Date:** 2026-02-16
**Scope:** Full codebase audit findings from architecture, service layer, testing, and frontend reviews

---

## Phase 1: Security & Stability Fixes (Critical)

These are bugs and security gaps in existing code that should be addressed before any new feature work.

### 1.1 Add Auth Enforcement to Query Resolvers

**Problem:** All query resolvers (`users`, `leagues`, `seasons`, `teams`, `players`, `games`, `goals`, `penalties`, `draftPicks`) are completely unprotected. Unauthenticated users can query all data.

**Files:**

- `src/graphql/resolvers.ts:94-124`

**Plan:**

- [ ] Decide auth policy for queries: require authentication for all, or allow public read for some?
- [ ] Apply `withPolicy(PolicyName.READ_ONLY, ...)` or equivalent to all query resolvers
- [ ] Add integration tests verifying unauthenticated users are denied
- [ ] Verify existing frontend queries still work with session token

**Considerations:**

- READ_ONLY policy requires any authenticated role (ADMIN, MANAGER, PLAYER) — this is likely the right default
- Some queries (e.g., public league info) may need a public policy later
- The `withPolicy` HOF requires 4-arg resolvers (parent, args, ctx, info) — current query resolvers use mixed signatures that may need updating

---

### 1.2 Migrate Mutations to Use Policy System

**Problem:** All 27 mutations use `withAdmin()` only. MANAGER role cannot perform any mutations, making it functionally useless despite RBAC policies being built for it.

**Files:**

- `src/graphql/resolvers.ts:126-166`
- `src/service/auth/rbacPolicy.ts` (policies already defined)

**Plan:**

- [ ] Map each mutation to its intended policy:
  - **ADMIN only:** createUser, updateUser, deleteUser, createLeague, updateLeague, deleteLeague, createSeason, updateSeason, deleteSeason
  - **MANAGER (team-scoped):** updateTeam, createPlayer (own team), updatePlayer (own team)
  - **MANAGER (season-scoped):** createGame, updateGame, createGoal, updateGoal, createPenalty, updatePenalty
  - Review remaining mutations and assign policies
- [ ] Migrate each mutation from `withAdmin()` to `withPolicy()` per the mapping
- [ ] Update integration tests to verify manager can perform scoped mutations
- [ ] Update integration tests to verify manager is denied for out-of-scope mutations
- [ ] Verify all 27 mutations still pass for admin role

**Considerations:**

- `withPolicy` uses a 4-arg resolver signature while `withAdmin` uses 3-arg — all resolver lambdas need the `info` parameter added
- Scoped policies (MANAGER_OF_TEAM, LEAGUE_ACCESS, SEASON_ACCESS) require the scope field (teamId, leagueId, seasonId) in args — verify GraphQL input types provide these
- Some mutations may need multiple policies (e.g., createPlayer needs both MANAGER role AND team scope)

---

### 1.3 Fix NextAuth JWT Callback Crash

**Problem:** `findUniqueOrThrow` in the JWT callback crashes the entire auth flow if a user is deleted after login. The `if (user)` check is dead code.

**File:**

- `src/service/auth/authOptions.ts:44-52`

**Plan:**

- [ ] Replace `findUniqueOrThrow` with `findUnique`
- [ ] Add null check — if user not found, return token without enrichment (graceful degradation)
- [ ] Log a warning when user lookup fails for an authenticated token
- [ ] Add unit test for the deleted-user scenario
- [ ] Consider: should the session be invalidated when user is not found?

---

## Phase 2: Architecture Improvements (High)

Structural improvements that prevent scaling problems and data corruption.

### 2.1 Implement DataLoader for Field Resolvers

**Problem:** ~30 field resolvers each re-query the parent record by ID to traverse a relation. A query for 10 items with 3 relations = 30 redundant queries.

**Files:**

- `src/service/models/draftPickService.ts:143-153`
- `src/service/models/goalService.ts:94-112`
- `src/service/models/penaltyService.ts:64-74`
- `src/service/models/playerService.ts:53-87`
- `src/service/models/teamService.ts:88-119`
- `src/service/models/seasonService.ts:75-95`
- `src/service/models/gameService.ts:76-116`

**Plan:**

- [ ] Evaluate DataLoader options: `dataloader` npm package or Prisma's built-in batching
- [ ] Create DataLoader instances per request in the GraphQL context
- [ ] Refactor field resolver service functions to accept parent object OR use DataLoader
- [ ] Fix `gameService.ts:100-116` double-query for home/away team goals specifically
- [ ] Fix `playerService.ts:73-79` redundant query in getPlayerAssists
- [ ] Benchmark before/after with a realistic query (e.g., season with 10 teams, each with 15 players)
- [ ] Add request-level query logging in dev to detect N+1 regressions

**Considerations:**

- Prisma's fluent API (`findUnique().relation()`) already batches at the engine level to some degree — measure actual impact before over-optimizing
- DataLoader adds complexity — weigh against actual query volume
- Alternative: pass parent object from resolver (simpler but less flexible)

---

### 2.2 Add Input Validation Layer

**Problem:** No service function validates input data. Strings can be empty, numbers out of range, and relationships inconsistent.

**Files:**

- All files in `src/service/models/`
- `src/service/models/modelServiceUtils.ts`

**Plan:**

- [ ] Choose validation library: Zod (recommended for TypeScript integration)
- [ ] Define validation schemas for each create/update input type:
  - String fields: non-empty, trimmed, max length
  - Numeric fields: jersey number (1-99), period (1-5), penalty minutes (>0), ratings (1-5)
  - Enum fields: runtime validation against Prisma enums
  - Relationship fields: existence checks where critical
- [ ] Apply validation at the service layer entry point (before Prisma calls)
- [ ] Return structured validation errors that GraphQL can format nicely
- [ ] Add slug uniqueness validation in `generateSlug` / create operations
- [ ] Add tests for validation edge cases (empty strings, boundary values, duplicates)

**Considerations:**

- Validation at service layer (not resolver) keeps it reusable for non-GraphQL entry points
- GraphQL schema already provides type-level validation — this is for business rule validation
- Don't duplicate GraphQL enum validation unless there's a bypass risk

---

### 2.3 Wrap Prisma Errors in Service Layer

**Problem:** Raw Prisma errors (constraint violations, not-found, etc.) leak through GraphQL to clients, exposing schema internals.

**Files:**

- All files in `src/service/models/`
- `src/graphql/resolvers.ts` (error conversion)

**Plan:**

- [ ] Create a service-layer error hierarchy:
  - `NotFoundError` — wraps Prisma's `NotFoundError`
  - `ValidationError` — for business rule violations
  - `ConflictError` — for unique constraint violations
- [ ] Add try-catch wrappers to service functions that translate Prisma errors
- [ ] Update GraphQL error handling to map service errors to appropriate GraphQL error codes
- [ ] Ensure error messages are user-friendly (no internal table/column names)
- [ ] Add tests verifying error responses for common failure scenarios

---

## Phase 3: Testing Gaps (High-Medium)

### 3.1 Add Tests for GET/List/Delete Operations

**Problem:** Service tests only cover create and validation paths. No tests for reading, listing, or deleting.

**Files:**

- All test files in `test/service/models/`

**Plan:**

- [ ] Add tests for each service's get-by-id function (found + not-found cases)
- [ ] Add tests for each service's list function (empty + populated)
- [ ] Add tests for each service's delete function (success + not-found)
- [ ] Add tests for update operations beyond validation (successful update, partial update)
- [ ] Priority order: userService (most critical gap), then leagueService, seasonService, teamService

---

### 3.2 Add Tests for modelServiceUtils

**Problem:** `cleanInput()`, `generateSlug()`, `maybeGet()` are used everywhere but have zero test coverage.

**File:**

- `src/service/models/modelServiceUtils.ts`

**Plan:**

- [ ] Create `test/service/models/modelServiceUtils.test.ts`
- [ ] Test `generateSlug`: normal input, special characters, unicode, collisions with similar names
- [ ] Test `cleanInput`: null/undefined removal, nested objects, edge cases
- [ ] Test `maybeGet`: null/undefined input, valid input, error cases

---

### 3.3 Add Coverage Thresholds

**Problem:** No coverage thresholds in Jest config — coverage can silently degrade.

**File:**

- `jest.config.ts`

**Plan:**

- [ ] Run coverage report to establish baseline: `npm test -- --coverage`
- [ ] Set `coverageThreshold` in jest.config.ts for critical directories:
  - `src/service/auth/` — 80%+ (security-critical)
  - `src/service/models/` — 60%+ (with plan to increase)
  - `src/graphql/` — 50%+ (resolver coverage)
- [ ] Add coverage to CI pipeline (`test:ci` script)

---

### 3.4 Consolidate Test Utilities

**Problem:** `jest.mock("next-auth/next")` duplicated across 3 files. Database cleanup is fragile.

**Plan:**

- [ ] Extract shared mock setup to a test helper module
- [ ] Make database cleanup model-aware (auto-discover models or use `$executeRaw('DELETE FROM ...')` cascade)
- [ ] Add a test that verifies `clearDatabase()` actually clears all tables

---

## Phase 4: Frontend Infrastructure (Medium)

### 4.1 Configure Apollo Client

**Problem:** `@apollo/client` is installed but not configured. Frontend cannot fetch any data.

**Files:**

- `src/app/providers.tsx` (needs ApolloProvider)
- New file: `src/lib/apolloClient.ts` or similar

**Plan:**

- [ ] Create Apollo Client instance with:
  - HTTP link pointing to `/api/graphql`
  - Auth header or cookie-based auth (NextAuth session cookie is sent automatically)
  - InMemoryCache with appropriate type policies
- [ ] Wrap app in `ApolloProvider` in `providers.tsx`
- [ ] Create a sample query hook to verify setup works
- [ ] Decide SSR strategy: client-only queries vs. server components with direct Prisma access

**Considerations:**

- Next.js 16 with App Router may favor React Server Components over Apollo for data fetching
- Evaluate whether Apollo is still the right choice vs. server components + direct DB access
- If keeping Apollo: configure for client components only

---

### 4.2 Add Next.js Middleware for Route Protection

**Problem:** No middleware.ts — all pages accessible regardless of auth state.

**Plan:**

- [ ] Create `src/middleware.ts` with NextAuth middleware
- [ ] Define public routes (login, public pages) vs protected routes
- [ ] Redirect unauthenticated users to sign-in page
- [ ] Consider role-based route protection (admin-only pages)

---

### 4.3 Add Error Boundaries

**Problem:** No React error boundary components.

**Plan:**

- [ ] Create `src/app/error.tsx` (Next.js App Router error boundary)
- [ ] Create `src/app/not-found.tsx` for 404 handling
- [ ] Add `src/app/loading.tsx` for loading states
- [ ] Consider per-route error boundaries for critical sections

---

### 4.4 Add Security Headers

**Problem:** No CSP, X-Frame-Options, or rate limiting.

**Plan:**

- [ ] Add security headers in `next.config.ts`:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
- [ ] Evaluate rate limiting options for `/api/graphql` endpoint
- [ ] Consider adding `helmet`-style headers via middleware

---

## Phase 5: Minor Improvements (Low)

### 5.1 Fix DateTime Serialization

**File:** `src/graphql/resolvers.ts:50-51`

- [ ] Validate `new Date(value)` produces a valid date before calling `.toISOString()`

### 5.2 Fix Inconsistent Async Patterns

**File:** `src/service/models/gameService.ts:100`

- [ ] Await Prisma query immediately instead of creating an unresolved promise

### 5.3 Clean Up Dead Code

**File:** `src/service/auth/authService.ts:207, 282`

- [ ] Unreachable catch-all throws at end of `onSome` handlers — add comment or remove

---

## Execution Notes

- Phases 1-2 should be addressed within the current epic or as a dedicated hardening epic before Epic 2
- Phase 3 can be tackled incrementally alongside feature work
- Phase 4 will naturally be addressed as Epic 2+ features require frontend data display
- Phase 5 items can be bundled into any convenient PR

**Dependencies:**

- Phase 1.2 (mutation policies) depends on 1.1 (query auth) being decided first — same auth strategy
- Phase 2.2 (validation) and 2.3 (error wrapping) should be done together
- Phase 4.1 (Apollo) blocks all frontend feature work
