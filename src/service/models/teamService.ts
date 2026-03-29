import { Option, pipe } from "effect";

import type { TeamCreateInput, TeamUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Game, Player, Prisma, Team } from "@/service/prisma";
import { Result } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { teamCreateSchema, teamUpdateSchema } from "../validation/schemas";
import { cleanInput, generateSlug, maybeGet, validate } from "./modelServiceUtils";
import { maybeGetPlayerById } from "./playerService";

export function getTeamsBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.team.findMany({ where: { seasonId } });
}

export async function getTeamById(id: string, ctx: ServerContext) {
  const team = await ctx.prisma.team.findUnique({ where: { id } });
  if (!team) throw new NotFoundError("Team", id);
  return team;
}

export function maybeGetTeamById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.team.findUnique({ where: { id } }), id);
}

export async function getTeamBySlug(seasonId: string, slug: string, ctx: ServerContext) {
  const team = await ctx.prisma.team.findUnique({
    where: { seasonId_slug: { seasonId, slug } },
  });
  if (!team) throw new NotFoundError("Team", slug);
  return team;
}

export function maybeGetTeamBySlug(
  seasonId: string,
  slug: string | null | undefined,
  ctx: ServerContext,
) {
  return maybeGet(
    (slug) => ctx.prisma.team.findUnique({ where: { seasonId_slug: { seasonId, slug } } }),
    slug,
  );
}

export async function createTeam(data: TeamCreateInput, ctx: ServerContext) {
  validate(teamCreateSchema, data);
  const slug = generateSlug(data.name);
  const teamWithSlug = await maybeGetTeamBySlug(data.seasonId, slug, ctx);
  const manager = await maybeGetPlayerById(data.managerId, ctx);

  validateTeam(data.seasonId, "", teamWithSlug, manager);

  return ctx.prisma.team.create({ data: { ...cleanInput(data), slug } });
}

export async function updateTeam(id: string, data: TeamUpdateInput, ctx: ServerContext) {
  validate(teamUpdateSchema, data);
  const payload: TeamUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["name"] as const);

  const existingTeam = await getTeamById(id, ctx);
  const slug = generateSlug(payload.name ?? existingTeam.name);
  const teamWithSlug = await maybeGetTeamBySlug(existingTeam.seasonId, slug, ctx);
  const manager = await maybeGetPlayerById(data.managerId, ctx);

  validateTeam(existingTeam.seasonId, existingTeam.id, teamWithSlug, manager);

  return ctx.prisma.team.update({
    where: { id },
    data: { ...payload, slug } as Prisma.TeamUncheckedUpdateInput,
  });
}

function validateTeam(
  seasonId: string,
  teamId: string,
  teamWithSlug: Option.Option<Team>,
  manager: Option.Option<Player>,
) {
  pipe(
    teamWithSlug,
    Option.map((teamWithSlug) => teamWithSlug.id === teamId),
    Option.map((isSameTeam) => invariant(isSameTeam, "Team with this name already exists")),
  );

  Option.map(manager, (manager) =>
    invariant(manager.seasonId === seasonId, "Manager must be in the same season as the team"),
  );
}

export function deleteTeam(id: string, ctx: ServerContext) {
  return ctx.prisma.team.delete({ where: { id } });
}

export async function getTeamSeason(teamId: string, ctx: ServerContext) {
  const season = await ctx.prisma.team.findUnique({ where: { id: teamId } })?.season();
  if (!season) throw new NotFoundError("Team", teamId);
  return season;
}

export async function getTeamManager(teamId: string, ctx: ServerContext) {
  return (await ctx.prisma.team.findUnique({ where: { id: teamId } })?.manager()) ?? null;
}

export async function getTeamPlayers(teamId: string, ctx: ServerContext) {
  const players = await ctx.prisma.team
    .findUnique({ where: { id: teamId } })
    ?.players({ orderBy: { number: "asc" } });
  return players ?? [];
}

export async function getTeamGames(teamId: string, ctx: ServerContext) {
  return ctx.prisma.game.findMany({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

export async function getTeamGoals(teamId: string, ctx: ServerContext) {
  const goals = await ctx.prisma.team.findUnique({ where: { id: teamId } })?.goals();
  return goals ?? [];
}

export function getTeamGoalsAgainst(teamId: string, ctx: ServerContext) {
  return ctx.prisma.goal.findMany({
    where: {
      teamId: { not: teamId },
      game: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
    },
  });
}

export async function getTeamPenalties(teamId: string, ctx: ServerContext) {
  const penalties = await ctx.prisma.team.findUnique({ where: { id: teamId } })?.penalties();
  return penalties ?? [];
}

export async function getTeamDraftPicks(teamId: string, ctx: ServerContext) {
  const draftPicks = await ctx.prisma.team.findUnique({ where: { id: teamId } })?.draftPicks();
  return draftPicks ?? [];
}

// --- Team stats caching ---

type TeamStats = { wins: Game[]; losses: Game[]; ties: Game[]; points: number };

const teamStatsCache = new WeakMap<ServerContext, Map<string, Promise<TeamStats>>>();

async function computeTeamStats(id: string, ctx: ServerContext): Promise<TeamStats> {
  const games = await getTeamGames(id, ctx);
  const wins = games.filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.WIN) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.WIN),
  );
  const losses = games.filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.LOSS) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.LOSS),
  );
  const ties = games.filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.TIE) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.TIE),
  );
  const points = games
    .map((game) => (game.homeTeamId === id ? game.homeTeamPoints : game.awayTeamPoints) ?? 0)
    .reduce((acc, p) => acc + p, 0);

  return { wins, losses, ties, points };
}

function getTeamStatsOnce(id: string, ctx: ServerContext): Promise<TeamStats> {
  let cache = teamStatsCache.get(ctx);
  if (!cache) {
    cache = new Map();
    teamStatsCache.set(ctx, cache);
  }
  let promise = cache.get(id);
  if (!promise) {
    promise = computeTeamStats(id, ctx);
    cache.set(id, promise);
  }
  return promise;
}

export async function getTeamWins(id: string, ctx: ServerContext) {
  return (await getTeamStatsOnce(id, ctx)).wins;
}

export async function getTeamLosses(id: string, ctx: ServerContext) {
  return (await getTeamStatsOnce(id, ctx)).losses;
}

export async function getTeamTies(id: string, ctx: ServerContext) {
  return (await getTeamStatsOnce(id, ctx)).ties;
}

export async function getTeamPoints(id: string, ctx: ServerContext) {
  return (await getTeamStatsOnce(id, ctx)).points;
}
