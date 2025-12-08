import { Option } from "effect";

import type { PlayerCreateInput, PlayerUpdateInput } from "@/graphql/generated";
import type { Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { invariant } from "@/utils/assertionUtils";

import { cleanInput, maybeGet } from "./modelServiceUtils";
import { maybeGetTeamById } from "./teamService";

export function getPlayersBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.player.findMany({ where: { seasonId } });
}

export function getPlayerById(id: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id } });
}

export function maybeGetPlayerById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.player.findUnique({ where: { id } }), id, ctx);
}

export async function createPlayer(data: PlayerCreateInput, ctx: ServerContext) {
  const team = await maybeGetTeamById(data.teamId, ctx);

  validatePlayerTeam(data.seasonId, team);

  return ctx.prisma.player.create({ data: cleanInput(data) });
}

export async function updatePlayer(id: string, data: PlayerUpdateInput, ctx: ServerContext) {
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

export function deletePlayer(id: string, ctx: ServerContext) {
  return ctx.prisma.player.delete({ where: { id } });
}

export function getPlayerUser(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).user();
}

export function getPlayerSeason(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).season();
}

export function getPlayerManagedTeam(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).managedTeam();
}

export function getPlayerTeam(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).team();
}

export function getPlayerGoals(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).goals();
}

export async function getPlayerAssists(playerId: string, ctx: ServerContext) {
  const player = await ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  return ctx.prisma.goal.findMany({
    where: { OR: [{ primaryAssistId: player.id }, { secondaryAssistId: player.id }] },
  });
}

export function getPlayerPenalties(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).penalties();
}

export function getPlayerDraftPick(playerId: string, ctx: ServerContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).draftPick();
}
