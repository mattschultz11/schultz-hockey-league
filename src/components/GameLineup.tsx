import { Button } from "@heroui/react";
import { clsx } from "clsx";
import Link from "next/link";

import type { Position } from "@/graphql/generated";
import {
  formatPositionRating,
  playerName,
  playerPosition,
  positionRating,
} from "@/utils/stringUtils";

type LineupPlayer = {
  id: string;
  number: number | null;
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
  teamId: string | null;
  user: { firstName: string | null; lastName: string | null };
};

type LineupEntry = {
  id: string;
  number: number | null;
  player: LineupPlayer;
};

function entryNumber(entry: LineupEntry) {
  return entry.number ?? entry.player.number;
}

function sortLineup(a: LineupEntry, b: LineupEntry) {
  const aGoalie = a.player.position === "G";
  const bGoalie = b.player.position === "G";
  if (aGoalie !== bGoalie) return aGoalie ? -1 : 1;
  const aNumber = entryNumber(a) ?? Number.MAX_SAFE_INTEGER;
  const bNumber = entryNumber(b) ?? Number.MAX_SAFE_INTEGER;
  if (aNumber !== bNumber) return bNumber - aNumber;
  const aRating = positionRating(a.player) ?? 0;
  const bRating = positionRating(b.player) ?? 0;
  return bRating - aRating;
}

type Props = {
  lineup: LineupEntry[];
  direction?: "right" | "left";
  editHref?: string;
};

export default function GameLineup({ lineup, direction, editHref }: Props) {
  const sortedLineup = [...lineup].sort(sortLineup);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={clsx("flex items-center justify-between gap-2", {
          "flex-row-reverse": direction === "right",
        })}
      >
        <span className="text-default-600 text-xs font-medium tracking-wide uppercase">Lineup</span>
        {editHref && (
          <Button
            as={Link}
            href={editHref}
            size="sm"
            variant="solid"
            className="h-6 min-w-0 px-2"
            color="warning"
          >
            Edit
          </Button>
        )}
      </div>
      {lineup.length === 0 ? (
        <span className="text-default-600 text-sm">No lineup set</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {sortedLineup.map((lineupEntry) => (
            <li
              key={lineupEntry.id}
              className={clsx("bg-default-100 flex items-center gap-2 rounded-md px-2 py-1", {
                "flex-row-reverse": direction === "right",
              })}
            >
              <span className="bg-default-200 w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
                {playerPosition(lineupEntry.player)}
              </span>
              <span className="text-default-600 w-8 shrink-0 font-mono text-sm">
                #{entryNumber(lineupEntry) ?? "—"}
              </span>
              <span
                className={clsx("text-foreground grow text-sm font-medium", {
                  "text-right": direction === "right",
                })}
              >
                {playerName(lineupEntry.player)}
              </span>
              <span className="text-default-600 text-sm">
                {formatPositionRating(lineupEntry.player)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
