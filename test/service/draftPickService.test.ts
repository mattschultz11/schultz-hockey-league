import { createDraftPick, updateDraftPick } from "@/service/draftPickService";
import { ServiceContext } from "@/service/types";

import prisma from "../lib/prisma";
import {
  insertPlayer,
  insertSeason,
  insertTeam,
  makeDraftPick,
  SeasonModel,
} from "../modelFactory";
import { createCtx } from "../utils";

describe("draftPickService", () => {
  let ctx: ServiceContext;
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
});
