import type { Prisma } from "@prisma/client";

import type { GoalCreateInput, GoalUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";

export function getGoals(ctx: ServiceContext) {
  return ctx.prisma.goal.findMany();
}

export function getGoalById(id: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUnique({ where: { id } });
}

export function createGoal(data: GoalCreateInput, ctx: ServiceContext) {
  return ctx.prisma.goal.create({ data: cleanInput(data) });
}

export function updateGoal(id: string, data: GoalUpdateInput, ctx: ServiceContext) {
  const payload: GoalUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["period", "time", "strength", "teamId", "scorerId"] as const);

  return ctx.prisma.goal.update({
    where: { id },
    data: payload as Prisma.GoalUncheckedUpdateInput,
  });
}

export function deleteGoal(id: string, ctx: ServiceContext) {
  return ctx.prisma.goal.delete({ where: { id } });
}

export function getGoalGame(goalId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id: goalId } }).game();
}

export function getGoalTeam(goalId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id: goalId } }).team();
}

export function getGoalScorer(goalId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id: goalId } }).scorer();
}

export function getGoalPrimaryAssist(goalId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id: goalId } }).primaryAssist();
}

export function getGoalSecondaryAssist(goalId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id: goalId } }).secondaryAssist();
}
