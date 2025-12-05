import { createGame, updateGame } from "@/service/gameService";
import type { ServiceContext } from "@/service/types";

import type { SeasonModel } from "../modelFactory";
import { insertSeason, insertTeam, makeGame } from "../modelFactory";
import { createCtx } from "../utils";

describe("gameService", () => {
  let ctx: ServiceContext;
  let season: SeasonModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
  });

  it("can create a game", async () => {
    const input = makeGame({ seasonId: season.id, homeTeamId: null, awayTeamId: null });

    const actual = await createGame(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when teams are from different seasons", async () => {
    const homeTeam = await insertTeam({ seasonId: season.id });
    const otherSeason = await insertSeason();
    const awayTeam = await insertTeam({ seasonId: otherSeason.id });
    const input = makeGame({
      seasonId: season.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });

    await expect(() => createGame(input, ctx)).rejects.toThrow(
      "Away team must be in the same season as the game",
    );
  });

  it("throws when the home team is from another season", async () => {
    const otherSeason = await insertSeason();
    const homeTeam = await insertTeam({ seasonId: otherSeason.id });
    const awayTeam = await insertTeam({ seasonId: season.id });
    const input = makeGame({
      seasonId: season.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });

    await expect(() => createGame(input, ctx)).rejects.toThrow(
      "Home team must be in the same season as the game",
    );
  });

  it("throws when home and away teams are the same", async () => {
    const team = await insertTeam({ seasonId: season.id });
    const input = makeGame({ seasonId: season.id, homeTeamId: team.id, awayTeamId: team.id });

    await expect(() => createGame(input, ctx)).rejects.toThrow(
      "Home and away teams cannot be the same",
    );
  });

  it("throws when updating a game with an away team from another season", async () => {
    const homeTeam = await insertTeam({ seasonId: season.id });
    const awayTeam = await insertTeam({ seasonId: season.id });
    const game = makeGame({
      seasonId: season.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });
    const created = await createGame(game, ctx);
    const otherSeason = await insertSeason();
    const otherAwayTeam = await insertTeam({ seasonId: otherSeason.id });

    await expect(() =>
      updateGame(created.id, { awayTeamId: otherAwayTeam.id }, ctx),
    ).rejects.toThrow("Away team must be in the same season as the game");
  });

  it("throws when updating a game to use the same home and away team", async () => {
    const homeTeam = await insertTeam({ seasonId: season.id });
    const awayTeam = await insertTeam({ seasonId: season.id });
    const game = makeGame({
      seasonId: season.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });
    const created = await createGame(game, ctx);

    await expect(() => updateGame(created.id, { awayTeamId: homeTeam.id }, ctx)).rejects.toThrow(
      "Home and away teams cannot be the same",
    );
  });
});
