import type { PlayerCreateInput, PlayerUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { cleanInput } from "./utils";

export function getPlayers(ctx: ServiceContext) {
  return ctx.prisma.player.findMany();
}

export function getPlayerById(id: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUnique({ where: { id } });
}

export function createPlayer(data: PlayerCreateInput, ctx: ServiceContext) {
  return ctx.prisma.player.create({ data: cleanInput(data) });
}

export function updatePlayer(id: string, data: PlayerUpdateInput, ctx: ServiceContext) {
  return ctx.prisma.player.update({
    where: { id },
    data: cleanInput(data),
  });
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

export function getPlayerPrimaryAssists(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).primaryAssists();
}

export function getPlayerSecondaryAssists(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).secondaryAssists();
}

export function getPlayerPenalties(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).penalties();
}

export function getPlayerDraftPick(playerId: string, ctx: ServiceContext) {
  return ctx.prisma.player.findUniqueOrThrow({ where: { id: playerId } }).draftPick();
}
