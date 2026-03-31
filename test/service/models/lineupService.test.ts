import { randUuid } from "@ngneat/falso";

import { ConflictError, NotFoundError } from "@/service/errors";
import {
  addPlayerToLineup,
  getLineupById,
  getLineupsByGame,
  getLineupsByGameAndTeam,
  removePlayerFromLineup,
  setGameLineup,
} from "@/service/models/lineupService";
import type { ServerContext } from "@/types";

import type { GameModel, PlayerModel, TeamModel } from "../../modelFactory";
import {
  insertGame,
  insertLineup,
  insertPlayer,
  insertSeason,
  insertTeam,
  makeLineup,
} from "../../modelFactory";
import { createCtx } from "../../utils";

describe("lineupService", () => {
  let ctx: ServerContext;
  let team: TeamModel;
  let player: PlayerModel;
  let game: GameModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    team = await insertTeam();
    player = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    game = await insertGame({ seasonId: team.seasonId, homeTeamId: team.id });
  });

  it("can add a player to a lineup", async () => {
    const input = makeLineup({ gameId: game.id, teamId: team.id, playerId: player.id });

    const actual = await addPlayerToLineup(input, ctx);

    expect(actual).toMatchObject({
      gameId: game.id,
      teamId: team.id,
      playerId: player.id,
    });
  });

  it("throws when the team is not in the game", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherPlayer = await insertPlayer({
      seasonId: team.seasonId,
      teamId: otherTeam.id,
    });
    const input = makeLineup({
      gameId: game.id,
      teamId: otherTeam.id,
      playerId: otherPlayer.id,
    });

    await expect(() => addPlayerToLineup(input, ctx)).rejects.toThrow("Team must be in the game");
  });

  it("throws when the player is not in the same season", async () => {
    const otherSeason = await insertSeason();
    const otherPlayer = await insertPlayer({ seasonId: otherSeason.id });
    const input = makeLineup({ gameId: game.id, teamId: team.id, playerId: otherPlayer.id });

    await expect(() => addPlayerToLineup(input, ctx)).rejects.toThrow(
      "Player must be in the same season as the game",
    );
  });

  it("throws ConflictError when adding a duplicate lineup entry", async () => {
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: player.id });
    const input = makeLineup({ gameId: game.id, teamId: team.id, playerId: player.id });

    await expect(() => addPlayerToLineup(input, ctx)).rejects.toThrow(ConflictError);
  });

  it("can remove a player from a lineup", async () => {
    const lineup = await addPlayerToLineup(
      makeLineup({ gameId: game.id, teamId: team.id, playerId: player.id }),
      ctx,
    );

    await removePlayerFromLineup(lineup.id, ctx);

    await expect(getLineupById(lineup.id, ctx)).rejects.toThrow(NotFoundError);
  });

  it("can set a game lineup (replaces existing)", async () => {
    const player2 = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const player3 = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });

    // Set initial lineup
    await setGameLineup(
      { gameId: game.id, teamId: team.id, playerIds: [player.id, player2.id] },
      ctx,
    );

    // Replace with new lineup
    const result = await setGameLineup(
      { gameId: game.id, teamId: team.id, playerIds: [player2.id, player3.id] },
      ctx,
    );

    expect(result).toHaveLength(2);
    expect(result.map((l) => l.playerId).sort()).toEqual([player2.id, player3.id].sort());
  });

  it("setGameLineup preserves other team's lineup", async () => {
    const awayTeam = await insertTeam({ seasonId: team.seasonId });
    const awayPlayer = await insertPlayer({ seasonId: team.seasonId, teamId: awayTeam.id });
    const gameWithBothTeams = await insertGame({
      seasonId: team.seasonId,
      homeTeamId: team.id,
      awayTeamId: awayTeam.id,
    });

    await setGameLineup(
      { gameId: gameWithBothTeams.id, teamId: awayTeam.id, playerIds: [awayPlayer.id] },
      ctx,
    );

    await setGameLineup(
      { gameId: gameWithBothTeams.id, teamId: team.id, playerIds: [player.id] },
      ctx,
    );

    const awayLineups = await getLineupsByGameAndTeam(gameWithBothTeams.id, awayTeam.id, ctx);
    expect(awayLineups).toHaveLength(1);
    expect(awayLineups[0].playerId).toBe(awayPlayer.id);
  });

  it("can get lineups by game", async () => {
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: player.id });

    const lineups = await getLineupsByGame(game.id, ctx);

    expect(lineups.length).toBeGreaterThanOrEqual(1);
  });

  it("can get a lineup by id", async () => {
    const lineup = await addPlayerToLineup(
      makeLineup({ gameId: game.id, teamId: team.id, playerId: player.id }),
      ctx,
    );

    const found = await getLineupById(lineup.id, ctx);

    expect(found).toMatchObject(lineup);
  });

  it("throws NotFoundError when getting a non-existent lineup", async () => {
    await expect(getLineupById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });
});
