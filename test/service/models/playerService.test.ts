import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  getPlayersBySeason,
  updatePlayer,
} from "@/service/models/playerService";
import { Position } from "@/service/prisma";
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

    expect(actual).toMatchObject(input);
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
});
