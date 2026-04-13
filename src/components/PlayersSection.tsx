"use client";

import { Input, Select, SelectItem } from "@heroui/react";
import { useCallback, useMemo, useState } from "react";

import { positionRating } from "@/utils/stringUtils";

import type { PlayersTablePlayer } from "./PlayersTable";
import PlayersTable from "./PlayersTable";

type Classification = "ROSTER" | "SUBSTITUTE";

export type PlayersSectionPlayer = PlayersTablePlayer & {
  classification: Classification;
};

type Props = {
  players: PlayersSectionPlayer[];
  isAdmin?: boolean;
  leagueSlug?: string;
  seasonSlug?: string;
};

const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "F", label: "Forward" },
  { value: "D", label: "Defense" },
  { value: "G", label: "Goalie" },
  { value: "__NONE__", label: "No position" },
];

const RATING_OPTIONS = [
  { value: "5", label: "5" },
  { value: "4.5", label: "4.5" },
  { value: "4", label: "4" },
  { value: "3.5", label: "3.5" },
  { value: "3", label: "3" },
  { value: "2.5", label: "2.5" },
  { value: "2", label: "2" },
  { value: "1.5", label: "1.5" },
  { value: "1", label: "1" },
  { value: "__NONE__", label: "Unrated" },
];

const NONE_KEY = "__NONE__";

function ratingBucket(player: PlayersTablePlayer): string {
  const rating = positionRating(player);
  return rating == null ? NONE_KEY : rating.toFixed(1);
}

function matchesSearch(player: PlayersTablePlayer, search: string): boolean {
  if (!search) return true;
  const term = search.toLowerCase().trim();
  if (!term) return true;
  const name = [player.user.firstName, player.user.lastName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (name.includes(term)) return true;
  if (player.number != null && String(player.number).includes(term)) return true;
  return false;
}

export default function PlayersSection({ players, isAdmin, leagueSlug, seasonSlug }: Props) {
  const [search, setSearch] = useState("");
  const [teamKeys, setTeamKeys] = useState<Set<string>>(new Set());
  const [positionKeys, setPositionKeys] = useState<Set<string>>(new Set());
  const [ratingKeys, setRatingKeys] = useState<Set<string>>(new Set());

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>();
    let hasFreeAgent = false;
    for (const player of players) {
      if (player.team) {
        map.set(player.team.id, player.team.name);
      } else {
        hasFreeAgent = true;
      }
    }
    const options = [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (hasFreeAgent) options.push({ value: NONE_KEY, label: "Free agent" });
    return options;
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (!matchesSearch(player, search)) return false;
      if (teamKeys.size > 0) {
        const key = player.team?.id ?? NONE_KEY;
        if (!teamKeys.has(key)) return false;
      }
      if (positionKeys.size > 0) {
        const position = player.position ?? NONE_KEY;
        if (!Array.from(positionKeys).some((key) => position.includes(key))) return false;
      }
      if (ratingKeys.size > 0) {
        if (!ratingKeys.has(ratingBucket(player))) return false;
      }
      return true;
    });
  }, [players, search, teamKeys, positionKeys, ratingKeys]);

  const rosterPlayers = filteredPlayers.filter((p) => p.classification === "ROSTER");
  const subPlayers = filteredPlayers.filter((p) => p.classification === "SUBSTITUTE");

  const makeMultiSelectHandler = useCallback(
    (setter: (value: Set<string>) => void) => (keys: "all" | Set<React.Key>) => {
      if (keys === "all") {
        setter(new Set());
        return;
      }
      const next = new Set<string>();
      for (const key of keys) next.add(key.toString());
      setter(next);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          placeholder="Name or number"
          value={search}
          onValueChange={setSearch}
          isClearable
          onClear={() => setSearch("")}
        />
        <Select
          label="Team"
          selectionMode="multiple"
          placeholder="All teams"
          selectedKeys={teamKeys}
          onSelectionChange={makeMultiSelectHandler(setTeamKeys)}
        >
          {teamOptions.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
        <Select
          label="Position"
          selectionMode="multiple"
          placeholder="All positions"
          selectedKeys={positionKeys}
          onSelectionChange={makeMultiSelectHandler(setPositionKeys)}
        >
          {POSITION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
        <Select
          label="Rating"
          selectionMode="multiple"
          placeholder="All ratings"
          selectedKeys={ratingKeys}
          onSelectionChange={makeMultiSelectHandler(setRatingKeys)}
        >
          {RATING_OPTIONS.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-white">Full Time</h2>
        <PlayersTable
          players={rosterPlayers}
          isAdmin={isAdmin}
          leagueSlug={leagueSlug}
          seasonSlug={seasonSlug}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-white">Spares</h2>
        <PlayersTable
          players={subPlayers}
          isAdmin={isAdmin}
          leagueSlug={leagueSlug}
          seasonSlug={seasonSlug}
        />
      </section>
    </div>
  );
}
