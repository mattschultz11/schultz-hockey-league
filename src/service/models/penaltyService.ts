import type { PenaltyCreateInput, PenaltyUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Lineup, Prisma } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { penaltyCreateSchema, penaltyUpdateSchema } from "../validation/schemas";
import { getLineupEntry } from "./lineupService";
import { cleanInput, validate } from "./modelServiceUtils";

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

  const playerLineup = await getLineupEntry(gameId, playerId, ctx);
  validatePenalty(teamId, playerLineup);

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

  const gameId = penalty.gameId;
  const teamId = payload.teamId ?? penalty.teamId;
  const playerId = payload.playerId ?? penalty.playerId;

  const playerLineup = await getLineupEntry(gameId, playerId, ctx);
  validatePenalty(teamId, playerLineup);

  return ctx.prisma.penalty.update({
    where: { id },
    data: payload as Prisma.PenaltyUncheckedUpdateInput,
  });
}

function validatePenalty(teamId: string, playerLineup: Lineup) {
  invariant(playerLineup.teamId === teamId, "Player must be in the lineup for this team");
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
