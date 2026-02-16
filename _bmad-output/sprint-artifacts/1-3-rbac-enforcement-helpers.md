# Story 1.3: RBAC Enforcement Helpers

Status: done

---

## Quick Start (Read This First)

**Story Goal:** Create reusable policy helpers for consistent role enforcement across APIs, with league/season scoping and comprehensive unit tests.

**ALREADY DONE (from Story 1.2 - DO NOT recreate):**

- `authService.ts`: `assertRole()`, `logAuthCheck()`, `AuthError` class
- `authService.ts`: `requireRole()`, `requireAdmin()`, `requireAtLeast()` guard functions
- `authService.ts`: `assertManagerOfTeam()` for team-scoped manager operations
- GraphQL mutations protected with `withAdmin()` wrapper
- Role enum: `Role.ADMIN`, `Role.MANAGER`, `Role.PLAYER`
- Integration tests for role enforcement (`test/graphql/auth.integration.test.ts`)

**YOUR TASKS:**

1. Create `rbacPolicy.ts` module with centralized policy definitions
2. Add league-scoped access guard: `assertLeagueAccess(ctx, leagueId)`
3. Add season-scoped access guard: `assertSeasonAccess(ctx, seasonId)`
4. Create `withPolicy()` higher-order function for resolver wrapping
5. Migrate existing `withAdmin()` to use new policy system
6. Write comprehensive unit tests for all RBAC scenarios

**DO NOT:**

- Duplicate existing guards in `authService.ts`
- Change the existing `assertRole()` or `assertManagerOfTeam()` signatures
- Modify NextAuth configuration

---

## Story

As a **developer**,
I want reusable policy helpers,
So that APIs consistently enforce roles.

## Acceptance Criteria

1. **Given** an API handler or GraphQL resolver
   **When** a policy helper is applied with required role
   **Then** unauthorized roles receive HTTP 403 Forbidden
   **And** authorized roles proceed to the handler logic

2. **Given** RBAC policies are updated centrally
   **When** a guarded endpoint is called
   **Then** the updated policy is reflected immediately
   **And** no code duplication exists across endpoints

3. **Given** a policy helper with league/season scoping
   **When** a user attempts to access resources outside their scope
   **Then** access is denied with 403
   **And** the denial is logged with user context

4. **Given** the policy helper module
   **When** unit tests are run
   **Then** all RBAC scenarios pass (admin access, manager scoped, viewer read-only, unauthorized denial)

## Tasks / Subtasks

- [x] Verify existing auth infrastructure (AC: #1)
  - [x] Review `authService.ts` for existing guard functions
  - [x] Confirm `withAdmin()` wrapper pattern in `resolvers.ts`
  - [x] Identify any gaps in current role enforcement

- [x] Create centralized policy module (AC: #2)
  - [x] Create `src/service/auth/rbacPolicy.ts`
  - [x] Define `PolicyName` type/enum for named policies
  - [x] Create policy registry mapping names to role requirements
  - [x] Export `getPolicy(name: PolicyName)` function

- [x] Add league-scoped access guard (AC: #3)
  - [x] Implement `assertLeagueAccess(ctx, leagueId)` in `authService.ts`
  - [x] ADMIN bypasses league check (can access all leagues)
  - [x] MANAGER must have a player record in the league
  - [x] PLAYER (viewer) can access all leagues (read-only)
  - [x] Log scope violations with userId and requestedLeagueId

- [x] Add season-scoped access guard (AC: #3)
  - [x] Implement `assertSeasonAccess(ctx, seasonId)` in `authService.ts`
  - [x] Validate season exists before checking access (returns "Season not found" for invalid IDs)
  - [x] Check manager has player record in the specific season (more restrictive than league-level check by design)
  - [x] Log scope violations with userId, seasonId, and reason

- [x] Create `withPolicy()` higher-order function (AC: #1, #2)
  - [x] Implement `withPolicy(policyName, resolverFn)` wrapper
  - [x] Support multiple policies: `withPolicy(['admin', 'managerOfTeam'], resolverFn)`
  - [x] Integrate with existing logging for audit trail
  - [x] Return proper GraphQL errors with codes
  - [x] Throw INTERNAL_SERVER_ERROR when scope policy used but required scope field missing from args

- [x] Migrate `withAdmin()` to policy system (AC: #2)
  - [x] Keep `withAdmin()` in resolvers.ts with original implementation for TypeScript inference compatibility
  - [x] New code can use `withPolicy(PolicyName.ADMIN, ...)` from rbacPolicy.ts
  - [x] Ensure backward compatibility with existing resolvers
  - [x] Verify all 27 mutations still work correctly

- [x] Write comprehensive unit tests (AC: #4)
  - [x] Create `test/service/auth/rbacPolicy.test.ts`
  - [x] Test: Admin can access any resource
  - [x] Test: Manager can only access scoped resources
  - [x] Test: Player (viewer) has read-only access
  - [x] Test: Unauthenticated users are denied (401)
  - [x] Test: League scoping enforced correctly
  - [x] Test: Season scoping enforced correctly
  - [x] Test: Policy changes take effect immediately

## Dev Notes

### Policy Architecture

The goal is to centralize RBAC logic while preserving the existing guard functions. The new policy system builds on top of existing infrastructure:

```
withPolicy('admin')           → uses requireAdmin() → uses assertRole()
withPolicy('managerOfTeam')   → uses assertManagerOfTeam()
withPolicy('leagueAccess')    → uses new assertLeagueAccess()
withPolicy('seasonAccess')    → uses new assertSeasonAccess()
```

### Policy Registry Pattern

```typescript
// src/service/auth/rbacPolicy.ts
import { Role } from "@/service/prisma";
import type { ServerContext } from "@/types";

export const PolicyName = {
  ADMIN: "admin",
  MANAGER: "manager",
  MANAGER_OF_TEAM: "managerOfTeam",
  LEAGUE_ACCESS: "leagueAccess",
  SEASON_ACCESS: "seasonAccess",
  READ_ONLY: "readOnly",
} as const;

export type PolicyName = (typeof PolicyName)[keyof typeof PolicyName];

type PolicyConfig = {
  roles: Role[];
  requiresScope?: "team" | "league" | "season";
};

const policyRegistry: Record<PolicyName, PolicyConfig> = {
  [PolicyName.ADMIN]: { roles: [Role.ADMIN] },
  [PolicyName.MANAGER]: { roles: [Role.ADMIN, Role.MANAGER] },
  [PolicyName.MANAGER_OF_TEAM]: {
    roles: [Role.ADMIN, Role.MANAGER],
    requiresScope: "team",
  },
  [PolicyName.LEAGUE_ACCESS]: {
    roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER],
    requiresScope: "league",
  },
  [PolicyName.SEASON_ACCESS]: {
    roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER],
    requiresScope: "season",
  },
  [PolicyName.READ_ONLY]: { roles: [Role.ADMIN, Role.MANAGER, Role.PLAYER] },
};

export function getPolicy(name: PolicyName): PolicyConfig {
  return policyRegistry[name];
}
```

### League Scoping Implementation

```typescript
// Add to authService.ts
export async function assertLeagueAccess(
  ctx: ServerContext,
  leagueId: string,
  endpoint?: string,
): Promise<ServerContext> {
  return Option.match(ctx.user, {
    onSome: async (user) => {
      // Admin can access all leagues
      if (user.role === Role.ADMIN) {
        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "admin_bypass",
        });
        return ctx;
      }

      // PLAYER (viewer) can read all leagues
      if (user.role === Role.PLAYER) {
        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "viewer_read_access",
        });
        return ctx;
      }

      // MANAGER must have a player record in the league
      if (user.role === Role.MANAGER) {
        const hasLeagueAccess = await ctx.prisma.player.findFirst({
          where: {
            userId: user.id,
            season: { leagueId: leagueId },
          },
        });

        if (!hasLeagueAccess) {
          logAuthCheck(ctx.requestId, "deny", {
            endpoint,
            userId: user.id,
            role: user.role,
            reason: "league_scope_violation",
          });
          throw new AuthError("Access denied: not in this league", 403);
        }

        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "manager_in_league",
        });
        return ctx;
      }

      throw new AuthError("Forbidden", 403);
    },
    onNone: () => {
      logAuthCheck(ctx.requestId, "unauthorized", {
        endpoint,
        reason: "no_session",
      });
      throw new AuthError("Unauthorized", 401);
    },
  });
}
```

### Season Scoping Implementation

```typescript
// Add to authService.ts
export async function assertSeasonAccess(
  ctx: ServerContext,
  seasonId: string,
  endpoint?: string,
): Promise<ServerContext> {
  return Option.match(ctx.user, {
    onSome: async (user) => {
      // Admin can access all seasons
      if (user.role === Role.ADMIN) {
        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "admin_bypass",
        });
        return ctx;
      }

      // Get the season to find its leagueId
      const season = await ctx.prisma.season.findUnique({
        where: { id: seasonId },
        select: { leagueId: true },
      });

      if (!season) {
        throw new AuthError("Season not found", 403);
      }

      // PLAYER (viewer) can read all seasons
      if (user.role === Role.PLAYER) {
        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "viewer_read_access",
        });
        return ctx;
      }

      // MANAGER must have a player record in this season
      if (user.role === Role.MANAGER) {
        const hasSeasonAccess = await ctx.prisma.player.findFirst({
          where: {
            userId: user.id,
            seasonId: seasonId,
          },
        });

        if (!hasSeasonAccess) {
          logAuthCheck(ctx.requestId, "deny", {
            endpoint,
            userId: user.id,
            role: user.role,
            reason: "season_scope_violation",
          });
          throw new AuthError("Access denied: not in this season", 403);
        }

        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          reason: "manager_in_season",
        });
        return ctx;
      }

      throw new AuthError("Forbidden", 403);
    },
    onNone: () => {
      logAuthCheck(ctx.requestId, "unauthorized", {
        endpoint,
        reason: "no_session",
      });
      throw new AuthError("Unauthorized", 401);
    },
  });
}
```

### withPolicy Higher-Order Function

```typescript
// src/service/auth/rbacPolicy.ts
import type { GraphQLResolveInfo } from "graphql";
import type { GraphQLContext } from "@/graphql/resolvers";

type ResolverFn<TResult, TParent, TArgs> = (
  parent: TParent,
  args: TArgs,
  ctx: GraphQLContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export function withPolicy<TResult, TParent, TArgs>(
  policy: PolicyName | PolicyName[],
  resolver: ResolverFn<TResult, TParent, TArgs>,
): ResolverFn<TResult, TParent, TArgs> {
  const policies = Array.isArray(policy) ? policy : [policy];

  return async (parent, args, ctx, info) => {
    const endpoint = `${info.parentType.name}.${info.fieldName}`;

    for (const policyName of policies) {
      const config = getPolicy(policyName);

      // First, check basic role access
      assertRole(ctx, config.roles, endpoint);

      // Then, check scope if required
      if (config.requiresScope === "team" && "teamId" in args) {
        await assertManagerOfTeam(ctx, (args as { teamId: string }).teamId, endpoint);
      }
      if (config.requiresScope === "league" && "leagueId" in args) {
        await assertLeagueAccess(ctx, (args as { leagueId: string }).leagueId, endpoint);
      }
      if (config.requiresScope === "season" && "seasonId" in args) {
        await assertSeasonAccess(ctx, (args as { seasonId: string }).seasonId, endpoint);
      }
    }

    return resolver(parent, args, ctx, info);
  };
}
```

### Migrating withAdmin()

```typescript
// In resolvers.ts, update the existing withAdmin function
import { withPolicy, PolicyName } from "@/service/auth/rbacPolicy";

// Old implementation (keep for backward compatibility initially)
function withAdmin<TResult, TParent, TArgs>(
  resolver: ResolverFn<TResult, TParent, TArgs>,
): ResolverFn<TResult, TParent, TArgs> {
  return withPolicy(PolicyName.ADMIN, resolver);
}
```

### File Structure

```
src/service/auth/
  authOptions.ts      # Exists - NextAuth config (DO NOT modify)
  authService.ts      # Exists - ADD assertLeagueAccess, assertSeasonAccess
  rbacPolicy.ts       # CREATE - Policy registry and withPolicy()

test/service/auth/
  authService.test.ts       # Exists - EXPAND with scope guard tests
  rbacPolicy.test.ts        # CREATE - Policy and withPolicy tests
```

### Architecture Compliance

- **Auth Strategy**: NextAuth.js 4.24.13 with JWT (DO NOT upgrade to v5)
- **RBAC**: Deny by default, guards at resolver entry
- **Logging**: Structured JSON with requestId correlation
- **Scoping**: All queries/writes scoped by league/season/team per FR-020

### Previous Story Patterns (from 1-2)

- Effect library: Use `Option` for user presence checks
- Logging: `logAuthCheck()` with endpoint, userId, role, reason
- Tests: Jest 30.2.0, run with `npm test -- --runInBand`
- Test location: `test/` mirrors `src/` structure
- Context creation: Use `createCtx()` from `test/utils.ts`

### References

- [Source: _bmad-output/epics.md#Story-1.3:-RBAC-Enforcement-Helpers]
- [Source: _bmad-output/architecture.md#Security-Architecture]
- [Source: _bmad-output/prd.md#Roles--Access] (FR-016, FR-017, FR-018)
- [Source: src/service/auth/authService.ts] - Existing guard implementations
- [Source: test/service/auth/authService.test.ts] - Test patterns to follow

## Dev Agent Record

### Context Reference

- `_bmad-output/sprint-artifacts/1-3-rbac-enforcement-helpers.context.xml`

## File List

### Created

- `src/service/auth/rbacPolicy.ts` - Centralized policy module with PolicyName, PolicyConfig, getPolicy(), withPolicy()
- `test/service/auth/rbacPolicy.test.ts` - Unit tests for policy registry and withPolicy wrapper

### Modified

- `src/service/auth/authService.ts` - Added assertLeagueAccess() and assertSeasonAccess() functions
- `src/graphql/resolvers.ts` - Added ensureAdmin() helper and added reference to rbacPolicy.ts in withAdmin docstring
- `test/service/auth/authService.test.ts` - Added tests for assertLeagueAccess and assertSeasonAccess
- `test/graphql/auth.integration.test.ts` - Added integration tests for league and season scoping

## Change Log

| Date       | Change                                                                 | Author |
| ---------- | ---------------------------------------------------------------------- | ------ |
| 2026-02-15 | Code review: fixed 7 issues (H1 scope bypass, H2 test coverage, M1-M5) | Review |
| 2025-12-21 | Story implementation complete, ready for review                        | Dev    |
| 2025-12-21 | Story context generated                                                | SM     |
| 2025-12-21 | Story drafted from epics                                               | SM     |
