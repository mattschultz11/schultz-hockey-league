import { createTeam, updateTeam } from "@/service/teamService";
import type { ServiceContext } from "@/service/types";

import type { SeasonModel } from "../modelFactory";
import { insertPlayer, insertSeason, makeTeam } from "../modelFactory";
import { createCtx } from "../utils";

describe("teamService", () => {
  let ctx: ServiceContext;
  let season: SeasonModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
  });

  it("can create a team", async () => {
    const input = makeTeam({ seasonId: season.id, managerId: null });

    const actual = await createTeam(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when creating a team with a duplicate name in the same season", async () => {
    const input = makeTeam({ seasonId: season.id, managerId: null });
    await createTeam(input, ctx);

    await expect(() => createTeam(input, ctx)).rejects.toThrow(
      "Team with this name already exists",
    );
  });

  it("throws when assigning a manager from another season on create", async () => {
    const otherSeason = await insertSeason();
    const manager = await insertPlayer({ seasonId: otherSeason.id });
    const input = makeTeam({ seasonId: season.id, managerId: manager.id });

    await expect(() => createTeam(input, ctx)).rejects.toThrow(
      "Manager must be in the same season as the team",
    );
  });

  it("throws when updating a team to a duplicate name in the same season", async () => {
    const original = await createTeam(makeTeam({ seasonId: season.id }), ctx);
    const duplicate = await createTeam(makeTeam({ seasonId: season.id }), ctx);

    await expect(() => updateTeam(original.id, { name: duplicate.name }, ctx)).rejects.toThrow(
      "Team with this name already exists",
    );
  });

  it("throws when updating a team to use a manager from another season", async () => {
    const manager = await insertPlayer({ seasonId: season.id });
    const team = await createTeam(makeTeam({ seasonId: season.id, managerId: manager.id }), ctx);
    const otherSeason = await insertSeason();
    const otherManager = await insertPlayer({ seasonId: otherSeason.id });

    await expect(() => updateTeam(team.id, { managerId: otherManager.id }, ctx)).rejects.toThrow(
      "Manager must be in the same season as the team",
    );
  });
});
