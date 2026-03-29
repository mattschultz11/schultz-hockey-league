"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

import DataTable from "./DataTable";

const columns = [
  { key: "round", label: "Round" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
] as const;

type GamesTableProps = {
  games: {
    round: number;
    date: Date;
    time: Date;
    location: string;
    id: string;
    homeTeam: {
      name: string;
    } | null;
    awayTeam: {
      name: string;
    } | null;
  }[];
};

export default function GamesTable({ games }: GamesTableProps) {
  const rows = games.map((game) => ({
    key: game.id,
    round: game.round,
    date: game.date.toLocaleDateString(),
    time: game.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    home: game.homeTeam?.name ?? "TBD",
    away: game.awayTeam?.name ?? "TBD",
    location: game.location,
  }));

  return (
    <DataTable aria-label="Games">
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
