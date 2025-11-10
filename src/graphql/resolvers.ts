import { GraphQLScalarType, Kind, GraphQLError, ValueNode } from "graphql";
import { Role } from "@prisma/client";

import type { ResolverFn, Resolvers } from "./generated";
import * as draftPickService from "../services/draftPickService";
import * as gameService from "../services/gameService";
import * as goalService from "../services/goalService";
import * as leagueService from "../services/leagueService";
import * as penaltyService from "../services/penaltyService";
import * as playerService from "../services/playerService";
import * as seasonService from "../services/seasonService";
import * as teamService from "../services/teamService";
import * as userService from "../services/userService";
import { ServiceContext } from "../services/types";

export type GraphQLContext = ServiceContext;

function parseDateValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = new Date(value as string | number | Date);
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError("Invalid DateTime");
  }

  return parsed;
}

function parseValue(value: unknown) {
  return parseDateValue(value);
}

function parseLiteral(ast: ValueNode) {
  if (ast.kind === Kind.STRING) {
    return parseDateValue(ast.value);
  }
  return null;
}

function serialize(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  throw new TypeError("DateTime serialization expects a Date or string");
}

function ensureAdmin(ctx: GraphQLContext) {
  if (ctx.currentUser?.role !== Role.ADMIN) {
    throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
  }
}

function withAdmin<TParent, TArgs, TResult>(
  resolver: ResolverFn<TResult, TParent, GraphQLContext, TArgs>,
): ResolverFn<TResult, TParent, GraphQLContext, TArgs> {
  return (parent, args, ctx, info) => {
    ensureAdmin(ctx);
    return resolver(parent, args, ctx, info);
  };
}

export const resolvers: Resolvers = {
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "An ISO-8601 encoded UTC date string.",
    serialize,
    parseValue,
    parseLiteral,
  }),

  Query: {
    users: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => userService.getUsers(ctx),
    user: (_parent: unknown, args: { id: string }, ctx: GraphQLContext) =>
      userService.getUserById(args.id, ctx),

    leagues: (_p: unknown, _a: unknown, ctx: GraphQLContext) => leagueService.getLeagues(ctx),
    league: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      leagueService.getLeagueById(args.id, ctx),

    seasons: (_p: unknown, _a: unknown, ctx: GraphQLContext) => seasonService.getSeasons(ctx),
    season: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      seasonService.getSeasonById(args.id, ctx),

    teams: (_p: unknown, _a: unknown, ctx: GraphQLContext) => teamService.getTeams(ctx),
    team: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      teamService.getTeamById(args.id, ctx),

    players: (_p: unknown, _a: unknown, ctx: GraphQLContext) => playerService.getPlayers(ctx),
    player: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      playerService.getPlayerById(args.id, ctx),

    games: (_p: unknown, _a: unknown, ctx: GraphQLContext) => gameService.getGames(ctx),
    game: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      gameService.getGameById(args.id, ctx),

    goals: (_p: unknown, _a: unknown, ctx: GraphQLContext) => goalService.getGoals(ctx),
    goal: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      goalService.getGoalById(args.id, ctx),

    penalties: (_p: unknown, _a: unknown, ctx: GraphQLContext) => penaltyService.getPenalties(ctx),
    penalty: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      penaltyService.getPenaltyById(args.id, ctx),

    draftPicks: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPicks(ctx),
    draftPick: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      draftPickService.getDraftPickById(args.id, ctx),
  },

  Mutation: {
    createUser: withAdmin((_p, args, ctx) => userService.createUser(args.data, ctx)),
    updateUser: withAdmin((_p, args, ctx) => userService.updateUser(args.id, args.data, ctx)),
    deleteUser: withAdmin((_p, args, ctx) => userService.deleteUser(args.id, ctx)),

    createLeague: withAdmin((_p, args, ctx) => leagueService.createLeague(args.data, ctx)),
    updateLeague: withAdmin((_p, args, ctx) => leagueService.updateLeague(args.id, args.data, ctx)),
    deleteLeague: withAdmin((_p, args, ctx) => leagueService.deleteLeague(args.id, ctx)),

    createSeason: withAdmin((_p, args, ctx) => seasonService.createSeason(args.data, ctx)),
    updateSeason: withAdmin((_p, args, ctx) => seasonService.updateSeason(args.id, args.data, ctx)),
    deleteSeason: withAdmin((_p, args, ctx) => seasonService.deleteSeason(args.id, ctx)),

    createTeam: withAdmin((_p, args, ctx) => teamService.createTeam(args.data, ctx)),
    updateTeam: withAdmin((_p, args, ctx) => teamService.updateTeam(args.id, args.data, ctx)),
    deleteTeam: withAdmin((_p, args, ctx) => teamService.deleteTeam(args.id, ctx)),

    createPlayer: withAdmin((_p, args, ctx) => playerService.createPlayer(args.data, ctx)),
    updatePlayer: withAdmin((_p, args, ctx) => playerService.updatePlayer(args.id, args.data, ctx)),
    deletePlayer: withAdmin((_p, args, ctx) => playerService.deletePlayer(args.id, ctx)),

    createGame: withAdmin((_p, args, ctx) => gameService.createGame(args.data, ctx)),
    updateGame: withAdmin((_p, args, ctx) => gameService.updateGame(args.id, args.data, ctx)),
    deleteGame: withAdmin((_p, args, ctx) => gameService.deleteGame(args.id, ctx)),

    createGoal: withAdmin((_p, args, ctx) => goalService.createGoal(args.data, ctx)),
    updateGoal: withAdmin((_p, args, ctx) => goalService.updateGoal(args.id, args.data, ctx)),
    deleteGoal: withAdmin((_p, args, ctx) => goalService.deleteGoal(args.id, ctx)),

    createPenalty: withAdmin((_p, args, ctx) => penaltyService.createPenalty(args.data, ctx)),
    updatePenalty: withAdmin((_p, args, ctx) =>
      penaltyService.updatePenalty(args.id, args.data, ctx),
    ),
    deletePenalty: withAdmin((_p, args, ctx) => penaltyService.deletePenalty(args.id, ctx)),

    createDraftPick: withAdmin((_p, args, ctx) => draftPickService.createDraftPick(args.data, ctx)),
    updateDraftPick: withAdmin((_p, args, ctx) =>
      draftPickService.updateDraftPick(args.id, args.data, ctx),
    ),
    deleteDraftPick: withAdmin((_p, args, ctx) => draftPickService.deleteDraftPick(args.id, ctx)),
  },

  User: {
    seasons: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      userService.getUserSeasons(parent.id, ctx),
  },
  League: {
    seasons: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      leagueService.getLeagueSeasons(parent.id, ctx),
  },
  Season: {
    league: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      seasonService.getSeasonLeague(parent.id, ctx),
    players: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      seasonService.getSeasonPlayers(parent.id, ctx),
    teams: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      seasonService.getSeasonTeams(parent.id, ctx),
    games: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      seasonService.getSeasonGames(parent.id, ctx),
    draft: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      seasonService.getSeasonDraft(parent.id, ctx),
  },
  Team: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamSeason(parent.id, ctx),
    manager: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamManager(parent.id, ctx),
    players: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamPlayers(parent.id, ctx),
    homeGames: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamHomeGames(parent.id, ctx),
    awayGames: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamAwayGames(parent.id, ctx),
    goals: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamGoals(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamPenalties(parent.id, ctx),
    draftPicks: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamDraftPicks(parent.id, ctx),
  },
  Player: {
    user: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerUser(parent.id, ctx),
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerSeason(parent.id, ctx),
    managedTeam: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerManagedTeam(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerTeam(parent.id, ctx),
    goals: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerGoals(parent.id, ctx),
    primaryAssists: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerPrimaryAssists(parent.id, ctx),
    secondaryAssists: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerSecondaryAssists(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerPenalties(parent.id, ctx),
    draftPick: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerDraftPick(parent.id, ctx),
  },
  Game: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameSeason(parent.id, ctx),
    homeTeam: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameHomeTeam(parent.id, ctx),
    awayTeam: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameAwayTeam(parent.id, ctx),
    goals: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameGoals(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGamePenalties(parent.id, ctx),
  },
  Goal: {
    game: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      goalService.getGoalGame(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      goalService.getGoalTeam(parent.id, ctx),
    scorer: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      goalService.getGoalScorer(parent.id, ctx),
    primaryAssist: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      goalService.getGoalPrimaryAssist(parent.id, ctx),
    secondaryAssist: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      goalService.getGoalSecondaryAssist(parent.id, ctx),
  },
  Penalty: {
    game: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      penaltyService.getPenaltyGame(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      penaltyService.getPenaltyTeam(parent.id, ctx),
    player: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      penaltyService.getPenaltyPlayer(parent.id, ctx),
  },
  DraftPick: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickSeason(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickTeam(parent.id, ctx),
    player: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickPlayer(parent.id, ctx),
  },
};
