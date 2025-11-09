import { Option } from "effect";

import type { GoalCreateInput, GoalUpdateInput } from "@/graphql/generated";
import type { Game, Player, Prisma, Team } from "@/lib/prisma";

import { getGameById } from "./gameService";
import { getPlayerById, maybeGetPlayerById } from "./playerService";
import { getTeamById } from "./teamService";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, invariant } from "./utils";

export function getGoalsBySeason(seasonId: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findMany({ where: { game: { seasonId } } });
}

export function getGoalById(id: string, ctx: ServiceContext) {
  return ctx.prisma.goal.findUniqueOrThrow({ where: { id } });
}

export async function createGoal(data: GoalCreateInput, ctx: ServiceContext) {
  const { gameId, teamId, scorerId, primaryAssistId, secondaryAssistId } = data;
  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const scorer = await getPlayerById(scorerId, ctx);
  const primaryAssistant = await maybeGetPlayerById(primaryAssistId, ctx);
  const secondaryAssistant = await maybeGetPlayerById(secondaryAssistId, ctx);

  validateGoal(game, team, scorer, primaryAssistant, secondaryAssistant);

  return ctx.prisma.goal.create({ data: cleanInput(data) });
}

export async function updateGoal(id: string, data: GoalUpdateInput, ctx: ServiceContext) {
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
