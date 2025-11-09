import { createLeague, updateLeague } from "@/service/leagueService";
import { ServiceContext } from "@/service/types";

import { makeLeague } from "../modelFactory";
import { createCtx } from "../utils";

describe("leagueService", () => {
  let ctx: ServiceContext;

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
});
