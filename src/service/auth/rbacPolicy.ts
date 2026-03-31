import type { GraphQLResolveInfo } from "graphql";
import { GraphQLError } from "graphql";

import type { GraphQLContext } from "@/graphql/resolvers";
import { logAuditEntry } from "@/service/audit/auditService";
import { ConflictError, NotFoundError, ValidationError } from "@/service/errors";
import { AuditAction, Role } from "@/service/prisma";

import {
  assertLeagueAccess,
  assertManagerOfTeam,
  assertRole,
  assertSeasonAccess,
  AuthError,
} from "./authService";

/**
 * Named policies for RBAC enforcement.
 * Each policy maps to specific role requirements and optional scope checks.
 */
export const PolicyName = {
  ADMIN: "admin",
  MANAGER: "manager",
  MANAGER_OF_TEAM: "managerOfTeam",
  LEAGUE_ACCESS: "leagueAccess",
  SEASON_ACCESS: "seasonAccess",
  READ_ONLY: "readOnly",
} as const;

export type PolicyNameType = (typeof PolicyName)[keyof typeof PolicyName];

/**
 * Configuration for a policy including required roles and optional scope type.
 */
export type PolicyConfig = {
  roles: Role[];
  requiresScope?: "team" | "league" | "season";
};

/**
 * Central registry mapping policy names to their configurations.
 * This is the single source of truth for RBAC policies.
 */
const policyRegistry: Record<PolicyNameType, PolicyConfig> = {
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

/**
 * Retrieves the policy configuration for a given policy name.
 */
export function getPolicy(name: PolicyNameType): PolicyConfig {
  return policyRegistry[name];
}

const scopeFieldMap: Record<NonNullable<PolicyConfig["requiresScope"]>, string> = {
  team: "teamId",
  league: "leagueId",
  season: "seasonId",
};

/**
 * Type for GraphQL resolver functions.
 */
type ResolverFn<TResult, TParent, TArgs> = (
  parent: TParent,
  args: TArgs,
  ctx: GraphQLContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

/**
 * Higher-order function that wraps a GraphQL resolver with policy enforcement.
 * Supports single policy or array of policies (all must pass).
 *
 * @example
 * // Single policy
 * createUser: withPolicy(PolicyName.ADMIN, (_, args, ctx) => userService.createUser(args.data, ctx))
 *
 * @example
 * // Multiple policies (all must pass)
 * updateTeam: withPolicy([PolicyName.MANAGER_OF_TEAM], (_, args, ctx) => teamService.updateTeam(args.id, args.data, ctx))
 */
export function withPolicy<TResult, TParent, TArgs extends object>(
  policy: PolicyNameType | PolicyNameType[],
  resolver: ResolverFn<TResult, TParent, TArgs>,
): ResolverFn<TResult, TParent, TArgs> {
  const policies = Array.isArray(policy) ? policy : [policy];

  return async (parent, args, ctx, info) => {
    const endpoint = `${info.parentType.name}.${info.fieldName}`;

    try {
      for (const policyName of policies) {
        const config = getPolicy(policyName);

        // First, check basic role access
        assertRole(ctx, config.roles, endpoint);

        // Then, check scope if required
        if (config.requiresScope) {
          const requiredField = scopeFieldMap[config.requiresScope];

          // Look up scope ID: top-level args first, then args.data (mutation pattern)
          let scopeValue: string | undefined;
          if (requiredField in args) {
            scopeValue = (args as Record<string, string>)[requiredField];
          } else {
            const data = (args as Record<string, unknown>).data;
            if (data != null && typeof data === "object" && requiredField in data) {
              scopeValue = (data as Record<string, string>)[requiredField];
            }
          }

          if (scopeValue === undefined) {
            throw new GraphQLError(
              `Policy "${policyName}" requires "${config.requiresScope}" scope but "${requiredField}" not found in args or args.data`,
              { extensions: { code: "INTERNAL_SERVER_ERROR" } },
            );
          }
          switch (config.requiresScope) {
            case "team":
              await assertManagerOfTeam(ctx, scopeValue, endpoint);
              break;
            case "league":
              await assertLeagueAccess(ctx, scopeValue, endpoint);
              break;
            case "season":
              await assertSeasonAccess(ctx, scopeValue, endpoint);
              break;
          }
        }
      }

      const result = await resolver(parent, args, ctx, info);

      // Post-resolver audit logging (fire-and-forget)
      const auditAction = parseAuditAction(info.fieldName);
      if (auditAction) {
        const entityType = parseEntityType(info.fieldName);
        const entityId = extractEntityId(result, args);
        logAuditEntry(ctx, {
          action: auditAction,
          entityType,
          entityId,
          metadata: sanitizeMetadata(args),
          endpoint,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof AuthError) {
        throw new GraphQLError(error.message, { extensions: { code: error.status } });
      }
      if (error instanceof ValidationError) {
        throw new GraphQLError(error.message, { extensions: { code: "BAD_USER_INPUT" } });
      }
      if (error instanceof NotFoundError) {
        throw new GraphQLError(error.message, { extensions: { code: "NOT_FOUND" } });
      }
      if (error instanceof ConflictError) {
        throw new GraphQLError(error.message, { extensions: { code: "CONFLICT" } });
      }
      throw error;
    }
  };
}

/**
 * Parses the mutation field name to determine the audit action.
 * Returns null for non-mutation operations (queries, field resolvers).
 */
export function parseAuditAction(fieldName: string): AuditAction | null {
  if (
    fieldName.startsWith("create") ||
    fieldName.startsWith("add") ||
    fieldName.startsWith("set")
  ) {
    return AuditAction.CREATE;
  }
  if (
    fieldName.startsWith("update") ||
    fieldName.startsWith("accept") ||
    fieldName.startsWith("record")
  ) {
    return AuditAction.UPDATE;
  }
  if (fieldName.startsWith("delete") || fieldName.startsWith("remove")) {
    return AuditAction.DELETE;
  }
  return null;
}

/**
 * Extracts the entity type from a mutation field name.
 * e.g. "createLeague" → "League", "deleteUser" → "User", "setGameLineup" → "GameLineup"
 */
export function parseEntityType(fieldName: string): string {
  const prefixes = ["create", "update", "delete", "add", "remove", "set", "accept"];
  for (const prefix of prefixes) {
    if (fieldName.startsWith(prefix)) {
      const rest = fieldName.slice(prefix.length);
      // Handle "PlayerToLineup" → "Lineup", "PlayerFromLineup" → "Lineup"
      if (rest.includes("To")) return rest.split("To").pop()!;
      if (rest.includes("From")) return rest.split("From").pop()!;
      return rest;
    }
  }
  return fieldName;
}

/**
 * Extracts the entity ID from the resolver result or args.
 * Priority: args.id (update/delete) → args.*Ids (batch operations) → result.id (create) → array result IDs
 */
function extractEntityId(result: unknown, args: object): string {
  const argsRecord = args as Record<string, unknown>;

  // For delete/update mutations, args.id is the entity ID
  if ("id" in argsRecord && typeof argsRecord.id === "string") {
    return argsRecord.id as string;
  }

  // For batch mutations with explicit ID arrays (e.g., acceptRegistrations → registrationIds)
  for (const key of Object.keys(argsRecord)) {
    if (key.endsWith("Ids") && Array.isArray(argsRecord[key])) {
      return (argsRecord[key] as string[]).join(",");
    }
  }

  // For create mutations, the result contains the new entity ID
  if (result != null && typeof result === "object" && "id" in result) {
    return (result as Record<string, unknown>).id as string;
  }

  // For array results (e.g. setGameLineup)
  if (Array.isArray(result) && result.length > 0 && "id" in result[0]) {
    return result.map((r: Record<string, unknown>) => r.id).join(",");
  }

  return "unknown";
}

/**
 * Sanitizes mutation args for storage as audit metadata.
 * Strips the "data" wrapper and "id" (already in entityId) for cleaner storage.
 */
function sanitizeMetadata(args: object): Record<string, unknown> {
  const copy = { ...args } as Record<string, unknown>;
  // If args has a "data" key, return the data directly (strip the wrapper)
  if ("data" in copy && typeof copy.data === "object" && copy.data != null) {
    return copy.data as Record<string, unknown>;
  }
  // For non-data args, exclude 'id' (already captured in entityId)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = copy;
  return rest;
}
