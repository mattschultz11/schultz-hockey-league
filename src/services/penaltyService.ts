import type { Prisma } from "@prisma/client";

import type { PenaltyCreateInput, PenaltyUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getPenalties(ctx: ServiceContext) {
  return ctx.prisma.penalty.findMany();
}

export function getPenaltyById(id: string, ctx: ServiceContext) {
  return ctx.prisma.penalty.findUnique({ where: { id } });
}

export function createPenalty(data: PenaltyCreateInput, ctx: ServiceContext) {
  return ctx.prisma.penalty.create({ data: cleanInput(data) });
}

export function updatePenalty(id: string, data: PenaltyUpdateInput, ctx: ServiceContext) {
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

  return ctx.prisma.penalty.update({
    where: { id },
    data: payload as Prisma.PenaltyUncheckedUpdateInput,
  });
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
