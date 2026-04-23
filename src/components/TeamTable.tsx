"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

import type { Position } from "@/graphql/generated";
import { formatPositionRating, playerName, playerPosition } from "@/utils/stringUtils";

import DataTable from "./DataTable";

const columns = [
  { key: "pick", label: "Pick" },
  { key: "name", label: "Name" },
  { key: "number", label: "#" },
  { key: "position", label: "Pos" },
  { key: "rating", label: "Rating" },
] as const;

type TeamTableProps = {
  team: {
    id: string;
    name: string;
    players: {
      id: string;
      number: number | null;
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
  hideNumber?: boolean;
};

export default function TeamTable({ team, hideNumber }: TeamTableProps) {
  // Build goals-against map: for each team, count goals in their games scored by opponents
  const rows = team.players
    .map((player) => {
      return {
        id: player.id,
        number: player.number,
        name: playerName(player),
        position: playerPosition(player),
        rating: formatPositionRating(player),
        pick: player.draftPick?.round ?? 0,
      };
    })
    .sort((a, b) => a.pick - b.pick);

  const filteredColumns = hideNumber ? columns.filter((col) => col.key !== "number") : columns;

  return (
    <DataTable aria-label={`${team.name} players`}>
      <TableHeader>
        {filteredColumns.map((col) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {filteredColumns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
