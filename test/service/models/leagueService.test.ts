import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createLeague,
  deleteLeague,
  getLeagueById,
  getLeagueBySlug,
  getLeagues,
  updateLeague,
} from "@/service/models/leagueService";
import type { ServerContext } from "@/types";

import { makeLeague } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("leagueService", () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = createCtx();
  });

  it("can create a league", async () => {
    const input = makeLeague();

    const actual = await createLeague(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when creating a league with a duplicate name", async () => {
    const input = makeLeague();
    await createLeague(input, ctx);

    await expect(() => createLeague(input, ctx)).rejects.toThrow(
      "League with this name already exists",
    );
  });

  it("throws when updating a league to use a duplicate name", async () => {
    const original = await createLeague(makeLeague(), ctx);
    const duplicate = await createLeague(makeLeague(), ctx);

    await expect(() =>
      updateLeague(original.id, { name: duplicate.name, description: duplicate.description }, ctx),
    ).rejects.toThrow("League with this name already exists");
  });

  it("can get a league by id", async () => {
    const league = await createLeague(makeLeague(), ctx);

    const found = await getLeagueById(league.id, ctx);

    expect(found).toMatchObject(league);
  });

  it("throws NotFoundError when getting a non-existent league by id", async () => {
    await expect(getLeagueById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can get a league by slug", async () => {
    const league = await createLeague(makeLeague(), ctx);

    const found = await getLeagueBySlug(league.slug, ctx);

    expect(found).toMatchObject(league);
  });

  it("throws NotFoundError when getting a non-existent league by slug", async () => {
    await expect(getLeagueBySlug("non-existent-slug", ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list all leagues", async () => {
    await createLeague(makeLeague(), ctx);
    await createLeague(makeLeague(), ctx);

    const leagues = await getLeagues(ctx);

    expect(leagues.length).toBeGreaterThanOrEqual(2);
  });

  it("can update a league", async () => {
    const league = await createLeague(makeLeague(), ctx);

    const updated = await updateLeague(league.id, { description: "Updated description" }, ctx);

    expect(updated.description).toBe("Updated description");
  });

  it("can delete a league", async () => {
    const league = await createLeague(makeLeague(), ctx);

    await deleteLeague(league.id, ctx);

    await expect(getLeagueById(league.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
