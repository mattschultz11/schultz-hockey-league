import type { Position } from "@/graphql/generated";
import {
  formatPositionRating,
  playerName,
  playerNumber,
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
  player: LineupPlayer;
};

function sortLineup(a: LineupPlayer, b: LineupPlayer) {
  const aGoalie = a.position === "G";
  const bGoalie = b.position === "G";
  if (aGoalie !== bGoalie) return aGoalie ? -1 : 1;
  const aRating = positionRating(a) ?? 0;
  const bRating = positionRating(b) ?? 0;
  return bRating - aRating;
}

export default function GameLineup({ lineup }: { lineup: LineupEntry[] }) {
  const sortedLineup = [...lineup].sort((a, b) => sortLineup(a.player, b.player));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-default-600 text-xs font-medium tracking-wide uppercase">Lineup</span>
      {lineup.length === 0 ? (
        <span className="text-default-600 text-sm">No lineup set</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {sortedLineup.map((lineupEntry) => (
            <li
              key={lineupEntry.id}
              className="bg-default-100 flex items-center gap-2 rounded-md px-2 py-1"
            >
              <span className="text-default-600 w-8 shrink-0 text-right font-mono text-sm">
                #{playerNumber(lineupEntry.player)}
              </span>
              <span className="bg-default-200 w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
                {playerPosition(lineupEntry.player)}
              </span>
              <span className="text-foreground flex-grow text-sm font-medium">
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
