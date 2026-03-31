"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

import type { Position } from "@/graphql/generated";
import {
  playerName,
  playerNumber,
  playerPosition,
  playerRating,
  teamName,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";

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

type PlayersTableProps = {
  players: {
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
  }[];
};

export default function PlayersTable({ players }: PlayersTableProps) {
  const rows = players.map((player) => {
    const goals = player._count.goals;
    const assists = player._count.primaryAssists + player._count.secondaryAssists;
    const points = goals + assists;
    const ppg = points / (points > 0 ? player._count.lineups : 1);
    const pim = player.penalties.reduce((acc, penalty) => acc + penalty.minutes, 0);

    return {
      key: player.id,
      name: playerName(player),
      team: teamName(player.team),
      number: playerNumber(player),
      rating: playerRating(player),
      position: playerPosition(player),
      games: player._count.lineups,
      goals,
      assists,
      points,
      ppg,
      pim,
    };
  });

  return (
    <DataTable aria-label="Players">
      <TableHeader>
        {columns.map((col) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            {columns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
