import { Option } from "effect";
import type { GraphQLResolveInfo } from "graphql";
import { GraphQLError } from "graphql";

import type { ResolverFn } from "@/graphql/generated";
import { type GraphQLContext, resolvers } from "@/graphql/resolvers";
import { assertManagerOfTeam, AuthError } from "@/service/auth/authService";
import type { League, Season, Team, User } from "@/service/prisma";
import { Role } from "@/service/prisma";

import {
  insertLeague,
  insertPlayer,
  insertSeason,
  insertTeam,
  insertUser,
  makeLeague,
  makeSeason,
  makeTeam,
} from "../modelFactory";
import { createCtx } from "../utils";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

/**
 * Helper to invoke a resolver that may be a function or ResolverWithResolve object
 */
async function invokeResolver<TResult, TParent, TArgs>(
  resolver: unknown,
  parent: TParent,
  args: TArgs,
  ctx: GraphQLContext,
): Promise<TResult> {
  if (typeof resolver === "function") {
    return (resolver as ResolverFn<TResult, TParent, GraphQLContext, TArgs>)(
      parent,
      args,
      ctx,
      {} as GraphQLResolveInfo,
    );
  }
  // ResolverWithResolve case
  const resolverObj = resolver as { resolve: ResolverFn<TResult, TParent, GraphQLContext, TArgs> };
  return resolverObj.resolve(parent, args, ctx, {} as GraphQLResolveInfo);
}

/**
 * Integration tests for GraphQL auth enforcement.
 * Tests role-based access control with actual database operations.
 */
describe("GraphQL Auth Integration", () => {
  describe("Admin role", () => {
    it("can execute createLeague mutation", async () => {
      const adminUser = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(adminUser) as GraphQLContext;
      const leagueInput = makeLeague();

      const result = await invokeResolver<League, unknown, unknown>(
        resolvers.Mutation!.createLeague,
        {},
        { data: { name: leagueInput.name, slug: leagueInput.slug } },
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(leagueInput.name);
      expect(result.slug).toBe(leagueInput.slug);
    });

    it("can execute createSeason mutation", async () => {
      const adminUser = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(adminUser) as GraphQLContext;
      const league = await insertLeague();
      const seasonInput = makeSeason({ leagueId: league.id });

      const result = await invokeResolver<Season, unknown, unknown>(
        resolvers.Mutation!.createSeason,
        {},
        {
          data: {
            leagueId: league.id,
            name: seasonInput.name,
            slug: seasonInput.slug,
            startDate: seasonInput.startDate,
            endDate: seasonInput.endDate,
          },
        },
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(seasonInput.name);
      expect(result.leagueId).toBe(league.id);
    });

    it("can execute createTeam mutation", async () => {
      const adminUser = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(adminUser) as GraphQLContext;
      const season = await insertSeason();
      const teamInput = makeTeam({ seasonId: season.id });

      const result = await invokeResolver<Team, unknown, unknown>(
        resolvers.Mutation!.createTeam,
        {},
        { data: { seasonId: season.id, name: teamInput.name, slug: teamInput.slug } },
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(teamInput.name);
      expect(result.seasonId).toBe(season.id);
    });

    it("can execute deleteLeague mutation", async () => {
      const adminUser = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(adminUser) as GraphQLContext;
      const league = await insertLeague();

      const result = await invokeResolver<League, unknown, unknown>(
        resolvers.Mutation!.deleteLeague,
        {},
        { id: league.id },
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(league.id);
    });
  });

  describe("Manager role", () => {
    it("cannot execute createLeague mutation (403)", async () => {
      const managerUser = await insertUser({ role: Role.MANAGER });
      const ctx = createCtx(managerUser) as GraphQLContext;
      const leagueInput = makeLeague();

      try {
        await invokeResolver(
          resolvers.Mutation!.createLeague,
          {},
          { data: { name: leagueInput.name, slug: leagueInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(403);
        expect((error as GraphQLError).message).toBe("Forbidden");
      }
    });

    it("cannot execute createTeam mutation (403)", async () => {
      const managerUser = await insertUser({ role: Role.MANAGER });
      const ctx = createCtx(managerUser) as GraphQLContext;
      const season = await insertSeason();
      const teamInput = makeTeam({ seasonId: season.id });

      try {
        await invokeResolver(
          resolvers.Mutation!.createTeam,
          {},
          { data: { seasonId: season.id, name: teamInput.name, slug: teamInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(403);
      }
    });

    it("cannot execute deleteLeague mutation (403)", async () => {
      const managerUser = await insertUser({ role: Role.MANAGER });
      const ctx = createCtx(managerUser) as GraphQLContext;
      const league = await insertLeague();

      try {
        await invokeResolver(resolvers.Mutation!.deleteLeague, {}, { id: league.id }, ctx);
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(403);
      }
    });
  });

  describe("Player role (viewer)", () => {
    it("cannot execute createLeague mutation (403)", async () => {
      const playerUser = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(playerUser) as GraphQLContext;
      const leagueInput = makeLeague();

      try {
        await invokeResolver(
          resolvers.Mutation!.createLeague,
          {},
          { data: { name: leagueInput.name, slug: leagueInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(403);
        expect((error as GraphQLError).message).toBe("Forbidden");
      }
    });

    it("cannot execute createTeam mutation (403)", async () => {
      const playerUser = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(playerUser) as GraphQLContext;
      const season = await insertSeason();
      const teamInput = makeTeam({ seasonId: season.id });

      try {
        await invokeResolver(
          resolvers.Mutation!.createTeam,
          {},
          { data: { seasonId: season.id, name: teamInput.name, slug: teamInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(403);
      }
    });

    it("can execute read queries (leagues)", async () => {
      const playerUser = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(playerUser) as GraphQLContext;

      // Create some leagues as admin first
      const adminUser = await insertUser({ role: Role.ADMIN });
      const adminCtx = createCtx(adminUser) as GraphQLContext;
      const league1 = makeLeague();
      const league2 = makeLeague();

      await invokeResolver(
        resolvers.Mutation!.createLeague,
        {},
        { data: { name: league1.name, slug: league1.slug } },
        adminCtx,
      );
      await invokeResolver(
        resolvers.Mutation!.createLeague,
        {},
        { data: { name: league2.name, slug: league2.slug } },
        adminCtx,
      );

      // Player should be able to read leagues
      const result = await invokeResolver<League[], unknown, unknown>(
        resolvers.Query!.leagues,
        {},
        {},
        ctx,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("can execute read queries (users)", async () => {
      const playerUser = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(playerUser) as GraphQLContext;

      // Insert more users
      await insertUser({ role: Role.ADMIN });
      await insertUser({ role: Role.MANAGER });

      const result = await invokeResolver<User[], unknown, unknown>(
        resolvers.Query!.users,
        {},
        {},
        ctx,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Unauthenticated user", () => {
    it("cannot execute createLeague mutation (401)", async () => {
      const ctx = {
        ...createCtx(),
        user: Option.none(),
      } as GraphQLContext;
      const leagueInput = makeLeague();

      try {
        await invokeResolver(
          resolvers.Mutation!.createLeague,
          {},
          { data: { name: leagueInput.name, slug: leagueInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(401);
        expect((error as GraphQLError).message).toBe("Unauthorized");
      }
    });

    it("cannot execute createTeam mutation (401)", async () => {
      const ctx = {
        ...createCtx(),
        user: Option.none(),
      } as GraphQLContext;
      const season = await insertSeason();
      const teamInput = makeTeam({ seasonId: season.id });

      try {
        await invokeResolver(
          resolvers.Mutation!.createTeam,
          {},
          { data: { seasonId: season.id, name: teamInput.name, slug: teamInput.slug } },
          ctx,
        );
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(401);
      }
    });

    it("cannot execute deleteUser mutation (401)", async () => {
      const userToDelete = await insertUser();
      const ctx = {
        ...createCtx(),
        user: Option.none(),
      } as GraphQLContext;

      try {
        await invokeResolver(resolvers.Mutation!.deleteUser, {}, { id: userToDelete.id }, ctx);
        fail("Expected GraphQLError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe(401);
      }
    });
  });

  describe("Manager team scoping", () => {
    it("manager can be associated with a team", async () => {
      // Create a manager user
      const managerUser = await insertUser({ role: Role.MANAGER });

      // Create a season and team
      const season = await insertSeason();
      const team = await insertTeam({ seasonId: season.id });

      // Create a player record that links the manager to the team
      const player = await insertPlayer({
        userId: managerUser.id,
        seasonId: season.id,
        teamId: team.id,
      });

      expect(player.userId).toBe(managerUser.id);
      expect(player.teamId).toBe(team.id);
    });

    it("manager can access their own managed team", async () => {
      // Create a manager user
      const managerUser = await insertUser({ role: Role.MANAGER });

      // Create a season
      const season = await insertSeason();

      // Create a player for the manager
      const managerPlayer = await insertPlayer({
        userId: managerUser.id,
        seasonId: season.id,
      });

      // Create a team with the manager set
      const team = await insertTeam({
        seasonId: season.id,
        managerId: managerPlayer.id,
      });

      // Create context for the manager
      const ctx = createCtx(managerUser) as GraphQLContext;

      // Manager should be able to access their own team
      const result = await assertManagerOfTeam(ctx, team.id);
      expect(result).toBe(ctx);
    });

    it("manager cannot access another team (403)", async () => {
      // Create a manager user
      const managerUser = await insertUser({ role: Role.MANAGER });

      // Create a season
      const season = await insertSeason();

      // Create a player for the manager
      const managerPlayer = await insertPlayer({
        userId: managerUser.id,
        seasonId: season.id,
      });

      // Create a team that the manager owns
      await insertTeam({
        seasonId: season.id,
        managerId: managerPlayer.id,
      });

      // Create ANOTHER team that the manager does NOT own
      const otherTeam = await insertTeam({ seasonId: season.id });

      // Create context for the manager
      const ctx = createCtx(managerUser) as GraphQLContext;

      // Manager should NOT be able to access another team
      try {
        await assertManagerOfTeam(ctx, otherTeam.id);
        fail("Expected AuthError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).status).toBe(403);
        expect((error as AuthError).message).toBe("Access denied: not your team");
      }
    });

    it("manager with no managed team cannot access any team (403)", async () => {
      // Create a manager user with no managed team
      const managerUser = await insertUser({ role: Role.MANAGER });

      // Create a season and team (but manager has no player record managing it)
      const season = await insertSeason();
      const team = await insertTeam({ seasonId: season.id });

      // Create context for the manager
      const ctx = createCtx(managerUser) as GraphQLContext;

      // Manager should NOT be able to access any team since they don't manage one
      try {
        await assertManagerOfTeam(ctx, team.id);
        fail("Expected AuthError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).status).toBe(403);
      }
    });
  });
});
