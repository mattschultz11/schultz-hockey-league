"use client";

import type { SortDescriptor } from "@heroui/react";
import { Switch, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { Position } from "@/graphql/generated";
import { useUserRole } from "@/hooks/useUserRole";
import {
  formatPhoneNumber,
  formatPositionRating,
  playerName,
  playerPosition,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";

export type PlayersTablePlayer = {
  number: number | null;
  draftPick: {
    round: number;
  } | null;
  position: Position | null;
  id: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
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
};

const columns = [
  { key: "pick", label: "Pick" },
  { key: "name", label: "Name" },
  { key: "position", label: "Pos" },
  { key: "rating", label: "Rtg" },
  { key: "number", label: "#" },
  { key: "games", label: "GP" },
  { key: "goals", label: "G" },
  { key: "assists", label: "A" },
  { key: "points", label: "Pts" },
  { key: "ppg", label: "PPG" },
  { key: "pim", label: "PIM" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const CONTACT_COLUMNS: ColumnKey[] = ["email", "phone"];

type Row = {
  key: string;
  pick: number;
  name: string;
  number: number | null;
  rating: string;
  position: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  ppg: number;
  pim: number;
  email: string;
  phone: string;
  href: string;
};

function playerStats(player: PlayersTablePlayer) {
  const goals = player._count.goals;
  const assists = player._count.primaryAssists + player._count.secondaryAssists;
  const points = goals + assists;
  const games = player._count.lineups;
  const ppg = points / (points > 0 ? games : 1);
  const pim = player.penalties.reduce((acc, penalty) => acc + penalty.minutes, 0);
  return { goals, assists, points, games, ppg, pim };
}

function comparePlayers(a: Row, b: Row, column: ColumnKey): number {
  switch (column) {
    case "number":
      return (a.number ?? Number.POSITIVE_INFINITY) - (b.number ?? Number.POSITIVE_INFINITY);
    case "name": {
      return a.name.localeCompare(b.name);
    }
    case "position":
      return (a.position ?? "").localeCompare(b.position ?? "");
    case "rating":
      return a.rating.localeCompare(b.rating);
    case "email":
      return a.email.localeCompare(b.email);
    case "phone":
      return a.phone.localeCompare(b.phone);
    case "pick":
    case "games":
    case "goals":
    case "assists":
    case "points":
    case "ppg":
    case "pim": {
      return a[column] - b[column];
    }
    default:
      return 0;
  }
}

export default function TeamPlayersTable({ players, league, season }: PlayersTableProps) {
  const router = useRouter();
  const { isManager, isAdmin } = useUserRole();
  const canViewContact = isManager || isAdmin;
  const [showContact, setShowContact] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "pick",
    direction: "ascending",
  });

  const rows = useMemo(
    () =>
      players.map((player) => {
        const stats = playerStats(player);
        return {
          key: player.id,
          pick: player.draftPick?.round ?? 0,
          name: playerName(player),
          number: player.number,
          rating: formatPositionRating(player),
          position: playerPosition(player),
          games: stats.games,
          goals: stats.goals,
          assists: stats.assists,
          points: stats.points,
          ppg: stats.ppg,
          pim: stats.pim,
          email: player.user.email,
          phone: formatPhoneNumber(player.user.phone),
          href: `/leagues/${league?.slug}/seasons/${season?.slug}/players/${player.id}`,
        };
      }),
    [players, league, season],
  );

  const sortedRows = useMemo(() => {
    const column = sortDescriptor.column as ColumnKey;
    const sorted = [...rows].sort((a, b) => comparePlayers(a, b, column));
    return sortDescriptor.direction === "descending" ? sorted.reverse() : sorted;
  }, [rows, sortDescriptor]);

  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => setSortDescriptor(descriptor),
    [],
  );

  const rowsById = new Map(rows.map((row) => [row.key, row]));
  const filteredColumns = columns.filter(
    (col) => (canViewContact && showContact) || !CONTACT_COLUMNS.includes(col.key),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Roster</h2>
        {canViewContact && (
          <div className="flex justify-end">
            <Switch isSelected={showContact} onValueChange={setShowContact} size="sm">
              Show contact info
            </Switch>
          </div>
        )}
      </div>
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
          {sortedRows.map((row) => (
            <TableRow key={row.key}>
              {filteredColumns.map((col) => (
                <TableCell key={col.key} className="whitespace-nowrap">
                  {row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </section>
  );
}
