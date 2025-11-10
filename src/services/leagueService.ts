import type { Prisma } from "@prisma/client";

import type { LeagueCreateInput, LeagueUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getLeagues(ctx: ServiceContext) {
  return ctx.prisma.league.findMany();
}

export function getLeagueById(id: string, ctx: ServiceContext) {
  return ctx.prisma.league.findUnique({ where: { id } });
}

export function createLeague(data: LeagueCreateInput, ctx: ServiceContext) {
  return ctx.prisma.league.create({ data: cleanInput(data) });
}

export function updateLeague(id: string, data: LeagueUpdateInput, ctx: ServiceContext) {
  const payload: LeagueUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["name"] as const);

  return ctx.prisma.league.update({
    where: { id },
    data: payload as Prisma.LeagueUncheckedUpdateInput,
  });
}

export function deleteLeague(id: string, ctx: ServiceContext) {
  return ctx.prisma.league.delete({ where: { id } });
}

export function getLeagueSeasons(leagueId: string, ctx: ServiceContext) {
  return ctx.prisma.league.findUniqueOrThrow({ where: { id: leagueId } }).seasons();
}
