"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useMemo } from "react";

import { Result } from "@/service/prisma/generated/enums";

import DataTable from "./DataTable";

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

function buildGoalsAgainstMap(
  teams: {
    id: string;
    homeGames: { id: string }[];
    awayGames: { id: string }[];
  }[],
  goals: { gameId: string; teamId: string }[],
) {
  const goalsAgainstMap = new Map<string, number>();
  const teamGameIds = new Map<string, Set<string>>();
  for (const team of teams) {
    const gameIds = new Set([
      ...team.homeGames.map((g) => g.id),
      ...team.awayGames.map((g) => g.id),
    ]);
    teamGameIds.set(team.id, gameIds);
    goalsAgainstMap.set(team.id, 0);
  }
  for (const goal of goals) {
    for (const [teamId, gameIds] of teamGameIds) {
      if (gameIds.has(goal.gameId) && goal.teamId !== teamId) {
        goalsAgainstMap.set(teamId, (goalsAgainstMap.get(teamId) ?? 0) + 1);
      }
    }
  }
  return goalsAgainstMap;
}

type StandingsTableProps = {
  teams: {
    id: string;
    slug: string;
    name: string;
    _count: {
      goals: number;
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
  }[];
  goals: {
    gameId: string;
    teamId: string;
  }[];
};

export default function StandingsTable({ teams, goals }: StandingsTableProps) {
  // Build goals-against map: for each team, count goals in their games scored by opponents
  const goalsAgainstMap = useMemo(() => buildGoalsAgainstMap(teams, goals), [teams, goals]);

  const rows = teams
    .map((team) => {
      return {
        id: team.id,
        name: team.name,
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
        goalsAgainst: goalsAgainstMap.get(team.id) ?? 0,
        plusMinus: team._count.goals - (goalsAgainstMap.get(team.id) ?? 0),
        pim: team.penalties.reduce((acc, p) => acc + p.minutes, 0),
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  return (
    <DataTable aria-label="Standings">
      <TableHeader>
        {columns.map((col) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
