import { createPlayer, updatePlayer } from "@/service/models/playerService";
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
});
