import { Option } from "effect";

import type { GoalCreateInput, GoalUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Lineup, Prisma } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { goalCreateSchema, goalUpdateSchema } from "../validation/schemas";
import { getLineupEntry } from "./lineupService";
import { cleanInput, maybeGet, validate } from "./modelServiceUtils";

export function getGoalsBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.goal.findMany({ where: { game: { seasonId } } });
}

export async function getGoalById(id: string, ctx: ServerContext) {
  const goal = await ctx.prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new NotFoundError("Goal", id);
  return goal;
}

export async function createGoal(data: GoalCreateInput, ctx: ServerContext) {
  validate(goalCreateSchema, data);
  const { gameId, teamId, scorerId, primaryAssistId, secondaryAssistId } = data;

  const scorer = await getLineupEntry(gameId, scorerId, ctx);
  const primaryAssist = await maybeGet((id) => getLineupEntry(gameId, id, ctx), primaryAssistId);
  const secondaryAssist = await maybeGet(
    (id) => getLineupEntry(gameId, id, ctx),
    secondaryAssistId,
  );

  validateGoal(teamId, scorer, primaryAssist, secondaryAssist);

  return ctx.prisma.goal.create({ data: cleanInput(data) });
}

export async function updateGoal(id: string, data: GoalUpdateInput, ctx: ServerContext) {
  validate(goalUpdateSchema, data);
  const payload: GoalUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["period", "time", "strength", "teamId", "scorerId"] as const);

  const goal = await getGoalById(id, ctx);

  const gameId = goal.gameId;
  const teamId = payload.teamId ?? goal.teamId;
  const scorerId = payload.scorerId ?? goal.scorerId;
  const primaryAssistId = payload.primaryAssistId ?? goal.primaryAssistId;
  const secondaryAssistId = payload.secondaryAssistId ?? goal.secondaryAssistId;

  const scorer = await getLineupEntry(gameId, scorerId, ctx);
  const primaryAssistant = await maybeGet((id) => getLineupEntry(gameId, id, ctx), primaryAssistId);
  const secondaryAssistant = await maybeGet(
    (id) => getLineupEntry(gameId, id, ctx),
    secondaryAssistId,
  );

  validateGoal(teamId, scorer, primaryAssistant, secondaryAssistant);

  return ctx.prisma.goal.update({
    where: { id },
    data: payload as Prisma.GoalUncheckedUpdateInput,
  });
}

function validateGoal(
  teamId: string,
  scorer: Lineup,
  primaryAssistant: Option.Option<Lineup>,
  secondaryAssistant: Option.Option<Lineup>,
) {
  invariant(scorer.teamId === teamId, "Scorer must be in the lineup for this team");

  Option.match(primaryAssistant, {
    onSome: (primaryAssistant) => {
      invariant(
        primaryAssistant.teamId === teamId,
        "Primary assistant must be in the lineup for this team",
      );
      invariant(
        primaryAssistant.playerId !== scorer.playerId,
        "Primary assistant cannot be the scorer",
      );

      Option.map(secondaryAssistant, (secondaryAssistant) => {
        invariant(
          secondaryAssistant.teamId === teamId,
          "Secondary assistant must be in the lineup for this team",
        );
        invariant(
          secondaryAssistant.playerId !== scorer.playerId,
          "Secondary assistant cannot be the scorer",
        );
        invariant(
          secondaryAssistant.playerId !== primaryAssistant?.playerId,
          "Secondary assistant cannot be the primary assistant",
        );
      });
    },
    onNone: () =>
      invariant(
        Option.isNone(secondaryAssistant),
        "Cannot have secondary assistant without primary assistant",
      ),
  });
}

export function deleteGoal(id: string, ctx: ServerContext) {
  return ctx.prisma.goal.delete({ where: { id } });
}

export async function getGoalGame(goalId: string, ctx: ServerContext) {
  const game = await ctx.prisma.goal.findUnique({ where: { id: goalId } })?.game();
  if (!game) throw new NotFoundError("Goal", goalId);
  return game;
}

export async function getGoalTeam(goalId: string, ctx: ServerContext) {
  const team = await ctx.prisma.goal.findUnique({ where: { id: goalId } })?.team();
  if (!team) throw new NotFoundError("Goal", goalId);
  return team;
}

export async function getGoalScorer(goalId: string, ctx: ServerContext) {
  const scorer = await ctx.prisma.goal.findUnique({ where: { id: goalId } })?.scorer();
  if (!scorer) throw new NotFoundError("Goal", goalId);
  return scorer;
}

export async function getGoalPrimaryAssist(goalId: string, ctx: ServerContext) {
  return (await ctx.prisma.goal.findUnique({ where: { id: goalId } })?.primaryAssist()) ?? null;
}

export async function getGoalSecondaryAssist(goalId: string, ctx: ServerContext) {
  return (await ctx.prisma.goal.findUnique({ where: { id: goalId } })?.secondaryAssist()) ?? null;
}
