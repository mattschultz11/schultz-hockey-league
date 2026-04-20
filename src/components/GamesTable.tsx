"use client";

import { Button, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";

import DataTable from "./DataTable";

const columns = [
  { key: "round", label: "Round" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
] as const;

export type GamesTableGame = {
  round: number;
  datetime: Date;
  location: string;
  id: string;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
};

type GamesTableProps = {
  games: GamesTableGame[];
  isAdmin?: boolean;
  league: {
    slug: string;
  };
  season: {
    slug: string;
  };
};

export default function GamesTable({ games, isAdmin, league, season }: GamesTableProps) {
  const router = useRouter();
  const showActions = !!(isAdmin && league.slug && season.slug);

  const rows = games.map((game) => ({
    key: game.id,
    round: game.round,
    date: game.datetime.toLocaleDateString(undefined, { timeZone: "UTC" }),
    time: game.datetime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }),
    home: game.homeTeam?.name ?? "TBD",
    away: game.awayTeam?.name ?? "TBD",
    location: game.location,
  }));

  return (
    <DataTable aria-label="Games">
      <TableHeader>
        {[
          ...columns.map((col) => <TableColumn key={col.key}>{col.label}</TableColumn>),
          ...(showActions
            ? [
                <TableColumn key="actions" width={80}>
                  {""}
                </TableColumn>,
              ]
            : []),
        ]}
      </TableHeader>
      <TableBody emptyContent="No games">
        {rows.map((row) => (
          <TableRow key={row.key}>
            {[
              ...columns.map((col) => <TableCell key={col.key}>{row[col.key]}</TableCell>),
              ...(showActions
                ? [
                    <TableCell key="actions" className="p-1">
                      <Button
                        size="sm"
                        color="primary"
                        className="h-7"
                        onPress={() =>
                          router.push(
                            `/admin/leagues/${league.slug}/seasons/${season.slug}/games/${row.key}/edit`,
                          )
                        }
                      >
                        Edit
                      </Button>
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
