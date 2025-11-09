import { Option, pipe } from "effect";

import type { SeasonCreateInput, SeasonUpdateInput } from "@/graphql/generated";
import type { Prisma, Season } from "@/lib/prisma";

import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, generateSlug, invariant, maybeGet } from "./utils";

export function getSeasonsByLeague(leagueId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findMany({ where: { leagueId }, orderBy: { startDate: "desc" } });
}

export function getSeasonById(id: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id } });
}

export function maybeGetSeasonById(id: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((id) => ctx.prisma.season.findUnique({ where: { id } }), id, ctx);
}

export function getSeasonBySlug(leagueId: string, slug: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { leagueId_slug: { leagueId, slug } } });
}

export function maybeGetSeasonBySlug(
  leagueId: string,
  slug: string | null | undefined,
  ctx: ServiceContext,
) {
  return maybeGet(
    (slug) => ctx.prisma.season.findUnique({ where: { leagueId_slug: { leagueId, slug } } }),
    slug,
    ctx,
  );
}

export async function createSeason(data: SeasonCreateInput, ctx: ServiceContext) {
  const slug = generateSlug(data.name);
  const seasonWithSlug = await maybeGetSeasonBySlug(data.leagueId, slug, ctx);

  validateSeason("", seasonWithSlug);

  return ctx.prisma.season.create({ data: { ...cleanInput(data), slug } });
}

export async function updateSeason(id: string, data: SeasonUpdateInput, ctx: ServiceContext) {
  const payload: SeasonUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["name", "startDate", "endDate"] as const);

  const existingSeason = await getSeasonById(id, ctx);
  const slug = generateSlug(payload.name ?? existingSeason.name);
  const seasonWithSlug = await maybeGetSeasonBySlug(existingSeason.leagueId, slug, ctx);

  validateSeason(existingSeason.id, seasonWithSlug);

  return ctx.prisma.season.update({
    where: { id },
    data: { ...payload, slug } as Prisma.SeasonUncheckedUpdateInput,
  });
}

function validateSeason(seasonId: string, seasonWithSlug: Option.Option<Season>) {
  pipe(
    seasonWithSlug,
    Option.map((seasonWithSlug) => seasonWithSlug.id === seasonId),
    Option.map((isSameSeason) => invariant(isSameSeason, "Season with this name already exists")),
  );
}

export function deleteSeason(id: string, ctx: ServiceContext) {
  return ctx.prisma.season.delete({ where: { id } });
}

export function getSeasonLeague(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).league();
}

export function getSeasonPlayers(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.season
    .findUniqueOrThrow({ where: { id: seasonId } })
    .players({ orderBy: { draftPick: { overall: "asc" } } });
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
