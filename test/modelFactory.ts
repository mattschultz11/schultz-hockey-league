import {
  rand,
  randBoolean,
  randCity,
  randCompanyName,
  randEmail,
  randFirstName,
  randFutureDate,
  randIceHockeyTeam,
  randLastName,
  randNumber,
  randPastDate,
  randPhoneNumber,
  randSentence,
  randUuid,
} from "@ngneat/falso";
import { Predicate } from "effect";

import type {
  DraftPick,
  Game,
  Goal,
  League,
  Penalty,
  Player,
  Season,
  Team,
  User,
} from "@/graphql/generated";
import { generateSlug } from "@/service/utils";

import prisma, {
  GloveHand,
  Handedness,
  PenaltyCategory,
  PenaltyType,
  Position,
  Role,
  Strength,
} from "./lib/prisma";

export type UserModel = Omit<User, "seasons">;

export function makeUser(
  user: Partial<
    Pick<
      UserModel,
      | "email"
      | "phone"
      | "firstName"
      | "lastName"
      | "birthday"
      | "handedness"
      | "gloveHand"
      | "role"
      | "archivedAt"
    >
  > = {},
): UserModel {
  const {
    email = randEmail(),
    phone = randPhoneNumber(),
    firstName = randFirstName(),
    lastName = randLastName(),
    birthday = randPastDate({ years: randNumber({ min: 21, max: 60 }) }),
    handedness = rand([Handedness.LEFT, Handedness.RIGHT] as const),
    gloveHand = rand([GloveHand.LEFT, GloveHand.RIGHT] as const),
    role = rand([Role.PLAYER, Role.MANAGER, Role.ADMIN] as const),
    archivedAt = null,
  } = user;

  return {
    id: randUuid(),
    email,
    phone,
    firstName,
    lastName,
    birthday,
    handedness,
    gloveHand,
    role,
    archivedAt,
  };
}

export async function insertUser(overrides: Partial<UserModel> = {}): Promise<UserModel> {
  const user = makeUser(overrides);

  return await prisma.user.create({
    data: user,
  });
}

export type LeagueModel = Omit<League, "seasons">;

export function makeLeague(
  league: Partial<Pick<LeagueModel, "id" | "name" | "description" | "skillLevel">> = {},
): LeagueModel {
  const {
    id = randUuid(),
    name = randCompanyName(),
    description = randSentence(),
    skillLevel = rand(["beginner", "intermediate", "advanced"] as const),
  } = league;

  return {
    id,
    slug: generateSlug(name),
    name: name,
    description: description,
    skillLevel: skillLevel,
  };
}

export async function insertLeague(overrides: Partial<LeagueModel> = {}): Promise<LeagueModel> {
  const league = makeLeague(overrides);

  return await prisma.league.create({
    data: league,
  });
}

export type SeasonModel = Omit<Season, "players" | "teams" | "games" | "draft" | "league">;

export function makeSeason(
  season: Partial<
    Pick<
      SeasonModel,
      | "id"
      | "name"
      | "startDate"
      | "endDate"
      | "sundays"
      | "mondays"
      | "tuesdays"
      | "wednesdays"
      | "thursdays"
      | "fridays"
      | "saturdays"
      | "leagueId"
    >
  > = {},
): SeasonModel {
  const {
    id = randUuid(),
    leagueId = randUuid(),
    name = randCompanyName(),
    startDate = randPastDate({ years: 1 }),
    endDate = randFutureDate({ years: 1 }),
    sundays = randBoolean(),
    mondays = randBoolean(),
    tuesdays = randBoolean(),
    wednesdays = randBoolean(),
    thursdays = randBoolean(),
    fridays = randBoolean(),
    saturdays = randBoolean(),
  } = season;

  return {
    id,
    slug: generateSlug(name),
    leagueId,
    name,
    startDate,
    endDate,
    sundays,
    mondays,
    tuesdays,
    wednesdays,
    thursdays,
    fridays,
    saturdays,
  };
}

export async function insertSeason(overrides: Partial<SeasonModel> = {}): Promise<SeasonModel> {
  const season = makeSeason(overrides);
  const { leagueId } = season;

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (Predicate.isNullable(league)) {
    await insertLeague({ id: leagueId });
  }

  return await prisma.season.create({
    data: season,
  });
}

export type TeamModel = Omit<
  Team,
  | "season"
  | "manager"
  | "players"
  | "games"
  | "wins"
  | "losses"
  | "ties"
  | "points"
  | "goals"
  | "penalties"
  | "draftPicks"
>;

export function makeTeam(
  team: Partial<Pick<TeamModel, "id" | "name" | "managerId" | "seasonId">> = {},
): TeamModel {
  const {
    id = randUuid(),
    seasonId = randUuid(),
    name = randIceHockeyTeam(),
    managerId = null,
  } = team;

  return {
    id,
    slug: generateSlug(name),
    seasonId,
    name,
    managerId,
  };
}

export async function insertTeam(overrides: Partial<TeamModel> = {}): Promise<TeamModel> {
  const team = makeTeam(overrides);
  const { seasonId, managerId } = team;

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (Predicate.isNullable(season)) {
    await insertSeason({ id: seasonId });
  }

  if (Predicate.isNotNullable(managerId)) {
    const manager = await prisma.player.findUnique({ where: { id: managerId } });
    if (Predicate.isNullable(manager)) {
      await insertPlayer({ id: managerId });
    }
  }

  return await prisma.team.create({
    data: team,
  });
}

export type PlayerModel = Omit<
  Player,
  "user" | "season" | "team" | "managedTeam" | "goals" | "assists" | "penalties" | "draftPick"
>;

export function makePlayer(
  player: Partial<
    Pick<
      PlayerModel,
      | "id"
      | "position"
      | "number"
      | "playerRating"
      | "goalieRating"
      | "lockerRating"
      | "registrationNumber"
      | "userId"
      | "seasonId"
      | "teamId"
    >
  > = {},
): PlayerModel {
  const {
    id = randUuid(),
    userId = randUuid(),
    seasonId = randUuid(),
    position = rand([Position.G, Position.D, Position.D_F, Position.F, Position.F_D] as const),
    number = randNumber({ min: 1, max: 99 }),
    playerRating = randNumber({ min: 1, max: 5 }),
    goalieRating = randNumber({ min: 1, max: 5 }),
    lockerRating = randNumber({ min: 1, max: 5 }),
    registrationNumber = randUuid(),
    teamId = null,
  } = player;

  const playerModel = {
    id,
    userId,
    seasonId,
    teamId,
    position,
    number: number,
    playerRating,
    goalieRating,
    lockerRating,
    registrationNumber,
  };

  return playerModel;
}

export async function insertPlayer(overrides: Partial<PlayerModel> = {}): Promise<PlayerModel> {
  const resolvedSeason =
    overrides.seasonId !== undefined ? { id: overrides.seasonId } : await insertSeason();
  const resolvedUser =
    overrides.userId !== undefined ? { id: overrides.userId } : await insertUser();
  const resolvedTeamId = overrides.teamId ?? null;

  // Ensure referenced records exist when ids are provided explicitly.
  const existingSeason = await prisma.season.findUnique({
    where: { id: resolvedSeason.id },
  });
  if (Predicate.isNullable(existingSeason)) {
    await insertSeason({ id: resolvedSeason.id });
  }

  const existingUser = await prisma.user.findUnique({ where: { id: resolvedUser.id } });
  if (Predicate.isNullable(existingUser)) {
    await insertUser({ id: resolvedUser.id });
  }

  if (Predicate.isNotNullable(resolvedTeamId)) {
    const existingTeam = await prisma.team.findUnique({ where: { id: resolvedTeamId } });
    if (Predicate.isNullable(existingTeam)) {
      await insertTeam({ id: resolvedTeamId, seasonId: resolvedSeason.id });
    }
  }

  const player = makePlayer({
    ...overrides,
    seasonId: resolvedSeason.id,
    userId: resolvedUser.id,
    teamId: resolvedTeamId,
  });

  return await prisma.player.create({
    data: player,
  });
}

export type GameModel = Omit<
  Game,
  "season" | "homeTeam" | "awayTeam" | "goals" | "penalties" | "homeTeamGoals" | "awayTeamGoals"
>;

export function makeGame(
  game: Partial<
    Pick<
      GameModel,
      "round" | "date" | "time" | "location" | "seasonId" | "homeTeamId" | "awayTeamId"
    >
  > = {},
): GameModel {
  const {
    seasonId = randUuid(),
    round = randNumber({ min: 1, max: 10 }),
    date = randPastDate(),
    time = setRandomTime(date),
    location = randCity(),
    homeTeamId = null,
    awayTeamId = null,
  } = game;

  return {
    id: randUuid(),
    seasonId,
    round,
    date,
    time,
    location,
    homeTeamId,
    awayTeamId,
  };
}

function setRandomTime(date: Date | string): Date {
  const newDate = new Date(date);
  newDate.setHours(randNumber({ min: 0, max: 23 }), randNumber({ min: 0, max: 59 }), 0, 0);

  return newDate;
}

export async function insertGame(overrides: Partial<GameModel> = {}): Promise<GameModel> {
  const game = makeGame(overrides);
  const { seasonId, homeTeamId, awayTeamId } = game;

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (Predicate.isNullable(season)) {
    await insertSeason({ id: seasonId });
  }

  if (Predicate.isNotNullable(homeTeamId)) {
    const homeTeam = await prisma.team.findUnique({ where: { id: homeTeamId } });
    if (Predicate.isNullable(homeTeam)) {
      await insertTeam({ id: homeTeamId, seasonId });
    }
  }

  if (Predicate.isNotNullable(awayTeamId)) {
    const awayTeam = await prisma.team.findUnique({ where: { id: awayTeamId } });
    if (Predicate.isNullable(awayTeam)) {
      await insertTeam({ id: awayTeamId, seasonId });
    }
  }

  return await prisma.game.create({
    data: game,
  });
}

export type GoalModel = Omit<
  Goal,
  "game" | "team" | "scorer" | "primaryAssist" | "secondaryAssist"
>;

export function makeGoal(
  goal: Partial<
    Pick<
      GoalModel,
      | "period"
      | "time"
      | "strength"
      | "gameId"
      | "teamId"
      | "scorerId"
      | "primaryAssistId"
      | "secondaryAssistId"
    >
  > = {},
): GoalModel {
  const {
    gameId = randUuid(),
    teamId = randUuid(),
    scorerId = randUuid(),
    primaryAssistId = null,
    secondaryAssistId = null,
  } = goal;

  return {
    id: randUuid(),
    gameId,
    period: randNumber({ min: 1, max: 3 }),
    time: randNumber({ min: 1, max: 100 }),
    strength: rand([Strength.EVEN, Strength.POWERPLAY, Strength.SHORTHANDED] as const),
    teamId,
    scorerId,
    primaryAssistId,
    secondaryAssistId,
  };
}

export async function insertGoal(overrides: Partial<GoalModel> = {}): Promise<GoalModel> {
  const goal = makeGoal(overrides);
  const { gameId, teamId, scorerId, primaryAssistId, secondaryAssistId } = goal;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (Predicate.isNullable(game)) {
    await insertGame({ id: gameId });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (Predicate.isNullable(team)) {
    await insertTeam({ id: teamId });
  }

  const scorer = await prisma.player.findUnique({ where: { id: scorerId } });
  if (Predicate.isNullable(scorer)) {
    await insertPlayer({ id: scorerId });
  }

  if (Predicate.isNotNullable(primaryAssistId)) {
    const primaryAssist = await prisma.player.findUnique({
      where: { id: primaryAssistId },
    });
    if (Predicate.isNullable(primaryAssist)) {
      await insertPlayer({ id: primaryAssistId });
    }
  }

  if (Predicate.isNotNullable(secondaryAssistId)) {
    const secondaryAssist = await prisma.player.findUnique({
      where: { id: secondaryAssistId },
    });
    if (Predicate.isNullable(secondaryAssist)) {
      await insertPlayer({ id: secondaryAssistId });
    }
  }

  return await prisma.goal.create({
    data: goal,
  });
}

export type PenaltyModel = Omit<Penalty, "game" | "team" | "player">;

export function makePenalty(
  penalty: Partial<
    Pick<
      PenaltyModel,
      "category" | "type" | "minutes" | "period" | "time" | "gameId" | "teamId" | "playerId"
    >
  > = {},
): PenaltyModel {
  const {
    gameId = randUuid(),
    teamId = randUuid(),
    playerId = randUuid(),
    period = randNumber({ min: 1, max: 3 }),
    time = randNumber({ min: 1, max: 100 }),
    category = PenaltyCategory.MINOR,
    type = rand([
      PenaltyType.HIGH_STICKING,
      PenaltyType.HOLDING,
      PenaltyType.HOOKING,
      PenaltyType.INTERFERENCE,
      PenaltyType.SLASHING,
      PenaltyType.TRIPPING,
    ] as const),
    minutes = 2,
  } = penalty;

  return {
    id: randUuid(),
    gameId,
    period,
    time,
    teamId,
    playerId,
    category,
    type,
    minutes,
  };
}

export async function insertPenalty(overrides: Partial<PenaltyModel> = {}): Promise<PenaltyModel> {
  const penalty = makePenalty(overrides);
  const { gameId, teamId, playerId } = penalty;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (Predicate.isNullable(game)) {
    await insertGame({ id: gameId });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (Predicate.isNullable(team)) {
    await insertTeam({ id: teamId });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (Predicate.isNullable(player)) {
    await insertPlayer({ id: playerId });
  }

  return await prisma.penalty.create({
    data: penalty,
  });
}

export type DraftPickModel = Omit<DraftPick, "season" | "team" | "player">;

export function makeDraftPick(
  draftPick: Partial<
    Pick<DraftPickModel, "id" | "overall" | "round" | "pick" | "seasonId" | "teamId" | "playerId">
  > = {},
): DraftPickModel {
  const {
    id = randUuid(),
    seasonId = randUuid(),
    teamId = randUuid(),
    playerId = randUuid(),
    overall = randNumber({ min: 1, max: 100 }),
    round = randNumber({ min: 1, max: 10 }),
    pick = randNumber({ min: 1, max: 10 }),
  } = draftPick;

  return {
    id,
    seasonId,
    teamId,
    playerId,
    overall,
    round,
    pick,
  };
}

export async function insertDraftPick(
  overrides: Partial<DraftPickModel> = {},
): Promise<DraftPickModel> {
  const draftPick = makeDraftPick(overrides);
  const { seasonId, teamId, playerId } = draftPick;

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (Predicate.isNullable(season)) {
    await insertSeason({ id: seasonId });
  }

  if (Predicate.isNotNullable(teamId)) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (Predicate.isNullable(team)) {
      await insertTeam({ id: teamId });
    }
  }

  if (Predicate.isNotNullable(playerId)) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (Predicate.isNullable(player)) {
      await insertPlayer({ id: playerId });
    }
  }

  return await prisma.draftPick.create({
    data: draftPick,
  });
}
