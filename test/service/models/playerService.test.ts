import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  getPlayerCatalog,
  getPlayersBySeason,
  updatePlayer,
} from "@/service/models/playerService";
import prisma, { Classification, Position } from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { SeasonModel, UserModel } from "../../modelFactory";
import { insertSeason, insertTeam, insertUser, makePlayer } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("playerService", () => {
  let ctx: ServerContext;
  let season: SeasonModel;
  let user: UserModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
    user = await insertUser();
  });

  it("can create a player", async () => {
    const input = makePlayer({ userId: user.id, seasonId: season.id, teamId: null });

    const actual = await createPlayer(input, ctx);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...expected } = input;
    expect(actual).toMatchObject(expected);
    expect(actual.id).toBeDefined();
  });

  it("throws when assigning a player to a team in a different season", async () => {
    const otherSeason = await insertSeason();
    const team = await insertTeam({ seasonId: otherSeason.id });
    const input = makePlayer({ userId: user.id, seasonId: season.id, teamId: team.id });

    await expect(() => createPlayer(input, ctx)).rejects.toThrow(
      "Team must be in the same season as the player",
    );
  });

  it("throws when updating a player to join a team in another season", async () => {
    const player = makePlayer({ userId: user.id, seasonId: season.id, teamId: null });
    const created = await createPlayer(player, ctx);
    const otherSeason = await insertSeason();
    const otherTeam = await insertTeam({ seasonId: otherSeason.id });

    await expect(() => updatePlayer(created.id, { teamId: otherTeam.id }, ctx)).rejects.toThrow(
      "Team must be in the same season as the player",
    );
  });

  it("can get a player by id", async () => {
    const player = await createPlayer(
      makePlayer({ userId: user.id, seasonId: season.id, teamId: null }),
      ctx,
    );

    const found = await getPlayerById(player.id, ctx);

    expect(found).toMatchObject(player);
  });

  it("throws NotFoundError when getting a non-existent player", async () => {
    await expect(getPlayerById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list players by season", async () => {
    await createPlayer(makePlayer({ userId: user.id, seasonId: season.id, teamId: null }), ctx);
    const user2 = await insertUser();
    await createPlayer(makePlayer({ userId: user2.id, seasonId: season.id, teamId: null }), ctx);

    const players = await getPlayersBySeason(season.id, ctx);

    expect(players.length).toBeGreaterThanOrEqual(2);
  });

  it("can update a player", async () => {
    const player = await createPlayer(
      makePlayer({ userId: user.id, seasonId: season.id, teamId: null }),
      ctx,
    );

    const updated = await updatePlayer(player.id, { position: Position.G, number: 30 }, ctx);

    expect(updated.position).toBe(Position.G);
    expect(updated.number).toBe(30);
  });

  it("can delete a player", async () => {
    const player = await createPlayer(
      makePlayer({ userId: user.id, seasonId: season.id, teamId: null }),
      ctx,
    );

    await deletePlayer(player.id, ctx);

    await expect(getPlayerById(player.id, ctx)).rejects.toThrow(NotFoundError);
  });

  describe("getPlayerCatalog", () => {
    let userAlice: UserModel;
    let userBob: UserModel;
    let userCharlie: UserModel;

    beforeEach(async () => {
      userAlice = await insertUser({ firstName: "Alice", lastName: "Smith" });
      userBob = await insertUser({ firstName: "Bob", lastName: "Jones" });
      userCharlie = await insertUser({ firstName: "Charlie", lastName: "Smith" });
    });

    it("returns all players for a season with no filters", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id }, ctx);

      expect(result).toHaveLength(2);
    });

    it("filters by name search — first name match", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, search: "Alice" }, ctx);

      expect(result).toHaveLength(1);
    });

    it("filters by name search — last name match", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userCharlie.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, search: "Smith" }, ctx);

      expect(result).toHaveLength(2); // Alice Smith + Charlie Smith
    });

    it("filters by partial name match", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, search: "Ali" }, ctx);

      expect(result).toHaveLength(1);
    });

    it("filters by position", async () => {
      await createPlayer(
        makePlayer({
          userId: userAlice.id,
          seasonId: season.id,
          teamId: null,
          position: Position.G,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null, position: Position.F }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, position: Position.G }, ctx);

      expect(result).toHaveLength(1);
    });

    it("filters by available=true (no team)", async () => {
      const team = await insertTeam({ seasonId: season.id, name: "Filter Team" });
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: team.id }),
        ctx,
      );
      const playerB = await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, available: true }, ctx);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(playerB.id);
    });

    it("filters by available=false (has team)", async () => {
      const team = await insertTeam({ seasonId: season.id, name: "Filter Team 2" });
      const playerA = await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: team.id }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, available: false }, ctx);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(playerA.id);
    });

    it("combines multiple filters", async () => {
      const playerA = await createPlayer(
        makePlayer({
          userId: userAlice.id,
          seasonId: season.id,
          teamId: null,
          position: Position.D,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null, position: Position.D }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userCharlie.id,
          seasonId: season.id,
          teamId: null,
          position: Position.F,
        }),
        ctx,
      );

      // Assign Alice to a team (not available)
      const team = await insertTeam({ seasonId: season.id, name: "Combine Team" });
      await prisma.player.update({ where: { id: playerA.id }, data: { teamId: team.id } });

      // Search for "Smith" + position D + available=true
      // Alice Smith: D but has team → excluded by available=true
      // Bob Jones: D + available but name doesn't match "Smith"
      // Charlie Smith: matches "Smith" but position is F → excluded
      const result = await getPlayerCatalog(
        { seasonId: season.id, search: "Smith", position: Position.D, available: true },
        ctx,
      );

      expect(result).toHaveLength(0);
    });

    it("returns empty array for season with no players", async () => {
      const emptySeason = await insertSeason({ leagueId: season.leagueId });

      const result = await getPlayerCatalog({ seasonId: emptySeason.id }, ctx);

      expect(result).toEqual([]);
    });

    it("filters by classification", async () => {
      await createPlayer(
        makePlayer({
          userId: userAlice.id,
          seasonId: season.id,
          teamId: null,
          classification: Classification.ROSTER,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userBob.id,
          seasonId: season.id,
          teamId: null,
          classification: Classification.SUBSTITUTE,
        }),
        ctx,
      );

      const roster = await getPlayerCatalog(
        { seasonId: season.id, classification: Classification.ROSTER },
        ctx,
      );
      expect(roster).toHaveLength(1);

      const subs = await getPlayerCatalog(
        { seasonId: season.id, classification: Classification.SUBSTITUTE },
        ctx,
      );
      expect(subs).toHaveLength(1);
    });

    it("filters by player rating range", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null, playerRating: 2.0 }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null, playerRating: 4.0 }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userCharlie.id,
          seasonId: season.id,
          teamId: null,
          playerRating: 3.0,
        }),
        ctx,
      );

      const result = await getPlayerCatalog(
        { seasonId: season.id, minPlayerRating: 2.5, maxPlayerRating: 4.0 },
        ctx,
      );

      expect(result).toHaveLength(2); // Bob (4.0) + Charlie (3.0)
    });

    it("filters by goalie rating range", async () => {
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null, goalieRating: 1.0 }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null, goalieRating: 3.5 }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id, minGoalieRating: 3.0 }, ctx);

      expect(result).toHaveLength(1);
    });

    it("filters by multiple positions", async () => {
      await createPlayer(
        makePlayer({
          userId: userAlice.id,
          seasonId: season.id,
          teamId: null,
          position: Position.G,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: null, position: Position.F }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userCharlie.id,
          seasonId: season.id,
          teamId: null,
          position: Position.D,
        }),
        ctx,
      );

      const result = await getPlayerCatalog(
        { seasonId: season.id, positions: [Position.G, Position.D] },
        ctx,
      );

      expect(result).toHaveLength(2);
    });

    it("filters by multiple classifications", async () => {
      await createPlayer(
        makePlayer({
          userId: userAlice.id,
          seasonId: season.id,
          teamId: null,
          classification: Classification.ROSTER,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userBob.id,
          seasonId: season.id,
          teamId: null,
          classification: Classification.SUBSTITUTE,
        }),
        ctx,
      );
      await createPlayer(
        makePlayer({
          userId: userCharlie.id,
          seasonId: season.id,
          teamId: null,
          classification: Classification.INJURED,
        }),
        ctx,
      );

      const result = await getPlayerCatalog(
        {
          seasonId: season.id,
          classifications: [Classification.ROSTER, Classification.SUBSTITUTE],
        },
        ctx,
      );

      expect(result).toHaveLength(2);
    });

    it("filters by multiple teamIds", async () => {
      const teamA = await insertTeam({ seasonId: season.id, name: "Team A" });
      const teamB = await insertTeam({ seasonId: season.id, name: "Team B" });
      const teamC = await insertTeam({ seasonId: season.id, name: "Team C" });
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: teamA.id }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: season.id, teamId: teamB.id }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userCharlie.id, seasonId: season.id, teamId: teamC.id }),
        ctx,
      );

      const result = await getPlayerCatalog(
        { seasonId: season.id, teamIds: [teamA.id, teamC.id] },
        ctx,
      );

      expect(result).toHaveLength(2);
    });

    it("does not return players from other seasons", async () => {
      const otherSeason = await insertSeason();
      await createPlayer(
        makePlayer({ userId: userAlice.id, seasonId: season.id, teamId: null }),
        ctx,
      );
      await createPlayer(
        makePlayer({ userId: userBob.id, seasonId: otherSeason.id, teamId: null }),
        ctx,
      );

      const result = await getPlayerCatalog({ seasonId: season.id }, ctx);

      expect(result).toHaveLength(1);
    });
  });
});
