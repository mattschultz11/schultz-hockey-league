import { Option, pipe } from "effect";

import type { SeasonCreateInput, SeasonUpdateInput } from "@/graphql/generated";
import type { Prisma, Season } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { cleanInput, generateSlug, maybeGet } from "./modelServiceUtils";

export function getSeasonsByLeague(leagueId: string, ctx: ServerContext) {
  return ctx.prisma.season.findMany({ where: { leagueId }, orderBy: { startDate: "desc" } });
}

export function getSeasonById(id: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id } });
}

export function maybeGetSeasonById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.season.findUnique({ where: { id } }), id, ctx);
}

export function getSeasonBySlug(leagueId: string, slug: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { leagueId_slug: { leagueId, slug } } });
}

export function maybeGetSeasonBySlug(
  leagueId: string,
  slug: string | null | undefined,
  ctx: ServerContext,
) {
  return maybeGet(
    (slug) => ctx.prisma.season.findUnique({ where: { leagueId_slug: { leagueId, slug } } }),
    slug,
    ctx,
  );
}

export async function createSeason(data: SeasonCreateInput, ctx: ServerContext) {
  const slug = generateSlug(data.name);
  const seasonWithSlug = await maybeGetSeasonBySlug(data.leagueId, slug, ctx);

  validateSeason("", seasonWithSlug);

  return ctx.prisma.season.create({ data: { ...cleanInput(data), slug } });
}

export async function updateSeason(id: string, data: SeasonUpdateInput, ctx: ServerContext) {
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

export function deleteSeason(id: string, ctx: ServerContext) {
  return ctx.prisma.season.delete({ where: { id } });
}

export function getSeasonLeague(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).league();
}

export function getSeasonPlayers(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.season
    .findUniqueOrThrow({ where: { id: seasonId } })
    .players({ orderBy: { draftPick: { overall: "asc" } } });
}

export function getSeasonTeams(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).teams();
}

export function getSeasonGames(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).games();
}

export function getSeasonDraft(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.season.findUniqueOrThrow({ where: { id: seasonId } }).draft();
}
