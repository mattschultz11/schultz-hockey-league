import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createGoal,
  deleteGoal,
  getGoalById,
  getGoalsBySeason,
  updateGoal,
} from "@/service/models/goalService";
import { Strength } from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { GameModel, PlayerModel, TeamModel } from "../../modelFactory";
import {
  insertGame,
  insertLineup,
  insertPlayer,
  insertSeason,
  insertTeam,
  makeGoal,
} from "../../modelFactory";
import { createCtx } from "../../utils";

describe("goalService", () => {
  let ctx: ServerContext;
  let team: TeamModel;
  let scorer: PlayerModel;
  let game: GameModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    team = await insertTeam();
    scorer = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    game = await insertGame({ seasonId: team.seasonId, homeTeamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: scorer.id });
  });

  it("can create a goal", async () => {
    const input = makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id });

    const actual = await createGoal(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when the scorer is not in the lineup", async () => {
    const otherScorer = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const input = makeGoal({ gameId: game.id, teamId: team.id, scorerId: otherScorer.id });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when the scoring team is not in the game", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherGame = await insertGame({ seasonId: team.seasonId, homeTeamId: otherTeam.id });
    const input = makeGoal({ gameId: otherGame.id, teamId: team.id, scorerId: scorer.id });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when the primary assistant is not in the lineup", async () => {
    const primaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: primaryAssist.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when the secondary assistant is not in the lineup", async () => {
    const primaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: primaryAssist.id });
    const secondaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: primaryAssist.id,
      secondaryAssistId: secondaryAssist.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when the primary assistant is also the scorer", async () => {
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: scorer.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Primary assistant cannot be the scorer",
    );
  });

  it("throws when the secondary assistant is also the scorer", async () => {
    const primaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: primaryAssist.id });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: primaryAssist.id,
      secondaryAssistId: scorer.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Secondary assistant cannot be the scorer",
    );
  });

  it("throws when a secondary assist is provided without a primary assist", async () => {
    const secondaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: secondaryAssist.id });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: null,
      secondaryAssistId: secondaryAssist.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Cannot have secondary assistant without primary assistant",
    );
  });

  it("throws when primary and secondary assistants are the same player", async () => {
    const assistant = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: assistant.id });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: assistant.id,
      secondaryAssistId: assistant.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Secondary assistant cannot be the primary assistant",
    );
  });

  it("throws when updating a goal to a different team without changing the scorer", async () => {
    const created = await createGoal(
      makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id }),
      ctx,
    );
    const otherTeam = await insertTeam({ seasonId: team.seasonId });

    await expect(() => updateGoal(created.id, { teamId: otherTeam.id }, ctx)).rejects.toThrow(
      "Scorer must be in the lineup for this team",
    );
  });

  it("can get a goal by id", async () => {
    const goal = await createGoal(
      makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id }),
      ctx,
    );

    const found = await getGoalById(goal.id, ctx);

    expect(found).toMatchObject(goal);
  });

  it("throws NotFoundError when getting a non-existent goal", async () => {
    await expect(getGoalById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list goals by season", async () => {
    const season = await insertSeason();
    const seasonTeam = await insertTeam({ seasonId: season.id });
    const seasonScorer = await insertPlayer({ seasonId: season.id, teamId: seasonTeam.id });
    const seasonGame = await insertGame({ seasonId: season.id, homeTeamId: seasonTeam.id });
    await insertLineup({
      gameId: seasonGame.id,
      teamId: seasonTeam.id,
      playerId: seasonScorer.id,
    });

    await createGoal(
      makeGoal({ gameId: seasonGame.id, teamId: seasonTeam.id, scorerId: seasonScorer.id }),
      ctx,
    );

    const goals = await getGoalsBySeason(season.id, ctx);

    expect(goals.length).toBeGreaterThanOrEqual(1);
  });

  it("can update a goal", async () => {
    const goal = await createGoal(
      makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id }),
      ctx,
    );

    const updated = await updateGoal(goal.id, { period: 3, strength: Strength.POWERPLAY }, ctx);

    expect(updated.period).toBe(3);
    expect(updated.strength).toBe(Strength.POWERPLAY);
  });

  it("can delete a goal", async () => {
    const goal = await createGoal(
      makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id }),
      ctx,
    );

    await deleteGoal(goal.id, ctx);

    await expect(getGoalById(goal.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
