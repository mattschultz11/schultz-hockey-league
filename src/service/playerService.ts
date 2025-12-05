import { Option } from "effect";

import type { Team } from "@/lib/prisma";

import type { PlayerCreateInput, PlayerUpdateInput } from "../graphql/generated";
import { maybeGetTeamById } from "./teamService";
import type { ServiceContext } from "./types";
import { cleanInput, invariant, maybeGet } from "./utils";

export function getPlayersBySeason(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findMany({ where: { seasonId } });
}

export function getPlayerById(id: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id } });
}

export function maybeGetPlayerById(id: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((id) => ctx.prisma.player.findUnique({ where: { id } }), id, ctx);
}

export async function createPlayer(data: PlayerCreateInput, ctx: ServiceContext) {
  const team = await maybeGetTeamById(data.teamId, ctx);

  validatePlayerTeam(data.seasonId, team);

  return ctx.prisma.player.create({ data: cleanInput(data) });
}

export async function updatePlayer(id: string, data: PlayerUpdateInput, ctx: ServiceContext) {
  const player = await getPlayerById(id, ctx);
  const team = await maybeGetTeamById(data.teamId ?? player.teamId, ctx);

  validatePlayerTeam(player.seasonId, team);

  return ctx.prisma.player.update({
    where: { id },
    data: cleanInput(data),
  });
}

function validatePlayerTeam(seasonId: string, team: Option.Option<Team>) {
  Option.map(team, (team) =>
    invariant(team.seasonId === seasonId, "Team must be in the same season as the player"),
  );
}

export function deletePlayer(id: string, ctx: ServiceContext) {
  return ctx.prisma.player.delete({ where: { id } });
}

export function getPlayerUser(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).user();
}

export function getPlayerSeason(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).season();
}

export function getPlayerManagedTeam(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).managedTeam();
}

export function getPlayerTeam(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).team();
}

export function getPlayerGoals(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).goals();
}

export async function getPlayerAssists(playerId: string, ctx: ServiceContext) {
  const player = await ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  return ctx.prisma.goal.findMany({
    where: { OR: [{ primaryAssistId: player.id }, { secondaryAssistId: player.id }] },
  });
}

export function getPlayerPenalties(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).penalties();
}

export function getPlayerDraftPick(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).draftPick();
}
