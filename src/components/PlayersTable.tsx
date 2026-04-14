"use client";

import type { SortDescriptor } from "@heroui/react";
import { Button, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { Position } from "@/graphql/generated";
import {
  formatPositionRating,
  playerName,
  playerNumber,
  playerPosition,
  positionRating,
  teamName,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";

export type PlayersTablePlayer = {
  number: number | null;
  team: {
    name: string;
    id: string;
    slug: string;
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
  isAdmin?: boolean;
  leagueSlug?: string;
  seasonSlug?: string;
};

const columns = [
  { key: "number", label: "#" },
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "team", label: "Team" },
  { key: "rating", label: "Rating" },
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

export default function PlayersTable({
  players,
  isAdmin = false,
  leagueSlug,
  seasonSlug,
}: PlayersTableProps) {
  const router = useRouter();
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const sortedPlayers = useMemo(() => {
    const column = sortDescriptor.column as ColumnKey;
    const sorted = [...players].sort((a, b) => comparePlayers(a, b, column));
    return sortDescriptor.direction === "descending" ? sorted.reverse() : sorted;
  }, [players, sortDescriptor]);

  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  }, []);

  const handleSelectionChange = useCallback((keys: "all" | Set<React.Key>) => {
    if (keys === "all") {
      setSelectedKeys(new Set());
      return;
    }
    const next = new Set<string>();
    for (const key of keys) {
      next.add(key.toString());
    }
    setSelectedKeys(next);
  }, []);

  const selectedId = selectedKeys.size > 0 ? selectedKeys.values().next().value : null;

  function handleEditPlayer() {
    if (!selectedId || !leagueSlug || !seasonSlug) return;
    router.push(`/admin/leagues/${leagueSlug}/seasons/${seasonSlug}/players/${selectedId}/edit`);
  }

  const rows = sortedPlayers.map((player) => {
    const stats = playerStats(player);
    return {
      key: player.id,
      name: playerName(player),
      team: teamName(player.team),
      number: playerNumber(player),
      rating: formatPositionRating(player),
      position: playerPosition(player),
      games: stats.games,
      goals: stats.goals,
      assists: stats.assists,
      points: stats.points,
      ppg: stats.ppg,
      pim: stats.pim,
    };
  });

  return (
    <DataTable
      aria-label="Players"
      sortDescriptor={sortDescriptor}
      onSortChange={handleSortChange}
      selectionMode={isAdmin ? "single" : "none"}
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelectionChange}
    >
      <TableHeader>
        {[
          ...columns.map((col) => (
            <TableColumn key={col.key} allowsSorting>
              {col.label}
            </TableColumn>
          )),
          ...(isAdmin
            ? [
                <TableColumn key="actions" width={72}>
                  {""}
                </TableColumn>,
              ]
            : []),
        ]}
      </TableHeader>
      <TableBody emptyContent="No players">
        {rows.map((row) => (
          <TableRow key={row.key}>
            {[
              ...columns.map((col) => <TableCell key={col.key}>{row[col.key]}</TableCell>),
              ...(isAdmin
                ? [
                    <TableCell key="actions" className="p-1">
                      {selectedKeys.has(row.key) ? (
                        <Button
                          size="sm"
                          color="primary"
                          className="h-7"
                          onPress={handleEditPlayer}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </TableCell>,
                  ]
                : []),
            ]}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
