import { Option, pipe } from "effect";

import type {
  CreateDraftInput,
  DraftPickCreateInput,
  DraftPickUpdateInput,
  DraftRotation,
} from "@/graphql/generated";
import { NotFoundError, ValidationError } from "@/service/errors";
import type { DraftPick, Player, Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import {
  createDraftSchema,
  draftPickCreateSchema,
  draftPickUpdateSchema,
} from "../validation/schemas";
import { cleanInput, validate } from "./modelServiceUtils";
import { maybeGetPlayerById } from "./playerService";
import { maybeGetTeamById } from "./teamService";

export function getDraftPicksBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findMany({ where: { seasonId }, orderBy: { overall: "asc" } });
}

export async function createDraft(data: CreateDraftInput, ctx: ServerContext) {
  validate(createDraftSchema, data);

  const { seasonId, teamIds, rounds, rotation, snakeStartRound } = data;

  // Validate season exists
  const season = await ctx.prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) throw new NotFoundError("Season", seasonId);

  // Validate no duplicate team IDs
  const uniqueIds = new Set(teamIds);
  if (uniqueIds.size !== teamIds.length) {
    throw new ValidationError("Team list contains duplicate team IDs");
  }

  // Validate all teams belong to this season
  const teams = await ctx.prisma.team.findMany({
    where: { seasonId },
    select: { id: true },
  });
  const seasonTeamIds = new Set(teams.map((t) => t.id));
  for (const teamId of teamIds) {
    if (!seasonTeamIds.has(teamId)) {
      throw new ValidationError(`Team ${teamId} does not belong to this season`);
    }
  }

  // Validate snakeStartRound rules
  if (rotation === "HYBRID" && snakeStartRound == null) {
    throw new ValidationError("snakeStartRound is required for HYBRID rotation");
  }
  if (rotation !== "HYBRID" && snakeStartRound != null) {
    throw new ValidationError("snakeStartRound is only valid for HYBRID rotation");
  }
  if (rotation === "HYBRID" && snakeStartRound != null && snakeStartRound > rounds) {
    throw new ValidationError("snakeStartRound cannot exceed total rounds");
  }

  // Generate draft picks
  const picks: Prisma.DraftPickCreateManyInput[] = [];
  let overall = 1;

  for (let round = 1; round <= rounds; round++) {
    const order = getTeamOrderForRound(teamIds, round, rotation, snakeStartRound);
    for (let pickInRound = 0; pickInRound < order.length; pickInRound++) {
      picks.push({
        seasonId,
        overall,
        round,
        pick: pickInRound + 1,
        teamId: order[pickInRound],
      });
      overall++;
    }
  }

  // Unassign players from teams for existing draft picks, then clear and recreate
  await ctx.prisma.$transaction([
    ctx.prisma.player.updateMany({
      where: { seasonId, teamId: { not: null }, draftPick: { isNot: null } },
      data: { teamId: null },
    }),
    ctx.prisma.draftPick.deleteMany({ where: { seasonId } }),
    ctx.prisma.draftPick.createMany({ data: picks }),
  ]);

  return ctx.prisma.draftPick.findMany({
    where: { seasonId },
    orderBy: { overall: "asc" },
  });
}

function getTeamOrderForRound(
  teamIds: readonly string[],
  round: number,
  rotation: DraftRotation,
  snakeStartRound: number | null | undefined,
): string[] {
  switch (rotation) {
    case "CYCLICAL":
      return [...teamIds];
    case "SNAKE":
      return round % 2 === 0 ? [...teamIds].reverse() : [...teamIds];
    case "HYBRID": {
      // snakeStartRound is guaranteed non-null by validation
      const snakeStart = snakeStartRound!;
      if (round < snakeStart) {
        return [...teamIds]; // cyclical rounds
      }
      // Snake rounds: reverse on even rounds relative to snake start
      const snakeRound = round - snakeStart + 1;
      return snakeRound % 2 === 0 ? [...teamIds] : [...teamIds].reverse();
    }
  }
}

export async function getDraftPickById(id: string, ctx: ServerContext) {
  const draftPick = await ctx.prisma.draftPick.findUnique({ where: { id } });
  if (!draftPick) throw new NotFoundError("DraftPick", id);
  return draftPick;
}

export async function createDraftPick(data: DraftPickCreateInput, ctx: ServerContext) {
  validate(draftPickCreateSchema, data);
  const player = await maybeGetPlayerById(data.playerId, ctx);
  const team = await maybeGetTeamById(data.teamId, ctx);

  validateDraftPick(data.seasonId, player, team);

  const queries: Prisma.PrismaPromise<unknown>[] = [
    ctx.prisma.draftPick.create({
      data: {
        ...cleanInput(data),
        playerRating: Option.getOrNull(player)?.playerRating,
        goalieRating: Option.getOrNull(player)?.goalieRating,
      },
    }),
  ];

  Option.map(player, (player) =>
    queries.push(
      ctx.prisma.player.update({
        where: { id: player.id },
        data: { teamId: data.teamId },
      }),
    ),
  );

  return (await ctx.prisma.$transaction(queries))[0] as DraftPick;
}

export async function updateDraftPick(id: string, data: DraftPickUpdateInput, ctx: ServerContext) {
  validate(draftPickUpdateSchema, data);
  const payload = cleanInput(data);
  assertNonNullableFields(payload, ["overall", "round", "pick"] as const);

  const draftPick = await getDraftPickById(id, ctx);
  const { playerId = draftPick.playerId, teamId = draftPick.teamId } = payload;

  const player = await maybeGetPlayerById(playerId, ctx);
  const team = await maybeGetTeamById(teamId, ctx);

  validateDraftPick(draftPick.seasonId, player, team);

  const transaction = await ctx.prisma.$transaction([
    ctx.prisma.draftPick.update({
      where: { id },
      data: {
        ...(payload as Prisma.DraftPickUncheckedUpdateInput),
        playerRating: Option.getOrNull(player)?.playerRating,
        goalieRating: Option.getOrNull(player)?.goalieRating,
      },
    }),
    ...syncDraftPickPlayersAndTeams(draftPick, player, team, ctx),
  ]);

  return transaction[0];
}

function validateDraftPick(
  seasonId: string,
  player: Option.Option<Player>,
  team: Option.Option<Team>,
) {
  Option.map(player, (player) =>
    invariant(player.seasonId === seasonId, "Player must be in the same season as the draft pick"),
  );

  Option.map(team, (team) =>
    invariant(team.seasonId === seasonId, "Team must be in the same season as the draft pick"),
  );
}

function syncDraftPickPlayersAndTeams(
  oldDraftPick: DraftPick,
  player: Option.Option<Player>,
  team: Option.Option<Team>,
  ctx: ServerContext,
) {
  const playerChanged = Option.getOrNull(player)?.id !== oldDraftPick.playerId;
  const teamChanged = Option.getOrNull(team)?.id !== oldDraftPick.teamId;

  const queries: Prisma.PrismaPromise<unknown>[] = [];

  if (playerChanged) {
    // Remove old player from team
    pipe(
      oldDraftPick.playerId,
      Option.fromNullable,
      Option.map((id) =>
        queries.push(
          ctx.prisma.player.update({
            where: { id },
            data: { teamId: null },
          }),
        ),
      ),
    );

    // Add new player to team
    Option.map(player, (player) =>
      queries.push(
        ctx.prisma.player.update({
          where: { id: player.id },
          data: { teamId: Option.getOrNull(team)?.id },
        }),
      ),
    );
  } else if (teamChanged) {
    // Update current player's team
    Option.map(player, (player) =>
      queries.push(
        ctx.prisma.player.update({
          where: { id: player.id },
          data: { teamId: Option.getOrNull(team)?.id },
        }),
      ),
    );
  }

  return queries;
}

export function deleteDraftPick(id: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.delete({ where: { id } });
}

export async function getDraftPickSeason(draftPickId: string, ctx: ServerContext) {
  const season = await ctx.prisma.draftPick.findUnique({ where: { id: draftPickId } })?.season();
  if (!season) throw new NotFoundError("DraftPick", draftPickId);
  return season;
}

export async function getDraftPickTeam(draftPickId: string, ctx: ServerContext) {
  return (await ctx.prisma.draftPick.findUnique({ where: { id: draftPickId } })?.team()) ?? null;
}

export async function getDraftPickPlayer(draftPickId: string, ctx: ServerContext) {
  return (await ctx.prisma.draftPick.findUnique({ where: { id: draftPickId } })?.player()) ?? null;
}
