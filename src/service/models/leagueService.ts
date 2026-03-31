import { Option, pipe } from "effect";

import type { LeagueCreateInput, LeagueUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { League, Prisma } from "@/service/prisma";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import type { ServerContext } from "../../types";
import { leagueCreateSchema, leagueUpdateSchema } from "../validation/schemas";
import { cleanInput, generateSlug, maybeGet, validate } from "./modelServiceUtils";

export function getLeagues(ctx: ServerContext) {
  return ctx.prisma.league.findMany({ orderBy: { skillLevel: "asc" } });
}

export async function getLeagueById(id: string, ctx: ServerContext) {
  const league = await ctx.prisma.league.findUnique({ where: { id } });
  if (!league) throw new NotFoundError("League", id);
  return league;
}

export function maybeGetLeagueById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => getLeagueById(id, ctx), id);
}

export async function getLeagueBySlug(slug: string, ctx: ServerContext) {
  const league = await ctx.prisma.league.findUnique({ where: { slug } });
  if (!league) throw new NotFoundError("League", slug);
  return league;
}

export function maybeGetLeagueBySlug(slug: string | null | undefined, ctx: ServerContext) {
  return maybeGet((slug) => ctx.prisma.league.findUnique({ where: { slug } }), slug);
}

export async function createLeague(data: LeagueCreateInput, ctx: ServerContext) {
  validate(leagueCreateSchema, data);
  const slug = generateSlug(data.name);
  const leagueWithSlug = await maybeGetLeagueBySlug(slug, ctx);

  validateLeague("", leagueWithSlug);

  return ctx.prisma.league.create({ data: { ...cleanInput(data), slug } });
}

export async function updateLeague(id: string, _data: LeagueUpdateInput, ctx: ServerContext) {
  validate(leagueUpdateSchema, _data);
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

export async function getLeagueSeasons(leagueId: string, ctx: ServerContext) {
  const seasons = await ctx.prisma.league
    .findUnique({ where: { id: leagueId } })
    ?.seasons({ orderBy: { startDate: "desc" } });
  return seasons ?? [];
}
