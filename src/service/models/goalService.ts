import { Option } from "effect";

import type { GoalCreateInput, GoalUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Game, Player, Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { goalCreateSchema, goalUpdateSchema } from "../validation/schemas";
import { getGameById } from "./gameService";
import { cleanInput, validate } from "./modelServiceUtils";
import { getPlayerById, maybeGetPlayerById } from "./playerService";
import { getTeamById } from "./teamService";

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
  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const scorer = await getPlayerById(scorerId, ctx);
  const primaryAssistant = await maybeGetPlayerById(primaryAssistId, ctx);
  const secondaryAssistant = await maybeGetPlayerById(secondaryAssistId, ctx);

  validateGoal(game, team, scorer, primaryAssistant, secondaryAssistant);

  return ctx.prisma.goal.create({ data: cleanInput(data) });
}

export async function updateGoal(id: string, data: GoalUpdateInput, ctx: ServerContext) {
  validate(goalUpdateSchema, data);
  const payload: GoalUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["period", "time", "strength", "teamId", "scorerId"] as const);

  const goal = await getGoalById(id, ctx);
  const game = await getGameById(goal.gameId, ctx);
  const { teamId, scorerId, primaryAssistId, secondaryAssistId } = payload;

  const team = await getTeamById(teamId ?? goal.teamId, ctx);
  const scorer = await getPlayerById(scorerId ?? goal.scorerId, ctx);
  const primaryAssistant = await maybeGetPlayerById(primaryAssistId ?? goal.primaryAssistId, ctx);
  const secondaryAssistant = await maybeGetPlayerById(
    secondaryAssistId ?? goal.secondaryAssistId,
    ctx,
  );

  validateGoal(game, team, scorer, primaryAssistant, secondaryAssistant);

  return ctx.prisma.goal.update({
    where: { id },
    data: payload as Prisma.GoalUncheckedUpdateInput,
  });
}

function validateGoal(
  game: Game,
  team: Team,
  scorer: Player,
  primaryAssistant: Option.Option<Player>,
  secondaryAssistant: Option.Option<Player>,
) {
  invariant(game.homeTeamId === team.id || game.awayTeamId === team.id, "Team must be in the game");
  invariant(team.id === scorer.teamId, "Scorer must be on the team");

  Option.match(primaryAssistant, {
    onSome: (primaryAssistant) => {
      invariant(primaryAssistant.teamId === team.id, "Primary assistant must be on the team");
      invariant(primaryAssistant.id !== scorer.id, "Primary assistant cannot be the scorer");

      Option.map(secondaryAssistant, (secondaryAssistant) => {
        invariant(secondaryAssistant.teamId === team.id, "Secondary assistant must be on the team");
        invariant(secondaryAssistant.id !== scorer.id, "Secondary assistant cannot be the scorer");
        invariant(
          secondaryAssistant.id !== primaryAssistant?.id,
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
