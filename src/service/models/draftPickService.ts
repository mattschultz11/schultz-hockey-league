import { Option, pipe } from "effect";

import type { DraftPickCreateInput, DraftPickUpdateInput } from "@/graphql/generated";
import type { DraftPick, Player, Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields, invariant } from "@/utils/assertionUtils";

import { cleanInput } from "./modelServiceUtils";
import { maybeGetPlayerById } from "./playerService";
import { maybeGetTeamById } from "./teamService";

export function getDraftPicksBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findMany({ where: { seasonId }, orderBy: { overall: "asc" } });
}

export function getDraftPickById(id: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id } });
}

export async function createDraftPick(data: DraftPickCreateInput, ctx: ServerContext) {
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

export function getDraftPickSeason(draftPickId: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).season();
}

export function getDraftPickTeam(draftPickId: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).team();
}

export function getDraftPickPlayer(draftPickId: string, ctx: ServerContext) {
  return ctx.prisma.draftPick.findUniqueOrThrow({ where: { id: draftPickId } }).player();
}
