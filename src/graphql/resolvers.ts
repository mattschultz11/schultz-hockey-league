import type { JsonValue } from "@prisma/client/runtime/client";
import { Option } from "effect";
import type { ValueNode } from "graphql";
import { GraphQLScalarType, Kind } from "graphql";

import { getAuditLog } from "@/service/audit/auditService";
import { PolicyName, withPolicy } from "@/service/auth/rbacPolicy";
import * as emailService from "@/service/email/emailService";
import * as draftPickService from "@/service/models/draftPickService";
import * as emailSendService from "@/service/models/emailSendService";
import * as gameService from "@/service/models/gameService";
import * as goalService from "@/service/models/goalService";
import * as leagueService from "@/service/models/leagueService";
import * as lineupService from "@/service/models/lineupService";
import { validate } from "@/service/models/modelServiceUtils";
import * as penaltyService from "@/service/models/penaltyService";
import * as playerService from "@/service/models/playerService";
import * as registrationService from "@/service/models/registrationService";
import * as seasonService from "@/service/models/seasonService";
import * as teamService from "@/service/models/teamService";
import * as userService from "@/service/models/userService";
import { sendBulkEmailSchema } from "@/service/validation/schemas";
import type { ServerContext } from "@/types";

import type { AuditLog, Resolvers } from "./generated";

export type GraphQLContext = ServerContext;

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
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new TypeError(`DateTime serialization received an invalid date string: "${value}"`);
    }
    return date.toISOString();
  }

  throw new TypeError("DateTime serialization expects a Date or string");
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

    seasons: (_p, args, ctx) => seasonService.getSeasonsByLeague(args.leagueId, ctx),
    season: (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      seasonService.getSeasonById(args.id, ctx),

    teams: (_p, args, ctx) => teamService.getTeamsBySeason(args.seasonId, ctx),
    team: (_p, args, ctx) => teamService.getTeamById(args.id, ctx),

    players: (_p, args, ctx) => playerService.getPlayersBySeason(args.seasonId, ctx),
    player: (_p, args, ctx) => playerService.getPlayerById(args.id, ctx),
    playerCatalog: (_p, args, ctx) => playerService.getPlayerCatalog(args.filter, ctx),

    games: (_p, args, ctx) => gameService.getGamesBySeason(args.seasonId, ctx),
    game: (_p, args, ctx) => gameService.getGameById(args.id, ctx),

    goals: (_p, args, ctx) => goalService.getGoalsBySeason(args.seasonId, ctx),
    goal: (_p, args, ctx) => goalService.getGoalById(args.id, ctx),

    penalties: (_p, args, ctx) => penaltyService.getPenaltiesBySeason(args.seasonId, ctx),
    penalty: (_p, args, ctx) => penaltyService.getPenaltyById(args.id, ctx),

    lineups: (_p, args, ctx) => lineupService.getLineupsByGame(args.gameId, ctx),
    gameTeamLineup: (_p, args, ctx) =>
      lineupService.getLineupsByGameAndTeam(args.gameId, args.teamId, ctx),

    draftPicks: (_p, args, ctx) => draftPickService.getDraftPicksBySeason(args.seasonId, ctx),
    draftPick: (_p, args, ctx) => draftPickService.getDraftPickById(args.id, ctx),
    draftBoard: (_p, args, ctx) => draftPickService.getDraftBoard(args.seasonId, ctx),

    registrations: (_p, args, ctx) =>
      registrationService.getRegistrationsBySeason(args.seasonId, ctx),
    registration: (_p, args, ctx) => registrationService.getRegistrationById(args.id, ctx),

    // Prisma returns metadata as JsonValue; AuditLog.metadata field resolver converts to string
    auditLog: withPolicy(
      PolicyName.ADMIN,
      (_p, args, ctx) => getAuditLog(args, ctx) as Promise<AuditLog[]>,
    ),

    emailHistory: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      emailSendService.getEmailSends(ctx, { limit: args.limit, offset: args.offset }),
    ),
    emailSend: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      emailSendService.getEmailSendById(args.id, ctx),
    ),
  },

  Mutation: {
    createUser: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      userService.createUser(args.data, ctx),
    ),
    updateUser: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      userService.updateUser(args.id, args.data, ctx),
    ),
    deleteUser: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      userService.deleteUser(args.id, ctx),
    ),

    createLeague: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      leagueService.createLeague(args.data, ctx),
    ),
    updateLeague: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      leagueService.updateLeague(args.id, args.data, ctx),
    ),
    deleteLeague: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      leagueService.deleteLeague(args.id, ctx),
    ),

    createSeason: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      seasonService.createSeason(args.data, ctx),
    ),
    updateSeason: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      seasonService.updateSeason(args.id, args.data, ctx),
    ),
    deleteSeason: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      seasonService.deleteSeason(args.id, ctx),
    ),
    createTeam: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      teamService.createTeam(args.data, ctx),
    ),
    updateTeam: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      teamService.updateTeam(args.id, args.data, ctx),
    ),
    deleteTeam: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      teamService.deleteTeam(args.id, ctx),
    ),

    createPlayer: withPolicy([PolicyName.MANAGER, PolicyName.SEASON_ACCESS], (_p, args, ctx) =>
      playerService.createPlayer(args.data, ctx),
    ),
    // TODO: Allow MANAGER with season scope once withPolicy supports resolving scope from resource ID
    updatePlayer: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      playerService.updatePlayer(args.id, args.data, ctx),
    ),
    deletePlayer: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      playerService.deletePlayer(args.id, ctx),
    ),

    createGame: withPolicy([PolicyName.MANAGER, PolicyName.SEASON_ACCESS], (_p, args, ctx) =>
      gameService.createGame(args.data, ctx),
    ),
    updateGame: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      gameService.updateGame(args.id, args.data, ctx),
    ),
    deleteGame: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      gameService.deleteGame(args.id, ctx),
    ),

    createGoal: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      goalService.createGoal(args.data, ctx),
    ),
    updateGoal: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      goalService.updateGoal(args.id, args.data, ctx),
    ),
    deleteGoal: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      goalService.deleteGoal(args.id, ctx),
    ),

    createPenalty: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      penaltyService.createPenalty(args.data, ctx),
    ),
    updatePenalty: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      penaltyService.updatePenalty(args.id, args.data, ctx),
    ),
    deletePenalty: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      penaltyService.deletePenalty(args.id, ctx),
    ),

    addPlayerToLineup: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      lineupService.addPlayerToLineup(args.data, ctx),
    ),
    removePlayerFromLineup: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      lineupService.removePlayerFromLineup(args.id, ctx),
    ),
    setGameLineup: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      lineupService.setGameLineup(args.data, ctx),
    ),

    createDraft: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      draftPickService.createDraft(args.data, ctx),
    ),
    createDraftPick: withPolicy([PolicyName.MANAGER, PolicyName.SEASON_ACCESS], (_p, args, ctx) =>
      draftPickService.createDraftPick(args.data, ctx),
    ),
    updateDraftPick: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      draftPickService.updateDraftPick(args.id, args.data, ctx),
    ),
    recordPick: withPolicy(PolicyName.MANAGER_OF_TEAM, (_p, args, ctx) =>
      draftPickService.recordPick(args.teamId, args.playerId, ctx),
    ),
    deleteDraftPick: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      draftPickService.deleteDraftPick(args.id, ctx),
    ),

    register: async (_p, args, ctx) => registrationService.registerForSeason(args.data, ctx),
    acceptRegistrations: withPolicy(PolicyName.ADMIN, (_p, args, ctx) =>
      registrationService.acceptRegistrations(args.seasonId, args.registrationIds, ctx),
    ),

    confirmPlayer: (_p, args, ctx) => playerService.confirmPlayer(args.id, args.confirmed, ctx),

    sendBulkEmail: withPolicy(PolicyName.ADMIN, async (_p, args, ctx) => {
      validate(sendBulkEmailSchema, args.data);
      const { seasonId, recipientEmails, subject, html, text: rawText } = args.data;

      return emailService.sendBulkTemplatedEmail(
        {
          seasonId,
          recipientEmails,
          subject,
          html,
          text: rawText ?? undefined,
          sentById: Option.getOrThrow(ctx.user).id,
        },
        ctx,
      );
    }),
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
    registrations: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      registrationService.getRegistrationsBySeason(parent.id, ctx),
  },
  Team: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamSeason(parent.id, ctx),
    manager: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamManager(parent.id, ctx),
    players: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamPlayers(parent.id, ctx),
    games: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamGames(parent.id, ctx),
    goals: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamGoals(parent.id, ctx),
    goalsAgainst: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamGoalsAgainst(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamPenalties(parent.id, ctx),
    draftPicks: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamDraftPicks(parent.id, ctx),
    wins: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamWins(parent.id, ctx),
    losses: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamLosses(parent.id, ctx),
    ties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamTies(parent.id, ctx),
    points: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      teamService.getTeamPoints(parent.id, ctx),
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
    assists: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerAssists(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerPenalties(parent.id, ctx),
    draftPick: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      playerService.getPlayerDraftPick(parent.id, ctx),
    lineups: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      lineupService.getLineupsByPlayer(parent.id, ctx),
  },
  Game: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameSeason(parent.id, ctx),
    homeTeam: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameHomeTeam(parent.id, ctx),
    homeTeamGoals: (
      parent: { id: string; homeTeamId: string | null },
      _args: unknown,
      ctx: GraphQLContext,
    ) => gameService.getGameHomeTeamGoals(parent.id, parent.homeTeamId, ctx),
    awayTeam: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameAwayTeam(parent.id, ctx),
    awayTeamGoals: (
      parent: { id: string; awayTeamId: string | null },
      _args: unknown,
      ctx: GraphQLContext,
    ) => gameService.getGameAwayTeamGoals(parent.id, parent.awayTeamId, ctx),
    goals: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGameGoals(parent.id, ctx),
    penalties: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      gameService.getGamePenalties(parent.id, ctx),
    lineups: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      lineupService.getLineupsByGame(parent.id, ctx),
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
  Lineup: {
    game: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      lineupService.getLineupGame(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      lineupService.getLineupTeam(parent.id, ctx),
    player: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      lineupService.getLineupPlayer(parent.id, ctx),
  },
  DraftPick: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickSeason(parent.id, ctx),
    team: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickTeam(parent.id, ctx),
    player: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      draftPickService.getDraftPickPlayer(parent.id, ctx),
  },
  EmailSend: {
    recipients: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      emailSendService.getEmailSendRecipients(parent.id, ctx),
  },
  AuditLog: {
    metadata: (parent: { metadata?: JsonValue }) =>
      parent.metadata != null ? JSON.stringify(parent.metadata) : null,
  },
  Registration: {
    season: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) =>
      registrationService.getRegistrationSeason(parent.id, ctx),
  },
};
