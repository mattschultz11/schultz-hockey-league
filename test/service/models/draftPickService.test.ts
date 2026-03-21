import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createDraft,
  createDraftPick,
  deleteDraftPick,
  getDraftPickById,
  getDraftPicksBySeason,
  updateDraftPick,
} from "@/service/models/draftPickService";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { SeasonModel, TeamModel } from "../../modelFactory";
import { insertPlayer, insertSeason, insertTeam, makeDraftPick } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("draftPickService", () => {
  let ctx: ServerContext;
  let season: SeasonModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
  });

  it("can create a draft pick", async () => {
    const draftPick = makeDraftPick({ seasonId: season.id, playerId: null, teamId: null });

    const actual = await createDraftPick(draftPick, ctx);

    expect(actual).toMatchObject(draftPick);
  });

  it("throws when player is not in the same season", async () => {
    const otherSeason = await insertSeason();
    const player = await insertPlayer({ seasonId: otherSeason.id });
    const draftPick = makeDraftPick({ seasonId: season.id, playerId: player.id, teamId: null });

    await expect(createDraftPick(draftPick, ctx)).rejects.toThrow(
      "Player must be in the same season as the draft pick",
    );
  });

  it("throws when team is not in the same season", async () => {
    const team = await insertTeam();
    const draftPick = makeDraftPick({ seasonId: season.id, playerId: null, teamId: team.id });

    await expect(createDraftPick(draftPick, ctx)).rejects.toThrow(
      "Team must be in the same season as the draft pick",
    );
  });

  it("updates player-team relationships when the draft pick player changes", async () => {
    const teamA = await insertTeam({ seasonId: season.id });
    const teamB = await insertTeam({ seasonId: season.id });
    const playerOne = await insertPlayer({ seasonId: season.id, teamId: teamA.id });
    const playerTwo = await insertPlayer({ seasonId: season.id, teamId: null });
    const draftPick = makeDraftPick({
      seasonId: season.id,
      playerId: playerOne.id,
      teamId: teamA.id,
    });
    const created = await createDraftPick(draftPick, ctx);

    const updated = await updateDraftPick(
      created.id,
      {
        playerId: playerTwo.id,
        teamId: teamB.id,
      },
      ctx,
    );

    const updatedPlayerOne = await prisma.player.findUniqueOrThrow({ where: { id: playerOne.id } });
    const updatedPlayerTwo = await prisma.player.findUniqueOrThrow({ where: { id: playerTwo.id } });

    expect(updated.playerId).toBe(playerTwo.id);
    expect(updated.teamId).toBe(teamB.id);
    expect(updatedPlayerOne.teamId).toBeNull();
    expect(updatedPlayerTwo.teamId).toBe(teamB.id);
  });

  it("updates the drafted player's team when only the team changes", async () => {
    const teamA = await insertTeam({ seasonId: season.id });
    const teamB = await insertTeam({ seasonId: season.id });
    const player = await insertPlayer({ seasonId: season.id, teamId: teamA.id });
    const created = await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: player.id, teamId: teamA.id }),
      ctx,
    );

    const updated = await updateDraftPick(
      created.id,
      {
        teamId: teamB.id,
      },
      ctx,
    );

    const updatedPlayer = await prisma.player.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.teamId).toBe(teamB.id);
    expect(updated.playerId).toBe(player.id);
    expect(updatedPlayer.teamId).toBe(teamB.id);
  });

  it("removes the player's team when the draft pick player is cleared", async () => {
    const team = await insertTeam({ seasonId: season.id });
    const player = await insertPlayer({ seasonId: season.id, teamId: team.id });
    const created = await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: player.id, teamId: team.id }),
      ctx,
    );

    const updated = await updateDraftPick(
      created.id,
      {
        playerId: null,
      },
      ctx,
    );

    const updatedPlayer = await prisma.player.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.playerId).toBeNull();
    expect(updatedPlayer.teamId).toBeNull();
  });

  it("throws when updating to a team in another season", async () => {
    const team = await insertTeam({ seasonId: season.id });
    const draftPick = await createDraftPick(
      makeDraftPick({ seasonId: season.id, teamId: team.id, playerId: null }),
      ctx,
    );
    const otherTeam = await insertTeam();

    await expect(() =>
      updateDraftPick(
        draftPick.id,
        {
          teamId: otherTeam.id,
        },
        ctx,
      ),
    ).rejects.toThrow("Team must be in the same season as the draft pick");
  });

  it("throws when updating to a player in another season", async () => {
    const team = await insertTeam({ seasonId: season.id });
    const draftPick = await createDraftPick(
      makeDraftPick({ seasonId: season.id, teamId: team.id, playerId: null }),
      ctx,
    );
    const otherSeason = await insertSeason();
    const otherPlayer = await insertPlayer({ seasonId: otherSeason.id, teamId: null });

    await expect(() =>
      updateDraftPick(
        draftPick.id,
        {
          playerId: otherPlayer.id,
        },
        ctx,
      ),
    ).rejects.toThrow("Player must be in the same season as the draft pick");
  });

  it("can get a draft pick by id", async () => {
    const draftPick = await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: null, teamId: null }),
      ctx,
    );

    const found = await getDraftPickById(draftPick.id, ctx);

    expect(found).toMatchObject(draftPick);
  });

  it("throws NotFoundError when getting a non-existent draft pick", async () => {
    await expect(getDraftPickById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list draft picks by season", async () => {
    await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: null, teamId: null }),
      ctx,
    );
    await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: null, teamId: null }),
      ctx,
    );

    const draftPicks = await getDraftPicksBySeason(season.id, ctx);

    expect(draftPicks.length).toBeGreaterThanOrEqual(2);
  });

  it("can update draft pick fields", async () => {
    const draftPick = await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: null, teamId: null }),
      ctx,
    );

    const updated = await updateDraftPick(draftPick.id, { overall: 1, round: 1, pick: 1 }, ctx);

    expect(updated.overall).toBe(1);
    expect(updated.round).toBe(1);
    expect(updated.pick).toBe(1);
  });

  it("can delete a draft pick", async () => {
    const draftPick = await createDraftPick(
      makeDraftPick({ seasonId: season.id, playerId: null, teamId: null }),
      ctx,
    );

    await deleteDraftPick(draftPick.id, ctx);

    await expect(getDraftPickById(draftPick.id, ctx)).rejects.toThrow(NotFoundError);
  });
});

describe("createDraft", () => {
  let ctx: ServerContext;
  let season: SeasonModel;
  let teams: TeamModel[];

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
    teams = [
      await insertTeam({ seasonId: season.id, name: "Team Alpha" }),
      await insertTeam({ seasonId: season.id, name: "Team Bravo" }),
      await insertTeam({ seasonId: season.id, name: "Team Charlie" }),
      await insertTeam({ seasonId: season.id, name: "Team Delta" }),
    ];
  });

  it("creates draft picks with CYCLICAL rotation", async () => {
    const teamIds = teams.map((t) => t.id);
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 3, rotation: "CYCLICAL" },
      ctx,
    );

    expect(picks).toHaveLength(12); // 4 teams x 3 rounds

    // Every round has the same order
    for (let round = 1; round <= 3; round++) {
      const roundPicks = picks.filter((p) => p.round === round);
      expect(roundPicks.map((p) => p.teamId)).toEqual(teamIds);
    }

    // Overall is sequential
    expect(picks.map((p) => p.overall)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("creates draft picks with SNAKE rotation", async () => {
    const teamIds = teams.map((t) => t.id);
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 4, rotation: "SNAKE" },
      ctx,
    );

    expect(picks).toHaveLength(16); // 4 teams x 4 rounds

    // Round 1: normal order
    const r1 = picks.filter((p) => p.round === 1).map((p) => p.teamId);
    expect(r1).toEqual(teamIds);

    // Round 2: reversed
    const r2 = picks.filter((p) => p.round === 2).map((p) => p.teamId);
    expect(r2).toEqual([...teamIds].reverse());

    // Round 3: normal again
    const r3 = picks.filter((p) => p.round === 3).map((p) => p.teamId);
    expect(r3).toEqual(teamIds);

    // Round 4: reversed again
    const r4 = picks.filter((p) => p.round === 4).map((p) => p.teamId);
    expect(r4).toEqual([...teamIds].reverse());
  });

  it("creates draft picks with HYBRID rotation", async () => {
    const teamIds = teams.map((t) => t.id);
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 4, rotation: "HYBRID", snakeStartRound: 3 },
      ctx,
    );

    expect(picks).toHaveLength(16);

    // Rounds 1-2: cyclical (normal order)
    const r1 = picks.filter((p) => p.round === 1).map((p) => p.teamId);
    const r2 = picks.filter((p) => p.round === 2).map((p) => p.teamId);
    expect(r1).toEqual(teamIds);
    expect(r2).toEqual(teamIds);

    // Round 3: first snake round — reversed
    const r3 = picks.filter((p) => p.round === 3).map((p) => p.teamId);
    expect(r3).toEqual([...teamIds].reverse());

    // Round 4: second snake round — normal
    const r4 = picks.filter((p) => p.round === 4).map((p) => p.teamId);
    expect(r4).toEqual(teamIds);
  });

  it("clears existing draft picks when creating a new draft", async () => {
    const teamIds = teams.map((t) => t.id);

    // Create first draft
    await createDraft({ seasonId: season.id, teamIds, rounds: 2, rotation: "CYCLICAL" }, ctx);

    // Create second draft — should replace
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 1, rotation: "CYCLICAL" },
      ctx,
    );

    expect(picks).toHaveLength(4); // Only 1 round now
    const allPicks = await prisma.draftPick.findMany({ where: { seasonId: season.id } });
    expect(allPicks).toHaveLength(4);
  });

  it("rejects duplicate team IDs", async () => {
    await expect(
      createDraft(
        {
          seasonId: season.id,
          teamIds: [teams[0].id, teams[0].id],
          rounds: 1,
          rotation: "CYCLICAL",
        },
        ctx,
      ),
    ).rejects.toThrow("Team list contains duplicate team IDs");
  });

  it("rejects team IDs not belonging to the season", async () => {
    const foreignId = randUuid();
    await expect(
      createDraft(
        { seasonId: season.id, teamIds: [teams[0].id, foreignId], rounds: 1, rotation: "CYCLICAL" },
        ctx,
      ),
    ).rejects.toThrow(`Team ${foreignId} does not belong to this season`);
  });

  it("throws NotFoundError for non-existent season", async () => {
    await expect(
      createDraft(
        {
          seasonId: randUuid(),
          teamIds: [teams[0].id, teams[1].id],
          rounds: 1,
          rotation: "CYCLICAL",
        },
        ctx,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects HYBRID rotation without snakeStartRound", async () => {
    const teamIds = teams.map((t) => t.id);
    await expect(
      createDraft({ seasonId: season.id, teamIds, rounds: 3, rotation: "HYBRID" }, ctx),
    ).rejects.toThrow("snakeStartRound is required for HYBRID rotation");
  });

  it("rejects snakeStartRound exceeding total rounds", async () => {
    const teamIds = teams.map((t) => t.id);
    await expect(
      createDraft(
        { seasonId: season.id, teamIds, rounds: 3, rotation: "HYBRID", snakeStartRound: 5 },
        ctx,
      ),
    ).rejects.toThrow("snakeStartRound cannot exceed total rounds");
  });

  it("sets correct pick numbers within each round", async () => {
    const teamIds = teams.map((t) => t.id);
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 2, rotation: "CYCLICAL" },
      ctx,
    );

    for (let round = 1; round <= 2; round++) {
      const roundPicks = picks.filter((p) => p.round === round);
      expect(roundPicks.map((p) => p.pick)).toEqual([1, 2, 3, 4]);
    }
  });

  it("unassigns drafted players from teams when re-creating draft", async () => {
    const teamIds = teams.map((t) => t.id);

    // Create initial draft
    await createDraft({ seasonId: season.id, teamIds, rounds: 1, rotation: "CYCLICAL" }, ctx);

    // Simulate a player being drafted: create player and assign to a pick
    const player = await insertPlayer({ seasonId: season.id, teamId: teams[0].id });
    const existingPicks = await prisma.draftPick.findMany({ where: { seasonId: season.id } });
    await prisma.draftPick.update({
      where: { id: existingPicks[0].id },
      data: { playerId: player.id },
    });

    // Re-create draft — player should be unassigned from team
    await createDraft({ seasonId: season.id, teamIds, rounds: 2, rotation: "CYCLICAL" }, ctx);

    const updatedPlayer = await prisma.player.findUnique({ where: { id: player.id } });
    expect(updatedPlayer?.teamId).toBeNull();
  });

  it("rejects snakeStartRound for non-HYBRID rotation", async () => {
    const teamIds = teams.map((t) => t.id);
    await expect(
      createDraft(
        { seasonId: season.id, teamIds, rounds: 3, rotation: "CYCLICAL", snakeStartRound: 2 },
        ctx,
      ),
    ).rejects.toThrow("snakeStartRound is only valid for HYBRID rotation");
  });

  it("leaves playerId null on generated picks", async () => {
    const teamIds = teams.map((t) => t.id);
    const picks = await createDraft(
      { seasonId: season.id, teamIds, rounds: 1, rotation: "CYCLICAL" },
      ctx,
    );

    expect(picks.every((p) => p.playerId === null)).toBe(true);
  });
});
