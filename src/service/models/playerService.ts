import { Option } from "effect";

import type {
  PlayerCatalogFilter,
  PlayerCreateInput,
  PlayerUpdateInput,
} from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Prisma, Team } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { invariant } from "@/utils/assertionUtils";

import { playerCreateSchema, playerUpdateSchema } from "../validation/schemas";
import { cleanInput, maybeGet, validate } from "./modelServiceUtils";
import { maybeGetTeamById } from "./teamService";

export function getPlayersBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.player.findMany({ where: { seasonId } });
}

export function getPlayerCatalog(filter: PlayerCatalogFilter, ctx: ServerContext) {
  const where: Prisma.PlayerWhereInput = { seasonId: filter.seasonId };

  if (filter.search) {
    const term = filter.search;
    where.user = {
      OR: [{ firstName: { contains: term } }, { lastName: { contains: term } }],
    };
  }

  if (filter.position) {
    where.position = filter.position;
  }

  if (filter.classification) {
    where.classification = filter.classification;
  }

  if (filter.minPlayerRating != null || filter.maxPlayerRating != null) {
    where.playerRating = {
      ...(filter.minPlayerRating != null && { gte: filter.minPlayerRating }),
      ...(filter.maxPlayerRating != null && { lte: filter.maxPlayerRating }),
    };
  }

  if (filter.minGoalieRating != null || filter.maxGoalieRating != null) {
    where.goalieRating = {
      ...(filter.minGoalieRating != null && { gte: filter.minGoalieRating }),
      ...(filter.maxGoalieRating != null && { lte: filter.maxGoalieRating }),
    };
  }

  if (filter.available === true) {
    where.team = { is: null };
  } else if (filter.available === false) {
    where.team = { isNot: null };
  }

  return ctx.prisma.player.findMany({
    where,
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
  });
}

export async function getPlayerById(id: string, ctx: ServerContext) {
  const player = await ctx.prisma.player.findUnique({ where: { id } });
  if (!player) throw new NotFoundError("Player", id);
  return player;
}

export async function getPlayersByIds(ids: string[], ctx: ServerContext) {
  const players = await ctx.prisma.player.findMany({ where: { id: { in: ids } } });
  if (players.length !== ids.length) {
    throw new NotFoundError(
      "Player",
      ids.filter((id) => !players.some((player) => player.id === id)).join(", "),
    );
  }
  return players;
}

export function maybeGetPlayerById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => getPlayerById(id, ctx), id);
}

export async function createPlayer(data: PlayerCreateInput, ctx: ServerContext) {
  const validated = validate(playerCreateSchema, data);
  const team = await maybeGetTeamById(validated.teamId, ctx);

  validatePlayerTeam(validated.seasonId, team);

  return ctx.prisma.player.create({ data: cleanInput(validated) });
}

export async function updatePlayer(id: string, data: PlayerUpdateInput, ctx: ServerContext) {
  const validated = validate(playerUpdateSchema, data);
  const player = await getPlayerById(id, ctx);
  const team = await maybeGetTeamById(validated.teamId ?? player.teamId, ctx);

  validatePlayerTeam(player.seasonId, team);

  return ctx.prisma.player.update({
    where: { id },
    data: cleanInput(validated),
  });
}

function validatePlayerTeam(seasonId: string, team: Option.Option<Team>) {
  Option.map(team, (team) =>
    invariant(team.seasonId === seasonId, "Team must be in the same season as the player"),
  );
}

export function deletePlayer(id: string, ctx: ServerContext) {
  return ctx.prisma.player.delete({ where: { id } });
}

export async function getPlayerUser(playerId: string, ctx: ServerContext) {
  return (await ctx.prisma.player.findUnique({ where: { id: playerId } })?.user())!;
}

export async function getPlayerSeason(playerId: string, ctx: ServerContext) {
  return (await ctx.prisma.player.findUnique({ where: { id: playerId } })?.season())!;
}

export async function getPlayerManagedTeam(playerId: string, ctx: ServerContext) {
  return await ctx.prisma.player.findUnique({ where: { id: playerId } })?.managedTeam();
}

export async function getPlayerTeam(playerId: string, ctx: ServerContext) {
  return await ctx.prisma.player.findUnique({ where: { id: playerId } })?.team();
}

export async function getPlayerGoals(playerId: string, ctx: ServerContext) {
  const goals = await ctx.prisma.player.findUnique({ where: { id: playerId } })?.goals();
  return goals ?? [];
}

export function getPlayerAssists(playerId: string, ctx: ServerContext) {
  return ctx.prisma.goal.findMany({
    where: { OR: [{ primaryAssistId: playerId }, { secondaryAssistId: playerId }] },
  });
}

export async function getPlayerPenalties(playerId: string, ctx: ServerContext) {
  const penalties = await ctx.prisma.player.findUnique({ where: { id: playerId } })?.penalties();
  return penalties ?? [];
}

export async function getPlayerDraftPick(playerId: string, ctx: ServerContext) {
  return await ctx.prisma.player.findUnique({ where: { id: playerId } })?.draftPick();
}
