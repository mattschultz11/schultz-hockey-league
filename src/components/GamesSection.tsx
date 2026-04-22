"use client";

import { Input, Pagination, Select, SelectItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { GamesTableGame } from "./GamesTable";
import GamesTable from "./GamesTable";

export type GamesSectionFilters = {
  startDate: string;
  endDate: string;
  teamId: string;
  location: string;
};

type Props = {
  games: GamesTableGame[];
  teams: { id: string; name: string }[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: GamesSectionFilters;
  league: {
    slug: string;
  };
  season: {
    slug: string;
  };
};

const LOCATION_DEBOUNCE_MS = 300;

export default function GamesSection({
  games,
  teams,
  totalCount,
  page,
  pageSize,
  filters,
  league,
  season,
}: Props) {
  const router = useRouter();
  const basePath = `/leagues/${league.slug}/seasons/${season.slug}/games`;

  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);
  const [teamKeys, setTeamKeys] = useState<Set<string>>(
    filters.teamId ? new Set([filters.teamId]) : new Set(),
  );
  const [location, setLocation] = useState(filters.location);

  const teamId = teamKeys.values().next().value ?? "";

  function pushFilters(next: GamesSectionFilters, nextPage: number) {
    const params = new URLSearchParams();
    if (next.startDate) params.set("startDate", next.startDate);
    if (next.endDate) params.set("endDate", next.endDate);
    if (next.teamId) params.set("teamId", next.teamId);
    if (next.location) params.set("location", next.location);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  // Push immediately when start/end/team change.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    pushFilters({ startDate, endDate, teamId, location }, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, teamId]);

  // Debounce location typing to avoid a round-trip per keystroke.
  useEffect(() => {
    if (!didMount.current) return;
    if (location === filters.location) return;
    const handle = setTimeout(() => {
      pushFilters({ startDate, endDate, teamId, location }, 1);
    }, LOCATION_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onValueChange={setStartDate}
          isClearable
          onClear={() => setStartDate("")}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onValueChange={setEndDate}
          isClearable
          onClear={() => setEndDate("")}
        />
        <Select
          label="Team"
          placeholder="All teams"
          selectedKeys={teamKeys}
          onSelectionChange={(keys) => {
            if (keys === "all") {
              setTeamKeys(new Set());
              return;
            }
            const next = new Set<string>();
            for (const k of keys) next.add(k.toString());
            setTeamKeys(next);
          }}
        >
          {teams.map((t) => (
            <SelectItem key={t.id}>{t.name}</SelectItem>
          ))}
        </Select>
        <Input
          label="Location"
          value={location}
          onValueChange={setLocation}
          isClearable
          onClear={() => setLocation("")}
        />
      </div>

      <GamesTable games={games} league={league} season={season} />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(p) => pushFilters({ startDate, endDate, teamId, location }, p)}
            showControls
          />
        </div>
      )}
    </div>
  );
}
