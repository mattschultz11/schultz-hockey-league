import { Option } from "effect";

import type { GameCreateInput, GameUpdateInput } from "@/graphql/generated";
import type { Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { cleanInput, maybeGet } from "./modelServiceUtils";
import { maybeGetTeamById } from "./teamService";

export function getGamesBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.game.findMany({ where: { seasonId }, orderBy: { date: "asc", time: "asc" } });
}

export function getGameById(id: string, ctx: ServerContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id } });
}

export function maybeGetGameById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.game.findUnique({ where: { id } }), id, ctx);
}

export async function createGame(data: GameCreateInput, ctx: ServerContext) {
  const { homeTeamId, awayTeamId } = data;

  const homeTeam = await maybeGetTeamById(homeTeamId, ctx);
  const awayTeam = await maybeGetTeamById(awayTeamId, ctx);

  validateGame(data.seasonId, homeTeam, awayTeam);

  return ctx.prisma.game.create({ data: cleanInput(data) });
}

export async function updateGame(id: string, data: GameUpdateInput, ctx: ServerContext) {
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

export function getGameSeason(gameId: string, ctx: ServerContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).season();
}

export function getGameHomeTeam(gameId: string, ctx: ServerContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).homeTeam();
}

export function getGameAwayTeam(gameId: string, ctx: ServerContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).awayTeam();
}

export function getGameGoals(gameId: string, ctx: ServerContext) {
  return ctx.prisma.game
    .findUniqueOrThrow({ where: { id: gameId } })
    .goals({ orderBy: { period: "asc", time: "asc" } });
}

export function getGamePenalties(gameId: string, ctx: ServerContext) {
  return ctx.prisma.game
    .findUniqueOrThrow({ where: { id: gameId } })
    .penalties({ orderBy: { period: "asc", time: "asc" } });
}

export async function getGameHomeTeamGoals(gameId: string, ctx: ServerContext) {
  const game = ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } });
  const homeTeamId = Option.fromNullable((await game).homeTeamId);

  return game.goals({
    where: { teamId: Option.getOrUndefined(homeTeamId) },
  });
}

export async function getGameAwayTeamGoals(gameId: string, ctx: ServerContext) {
  const game = ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } });
  const awayTeamId = Option.fromNullable((await game).awayTeamId);

  return game.goals({
    where: { teamId: Option.getOrUndefined(awayTeamId) },
  });
}
