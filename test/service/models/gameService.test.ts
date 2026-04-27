import { randCity, randUuid } from "@ngneat/falso";

import { NotFoundError, ValidationError } from "@/service/errors";
import {
  createGame,
  deleteGame,
  getGameById,
  getGamesBySeason,
  updateGame,
} from "@/service/models/gameService";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { SeasonModel } from "../../modelFactory";
import { insertGame, insertPlayer, insertSeason, insertTeam, makeGame } from "../../modelFactory";
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

    expect(actual).toMatchObject({ ...input, location: input.location.toLowerCase() });
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

    expect(updated.location).toBe(newLocation.toLowerCase());
  });

  it("can delete a game", async () => {
    const game = await createGame(
      makeGame({ seasonId: season.id, homeTeamId: null, awayTeamId: null }),
      ctx,
    );

    await deleteGame(game.id, ctx);

    await expect(getGameById(game.id, ctx)).rejects.toThrow(NotFoundError);
  });

  describe("team results and points", () => {
    let teamCounter = 0;
    async function createPlayedGame() {
      teamCounter += 1;
      const homeTeam = await insertTeam({
        seasonId: season.id,
        name: `Results Home ${teamCounter}`,
      });
      const awayTeam = await insertTeam({
        seasonId: season.id,
        name: `Results Away ${teamCounter}`,
      });
      const game = await createGame(
        makeGame({ seasonId: season.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id }),
        ctx,
      );
      return game;
    }

    it("persists a WIN/LOSS result with points", async () => {
      const game = await createPlayedGame();

      const updated = await updateGame(
        game.id,
        {
          homeTeamResult: "WIN",
          awayTeamResult: "LOSS",
          homeTeamPoints: 2,
          awayTeamPoints: 0,
        },
        ctx,
      );

      expect(updated).toMatchObject({
        homeTeamResult: "WIN",
        awayTeamResult: "LOSS",
        homeTeamPoints: 2,
        awayTeamPoints: 0,
      });
    });

    it("persists a TIE/TIE result", async () => {
      const game = await createPlayedGame();

      const updated = await updateGame(
        game.id,
        {
          homeTeamResult: "TIE",
          awayTeamResult: "TIE",
          homeTeamPoints: 1,
          awayTeamPoints: 1,
        },
        ctx,
      );

      expect(updated).toMatchObject({
        homeTeamResult: "TIE",
        awayTeamResult: "TIE",
        homeTeamPoints: 1,
        awayTeamPoints: 1,
      });
    });

    it("clears existing results when both are set to null", async () => {
      const game = await createPlayedGame();
      await updateGame(
        game.id,
        { homeTeamResult: "WIN", awayTeamResult: "LOSS", homeTeamPoints: 2, awayTeamPoints: 0 },
        ctx,
      );

      const cleared = await updateGame(
        game.id,
        { homeTeamResult: null, awayTeamResult: null, homeTeamPoints: null, awayTeamPoints: null },
        ctx,
      );

      expect(cleared).toMatchObject({
        homeTeamResult: null,
        awayTeamResult: null,
        homeTeamPoints: null,
        awayTeamPoints: null,
      });
    });

    it("rejects WIN paired with WIN", async () => {
      const game = await createPlayedGame();

      await expect(() =>
        updateGame(game.id, { homeTeamResult: "WIN", awayTeamResult: "WIN" }, ctx),
      ).rejects.toThrow("If home team wins, away team must lose");
    });

    it("rejects LOSS paired with LOSS", async () => {
      const game = await createPlayedGame();

      await expect(() =>
        updateGame(game.id, { homeTeamResult: "LOSS", awayTeamResult: "LOSS" }, ctx),
      ).rejects.toThrow("If home team loses, away team must win");
    });

    it("rejects TIE paired with WIN", async () => {
      const game = await createPlayedGame();

      await expect(() =>
        updateGame(game.id, { homeTeamResult: "TIE", awayTeamResult: "WIN" }, ctx),
      ).rejects.toThrow("If one team ties, the other must also tie");
    });

    it("rejects setting only one team's result", async () => {
      const game = await createPlayedGame();

      await expect(() => updateGame(game.id, { homeTeamResult: "WIN" }, ctx)).rejects.toThrow(
        "Home and away team results must both be set or both be cleared",
      );
    });

    it("rejects clearing only one team's result", async () => {
      const game = await createPlayedGame();
      await updateGame(
        game.id,
        { homeTeamResult: "WIN", awayTeamResult: "LOSS", homeTeamPoints: 2, awayTeamPoints: 0 },
        ctx,
      );

      await expect(() => updateGame(game.id, { homeTeamResult: null }, ctx)).rejects.toThrow(
        "Home and away team results must both be set or both be cleared",
      );
    });

    it("rejects points outside the 0–3 range", async () => {
      const game = await createPlayedGame();

      await expect(() =>
        updateGame(
          game.id,
          { homeTeamResult: "WIN", awayTeamResult: "LOSS", homeTeamPoints: 4, awayTeamPoints: 0 },
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects negative points", async () => {
      const game = await createPlayedGame();

      await expect(() =>
        updateGame(
          game.id,
          { homeTeamResult: "WIN", awayTeamResult: "LOSS", homeTeamPoints: 2, awayTeamPoints: -1 },
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("schedule overlap detection", () => {
    const SLOT_DATETIME = new Date("2026-05-12T19:00:00.000Z");

    it("rejects create when home team already booked at the same slot (home ↔ home)", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Overlap Home A" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Overlap Away B" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Overlap Away C" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      await expect(() =>
        createGame(
          makeGame({
            seasonId: season.id,
            homeTeamId: teamA.id,
            awayTeamId: teamC.id,
            datetime: SLOT_DATETIME,
          }),
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects create when away team already booked at the same slot (away ↔ away)", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Away-Away Home 1" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Away-Away Shared" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Away-Away Home 2" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      await expect(() =>
        createGame(
          makeGame({
            seasonId: season.id,
            homeTeamId: teamC.id,
            awayTeamId: teamB.id,
            datetime: SLOT_DATETIME,
          }),
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects create when new home team matches existing away team (home ↔ away)", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Sym HA Host" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Sym HA Swap" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Sym HA Other" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      await expect(() =>
        createGame(
          makeGame({
            seasonId: season.id,
            homeTeamId: teamB.id,
            awayTeamId: teamC.id,
            datetime: SLOT_DATETIME,
          }),
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects create when new away team matches existing home team (away ↔ home)", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Sym AH Host" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Sym AH Swap" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Sym AH Other" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      await expect(() =>
        createGame(
          makeGame({
            seasonId: season.id,
            homeTeamId: teamC.id,
            awayTeamId: teamA.id,
            datetime: SLOT_DATETIME,
          }),
          ctx,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("allows update to succeed when the only conflicting row is the game being updated", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Self Excl Home" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Self Excl Away" });

      const created = await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      const updated = await updateGame(created.id, { location: "New Rink" }, ctx);

      expect(updated.location).toBe("new rink");
    });

    it("includes the conflicting team name and round in the error message", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Ice Dragons" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Err Msg Away" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Err Msg Other" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
          round: 7,
        }),
        ctx,
      );

      await expect(() =>
        createGame(
          makeGame({
            seasonId: season.id,
            homeTeamId: teamA.id,
            awayTeamId: teamC.id,
            datetime: SLOT_DATETIME,
          }),
          ctx,
        ),
      ).rejects.toThrow(/'Ice Dragons'.*round 7/);
    });

    it("allows create when datetimes differ", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Time Diff Home" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Time Diff Away" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Time Diff Other" });

      await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          datetime: SLOT_DATETIME,
        }),
        ctx,
      );

      const second = await createGame(
        makeGame({
          seasonId: season.id,
          homeTeamId: teamA.id,
          awayTeamId: teamC.id,
          datetime: new Date("2026-05-12T21:00:00.000Z"),
        }),
        ctx,
      );

      expect(second.id).toBeDefined();
    });
  });

  describe("deleteGame cascade guard", () => {
    it("deletes a game with no children", async () => {
      const game = await insertGame({ seasonId: season.id });

      await deleteGame(game.id, ctx);

      await expect(getGameById(game.id, ctx)).rejects.toThrow(NotFoundError);
    });

    it("rejects delete when a goal is attached to the game", async () => {
      const team = await insertTeam({ seasonId: season.id, name: "Goal Guard Home" });
      const away = await insertTeam({ seasonId: season.id, name: "Goal Guard Away" });
      const scorer = await insertPlayer({ seasonId: season.id, teamId: team.id });
      const game = await insertGame({
        seasonId: season.id,
        homeTeamId: team.id,
        awayTeamId: away.id,
      });

      await prisma.goal.create({
        data: {
          gameId: game.id,
          teamId: team.id,
          scorerId: scorer.id,
          period: 1,
          time: 120,
          strength: "EVEN",
        },
      });

      await expect(() => deleteGame(game.id, ctx)).rejects.toThrow(ValidationError);
    });

    it("rejects delete when a penalty is attached to the game", async () => {
      const team = await insertTeam({ seasonId: season.id, name: "Pen Guard Home" });
      const away = await insertTeam({ seasonId: season.id, name: "Pen Guard Away" });
      const offender = await insertPlayer({ seasonId: season.id, teamId: team.id });
      const game = await insertGame({
        seasonId: season.id,
        homeTeamId: team.id,
        awayTeamId: away.id,
      });

      await prisma.penalty.create({
        data: {
          gameId: game.id,
          teamId: team.id,
          playerId: offender.id,
          period: 1,
          time: 45,
          type: "HOOKING",
          minutes: 2,
        },
      });

      await expect(() => deleteGame(game.id, ctx)).rejects.toThrow(ValidationError);
    });

    it("rejects delete when a lineup is attached to the game", async () => {
      const team = await insertTeam({ seasonId: season.id, name: "Line Guard Home" });
      const away = await insertTeam({ seasonId: season.id, name: "Line Guard Away" });
      const player = await insertPlayer({ seasonId: season.id, teamId: team.id });
      const game = await insertGame({
        seasonId: season.id,
        homeTeamId: team.id,
        awayTeamId: away.id,
      });

      await prisma.lineup.create({
        data: {
          gameId: game.id,
          teamId: team.id,
          playerId: player.id,
        },
      });

      await expect(() => deleteGame(game.id, ctx)).rejects.toThrow(ValidationError);
    });
  });
});
