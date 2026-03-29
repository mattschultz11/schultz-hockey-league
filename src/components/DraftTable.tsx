"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

import type { Position } from "@/graphql/generated";
import { playerName, playerPosition, playerRating, teamName } from "@/utils/stringUtils";

import DataTable from "./DataTable";

const columns = [
  { key: "overall", label: "Overall" },
  { key: "round", label: "Round" },
  { key: "pick", label: "Pick" },
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "rating", label: "Rating" },
  { key: "position", label: "Position" },
] as const;

type Props = {
  draftPicks: {
    id: string;
    overall: number;
    round: number;
    pick: number;
    team: {
      id: string;
      name: string;
    } | null;
    player: {
      id: string;
      position: Position | null;
      playerRating: number | null;
      goalieRating: number | null;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      };
    } | null;
  }[];
};

export default function DraftTable({ draftPicks }: Props) {
  const rows = draftPicks.map((pick) => ({
    key: pick.id,
    overall: pick.overall,
    round: pick.round,
    pick: pick.pick,
    team: teamName(pick.team),
    player: playerName(pick.player),
    rating: playerRating(pick.player),
    position: playerPosition(pick.player),
  }));

  return (
    <DataTable aria-label="Draft picks">
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
