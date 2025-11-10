import type { Prisma } from "@prisma/client";
import { Option, pipe } from "effect";

import type { DraftPickCreateInput, DraftPickUpdateInput } from "../graphql/generated";
import { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput } from "./utils";
import { Predicate } from "effect";

export function getDraftPicks(ctx: ServiceContext) {
  return ctx.prisma.draftPick.findMany();
}

export function getDraftPickById(id: string, ctx: ServiceContext) {
  return ctx.prisma.draftPick.findUnique({ where: { id } });
}

export async function createDraftPick(data: DraftPickCreateInput, ctx: ServiceContext) {
  const player = await pipe(
    data.playerId,
    Option.fromNullable,
    Option.map((playerId) => ctx.prisma.player.findUnique({ where: { id: playerId } })),
    Option.getOrNull,
  );

  return setDraftPickPlayersTeam(data, ctx).then(() =>
    ctx.prisma.draftPick.create({
      data: {
        ...cleanInput(data),
        playerRating: player?.playerRating,
        goalieRating: player?.goalieRating,
      },
    }),
  );
}

async function setDraftPickPlayersTeam(payload: DraftPickCreateInput, ctx: ServiceContext) {
  if (Predicate.isNotNullable(payload.playerId)) {
    await ctx.prisma.player.update({
      where: { id: payload.playerId },
      data: { teamId: payload.teamId },
    });
  }
}

export async function updateDraftPick(id: string, data: DraftPickUpdateInput, ctx: ServiceContext) {
  const payload = cleanInput(data);
  assertNonNullableFields(payload, ["overall", "round", "pick"] as const);

  const player = await pipe(
    payload.playerId,
    Option.fromNullable,
    Option.map((playerId) => ctx.prisma.player.findUnique({ where: { id: playerId } })),
    Option.getOrNull,
  );

  return syncDraftPickPlayersAndTeams(id, payload, ctx).then(() =>
    ctx.prisma.draftPick.update({
      where: { id },
      data: {
        ...(payload as Prisma.DraftPickUncheckedUpdateInput),
        playerRating: player?.playerRating,
        goalieRating: player?.goalieRating,
      },
    }),
  );
}

async function syncDraftPickPlayersAndTeams(
  id: string,
  payload: DraftPickUpdateInput,
  ctx: ServiceContext,
) {
  const draftPick = await ctx.prisma.draftPick.findUniqueOrThrow({ where: { id } });
  const { playerId = draftPick.playerId, teamId = draftPick.teamId } = payload;
  const playerChanged = playerId !== draftPick.playerId;
  const teamChanged = teamId !== draftPick.teamId;

  if (playerChanged) {
    // Remove old player from team
    if (Predicate.isNotNullable(draftPick.playerId)) {
      await ctx.prisma.player.update({
        where: { id: draftPick.playerId },
        data: { teamId: null },
      });
    }
    // Add new player to team
    if (Predicate.isNotNullable(playerId)) {
      await ctx.prisma.player.update({
        where: { id: playerId },
        data: { teamId: teamId },
      });
    }
  } else if (teamChanged && Predicate.isNotNullable(playerId)) {
    // Update current player's team
    await ctx.prisma.player.update({
      where: { id: playerId },
      data: { teamId: teamId },
    });
  }
}

export function deleteDraftPick(id: string, ctx: ServiceContext) {
  return ctx.prisma.draftPick.delete({ where: { id } });
}

export function getDraftPickSeason(draftPickId: string, ctx: ServiceContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).season();
}

export function getDraftPickTeam(draftPickId: string, ctx: ServiceContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).team();
}

export function getDraftPickPlayer(draftPickId: string, ctx: ServiceContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).player();
}
