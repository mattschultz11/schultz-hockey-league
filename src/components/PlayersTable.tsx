"use client";

import type { SortDescriptor } from "@heroui/react";
import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { Position } from "@/graphql/generated";
import {
  formatPositionRating,
  playerName,
  playerNumber,
  playerPosition,
  positionRating,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";
import TeamName from "./TeamName";

export type PlayersTablePlayer = {
  number: number | null;
  draftPick: {
    overall: number;
  } | null;
  team: {
    name: string;
    id: string;
    slug: string;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null;
  position: Position | null;
  id: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
  _count: {
    goals: number;
    primaryAssists: number;
    secondaryAssists: number;
    lineups: number;
  };
  playerRating: number | null;
  goalieRating: number | null;
  penalties: {
    id: string;
    minutes: number;
  }[];
};

type PlayersTableProps = {
  players: PlayersTablePlayer[];
  league?: { slug: string };
  season?: { slug: string };
  hideTeam?: boolean;
};

const columns = [
  { key: "pick", label: "Pick" },
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "rating", label: "Rating" },
  { key: "team", label: "Team" },
  { key: "number", label: "#" },
  { key: "games", label: "GP" },
  { key: "goals", label: "G" },
  { key: "assists", label: "A" },
  { key: "points", label: "Pts" },
  { key: "ppg", label: "PPG" },
  { key: "pim", label: "PIM" },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

function playerStats(player: PlayersTablePlayer) {
  const goals = player._count.goals;
  const assists = player._count.primaryAssists + player._count.secondaryAssists;
  const points = goals + assists;
  const games = player._count.lineups;
  const ppg = points / (points > 0 ? games : 1);
  const pim = player.penalties.reduce((acc, penalty) => acc + penalty.minutes, 0);
  return { goals, assists, points, games, ppg, pim };
}

function comparePlayers(a: PlayersTablePlayer, b: PlayersTablePlayer, column: ColumnKey): number {
  switch (column) {
    case "pick":
      return (
        (a.draftPick?.overall ?? Number.POSITIVE_INFINITY) -
        (b.draftPick?.overall ?? Number.POSITIVE_INFINITY)
      );
    case "number":
      return (a.number ?? Number.POSITIVE_INFINITY) - (b.number ?? Number.POSITIVE_INFINITY);
    case "name": {
      const aName = [a.user.lastName, a.user.firstName].filter(Boolean).join(", ");
      const bName = [b.user.lastName, b.user.firstName].filter(Boolean).join(", ");
      return aName.localeCompare(bName);
    }
    case "position":
      return (a.position ?? "").localeCompare(b.position ?? "");
    case "team":
      return (a.team?.name ?? "").localeCompare(b.team?.name ?? "");
    case "rating":
      return (
        (positionRating(a) ?? Number.POSITIVE_INFINITY) -
        (positionRating(b) ?? Number.POSITIVE_INFINITY)
      );
    case "games":
    case "goals":
    case "assists":
    case "points":
    case "ppg":
    case "pim": {
      const aStats = playerStats(a);
      const bStats = playerStats(b);
      return aStats[column] - bStats[column];
    }
    default:
      return 0;
  }
}

export default function PlayersTable({ players, league, season, hideTeam }: PlayersTableProps) {
  const router = useRouter();
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "points",
    direction: "ascending",
  });

  const sortedPlayers = useMemo(() => {
    const column = sortDescriptor.column as ColumnKey;
    const sorted = [...players].sort((a, b) => comparePlayers(a, b, column));
    return sortDescriptor.direction === "descending" ? sorted.reverse() : sorted;
  }, [players, sortDescriptor]);

  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  }, []);

  const rows = sortedPlayers.map((player) => {
    const stats = playerStats(player);
    return {
      key: player.id,
      pick: player.draftPick?.overall,
      name: playerName(player),
      team: player.team,
      number: playerNumber(player),
      rating: formatPositionRating(player),
      position: playerPosition(player),
      games: stats.games,
      goals: stats.goals,
      assists: stats.assists,
      points: stats.points,
      ppg: stats.ppg,
      pim: stats.pim,
      href: `/leagues/${league?.slug}/seasons/${season?.slug}/players/${player.id}`,
    };
  });

  const rowsById = new Map(rows.map((row) => [row.key, row]));
  const filteredColumns = hideTeam ? columns.filter((col) => col.key !== "team") : columns;

  return (
    <DataTable
      aria-label="Players"
      sortDescriptor={sortDescriptor}
      onSortChange={handleSortChange}
      onRowAction={(key) => {
        router.push(rowsById.get(String(key))?.href ?? "");
      }}
    >
      <TableHeader>
        {filteredColumns.map((col) => (
          <TableColumn key={col.key} allowsSorting>
            {col.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="No players">
        {rows.map((row) => (
          <TableRow key={row.key}>
            {filteredColumns.map((col) => (
              <TableCell key={col.key}>
                {col.key === "team" ? row.team ? <TeamName team={row.team} /> : "-" : row[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
