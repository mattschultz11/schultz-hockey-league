import { Option } from "effect";

import type { GameCreateInput, GameUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { gameCreateSchema, gameUpdateSchema } from "../validation/schemas";
import { cleanInput, maybeGet, validate } from "./modelServiceUtils";
import { maybeGetTeamById } from "./teamService";

export function getGamesBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.game.findMany({
    where: { seasonId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
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

  return ctx.prisma.game.create({ data: cleanInput(data) });
}

export async function updateGame(id: string, data: GameUpdateInput, ctx: ServerContext) {
  validate(gameUpdateSchema, data);
  const payload: GameUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["round", "date", "time", "location", "awayTeamId"] as const);

  const game = await getGameById(id, ctx);
  const { homeTeamId = game.homeTeamId, awayTeamId = game.awayTeamId } = payload;

  const homeTeam = await maybeGetTeamById(homeTeamId, ctx);
  const awayTeam = await maybeGetTeamById(awayTeamId, ctx);

  validateGame(game.seasonId, homeTeam, awayTeam);

  return ctx.prisma.game.update({
    where: { id },
    data: payload as Prisma.GameUncheckedUpdateInput,
  });
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

export function deleteGame(id: string, ctx: ServerContext) {
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
