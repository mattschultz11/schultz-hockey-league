import { Option, pipe } from "effect";

import type { LeagueCreateInput, LeagueUpdateInput } from "@/graphql/generated";
import type { League, Prisma } from "@/lib/prisma";

import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, generateSlug, invariant, maybeGet } from "./utils";

export function getLeagues(ctx: ServiceContext) {
  return ctx.prisma.league.findMany({ orderBy: { skillLevel: "asc" } });
}

export function getLeagueById(id: string, ctx: ServiceContext) {
  return ctx.prisma.league.findUniqueOrThrow({ where: { id } });
}

export function maybeGetLeagueById(id: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((id) => ctx.prisma.league.findUnique({ where: { id } }), id, ctx);
}

export function getLeagueBySlug(slug: string, ctx: ServiceContext) {
  return ctx.prisma.league.findUniqueOrThrow({ where: { slug } });
}

export function maybeGetLeagueBySlug(slug: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((slug) => ctx.prisma.league.findUnique({ where: { slug } }), slug, ctx);
}

export async function createLeague(data: LeagueCreateInput, ctx: ServiceContext) {
  const slug = generateSlug(data.name);
  const leagueWithSlug = await maybeGetLeagueBySlug(slug, ctx);

  validateLeague("", leagueWithSlug);

  return ctx.prisma.league.create({ data: { ...cleanInput(data), slug } });
}

export async function updateLeague(id: string, _data: LeagueUpdateInput, ctx: ServiceContext) {
  const payload: LeagueUpdateInput = cleanInput(_data);
  assertNonNullableFields(payload, ["name"] as const);

  const existingLeague = await getLeagueById(id, ctx);
  const slug = generateSlug(payload.name ?? existingLeague.name);
  const leagueWithSlug = await maybeGetLeagueBySlug(slug, ctx);

  validateLeague(existingLeague.id, leagueWithSlug);

  return ctx.prisma.league.update({
    where: { id },
    data: { ...payload, slug } as Prisma.LeagueUncheckedUpdateInput,
  });
}

function validateLeague(id: string, leagueWithSlug: Option.Option<League>) {
  pipe(
    leagueWithSlug,
    Option.map((leagueWithSlug) => leagueWithSlug.id === id),
    Option.map((isSameLeague) => invariant(isSameLeague, "League with this name already exists")),
  );
}

export function deleteLeague(id: string, ctx: ServiceContext) {
  return ctx.prisma.league.delete({ where: { id } });
}

export function getLeagueSeasons(leagueId: string, ctx: ServiceContext) {
  return ctx.prisma.league
    .findUniqueOrThrow({ where: { id: leagueId } })
    .seasons({ orderBy: { startDate: "desc" } });
}
