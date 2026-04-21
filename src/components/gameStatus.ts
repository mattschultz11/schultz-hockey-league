import type { Result } from "@/service/prisma/generated/enums";

export type GameStatus = "Upcoming" | "Final" | "Awaiting";

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
