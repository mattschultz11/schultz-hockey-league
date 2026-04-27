import type { Result } from "@/service/prisma/generated/enums";

/**
 * Prisma where-fragment for "this stat row belongs to a finalized game".
 * Used in player stat queries (lineups, goals, assists, penalties) so the
 * same definition of "finalized" is shared across pages.
 */
export const FINALIZED_GAME_WHERE = { game: { homeTeamResult: { not: null } } };

export type GameStatus = "Upcoming" | "Final" | "Awaiting";

export const STATUS_COLOR: Record<GameStatus, "default" | "success" | "warning"> = {
  Upcoming: "default",
  Final: "success",
  Awaiting: "warning",
};

/**
 * Derives the display status for a game row.
 *
 * Precedence: a game with BOTH results set is always Final, even if its
 * datetime is in the future (e.g. admin edited the schedule after play).
 * Past-scheduled games with at least one missing result render as Awaiting.
 */
export function getGameStatus(
  datetime: Date,
  homeTeamResult: Result | null | undefined,
  awayTeamResult: Result | null | undefined,
  now: Date = new Date(),
): GameStatus {
  if (homeTeamResult != null && awayTeamResult != null) return "Final";
  if (datetime.getTime() >= now.getTime()) return "Upcoming";
  return "Awaiting";
}

type NextUpcomingCandidate = {
  id: string;
  datetime: Date;
  homeTeamResult: Result | null | undefined;
  awayTeamResult: Result | null | undefined;
};

/**
 * Returns the id of the soonest game whose status is `Upcoming`, or null
 * if no upcoming games exist. Final games are skipped even when their
 * datetime is in the future (status precedence — see getGameStatus).
 */
export function findNextUpcomingId(
  games: NextUpcomingCandidate[],
  now: Date = new Date(),
): string | null {
  let next: NextUpcomingCandidate | null = null;
  for (const game of games) {
    if (
      getGameStatus(game.datetime, game.homeTeamResult, game.awayTeamResult, now) !== "Upcoming"
    ) {
      continue;
    }
    if (next === null || game.datetime.getTime() < next.datetime.getTime()) {
      next = game;
    }
  }
  return next?.id ?? null;
}
