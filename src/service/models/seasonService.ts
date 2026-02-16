import { Option, pipe } from "effect";

import type { SeasonCreateInput, SeasonUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Prisma, Season } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { seasonCreateSchema, seasonUpdateSchema } from "../validation/schemas";
import { cleanInput, generateSlug, maybeGet, validate } from "./modelServiceUtils";

export function getSeasonsByLeague(leagueId: string, ctx: ServerContext) {
  return ctx.prisma.season.findMany({ where: { leagueId }, orderBy: { startDate: "desc" } });
}

export async function getSeasonById(id: string, ctx: ServerContext) {
  const season = await ctx.prisma.season.findUnique({ where: { id } });
  if (!season) throw new NotFoundError("Season", id);
  return season;
}

export function maybeGetSeasonById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.season.findUnique({ where: { id } }), id, ctx);
}

export async function getSeasonBySlug(leagueId: string, slug: string, ctx: ServerContext) {
  const season = await ctx.prisma.season.findUnique({
    where: { leagueId_slug: { leagueId, slug } },
  });
  if (!season) throw new NotFoundError("Season", slug);
  return season;
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
  validate(seasonCreateSchema, data);
  const slug = generateSlug(data.name);
  const seasonWithSlug = await maybeGetSeasonBySlug(data.leagueId, slug, ctx);

  validateSeason("", seasonWithSlug);

  return ctx.prisma.season.create({ data: { ...cleanInput(data), slug } });
}

export async function updateSeason(id: string, data: SeasonUpdateInput, ctx: ServerContext) {
  validate(seasonUpdateSchema, data);
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

export async function getSeasonLeague(seasonId: string, ctx: ServerContext) {
  const league = await ctx.prisma.season.findUnique({ where: { id: seasonId } })?.league();
  if (!league) throw new NotFoundError("Season", seasonId);
  return league;
}

export async function getSeasonPlayers(seasonId: string, ctx: ServerContext) {
  const players = await ctx.prisma.season
    .findUnique({ where: { id: seasonId } })
    ?.players({ orderBy: { draftPick: { overall: "asc" } } });
  return players ?? [];
}

export async function getSeasonTeams(seasonId: string, ctx: ServerContext) {
  const teams = await ctx.prisma.season.findUnique({ where: { id: seasonId } })?.teams();
  return teams ?? [];
}

export async function getSeasonGames(seasonId: string, ctx: ServerContext) {
  const games = await ctx.prisma.season.findUnique({ where: { id: seasonId } })?.games();
  return games ?? [];
}

export async function getSeasonDraft(seasonId: string, ctx: ServerContext) {
  const draft = await ctx.prisma.season.findUnique({ where: { id: seasonId } })?.draft();
  return draft ?? [];
}
