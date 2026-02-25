import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createPenalty,
  deletePenalty,
  getPenaltiesBySeason,
  getPenaltyById,
  updatePenalty,
} from "@/service/models/penaltyService";
import { PenaltyCategory } from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { GameModel, PlayerModel, TeamModel } from "../../modelFactory";
import {
  insertGame,
  insertLineup,
  insertPenalty,
  insertPlayer,
  insertSeason,
  insertTeam,
  makePenalty,
} from "../../modelFactory";
import { createCtx } from "../../utils";

describe("penaltyService", () => {
  let ctx: ServerContext;
  let team: TeamModel;
  let player: PlayerModel;
  let game: GameModel;

  beforeAll(async () => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    team = await insertTeam();
    player = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    game = await insertGame({ homeTeamId: team.id });
    await insertLineup({ gameId: game.id, teamId: team.id, playerId: player.id });
  });

  it("can create a penalty", async () => {
    const input = makePenalty({ gameId: game.id, teamId: team.id, playerId: player.id });

    const actual = await createPenalty(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when the penalized player is not in the lineup", async () => {
    const otherPlayer = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });
    const input = makePenalty({ gameId: game.id, teamId: team.id, playerId: otherPlayer.id });

    await expect(() => createPenalty(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when the penalized team is not in the game", async () => {
    const otherTeam = await insertTeam({ seasonId: team.seasonId });
    const otherGame = await insertGame({ seasonId: team.seasonId, homeTeamId: otherTeam.id });
    const input = makePenalty({ gameId: otherGame.id, teamId: team.id, playerId: player.id });

    await expect(() => createPenalty(input, ctx)).rejects.toThrow(NotFoundError);
  });

  it("throws when updating a penalty with a player not in the lineup", async () => {
    const created = await insertPenalty({ gameId: game.id, teamId: team.id, playerId: player.id });
    const otherPlayer = await insertPlayer({ seasonId: team.seasonId, teamId: team.id });

    await expect(() =>
      updatePenalty(
        created.id,
        {
          playerId: otherPlayer.id,
        },
        ctx,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws when updating a penalty to another team without changing the player", async () => {
    const created = await insertPenalty({ gameId: game.id, teamId: team.id, playerId: player.id });
    const otherTeam = await insertTeam({ seasonId: team.seasonId });

    await expect(() =>
      updatePenalty(
        created.id,
        {
          teamId: otherTeam.id,
        },
        ctx,
      ),
    ).rejects.toThrow("Player must be in the lineup for this team");
  });

  it("can get a penalty by id", async () => {
    const penalty = await createPenalty(
      makePenalty({ gameId: game.id, teamId: team.id, playerId: player.id }),
      ctx,
    );

    const found = await getPenaltyById(penalty.id, ctx);

    expect(found).toMatchObject(penalty);
  });

  it("throws NotFoundError when getting a non-existent penalty", async () => {
    await expect(getPenaltyById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list penalties by season", async () => {
    const season = await insertSeason();
    const seasonTeam = await insertTeam({ seasonId: season.id });
    const seasonPlayer = await insertPlayer({ seasonId: season.id, teamId: seasonTeam.id });
    const seasonGame = await insertGame({ seasonId: season.id, homeTeamId: seasonTeam.id });
    await insertLineup({
      gameId: seasonGame.id,
      teamId: seasonTeam.id,
      playerId: seasonPlayer.id,
    });

    await createPenalty(
      makePenalty({ gameId: seasonGame.id, teamId: seasonTeam.id, playerId: seasonPlayer.id }),
      ctx,
    );

    const penalties = await getPenaltiesBySeason(season.id, ctx);

    expect(penalties.length).toBeGreaterThanOrEqual(1);
  });

  it("can update a penalty", async () => {
    const penalty = await createPenalty(
      makePenalty({ gameId: game.id, teamId: team.id, playerId: player.id }),
      ctx,
    );

    const updated = await updatePenalty(
      penalty.id,
      { category: PenaltyCategory.MAJOR, minutes: 5 },
      ctx,
    );

    expect(updated.category).toBe(PenaltyCategory.MAJOR);
    expect(updated.minutes).toBe(5);
  });

  it("can delete a penalty", async () => {
    const penalty = await createPenalty(
      makePenalty({ gameId: game.id, teamId: team.id, playerId: player.id }),
      ctx,
    );

    await deletePenalty(penalty.id, ctx);

    await expect(getPenaltyById(penalty.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
