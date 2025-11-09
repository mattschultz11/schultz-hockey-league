import type { PenaltyCreateInput, PenaltyUpdateInput } from "@/graphql/generated";
import type { Game, Player, Prisma, Team } from "@/lib/prisma";

import { getGameById } from "./gameService";
import { getPlayerById } from "./playerService";
import { getTeamById } from "./teamService";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, invariant } from "./utils";

export function getPenaltiesBySeason(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findMany({ where: { game: { seasonId } } });
}

export function getPenaltyById(id: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findUniqueOrThrow({ where: { id } });
}

export async function createPenalty(data: PenaltyCreateInput, ctx: ServiceContext) {
  const { gameId, teamId, playerId } = data;
  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const player = await getPlayerById(playerId, ctx);

  validatePenalty(game, team, player);

  return ctx.prisma.penalty.create({ data: cleanInput(data) });
}

export async function updatePenalty(id: string, data: PenaltyUpdateInput, ctx: ServiceContext) {
  const payload: PenaltyUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, [
    "period",
    "time",
    "teamId",
    "playerId",
    "category",
    "type",
    "minutes",
  ] as const);

  const penalty = await getPenaltyById(id, ctx);
  const game = await getGameById(penalty.gameId, ctx);
  const team = await getTeamById(payload.teamId ?? penalty.teamId, ctx);
  const player = await getPlayerById(payload.playerId ?? penalty.playerId, ctx);

  validatePenalty(game, team, player);

  return ctx.prisma.penalty.update({
    where: { id },
    data: payload as Prisma.PenaltyUncheckedUpdateInput,
  });
}

function validatePenalty(game: Game, team: Team, player: Player) {
  invariant(game.homeTeamId === team.id || game.awayTeamId === team.id, "Team must be in the game");
  invariant(team.id === player.teamId, "Player must be on the team");
}

export function deletePenalty(id: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.delete({ where: { id } });
}

export function getPenaltyGame(penaltyId: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findUniqueOrThrow({ where: { id: penaltyId } }).game();
}

export function getPenaltyTeam(penaltyId: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findUniqueOrThrow({ where: { id: penaltyId } }).team();
}

export function getPenaltyPlayer(penaltyId: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findUniqueOrThrow({ where: { id: penaltyId } }).player();
}
