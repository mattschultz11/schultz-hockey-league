"use client";

import type { SortDescriptor } from "@heroui/react";
import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Result } from "@/service/prisma/generated/enums";

import DataTable from "./DataTable";
import TeamName from "./TeamName";

const columns = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Name" },
  { key: "games", label: "GP" },
  { key: "wins", label: "W" },
  { key: "losses", label: "L" },
  { key: "ties", label: "T" },
  { key: "points", label: "Pts" },
  { key: "goalsFor", label: "GF" },
  { key: "goalsAgainst", label: "GA" },
  { key: "plusMinus", label: "+/-" },
  { key: "pim", label: "PIM" },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

type StandingsTableProps = {
  teams: {
    id: string;
    slug: string;
    name: string;
    _count: {
      goals: number;
      goalsAgainst: number;
    };
    abbreviation: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    homeGames: {
      id: string;
      homeTeamResult: string | null;
      homeTeamPoints: number | null;
    }[];
    awayGames: {
      id: string;
      awayTeamResult: string | null;
      awayTeamPoints: number | null;
    }[];
    penalties: {
      minutes: number;
    }[];
    standing: {
      rank: number;
    } | null;
  }[];
  league: {
    slug: string;
  };
  season: {
    slug: string;
  };
};

export default function StandingsTable({ teams, league, season }: StandingsTableProps) {
  const router = useRouter();
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "rank",
    direction: "ascending",
  });

  const rows = useMemo(
    () =>
      teams.map((team) => ({
        id: team.id,
        rank: team.standing?.rank ?? 0,
        name: team.name,
        team,
        games: team.homeGames.length + team.awayGames.length,
        wins:
          team.homeGames.filter((g) => g.homeTeamResult === Result.WIN).length +
          team.awayGames.filter((g) => g.awayTeamResult === Result.WIN).length,
        losses:
          team.homeGames.filter((g) => g.homeTeamResult === Result.LOSS).length +
          team.awayGames.filter((g) => g.awayTeamResult === Result.LOSS).length,
        ties:
          team.homeGames.filter((g) => g.homeTeamResult === Result.TIE).length +
          team.awayGames.filter((g) => g.awayTeamResult === Result.TIE).length,
        points:
          team.homeGames.reduce((acc, g) => acc + (g.homeTeamPoints ?? 0), 0) +
          team.awayGames.reduce((acc, g) => acc + (g.awayTeamPoints ?? 0), 0),
        goalsFor: team._count.goals,
        goalsAgainst: team._count.goalsAgainst,
        plusMinus: team._count.goals - team._count.goalsAgainst,
        pim: team.penalties.reduce((acc, p) => acc + p.minutes, 0),
        href: `/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}`,
      })),
    [teams, league.slug, season.slug],
  );

  const sortedRows = useMemo(() => {
    const column = sortDescriptor.column as ColumnKey;
    const sorted = [...rows].sort((a, b) => {
      const va = a[column];
      const vb = b[column];
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb));
    });
    return sortDescriptor.direction === "descending" ? sorted.reverse() : sorted;
  }, [rows, sortDescriptor]);

  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  }, []);

  const rowsById = new Map(sortedRows.map((row) => [row.id, row]));

  return (
    <DataTable
      aria-label="Standings"
      sortDescriptor={sortDescriptor}
      onSortChange={handleSortChange}
      onRowAction={(key) => {
        router.push(rowsById.get(String(key))?.href ?? "");
      }}
    >
      <TableHeader>
        {columns.map((col) => (
          <TableColumn key={col.key} allowsSorting>
            {col.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {col.key === "name" ? <TeamName team={row.team} /> : row[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
