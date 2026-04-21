"use client";

import {
  Button,
  Chip,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useRouter } from "next/navigation";

import type { Result } from "@/service/prisma/generated/enums";

import DataTable from "./DataTable";
import type { GameStatus } from "./gameStatus";
import { getGameStatus } from "./gameStatus";

const columns = [
  { key: "round", label: "Round" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
] as const;

const STATUS_COLOR: Record<GameStatus, "default" | "success" | "warning"> = {
  Upcoming: "default",
  Final: "success",
  Awaiting: "warning",
};

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
              ...columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === "status" ? (
                    <Chip size="sm" color={STATUS_COLOR[row.status]}>
                      {row.status}
                    </Chip>
                  ) : (
                    row[col.key]
                  )}
                </TableCell>
              )),
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
