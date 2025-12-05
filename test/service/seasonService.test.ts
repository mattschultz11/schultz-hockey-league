import { createSeason, updateSeason } from "@/service/seasonService";
import type { ServiceContext } from "@/service/types";

import type { LeagueModel } from "../modelFactory";
import { insertLeague, makeSeason } from "../modelFactory";
import { createCtx } from "../utils";

describe("seasonService", () => {
  let ctx: ServiceContext;
  let league: LeagueModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    league = await insertLeague();
  });

  it("can create a season", async () => {
    const input = makeSeason({ leagueId: league.id });

    const actual = await createSeason(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when creating a season with a duplicate name in the same league", async () => {
    const input = makeSeason({ leagueId: league.id });
    await createSeason(input, ctx);

    await expect(() => createSeason(input, ctx)).rejects.toThrow(
      "Season with this name already exists",
    );
  });

  it("throws when updating a season to a duplicate name in the same league", async () => {
    const original = await createSeason(makeSeason({ leagueId: league.id }), ctx);
    const duplicate = await createSeason(makeSeason({ leagueId: league.id }), ctx);

    await expect(() =>
      updateSeason(
        original.id,
        { name: duplicate.name, startDate: duplicate.startDate, endDate: duplicate.endDate },
        ctx,
      ),
    ).rejects.toThrow("Season with this name already exists");
  });
});
