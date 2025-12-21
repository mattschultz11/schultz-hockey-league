# Story 1.2: Auth Baseline with Roles

Status: done

---

## Quick Start (Read This First)

**Story Goal:** Complete role-based access control for GraphQL API with manager team-scoping, enhanced logging, and comprehensive testing.

**ALREADY DONE (DO NOT recreate):**

- NextAuth config (`authOptions.ts`): Google OAuth, JWT strategy, secure cookies
- Auth helpers (`authService.ts`): `assertRole()`, `auth()`, `logAuthCheck()`, `AuthError`
- API route: `src/app/api/auth/[...nextauth]/route.ts`
- Prisma `Role` enum: ADMIN, MANAGER, PLAYER (PLAYER = "viewer" in PRD)
- GraphQL mutations: ALL 15+ mutations already protected with `withAdmin()` wrapper
- UI auth: sign-in/sign-out working in `src/app/nav.tsx`

**YOUR TASKS:**

1. Add role guard helpers to `authService.ts`: `requireRole()`, `requireAtLeast()`
2. Add manager team-scoping guard: `assertManagerOfTeam()`
3. Enhance `logAuthCheck()` with endpoint names
4. Create `useUserRole()` hook for client-side role-based UI
5. Write integration tests for GraphQL mutations with different roles

**DO NOT:**

- Reinstall NextAuth (already done)
- Re-apply guards to mutations (already applied via `withAdmin()`)
- Create separate `rbacGuards.ts` file (extend existing `authService.ts`)

---

## Story

As an **admin**,
I want login with session cookies and roles (admin/manager/viewer),
so that access is enforced per role.

## Acceptance Criteria

1. **Given** NextAuth is configured with a provider
   **When** a known user signs in with valid credentials
   **Then** a session cookie is set (httpOnly, secure in production)
   **And** the user's role (ADMIN/MANAGER/PLAYER) is stored in the session

2. **Given** a user with "MANAGER" role is authenticated
   **When** they attempt to access an admin-only endpoint
   **Then** the request is denied with HTTP 403 Forbidden
   **And** an appropriate error message is returned
   **And** the denial is logged with user context

3. **Given** a user with "PLAYER" role (viewer equivalent) is authenticated
   **When** they access read-only pages (schedules, standings)
   **Then** the page loads successfully
   **And** no write/edit affordances are displayed

4. **Given** any protected route is accessed
   **When** the request is processed
   **Then** role enforcement is applied via API guards
   **And** 100% of protected routes enforce role checks

## Tasks / Subtasks

- [x] Verify existing auth works correctly (AC: #1)
  - [x] Run app: `npm run dev` and sign in with Google OAuth
  - [x] Verify session cookie is set with role in JWT
  - [x] Check console logs show structured auth events

- [x] Verify existing mutation guards (AC: #2, #4)
  - [x] Confirm all 15+ mutations in `resolvers.ts` use `withAdmin()` wrapper
  - [x] Test: ADMIN can execute `createDraftPick` mutation
  - [x] Test: MANAGER executing `createDraftPick` returns GraphQL error with code 403
  - [x] Test: PLAYER executing `createDraftPick` returns GraphQL error with code 403

- [x] Add role guard helpers to `authService.ts` (AC: #2, #4)
  - [x] Add `requireRole(allowedRoles: Role[])` - returns guard function
  - [x] Add `requireAtLeast(minRole: Role)` - hierarchical check (ADMIN > MANAGER > PLAYER)
  - [x] Add `requireAdmin()` - shortcut for `requireRole([Role.ADMIN])`

- [x] Add manager team-scoping guard (AC: #2) - SECURITY CRITICAL
  - [x] Add `assertManagerOfTeam(ctx, teamId)` to `authService.ts`
  - [x] ADMIN bypasses team check (can access all teams)
  - [x] MANAGER must own the team via Player.managedTeam relationship
  - [x] Log team scope violations with userId and requestedTeamId

- [x] Enhance auth logging (AC: #2)
  - [x] Update `logAuthCheck()` signature to include endpoint name
  - [x] Log fields: `{ event, requestId, outcome, endpoint, userId, role, requiredRoles, reason }`
  - [x] Log all 403 denials at INFO level
  - [x] Log successful authorizations at DEBUG level

- [x] Create client-side role hook (AC: #3)
  - [x] Create `src/hooks/useUserRole.ts` with `useUserRole()` hook
  - [x] Expose: `role`, `isAdmin`, `isManager`, `isPlayer`, `isAuthenticated`
  - [ ] Use in components to conditionally render write affordances (deferred to UI stories)

- [x] Write integration tests (AC: #1, #2, #3, #4)
  - [x] Create `test/graphql/auth.integration.test.ts`
  - [x] Test: Admin can execute mutations (test 3+ mutation types)
  - [x] Test: Manager cannot execute admin-only mutations (403)
  - [x] Test: Player cannot execute any mutations (403)
  - [x] Test: Unauthenticated user cannot execute mutations (401)
  - [x] Test: Manager can only access their own team's data

## Dev Notes

### GraphQL Context Type

**CRITICAL:** Use correct types in resolvers:

```typescript
// In resolvers.ts - use GraphQLContext, NOT AuthContext
import type { GraphQLContext } from "@/graphql/resolvers";

// GraphQLContext is aliased to ServerContext (see src/types.ts:10-12)
// ServerContext extends AuthContext with: { prisma: PrismaClient }

// Resolver signature:
async myResolver(_parent: unknown, args: Args, ctx: GraphQLContext) {
  assertRole(ctx, [Role.ADMIN]);
  // ctx.prisma is available
  // ctx.user is Option<User>
  // ctx.requestId is string
}
```

### Role Permission Matrix

| Prisma Enum    | PRD Term | Mutations           | Scoping         |
| -------------- | -------- | ------------------- | --------------- |
| `Role.ADMIN`   | admin    | All mutations       | System-wide     |
| `Role.MANAGER` | manager  | Team mutations only | Their team only |
| `Role.PLAYER`  | viewer   | None (read-only)    | All data (read) |

**Permission Examples:**

- ADMIN: createDraftPick, updateRoster, createGame, approveStats
- MANAGER: updateRoster (team-scoped), submitStats (team games only)
- PLAYER: All queries, zero mutations

### Manager Team-Scoping (SECURITY CRITICAL)

Per FR-017: "Team Managers have limited write access (their team's picks, roster updates as allowed)"

```typescript
// Add to authService.ts
export async function assertManagerOfTeam(
  ctx: GraphQLContext,
  teamId: string,
): Promise<GraphQLContext> {
  return Option.match(ctx.user, {
    onSome: async (user) => {
      // Admin can access all teams
      if (user.role === Role.ADMIN) return ctx;

      if (user.role === Role.MANAGER) {
        // Find manager's team via Player -> managedTeam relationship
        const managedTeam = await ctx.prisma.player.findFirst({
          where: {
            userId: user.id,
            managedTeam: { isNot: null },
          },
          include: { managedTeam: true },
        });

        if (!managedTeam || managedTeam.managedTeam?.id !== teamId) {
          logAuthCheck(ctx.requestId, "deny", {
            endpoint: "team-scoped-mutation",
            reason: "team_scope_violation",
            userId: user.id,
            requestedTeam: teamId,
            requiredRoles: [Role.MANAGER],
          });
          throw new AuthError("Access denied: not your team", 403);
        }
        return ctx;
      }

      throw new AuthError("Forbidden", 403);
    },
    onNone: () => {
      throw new AuthError("Unauthorized", 401);
    },
  });
}
```

### Enhanced Auth Logging

Update `logAuthCheck()` in `authService.ts`:

```typescript
export function logAuthCheck(
  requestId: string,
  outcome: "allow" | "deny" | "unauthorized",
  details: {
    endpoint?: string; // e.g., "Mutation.createDraftPick"
    userId?: string;
    role?: Role;
    requiredRoles?: Role[];
    reason?: string; // For denials: "insufficient_role", "team_scope_violation"
    teamId?: string; // For manager scoping
  },
) {
  const level = outcome === "allow" ? "debug" : "info";
  console[level](
    JSON.stringify({
      event: "authz",
      requestId,
      outcome,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}
```

### Client-Side Role Hook

Create `src/hooks/useUserRole.ts`:

```typescript
import { useSession } from "next-auth/react";
import type { Role } from "@/service/prisma";

export function useUserRole() {
  const { data: session, status } = useSession();

  const role = session?.user?.role as Role | undefined;

  return {
    role,
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isPlayer: role === "PLAYER",
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}

// Usage in components:
// const { isAdmin, isManager } = useUserRole();
// {(isAdmin || isManager) && <DraftPickButton />}
// {isAdmin && <OverrideButton />}
```

### Integration Test Specification

Create `test/graphql/auth.integration.test.ts`:

```typescript
import { Role } from "@/service/prisma";
// Import test utilities (check existing test patterns)

describe("GraphQL Auth Integration", () => {
  describe("Admin role", () => {
    it("can execute createDraftPick mutation", async () => {
      /* ... */
    });
    it("can execute createTeam mutation", async () => {
      /* ... */
    });
    it("can execute updateRoster mutation", async () => {
      /* ... */
    });
  });

  describe("Manager role", () => {
    it("cannot execute admin-only mutations (403)", async () => {
      /* ... */
    });
    it("can only access their own team data", async () => {
      /* ... */
    });
    it("is denied access to other teams (403)", async () => {
      /* ... */
    });
  });

  describe("Player role", () => {
    it("cannot execute any mutations (403)", async () => {
      /* ... */
    });
    it("can execute read queries", async () => {
      /* ... */
    });
  });

  describe("Unauthenticated", () => {
    it("cannot execute mutations (401)", async () => {
      /* ... */
    });
    it("cannot execute queries requiring auth (401)", async () => {
      /* ... */
    });
  });
});
```

### JWT Token Security Notes

- Role stored in JWT token (signed with `NEXTAUTH_SECRET`)
- Token signature prevents client-side tampering
- Role is re-validated from database on each `jwt` callback (see `authOptions.ts:44-52`)
- Keep session payload minimal - current implementation is optimal
- Verify `NEXTAUTH_SECRET` is 32+ random characters

### File Structure

```
src/service/auth/
  authOptions.ts      # Exists - NextAuth config (DO NOT modify)
  authService.ts      # Exists - ADD new guards here (requireRole, assertManagerOfTeam)

src/hooks/
  useUserRole.ts      # CREATE - Client-side role hook

test/graphql/
  auth.integration.test.ts  # CREATE - Integration tests

test/service/auth/
  authService.test.ts       # Exists - EXPAND with new guard tests
```

### Architecture Compliance

- **Auth Strategy**: NextAuth.js 4.24.13 with JWT (DO NOT upgrade to v5)
- **Session**: httpOnly secure cookies
- **RBAC**: Deny by default, guards at resolver entry
- **Logging**: Structured JSON with requestId correlation

### Previous Story Patterns (from 1-1)

- Prisma client: `src/service/prisma/index.ts`
- Logging: JSON with `requestId`, `event`, `source` fields
- Tests: Jest 30.2.0, run with `npm test -- --runInBand`
- Test location: `test/` mirrors `src/` structure

### References

- [Source: _bmad-output/epics.md#Story-1.2:-Auth-Baseline-with-Roles]
- [Source: _bmad-output/architecture.md#Authentication--Authorization]
- [Source: _bmad-output/architecture.md#Security-Architecture]
- [Source: _bmad-output/prd.md#Roles--Access] (FR-016, FR-017, FR-018)
- [Source: src/graphql/resolvers.ts] - All mutations use `withAdmin()` wrapper
- [Source: src/service/auth/authService.ts] - Existing `assertRole()` implementation

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Auth tests: `npm test -- --runInBand --testPathPatterns="auth"`

### Completion Notes List

- Verified existing auth configuration in `authOptions.ts` with Google OAuth, JWT strategy, and secure cookies
- Confirmed all 27 GraphQL mutations (9 entities x 3 operations) are protected with `withAdmin()` wrapper
- Enhanced `logAuthCheck()` with typed details including endpoint, userId, role, requiredRoles, reason, teamId
- Added structured logging with DEBUG level for allows, INFO level for denials
- Implemented `requireRole()` guard function that wraps `assertRole()`
- Implemented `requireAdmin()` shortcut for admin-only endpoints
- Implemented `requireAtLeast()` hierarchical role check (ADMIN > MANAGER > PLAYER)
- Implemented `assertManagerOfTeam()` for team-scoped MANAGER operations (SECURITY CRITICAL)
- Created `useUserRole()` client-side hook for role-based UI rendering
- Added 39 auth tests covering all role combinations and edge cases (21 unit + 18 integration)
- Integration tests use real SQLite test database with insertUser, insertLeague, etc.
- All tests pass, lint passes, typecheck passes

### File List

**New Files:**

- `src/hooks/useUserRole.ts` - Client-side role hook for conditional UI rendering
- `test/graphql/auth.integration.test.ts` - GraphQL auth integration tests (18 tests) using test database

**Modified Files:**

- `src/service/auth/authService.ts` - Added role guard helpers and manager team-scoping
- `test/service/auth/authService.test.ts` - Expanded from 3 to 21 tests
- `_bmad-output/sprint-status.yaml` - Updated story status to review
- `_bmad-output/epics.md` - Updated epic status

## Change Log

| Date       | Change                                                                                       | Author    |
| ---------- | -------------------------------------------------------------------------------------------- | --------- |
| 2025-12-21 | Story implementation complete - all tasks done, 39 tests passing                             | Dev Agent |
| 2025-12-21 | Code review fixes: Added 3 manager team-scoping tests, fixed docs, removed unused type field | SM Review |
