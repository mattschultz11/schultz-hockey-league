import type { Prisma } from "@prisma/client";

import type { TeamCreateInput, TeamUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getTeams(ctx: ServiceContext) {
  return ctx.prisma.team.findMany();
}

export function getTeamById(id: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUnique({ where: { id } });
}

export function createTeam(data: TeamCreateInput, ctx: ServiceContext) {
  return ctx.prisma.team.create({ data: cleanInput(data) });
}

export function updateTeam(id: string, data: TeamUpdateInput, ctx: ServiceContext) {
  const payload: TeamUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["name", "managerId"] as const);

  return ctx.prisma.team.update({
    where: { id },
    data: payload as Prisma.TeamUncheckedUpdateInput,
  });
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
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).players();
}

export function getTeamHomeGames(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).homeGames();
}

export function getTeamAwayGames(teamId: string, ctx: ServiceContext) {
  return ctx.prisma.team.findUniqueOrThrow({ where: { id: teamId } }).awayGames();
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
