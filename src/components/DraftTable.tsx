"use client";

import { TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useState } from "react";

import type { Position } from "@/graphql/generated";
import { formatPositionRating, playerName, playerPosition } from "@/utils/stringUtils";

import DataTable from "./DataTable";
import EditDraftPickModal from "./EditDraftPickModal";
import TeamName from "./TeamName";

const columns = [
  { key: "overall", label: "Overall" },
  { key: "round", label: "Round" },
  { key: "pick", label: "Pick" },
  { key: "team", label: "Team" },
  { key: "player", label: "Player" },
  { key: "rating", label: "Rating" },
  { key: "position", label: "Position" },
] as const;

type PlayerOption = {
  id: string;
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
  user: { id: string; firstName: string | null; lastName: string | null };
};

type TeamOption = {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type DraftPickRow = {
  id: string;
  overall: number;
  round: number;
  pick: number;
  team: TeamOption | null;
  player: PlayerOption | null;
};

type Props = {
  draftPicks: DraftPickRow[];
  isAdmin?: boolean;
  teams?: TeamOption[];
  players?: PlayerOption[];
};

export default function DraftTable({ draftPicks, isAdmin, teams, players }: Props) {
  const [editingPick, setEditingPick] = useState<DraftPickRow | null>(null);

  const rows = draftPicks.map((pick) => ({
    key: pick.id,
    overall: pick.overall,
    round: pick.round,
    pick: pick.pick,
    team: pick.team,
    player: playerName(pick.player),
    rating: formatPositionRating(pick.player),
    position: playerPosition(pick.player),
  }));

  return (
    <>
      <DataTable
        aria-label="Draft picks"
        selectionMode={isAdmin ? "single" : "none"}
        onSelectionChange={(keys) => {
          if (!isAdmin) return;
          const pickId = [...keys][0]?.toString();
          const pick = draftPicks.find((p) => p.id === pickId);
          if (pick) setEditingPick(pick);
        }}
      >
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.key}>{col.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === "team" ? (
                    row.team ? (
                      <TeamName team={row.team} />
                    ) : (
                      "-"
                    )
                  ) : (
                    row[col.key]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      {editingPick && isAdmin && teams && players && (
        <EditDraftPickModal
          pick={editingPick}
          teams={teams}
          players={players}
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setEditingPick(null);
          }}
        />
      )}
    </>
  );
}
