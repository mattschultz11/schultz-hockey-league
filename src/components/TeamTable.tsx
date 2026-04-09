"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

import type { Position } from "@/graphql/generated";
import { formatPositionRating, playerName, playerPosition } from "@/utils/stringUtils";

import DataTable from "./DataTable";

const columns = [
  { key: "name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "rating", label: "Rating" },
  { key: "pick", label: "Pick" },
] as const;

type TeamTableProps = {
  team: {
    id: string;
    name: string;
    players: {
      id: string;
      position: Position | null;
      playerRating: number | null;
      goalieRating: number | null;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      };
      draftPick: {
        id: string;
        overall: number;
        round: number;
        pick: number;
      } | null;
    }[];
  };
};

export default function TeamTable({ team }: TeamTableProps) {
  // Build goals-against map: for each team, count goals in their games scored by opponents
  const rows = team.players
    .map((player) => {
      return {
        id: player.id,
        name: playerName(player),
        position: playerPosition(player),
        rating: formatPositionRating(player),
        pick: player.draftPick?.round ?? 0,
      };
    })
    .sort((a, b) => b.pick - a.pick)
    .sort((a, b) => a.position.localeCompare(b.position));

  return (
    <DataTable aria-label={`${team.name} players`}>
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
