"use client";

import { Chip, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";

import type { Result } from "@/service/prisma/generated/enums";

import DataTable from "./DataTable";
import { getGameStatus, STATUS_COLOR } from "./gameStatus";

const columns = [
  { key: "round", label: "Round" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
] as const;

export type GamesTableGame = {
  round: number;
  datetime: Date;
  location: string;
  id: string;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
  homeTeamResult: Result | null;
  awayTeamResult: Result | null;
};

type GamesTableProps = {
  games: GamesTableGame[];
  /** Game id to highlight with a "Next Up" chip in the status cell. */
  nextUpId?: string | null;
  league: {
    slug: string;
  };
  season: {
    slug: string;
  };
};

export default function GamesTable({ games, nextUpId, league, season }: GamesTableProps) {
  const router = useRouter();

  const rowHref = (gameId: string) =>
    `/leagues/${league.slug}/seasons/${season.slug}/games/${gameId}`;

  const rows = games.map((game) => {
    const status = getGameStatus(game.datetime, game.homeTeamResult, game.awayTeamResult);
    return {
      key: game.id,
      round: game.round,
      date: game.datetime.toLocaleDateString(),
      time: game.datetime.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      home: game.homeTeam?.name ?? "TBD",
      away: game.awayTeam?.name ?? "TBD",
      location: game.location,
      status,
    };
  });

  return (
    <DataTable
      aria-label="Games"
      onRowAction={
        rowHref
          ? (key) => {
              router.push(rowHref(String(key)));
            }
          : undefined
      }
    >
      <TableHeader>
        {columns.map((col) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="No games">
        {rows.map((row) => {
          const isNextUp = nextUpId != null && nextUpId === row.key && row.status === "Upcoming";
          return (
            <TableRow key={row.key}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === "status" ? (
                    <div className="flex flex-wrap items-center gap-1">
                      <Chip size="sm" color={STATUS_COLOR[row.status]}>
                        {row.status}
                      </Chip>
                      {isNextUp && (
                        <Chip size="sm" variant="flat" color="primary">
                          Next Up
                        </Chip>
                      )}
                    </div>
                  ) : (
                    row[col.key]
                  )}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </DataTable>
  );
}
