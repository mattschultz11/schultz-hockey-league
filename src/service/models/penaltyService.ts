import type { PenaltyCreateInput, PenaltyUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Game, Player, Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { penaltyCreateSchema, penaltyUpdateSchema } from "../validation/schemas";
import { getGameById } from "./gameService";
import { cleanInput, validate } from "./modelServiceUtils";
import { getPlayerById } from "./playerService";
import { getTeamById } from "./teamService";

export function getPenaltiesBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.penalty.findMany({ where: { game: { seasonId } } });
}

export async function getPenaltyById(id: string, ctx: ServerContext) {
  const penalty = await ctx.prisma.penalty.findUnique({ where: { id } });
  if (!penalty) throw new NotFoundError("Penalty", id);
  return penalty;
}

export async function createPenalty(data: PenaltyCreateInput, ctx: ServerContext) {
  validate(penaltyCreateSchema, data);
  const { gameId, teamId, playerId } = data;
  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const player = await getPlayerById(playerId, ctx);

  validatePenalty(game, team, player);

  return ctx.prisma.penalty.create({ data: cleanInput(data) });
}

export async function updatePenalty(id: string, data: PenaltyUpdateInput, ctx: ServerContext) {
  validate(penaltyUpdateSchema, data);
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

export function deletePenalty(id: string, ctx: ServerContext) {
  return ctx.prisma.penalty.delete({ where: { id } });
}

export async function getPenaltyGame(penaltyId: string, ctx: ServerContext) {
  const game = await ctx.prisma.penalty.findUnique({ where: { id: penaltyId } })?.game();
  if (!game) throw new NotFoundError("Penalty", penaltyId);
  return game;
}

export async function getPenaltyTeam(penaltyId: string, ctx: ServerContext) {
  const team = await ctx.prisma.penalty.findUnique({ where: { id: penaltyId } })?.team();
  if (!team) throw new NotFoundError("Penalty", penaltyId);
  return team;
}

export async function getPenaltyPlayer(penaltyId: string, ctx: ServerContext) {
  const player = await ctx.prisma.penalty.findUnique({ where: { id: penaltyId } })?.player();
  if (!player) throw new NotFoundError("Penalty", penaltyId);
  return player;
}
