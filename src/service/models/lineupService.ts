import type { LineupCreateInput, SetGameLineupInput } from "@/graphql/generated";
import { ConflictError, NotFoundError } from "@/service/errors";
import type { ServerContext } from "@/types";
import { invariant } from "@/utils/assertionUtils";

import type { Game, Player, Team } from "../prisma";
import { lineupCreateSchema, setGameLineupSchema } from "../validation/schemas";
import { getGameById } from "./gameService";
import { validate } from "./modelServiceUtils";
import { getPlayerById, getPlayersByIds } from "./playerService";
import { getTeamById } from "./teamService";

export function getLineupsByGame(gameId: string, ctx: ServerContext) {
  return ctx.prisma.lineup.findMany({ where: { gameId } });
}

export function getLineupsByGameAndTeam(gameId: string, teamId: string, ctx: ServerContext) {
  return ctx.prisma.lineup.findMany({ where: { gameId, teamId } });
}

export function getLineupsByPlayer(playerId: string, ctx: ServerContext) {
  return ctx.prisma.lineup.findMany({ where: { playerId } });
}

export async function getLineupById(id: string, ctx: ServerContext) {
  const lineup = await ctx.prisma.lineup.findUnique({ where: { id } });
  if (!lineup) throw new NotFoundError("Lineup", id);
  return lineup;
}

export async function addPlayerToLineup(data: LineupCreateInput, ctx: ServerContext) {
  validate(lineupCreateSchema, data);
  const { gameId, teamId, playerId } = data;

  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const player = await getPlayerById(playerId, ctx);

  validateLineupEntry(game, team, player);

  try {
    return await ctx.prisma.lineup.create({ data: { gameId, teamId, playerId } });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "PrismaClientKnownRequestError" &&
      (error as unknown as { code: string }).code === "P2002"
    ) {
      throw new ConflictError("Player is already in a lineup for this game");
    }
    throw error;
  }
}

export async function removePlayerFromLineup(id: string, ctx: ServerContext) {
  await getLineupById(id, ctx);
  return ctx.prisma.lineup.delete({ where: { id } });
}

export async function setGameLineup(data: SetGameLineupInput, ctx: ServerContext) {
  validate(setGameLineupSchema, data);
  const { gameId, teamId, playerIds } = data;

  const game = await getGameById(gameId, ctx);
  const team = await getTeamById(teamId, ctx);
  const players = await getPlayersByIds(playerIds, ctx);
  invariant(players.length === playerIds.length, "One or more players not found");

  validateLineup(game, team, players);

  return ctx.prisma.$transaction(async (tx) => {
    await tx.lineup.deleteMany({ where: { gameId, teamId } });
    await tx.lineup.createMany({
      data: playerIds.map((playerId) => ({ gameId, teamId, playerId })),
    });
    return tx.lineup.findMany({ where: { gameId, teamId } });
  });
}

function validateLineupEntry(game: Game, team: Team, player: Player) {
  validateLineup(game, team, [player]);
}

function validateLineup(game: Game, team: Team, players: Player[]) {
  const opposingTeamId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId;

  invariant(game.homeTeamId === team.id || game.awayTeamId === team.id, "Team must be in the game");
  for (const player of players) {
    invariant(game.seasonId === player.seasonId, "Player must be in the same season as the game");
    invariant(player.teamId !== opposingTeamId, "Player must not be on the opposing team");
  }
}

export async function getLineupEntry(gameId: string, playerId: string, ctx: ServerContext) {
  const lineup = await ctx.prisma.lineup.findUnique({
    where: { gameId_playerId: { gameId, playerId } },
  });
  if (!lineup) throw new NotFoundError("Lineup", `${gameId}/${playerId}`);
  return lineup;
}

// Field resolvers (batching via findUnique().relation())

export async function getLineupGame(lineupId: string, ctx: ServerContext) {
  const game = await ctx.prisma.lineup.findUnique({ where: { id: lineupId } })?.game();
  if (!game) throw new NotFoundError("Lineup", lineupId);
  return game;
}

export async function getLineupTeam(lineupId: string, ctx: ServerContext) {
  const team = await ctx.prisma.lineup.findUnique({ where: { id: lineupId } })?.team();
  if (!team) throw new NotFoundError("Lineup", lineupId);
  return team;
}

export async function getLineupPlayer(lineupId: string, ctx: ServerContext) {
  const player = await ctx.prisma.lineup.findUnique({ where: { id: lineupId } })?.player();
  if (!player) throw new NotFoundError("Lineup", lineupId);
  return player;
}
