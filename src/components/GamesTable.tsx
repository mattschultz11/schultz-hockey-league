"use client";

import { Chip, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";

import type { Result } from "@/service/prisma/generated/enums";

import DataTable from "./DataTable";
import { getGameStatus, STATUS_COLOR } from "./gameStatus";
import TeamName from "./TeamName";

const columns = [
  { key: "round", label: "Round" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
] as const;

type GamesTableTeam = {
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type GamesTableGame = {
  id: string;
  round: number;
  datetime: Date;
  location: string;
  homeTeam: GamesTableTeam | null;
  awayTeam: GamesTableTeam | null;
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
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      location: game.location,
      status,
      href: `/leagues/${league.slug}/seasons/${season.slug}/games/${game.id}`,
    };
  });

  const rowsById = new Map(rows.map((row) => [row.key, row]));

  return (
    <DataTable
      aria-label="Games"
      onRowAction={(key) => {
        router.push(rowsById.get(String(key))?.href ?? "");
      }}
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
                <TableCell key={col.key}>{renderCell(col.key, row, isNextUp)}</TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </DataTable>
  );
}

type Row = {
  key: string;
  round: number;
  date: string;
  time: string;
  homeTeam: GamesTableTeam | null;
  awayTeam: GamesTableTeam | null;
  location: string;
  status: ReturnType<typeof getGameStatus>;
};

function renderCell(key: (typeof columns)[number]["key"], row: Row, isNextUp: boolean) {
  switch (key) {
    case "home":
      return row.homeTeam ? <TeamName team={row.homeTeam} outlineWidth={0.5} /> : "TBD";
    case "away":
      return row.awayTeam ? <TeamName team={row.awayTeam} outlineWidth={0.5} /> : "TBD";
    case "status":
      return (
        <div className="flex flex-wrap items-center gap-1">
          {isNextUp ? (
            <Chip size="sm" variant="dot" color="primary">
              Next Up
            </Chip>
          ) : (
            <Chip size="sm" color={STATUS_COLOR[row.status]}>
              {row.status}
            </Chip>
          )}
        </div>
      );
    default:
      return row[key];
  }
}
