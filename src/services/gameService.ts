import type { Prisma } from "@prisma/client";

import type { GameCreateInput, GameUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getGames(ctx: ServiceContext) {
  return ctx.prisma.game.findMany();
}

export function getGameById(id: string, ctx: ServiceContext) {
  return ctx.prisma.game.findUnique({ where: { id } });
}

export function createGame(data: GameCreateInput, ctx: ServiceContext) {
  return ctx.prisma.game.create({ data: cleanInput(data) });
}

export function updateGame(id: string, data: GameUpdateInput, ctx: ServiceContext) {
  const payload: GameUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["round", "date", "time", "location", "awayTeamId"] as const);

  return ctx.prisma.game.update({
    where: { id },
    data: payload as Prisma.GameUncheckedUpdateInput,
  });
}

export function deleteGame(id: string, ctx: ServiceContext) {
  return ctx.prisma.game.delete({ where: { id } });
}

export function getGameSeason(gameId: string, ctx: ServiceContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).season();
}

export function getGameHomeTeam(gameId: string, ctx: ServiceContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).homeTeam();
}

export function getGameAwayTeam(gameId: string, ctx: ServiceContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).awayTeam();
}

export function getGameGoals(gameId: string, ctx: ServiceContext) {
  return ctx.prisma.game.findUniqueOrThrow({ where: { id: gameId } }).goals();
}
