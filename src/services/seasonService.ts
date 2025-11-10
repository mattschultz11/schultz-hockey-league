import type { Prisma } from "@prisma/client";

import type { SeasonCreateInput, SeasonUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getSeasons(ctx: ServiceContext) {
  return ctx.prisma.season.findMany();
}

export function getSeasonById(id: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUnique({ where: { id } });
}

export function createSeason(data: SeasonCreateInput, ctx: ServiceContext) {
  return ctx.prisma.season.create({ data: cleanInput(data) });
}

export function updateSeason(id: string, data: SeasonUpdateInput, ctx: ServiceContext) {
  const payload: SeasonUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["name", "startDate", "endDate"] as const);

  return ctx.prisma.season.update({
    where: { id },
    data: payload as Prisma.SeasonUncheckedUpdateInput,
  });
}

export function deleteSeason(id: string, ctx: ServiceContext) {
  return ctx.prisma.season.delete({ where: { id } });
}

export function getSeasonLeague(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).league();
}

export function getSeasonPlayers(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).players();
}

export function getSeasonTeams(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).teams();
}

export function getSeasonGames(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).games();
}

export function getSeasonDraft(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).draft();
}
