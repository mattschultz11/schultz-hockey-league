import { randCity, randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createGame,
  deleteGame,
  getGameById,
  getGamesBySeason,
  updateGame,
} from "@/service/models/gameService";
import type { ServerContext } from "@/types";

import type { SeasonModel } from "../../modelFactory";
import { insertSeason, insertTeam, makeGame } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("gameService", () => {
  let ctx: ServerContext;
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

  it("can get a game by id", async () => {
    const game = await createGame(
      makeGame({ seasonId: season.id, homeTeamId: null, awayTeamId: null }),
      ctx,
    );

    const found = await getGameById(game.id, ctx);

    expect(found).toMatchObject(game);
  });

  it("throws NotFoundError when getting a non-existent game", async () => {
    await expect(getGameById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list games by season", async () => {
    await createGame(makeGame({ seasonId: season.id }), ctx);
    await createGame(makeGame({ seasonId: season.id }), ctx);

    const games = await getGamesBySeason(season.id, ctx);

    expect(games.length).toBeGreaterThanOrEqual(2);
  });

  it("can update a game", async () => {
    const homeTeam = await insertTeam({ seasonId: season.id });
    const awayTeam = await insertTeam({ seasonId: season.id });
    const game = await createGame(
      makeGame({ seasonId: season.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id }),
      ctx,
    );
    const newLocation = randCity();

    const updated = await updateGame(game.id, { location: newLocation }, ctx);

    expect(updated.location).toBe(newLocation);
  });

  it("can delete a game", async () => {
    const game = await createGame(
      makeGame({ seasonId: season.id, homeTeamId: null, awayTeamId: null }),
      ctx,
    );

    await deleteGame(game.id, ctx);

    await expect(getGameById(game.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
