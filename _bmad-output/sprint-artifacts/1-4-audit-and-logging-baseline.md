# Story 1.4: Audit and Logging Baseline

Status: done

## Story

As an **admin**,
I want write actions audited and logs correlated,
So that changes are traceable.

**Epic Context:** Epic 1 — Foundation & Access. This is the 4th of 5 stories. Stories 1.1-1.3 and 1.5 are already done. This is the final gate to closing Epic 1.

## Acceptance Criteria

1. **Given** a write action occurs (create, update, delete on any entity)
   **When** the action completes successfully
   **Then** an audit entry is created with actor (userId, role), target (entity type, entity ID), action (create/update/delete), timestamp, and metadata (mutation args or changed fields)
   **And** the entry is stored in the AuditLog table

2. **Given** any API request is processed
   **When** logging occurs
   **Then** logs include requestId and user context (userId, role)
   **And** logs are structured JSON format

3. **Given** audit records exist for a league/season
   **When** an admin queries the audit log
   **Then** records are filterable by entity type, actor, and action type
   **And** results are returned with pagination

4. **Given** 100 write actions occur
   **When** the audit table is queried
   **Then** 100 corresponding audit entries exist
   **And** no write action is missing an audit trail

## Tasks / Subtasks

- [x] Task 1: Create AuditLog Prisma model + migration (AC: #1)
  - [x] Add `AuditLog` model to `prisma/schema.prisma` with fields: `id`, `timestamp`, `requestId`, `actorId` (nullable — for unauthenticated `register`), `actorRole`, `action` (CREATE/UPDATE/DELETE enum), `entityType`, `entityId`, `metadata` (Json), `endpoint`
  - [x] Add indexes on `entityType`, `actorId`, `action`, `timestamp` for query filtering
  - [x] Run `npx prisma migrate dev` to generate migration

- [x] Task 2: Create audit service module (AC: #1, #4)
  - [x] Create `src/service/audit/auditService.ts`
  - [x] Implement `logAuditEntry(ctx, { action, entityType, entityId, metadata, endpoint })` that writes to AuditLog table via `ctx.prisma`
  - [x] Use fire-and-forget pattern (`void prisma.auditLog.create(...)`) so audit writes don't block mutation responses or cause failures if audit write fails
  - [x] Log audit write failures to console.error (don't throw)

- [x] Task 3: Inject audit logging into `withPolicy()` (AC: #1, #4)
  - [x] In `rbacPolicy.ts`, after policy checks pass and resolver executes successfully, call `logAuditEntry`
  - [x] Extract `action` from endpoint name: `Mutation.createX` → CREATE, `Mutation.updateX` → UPDATE, `Mutation.deleteX` → DELETE
  - [x] Extract `entityType` from endpoint name: `Mutation.createLeague` → `League`
  - [x] Extract `entityId` from resolver result (result.id) or args (args.id for update/delete)
  - [x] Pass `args.data` or `args` as metadata (exclude sensitive fields if any)

- [x] Task 4: Handle `register` mutation audit (AC: #4)
  - [x] The `register` mutation bypasses `withPolicy()` — add direct `logAuditEntry` call in `resolvers.ts` after `registrationService.registerForSeason` returns
  - [x] `actorId` will be null (unauthenticated), `actorRole` null, `entityType` = "Registration"

- [x] Task 5: Add GraphQL query for audit log (AC: #3)
  - [x] Add `AuditLog` type to `type-defs.mjs`
  - [x] Add query: `auditLog(entityType: String, actorId: String, action: String, limit: Int, offset: Int): [AuditLog!]!`
  - [x] Protect with `withPolicy(PolicyName.ADMIN, ...)`
  - [x] Implement in `auditService.ts` with Prisma `findMany` + `where` filters + `take`/`skip` pagination + `orderBy: { timestamp: "desc" }`

- [x] Task 6: Enhance structured logging with requestId consistency (AC: #2)
  - [x] Verify `ctx.requestId` is populated on every request (already exists via `getRequestId` in authService)
  - [x] Ensure audit log entries include `requestId` for correlation with existing `logAuthCheck` output
  - [x] Add `event: "audit"` field to console output for audit writes (parallel to existing `event: "authz"`)

- [x] Task 7: Write tests (AC: #1, #3, #4)
  - [x] Create `test/service/audit/auditService.test.ts`
  - [x] Test: `logAuditEntry` creates AuditLog record with correct fields
  - [x] Test: Fire-and-forget doesn't throw on audit write failure
  - [x] Test: All mutation types (create/update/delete) produce audit entries via `withPolicy`
  - [x] Test: `register` mutation produces audit entry without actor
  - [x] Test: `auditLog` query returns filtered/paginated results
  - [x] Test: `auditLog` query requires ADMIN role

## Dev Notes

### Architecture Compliance

- **Auth Strategy**: NextAuth.js 4.24.13 — DO NOT upgrade to v5
- **RBAC**: Deny by default, guards at resolver entry via `withPolicy()` — audit hooks go IN `withPolicy`, not alongside it
- **Logging Pattern**: Structured JSON to stdout. Two existing patterns to align with:
  - `authOptions.ts` → `logAuth()` uses `{ event, requestId, source: "nextauth", ...payload }`
  - `authService.ts` → `logAuthCheck()` uses `{ event: "authz", requestId, outcome, timestamp, ...details }`
  - New audit logging should follow: `{ event: "audit", requestId, timestamp, ...auditFields }`
- **Error handling**: `ServiceError` hierarchy in `src/service/errors.ts`. Audit failures must NOT propagate — fire-and-forget with `console.error` on failure
- **Validation**: Effect Schema via `validate()` in `modelServiceUtils.ts` — use for any new input schemas (e.g., audit query filters)
- **Database**: PostgreSQL + Prisma 7. All new models follow existing conventions (UUID `id`, `@default(uuid())`, camelCase fields)

### Critical Codebase Context

**The injection point is `withPolicy()` in `src/service/auth/rbacPolicy.ts`** (around line 146). Current flow:

```
withPolicy() → assertRole() → [scope checks] → return await resolver(parent, args, ctx, info)
                                                  ↑ audit AFTER this returns successfully
```

Audit should happen POST-resolver (after the mutation succeeds), not pre-resolver. This ensures we only audit successful writes, and we have the result (with `result.id`) for the `entityId` field.

**The `register` mutation is the ONE exception** — it's defined directly in `resolvers.ts` without `withPolicy()`:

```ts
register: (_p, args, ctx) => registrationService.registerForSeason(args.data, ctx),
```

This needs a manual audit call wrapping the result.

**`ServerContext` already carries everything needed:**

- `ctx.requestId` — from `getRequestId()` in authService
- `ctx.user` — `Option<SessionUser>` with `id`, `role`
- `ctx.prisma` — Prisma client for writing AuditLog

### Library & Framework Requirements

- **Prisma 7.0.1** — use `@default(uuid())` for id, `Json` type for metadata field, `DateTime @default(now())` for timestamp
- **Effect** — use `Option.match(ctx.user, ...)` pattern for extracting actor info (already established in authService)
- **GraphQL Yoga** — `maskError` in `src/graphql/schema.ts` handles errors from queries/field resolvers; audit query errors will flow through this
- **Jest 30** — run with `npm test -- --runInBand`; use `@ngneat/falso` for test data; use existing `createCtx()` and model factories

### File Structure

```
CREATED:
  prisma/migrations/XXXXXX_add_audit_log/     # Auto-generated migration
  src/service/audit/auditService.ts            # Audit service (write + query)
  test/service/audit/auditService.test.ts      # Unit tests

MODIFIED:
  prisma/schema.prisma                         # Add AuditLog model + AuditAction enum
  src/service/auth/rbacPolicy.ts               # Add post-resolver audit hook in withPolicy()
  src/graphql/type-defs.mjs                    # Add AuditLog type + auditLog query
  src/graphql/resolvers.ts                     # Add auditLog query resolver + register audit wrapper
```

### Testing Requirements

- **Location**: `test/service/audit/auditService.test.ts`
- **Pattern**: Follow `test/service/models/*.test.ts` pattern — use `createCtx()`, `insert*()` factories, SQLite in-memory via Prisma mock
- **Coverage**: Story adds a new module — ensure `auditService.ts` has meaningful statement coverage
- **Existing tests must not break**: Run full suite with `npm test -- --runInBand` after changes
- **Key scenarios**:
  - Audit entry created with correct actor/action/entity/metadata
  - Nullable actorId for unauthenticated register
  - Fire-and-forget doesn't break mutations on audit failure
  - Query filtering by entityType, actorId, action
  - Query pagination with limit/offset
  - Query requires ADMIN policy

### Previous Story Intelligence (from 1.3)

- `withPolicy()` catches `AuthError`, `ValidationError`, `NotFoundError`, `ConflictError` — the audit hook must be INSIDE the try block, after the resolver returns, so it only fires on success
- `return await` is REQUIRED in async try/catch to properly catch rejected promises (documented gotcha from rbacPolicy.ts)
- Story 1.3 code review found 7 issues (H1 scope bypass, H2 test coverage) — be thorough with edge cases
- `PolicyName` is both a const object and a type (same-name pattern) — don't duplicate this pattern for AuditAction; use a Prisma enum instead

### Git Intelligence

Recent commits show: registration form, lineup table, accept registrations, admin page restructure, Season model updates. All followed the established pattern of:

- Prisma schema change → migration → service function → resolver wiring → type-defs update
- No commit touched logging infrastructure

### DO NOT

- Add audit logging to read queries (getLeagues, getTeamById, etc.) — mutations only
- Block mutations on audit write failure — fire-and-forget
- Add a `maxLength(255)` to the metadata Json field (it's Json, not a string)
- Create a separate REST endpoint for audit — use GraphQL query
- Modify `logAuthCheck()` or `authService.ts` — audit is a new concern, not an extension of auth logging
- Add `requestId` generation — it already exists via `getRequestId()` in authService

### References

- [Source: _bmad-output/epics.md#Story-1.4:-Audit-and-Logging-Baseline]
- [Source: _bmad-output/architecture.md#Logging-Strategy]
- [Source: _bmad-output/architecture.md#Security-Architecture]
- [Source: _bmad-output/architecture.md#Data-Architecture]
- [Source: _bmad-output/prd.md#Security] (NFR-003, NFR-004)
- [Source: src/service/auth/rbacPolicy.ts] — withPolicy() injection point
- [Source: src/service/auth/authService.ts] — logAuthCheck pattern, ServerContext shape
- [Source: src/graphql/resolvers.ts] — 30 mutations wrapped with withPolicy + 1 unwrapped register

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Migration required `dotenvx run --env-file .env.local` prefix for DATABASE_URL
- Test schema (`tmp/schema.prisma`) must be kept in sync with production schema — AuditLog model + AuditAction enum added there and regenerated
- `jose` ESM import error resolved by mocking `next-auth/next` (matches existing rbacPolicy.test.ts pattern)

### Completion Notes List

- All 7 tasks implemented across 4 new files and 4 modified files
- 342 tests passing across 20 suites (33 new tests: 28 audit + 5 withPolicy integration)
- Lint clean
- Fire-and-forget pattern confirmed: audit failures logged to console.error, never propagate to callers
- `withPolicy()` audit hook fires post-resolver inside the try block — only successful mutations are audited
- `register` mutation manually wrapped with async/await and direct `logAuditEntry` call
- `AuditLog.metadata` field resolver serializes Prisma Json to GraphQL String via `JSON.stringify`
- Helper functions `parseAuditAction` and `parseEntityType` handle all mutation name patterns (create/update/delete/add/remove/set/accept)
- Code review fixes: withPolicy integration tests, actorId filter test, extractEntityId batch ID support, sanitizeMetadata data unwrapping, getAuditLog input validation (limit clamped [1,100], offset >= 0)

### File List

**Created:**

- `prisma/migrations/20260228022551_add_audit_log/migration.sql`
- `src/service/audit/auditService.ts`
- `test/service/audit/auditService.test.ts`

**Modified:**

- `prisma/schema.prisma` — Added AuditAction enum + AuditLog model with indexes
- `tmp/schema.prisma` — Mirrored AuditAction enum + AuditLog model for test database
- `src/service/auth/rbacPolicy.ts` — Post-resolver audit hook in withPolicy() + parseAuditAction/parseEntityType helpers
- `src/graphql/type-defs.mjs` — AuditAction enum, AuditLog type, auditLog query
- `src/graphql/resolvers.ts` — auditLog query resolver, register audit wrapper, AuditLog.metadata field resolver
