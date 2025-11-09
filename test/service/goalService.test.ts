import { createGoal, updateGoal } from "@/service/goalService";
import { ServiceContext } from "@/service/types";

import {
  GameModel,
  insertGame,
  insertPlayer,
  insertTeam,
  makeGoal,
  PlayerModel,
  TeamModel,
} from "../modelFactory";
import { createCtx } from "../utils";

describe("goalService", () => {
  let ctx: ServiceContext;
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
  });

  it("can create a goal", async () => {
    const input = makeGoal({ gameId: game.id, teamId: team.id, scorerId: scorer.id });

    const actual = await createGoal(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when the scorer is not on the scoring team", async () => {
    const otherTeam = await insertTeam();
    const otherScorer = await insertPlayer({ seasonId: otherTeam.seasonId, teamId: otherTeam.id });
    const input = makeGoal({ gameId: game.id, teamId: team.id, scorerId: otherScorer.id });

    await expect(() => createGoal(input, ctx)).rejects.toThrow("Scorer must be on the team");
  });

  it("throws when the scoring team is not in the game", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherGame = await insertGame({ seasonId: team.seasonId, homeTeamId: otherTeam.id });
    const input = makeGoal({ gameId: otherGame.id, teamId: team.id, scorerId: scorer.id });

    await expect(() => createGoal(input, ctx)).rejects.toThrow("Team must be in the game");
  });

  it("throws when the primary assistant is not on the scoring team", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const primaryAssist = await insertPlayer({
      seasonId: otherTeam.seasonId,
      teamId: otherTeam.id,
    });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: primaryAssist.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Primary assistant must be on the team",
    );
  });

  it("throws when the secondary assistant is not on the scoring team", async () => {
    const primaryAssist = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const secondaryAssist = await insertPlayer({
      seasonId: otherTeam.seasonId,
      teamId: otherTeam.id,
    });
    const input = makeGoal({
      gameId: game.id,
      teamId: team.id,
      scorerId: scorer.id,
      primaryAssistId: primaryAssist.id,
      secondaryAssistId: secondaryAssist.id,
    });

    await expect(() => createGoal(input, ctx)).rejects.toThrow(
      "Secondary assistant must be on the team",
    );
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
      "Team must be in the game",
    );
  });
});
