import { createPenalty, updatePenalty } from "@/service/penaltyService";
import type { ServiceContext } from "@/service/types";

import type { GameModel, PlayerModel, TeamModel } from "../modelFactory";
import { insertGame, insertPenalty, insertPlayer, insertTeam, makePenalty } from "../modelFactory";
import { createCtx } from "../utils";

describe("penaltyService", () => {
  let ctx: ServiceContext;
  let team: TeamModel;
  let player: PlayerModel;
  let game: GameModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    team = await insertTeam();
    player = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    game = await insertGame({ homeTeamId: team.id });
  });

  it("can create a penalty", async () => {
    const input = makePenalty({ gameId: game.id, teamId: team.id, playerId: player.id });

    const actual = await createPenalty(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when the penalized player is not on the team", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherPlayer = await insertPlayer({ seasonId: otherTeam.seasonId, teamId: otherTeam.id });
    const input = makePenalty({ gameId: game.id, teamId: team.id, playerId: otherPlayer.id });

    await expect(() => createPenalty(input, ctx)).rejects.toThrow("Player must be on the team");
  });

  it("throws when the penalized team is not in the game", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherGame = await insertGame({ seasonId: team.seasonId, homeTeamId: otherTeam.id });
    const input = makePenalty({ gameId: otherGame.id, teamId: team.id, playerId: player.id });

    await expect(() => createPenalty(input, ctx)).rejects.toThrow("Team must be in the game");
  });

  it("throws when updating a penalty with a player from another team", async () => {
    const created = await insertPenalty({ gameId: game.id, teamId: team.id, playerId: player.id });
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherPlayer = await insertPlayer({ seasonId: otherTeam.seasonId, teamId: otherTeam.id });

    await expect(() =>
      updatePenalty(
        created.id,
        {
          playerId: otherPlayer.id,
        },
        ctx,
      ),
    ).rejects.toThrow("Player must be on the team");
  });

  it("throws when updating a penalty to another team without changing the player", async () => {
    const created = await insertPenalty({ gameId: game.id, teamId: team.id, playerId: player.id });
    const otherTeam = await insertTeam({ seasonId: team.seasonId });

    await expect(() =>
      updatePenalty(
        created.id,
        {
          teamId: otherTeam.id,
        },
        ctx,
      ),
    ).rejects.toThrow("Team must be in the game");
  });
});
