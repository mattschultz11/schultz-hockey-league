import type { GraphQLResolveInfo } from "graphql";
import { GraphQLError } from "graphql";

import type { GraphQLContext } from "@/graphql/resolvers";
import { Role } from "@/service/prisma";

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
          const scopeFieldMap: Record<NonNullable<PolicyConfig["requiresScope"]>, string> = {
            team: "teamId",
            league: "leagueId",
            season: "seasonId",
          };
          const requiredField = scopeFieldMap[config.requiresScope];

          if (!(requiredField in args)) {
            throw new GraphQLError(
              `Policy "${policyName}" requires "${config.requiresScope}" scope but "${requiredField}" not found in resolver args`,
              { extensions: { code: "INTERNAL_SERVER_ERROR" } },
            );
          }

          const scopeValue = (args as Record<string, string>)[requiredField];
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

      return resolver(parent, args, ctx, info);
    } catch (error) {
      if (error instanceof AuthError) {
        throw new GraphQLError(error.message, { extensions: { code: error.status } });
      }
      throw error;
    }
  };
}
