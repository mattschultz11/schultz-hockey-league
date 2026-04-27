import { Option } from "effect";

import type { GameCreateInput, GameUpdateInput } from "@/graphql/generated";
import { NotFoundError, ValidationError } from "@/service/errors";
import type { Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { gameCreateSchema, gameUpdateSchema } from "../validation/schemas";
import { cleanInput, maybeGet, validate } from "./modelServiceUtils";
import { maybeGetTeamById } from "./teamService";

export function getGamesBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.game.findMany({
    where: { seasonId },
    orderBy: { datetime: "asc" },
  });
}

export async function getGameById(id: string, ctx: ServerContext) {
  const game = await ctx.prisma.game.findUnique({ where: { id } });
  if (!game) throw new NotFoundError("Game", id);
  return game;
}

export function maybeGetGameById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => getGameById(id, ctx), id);
}

export async function createGame(data: GameCreateInput, ctx: ServerContext) {
  validate(gameCreateSchema, data);
  const { homeTeamId, awayTeamId } = data;

  const homeTeam = await maybeGetTeamById(homeTeamId, ctx);
  const awayTeam = await maybeGetTeamById(awayTeamId, ctx);

  validateGame(data.seasonId, homeTeam, awayTeam);
  await validateNoScheduleConflict(
    {
      seasonId: data.seasonId,
      datetime: data.datetime,
      homeTeamId,
      awayTeamId,
    },
    ctx,
  );

  return ctx.prisma.game.create({
    data: { ...cleanInput(data) },
  });
}

export async function updateGame(id: string, data: GameUpdateInput, ctx: ServerContext) {
  validate(gameUpdateSchema, data);
  const payload: GameUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["round", "datetime", "location", "awayTeamId"] as const);

  const game = await getGameById(id, ctx);
  const {
    homeTeamId = game.homeTeamId,
    awayTeamId = game.awayTeamId,
    homeTeamResult = game.homeTeamResult,
    awayTeamResult = game.awayTeamResult,
  } = payload;

  const homeTeam = await maybeGetTeamById(homeTeamId, ctx);
  const awayTeam = await maybeGetTeamById(awayTeamId, ctx);

  validateGame(game.seasonId, homeTeam, awayTeam);
  validateResults(homeTeamResult, awayTeamResult);
  await validateNoScheduleConflict(
    {
      seasonId: game.seasonId,
      datetime: payload.datetime ?? game.datetime,
      homeTeamId,
      awayTeamId,
      excludeGameId: id,
    },
    ctx,
  );

  return ctx.prisma.game.update({
    where: { id },
    data: payload as Prisma.GameUncheckedUpdateInput,
  });
}

function validateResults(
  homeTeamResult: string | null | undefined,
  awayTeamResult: string | null | undefined,
) {
  if (homeTeamResult == null && awayTeamResult == null) return;
  invariant(
    homeTeamResult != null && awayTeamResult != null,
    "Home and away team results must both be set or both be cleared",
  );
  if (homeTeamResult === "TIE") {
    invariant(awayTeamResult === "TIE", "If one team ties, the other must also tie");
  } else if (homeTeamResult === "WIN") {
    invariant(awayTeamResult === "LOSS", "If home team wins, away team must lose");
  } else if (homeTeamResult === "LOSS") {
    invariant(awayTeamResult === "WIN", "If home team loses, away team must win");
  }
}

function validateGame(
  seasonId: string,
  homeTeam: Option.Option<Team>,
  awayTeam: Option.Option<Team>,
) {
  Option.map(homeTeam, (homeTeam) =>
    invariant(homeTeam.seasonId === seasonId, "Home team must be in the same season as the game"),
  );

  Option.map(awayTeam, (awayTeam) =>
    invariant(awayTeam.seasonId === seasonId, "Away team must be in the same season as the game"),
  );

  Option.map(homeTeam, (homeTeam) =>
    Option.map(awayTeam, (awayTeam) =>
      invariant(homeTeam.id !== awayTeam.id, "Home and away teams cannot be the same"),
    ),
  );
}

async function validateNoScheduleConflict(
  params: {
    seasonId: string;
    datetime: Date | string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    excludeGameId?: string;
  },
  ctx: ServerContext,
) {
  const { seasonId, datetime, homeTeamId, awayTeamId, excludeGameId } = params;

  const teamIds = [homeTeamId, awayTeamId].filter((id): id is string => !!id);
  if (teamIds.length === 0) return;

  const conflicts = await ctx.prisma.game.findMany({
    where: {
      seasonId,
      datetime,
      ...(excludeGameId ? { NOT: { id: excludeGameId } } : {}),
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    },
    select: {
      id: true,
      round: true,
      datetime: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    const conflictTeam =
      (conflict.homeTeam && teamIds.includes(conflict.homeTeam.id) ? conflict.homeTeam : null) ??
      (conflict.awayTeam && teamIds.includes(conflict.awayTeam.id) ? conflict.awayTeam : null);
    const teamLabel = conflictTeam ? `'${conflictTeam.name}'` : "Team";
    const when = new Date(conflict.datetime).toISOString().replace("T", " ").slice(0, 16);
    throw new ValidationError(
      `Team ${teamLabel} already plays at ${when} (round ${conflict.round})`,
    );
  }
}

export async function deleteGame(id: string, ctx: ServerContext) {
  await getGameById(id, ctx);

  const [goalCount, penaltyCount, lineupCount] = await Promise.all([
    ctx.prisma.goal.count({ where: { gameId: id } }),
    ctx.prisma.penalty.count({ where: { gameId: id } }),
    ctx.prisma.lineup.count({ where: { gameId: id } }),
  ]);

  if (goalCount + penaltyCount + lineupCount > 0) {
    throw new ValidationError(
      "Cannot delete a game with recorded goals, penalties, or lineups — remove them first",
    );
  }

  return ctx.prisma.game.delete({ where: { id } });
}

export async function getGameSeason(gameId: string, ctx: ServerContext) {
  const season = await ctx.prisma.game.findUnique({ where: { id: gameId } })?.season();
  if (!season) throw new NotFoundError("Game", gameId);
  return season;
}

export async function getGameHomeTeam(gameId: string, ctx: ServerContext) {
  return (await ctx.prisma.game.findUnique({ where: { id: gameId } })?.homeTeam()) ?? null;
}

export async function getGameAwayTeam(gameId: string, ctx: ServerContext) {
  return (await ctx.prisma.game.findUnique({ where: { id: gameId } })?.awayTeam()) ?? null;
}

export async function getGameGoals(gameId: string, ctx: ServerContext) {
  const goals = await ctx.prisma.game
    .findUnique({ where: { id: gameId } })
    ?.goals({ orderBy: [{ period: "asc" }, { time: "asc" }] });
  return goals ?? [];
}

export async function getGamePenalties(gameId: string, ctx: ServerContext) {
  const penalties = await ctx.prisma.game
    .findUnique({ where: { id: gameId } })
    ?.penalties({ orderBy: [{ period: "asc" }, { time: "asc" }] });
  return penalties ?? [];
}

export async function getGameHomeTeamGoals(
  gameId: string,
  homeTeamId: string | null,
  ctx: ServerContext,
) {
  if (!homeTeamId) return [];
  const goals = await ctx.prisma.game
    .findUnique({ where: { id: gameId } })
    ?.goals({ where: { teamId: homeTeamId } });
  return goals ?? [];
}

export async function getGameAwayTeamGoals(
  gameId: string,
  awayTeamId: string | null,
  ctx: ServerContext,
) {
  if (!awayTeamId) return [];
  const goals = await ctx.prisma.game
    .findUnique({ where: { id: gameId } })
    ?.goals({ where: { teamId: awayTeamId } });
  return goals ?? [];
}
