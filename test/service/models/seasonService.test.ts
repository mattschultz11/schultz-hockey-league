import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createSeason,
  deleteSeason,
  getSeasonById,
  getSeasonBySlug,
  getSeasonsByLeague,
  updateSeason,
} from "@/service/models/seasonService";
import type { ServerContext } from "@/types";

import type { LeagueModel } from "../../modelFactory";
import { insertLeague, makeSeason } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("seasonService", () => {
  let ctx: ServerContext;
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

  it("can get a season by id", async () => {
    const season = await createSeason(makeSeason({ leagueId: league.id }), ctx);

    const found = await getSeasonById(season.id, ctx);

    expect(found).toMatchObject(season);
  });

  it("throws NotFoundError when getting a non-existent season by id", async () => {
    await expect(getSeasonById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can get a season by slug", async () => {
    const season = await createSeason(makeSeason({ leagueId: league.id }), ctx);

    const found = await getSeasonBySlug(league.id, season.slug, ctx);

    expect(found).toMatchObject(season);
  });

  it("throws NotFoundError when getting a non-existent season by slug", async () => {
    await expect(getSeasonBySlug(league.id, "non-existent-slug", ctx)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("can list seasons by league", async () => {
    await createSeason(makeSeason({ leagueId: league.id }), ctx);
    await createSeason(makeSeason({ leagueId: league.id }), ctx);

    const seasons = await getSeasonsByLeague(league.id, ctx);

    expect(seasons.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty list for league with no seasons", async () => {
    const emptyLeague = await insertLeague();

    const seasons = await getSeasonsByLeague(emptyLeague.id, ctx);

    expect(seasons).toEqual([]);
  });

  it("can update a season", async () => {
    const season = await createSeason(makeSeason({ leagueId: league.id }), ctx);
    const newDate = new Date("2026-06-01");

    const updated = await updateSeason(season.id, { startDate: newDate }, ctx);

    expect(updated.startDate).toEqual(newDate);
  });

  it("can delete a season", async () => {
    const season = await createSeason(makeSeason({ leagueId: league.id }), ctx);

    await deleteSeason(season.id, ctx);

    await expect(getSeasonById(season.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
