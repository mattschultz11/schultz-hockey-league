import { Option, pipe } from "effect";

import type { TeamCreateInput, TeamUpdateInput } from "@/graphql/generated";
import { type Player, type Prisma, Result, type Team } from "@/lib/prisma";

import { maybeGetPlayerById } from "./playerService";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, generateSlug, invariant, maybeGet } from "./utils";

export function getTeamsBySeason(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findMany({ where: { seasonId } });
}

export function getTeamById(id: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id } });
}

export function maybeGetTeamById(id: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((id) => ctx.prisma.team.findUnique({ where: { id } }), id, ctx);
}

export function getTeamBySlug(seasonId: string, slug: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { seasonId_slug: { seasonId, slug } } });
}

export function maybeGetTeamBySlug(
  seasonId: string,
  slug: string | null | undefined,
  ctx: ServiceContext,
) {
  return maybeGet(
    (slug) => ctx.prisma.team.findUnique({ where: { seasonId_slug: { seasonId, slug } } }),
    slug,
    ctx,
  );
}

export async function createTeam(data: TeamCreateInput, ctx: ServiceContext) {
  const slug = generateSlug(data.name);
  const teamWithSlug = await maybeGetTeamBySlug(data.seasonId, slug, ctx);
  const manager = await maybeGetPlayerById(data.managerId, ctx);

  validateTeam(data.seasonId, "", teamWithSlug, manager);

  return ctx.prisma.team.create({ data: { ...cleanInput(data), slug } });
}

export async function updateTeam(id: string, data: TeamUpdateInput, ctx: ServiceContext) {
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

export function deleteTeam(id: string, ctx: ServiceContext) {
  return ctx.prisma.team.delete({ where: { id } });
}

export function getTeamSeason(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).season();
}

export function getTeamManager(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).manager();
}

export function getTeamPlayers(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team
    .findUniqueOrThrow({ where: { id: teamId } })
    .players({ orderBy: { number: "asc" } });
}

export async function getTeamGames(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.game.findMany({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    orderBy: { date: "asc", time: "asc" },
  });
}

export function getTeamGoals(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).goals();
}

export function getTeamPenalties(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).penalties();
}

export function getTeamDraftPicks(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).draftPicks();
}
export async function getTeamWins(id: string, ctx: ServiceContext) {
  return (await getTeamGames(id, ctx)).filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.WIN) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.WIN),
  );
}

export async function getTeamLosses(id: string, ctx: ServiceContext) {
  return (await getTeamGames(id, ctx)).filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.LOSS) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.LOSS),
  );
}

export async function getTeamTies(id: string, ctx: ServiceContext) {
  return (await getTeamGames(id, ctx)).filter(
    (game) =>
      (game.homeTeamId === id && game.homeTeamResult === Result.TIE) ||
      (game.awayTeamId === id && game.awayTeamResult === Result.TIE),
  );
}

export async function getTeamPoints(id: string, ctx: ServiceContext) {
  return (await getTeamGames(id, ctx))
    .map((game) => (game.homeTeamId === id ? game.homeTeamPoints : game.awayTeamPoints) ?? 0)
    .reduce((acc, points) => acc + points, 0);
}
