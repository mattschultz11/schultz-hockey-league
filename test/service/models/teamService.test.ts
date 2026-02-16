import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createTeam,
  deleteTeam,
  getTeamById,
  getTeamBySlug,
  getTeamsBySeason,
  updateTeam,
} from "@/service/models/teamService";
import type { ServerContext } from "@/types";

import type { SeasonModel } from "../../modelFactory";
import { insertPlayer, insertSeason, makeTeam } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("teamService", () => {
  let ctx: ServerContext;
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

  it("can get a team by id", async () => {
    const team = await createTeam(makeTeam({ seasonId: season.id }), ctx);

    const found = await getTeamById(team.id, ctx);

    expect(found).toMatchObject(team);
  });

  it("throws NotFoundError when getting a non-existent team by id", async () => {
    await expect(getTeamById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can get a team by slug", async () => {
    const team = await createTeam(makeTeam({ seasonId: season.id }), ctx);

    const found = await getTeamBySlug(season.id, team.slug, ctx);

    expect(found).toMatchObject(team);
  });

  it("throws NotFoundError when getting a non-existent team by slug", async () => {
    await expect(getTeamBySlug(season.id, "non-existent-slug", ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list teams by season", async () => {
    await createTeam(makeTeam({ seasonId: season.id }), ctx);
    await createTeam(makeTeam({ seasonId: season.id }), ctx);

    const teams = await getTeamsBySeason(season.id, ctx);

    expect(teams.length).toBeGreaterThanOrEqual(2);
  });

  it("can update a team name", async () => {
    const team = await createTeam(makeTeam({ seasonId: season.id }), ctx);

    const updated = await updateTeam(team.id, { name: "New Name" }, ctx);

    expect(updated.name).toBe("New Name");
  });

  it("can delete a team", async () => {
    const team = await createTeam(makeTeam({ seasonId: season.id }), ctx);

    await deleteTeam(team.id, ctx);

    await expect(getTeamById(team.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
