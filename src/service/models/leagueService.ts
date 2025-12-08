import { Option, pipe } from "effect";

import type { LeagueCreateInput, LeagueUpdateInput } from "@/graphql/generated";
import type { League, Prisma } from "@/service/prisma";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import type { ServerContext } from "../../types";
import { cleanInput, generateSlug, maybeGet } from "./modelServiceUtils";

export function getLeagues(ctx: ServerContext) {
  return ctx.prisma.league.findMany({ orderBy: { skillLevel: "asc" } });
}

export function getLeagueById(id: string, ctx: ServerContext) {
  return ctx.prisma.league.findUniqueOrThrow({ where: { id } });
}

export function maybeGetLeagueById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.league.findUnique({ where: { id } }), id, ctx);
}

export function getLeagueBySlug(slug: string, ctx: ServerContext) {
  return ctx.prisma.league.findUniqueOrThrow({ where: { slug } });
}

export function maybeGetLeagueBySlug(slug: string | null | undefined, ctx: ServerContext) {
  return maybeGet((slug) => ctx.prisma.league.findUnique({ where: { slug } }), slug, ctx);
}

export async function createLeague(data: LeagueCreateInput, ctx: ServerContext) {
  const slug = generateSlug(data.name);
  const leagueWithSlug = await maybeGetLeagueBySlug(slug, ctx);

  validateLeague("", leagueWithSlug);

  return ctx.prisma.league.create({ data: { ...cleanInput(data), slug } });
}

export async function updateLeague(id: string, _data: LeagueUpdateInput, ctx: ServerContext) {
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

export function deleteLeague(id: string, ctx: ServerContext) {
  return ctx.prisma.league.delete({ where: { id } });
}

export function getLeagueSeasons(leagueId: string, ctx: ServerContext) {
  return ctx.prisma.league
    .findUniqueOrThrow({ where: { id: leagueId } })
    .seasons({ orderBy: { startDate: "desc" } });
}
