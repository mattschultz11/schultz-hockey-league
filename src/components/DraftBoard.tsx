"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Predicate } from "effect";
import { useEffect, useState } from "react";

import type { Position } from "@/graphql/generated";
import {
  formatName,
  playerName,
  playerPosition,
  playerRating,
  teamName,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";
import TeamTable from "./TeamTable";

// --- GraphQL Query ---

const DRAFT_BOARD_QUERY = gql`
  query DraftBoard($seasonId: ID!) {
    draftBoard(seasonId: $seasonId) {
      currentPick {
        id
        overall
        round
        pick
        teamId
        team {
          id
          name
          players {
            id
            position
            playerRating
            goalieRating
            user {
              id
              firstName
              lastName
            }
            draftPick {
              id
              overall
              round
              pick
            }
          }
        }
      }
      nextPick {
        id
        overall
        round
        pick
        team {
          id
          name
          players {
            id
            position
            playerRating
            goalieRating
            user {
              id
              firstName
              lastName
            }
            draftPick {
              id
              overall
              round
              pick
            }
          }
        }
      }
      draftPicks {
        id
        overall
        round
        pick
        team {
          id
          name
        }
        player {
          id
          position
          playerRating
          goalieRating
          user {
            id
            firstName
            lastName
          }
        }
      }
      availablePlayers {
        id
        position
        playerRating
        goalieRating
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

// --- Types ---

type DraftPick = {
  id: string;
  overall: number;
  round: number;
  pick: number;
  team: { id: string; name: string } | null;
  player: PlayerWithUser | null;
};

type PlayerWithUser = {
  id: string;
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
  user: { id: string; firstName: string | null; lastName: string | null };
};

type TeamWithPlayers = {
  id: string;
  name: string;
  players: (PlayerWithUser & {
    draftPick: { id: string; overall: number; round: number; pick: number } | null;
  })[];
};

type DraftBoardData = {
  currentPick: (DraftPick & { teamId: string | null; team: TeamWithPlayers | null }) | null;
  nextPick: (DraftPick & { teamId: string | null; team: TeamWithPlayers | null }) | null;
  draftPicks: DraftPick[];
  availablePlayers: PlayerWithUser[];
};

type DraftBoardResult = { draftBoard: DraftBoardData };

// --- Helper ---

function getRating(player: {
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
}) {
  if (player.position === "G") return player.goalieRating ?? 0;
  return player.playerRating ?? 0;
}

// --- Sub-components ---

function CurrentPickBanner({
  previousPicks,
  currentPick,
  upcomingPicks,
}: {
  currentPick: DraftPick | null;
  upcomingPicks: DraftPick[];
  previousPicks: DraftPick[];
}) {
  const isDraftComplete = !currentPick && upcomingPicks.length > 0;
  const upcoming = [...upcomingPicks].slice(1).reverse();

  return (
    <Card>
      <CardBody className="text-center">
        {isDraftComplete ? (
          <div>
            <p className="text-success text-xl font-bold">Draft Complete</p>
            <p className="text-default-500">All picks have been made</p>
          </div>
        ) : currentPick ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div>
              <p className="text-default-500 text-sm">Now Picking</p>
              <p className="text-2xl font-bold">
                Round {currentPick.round}, Pick {currentPick.pick}
              </p>
            </div>
            <PickCarousel
              upcoming={upcoming}
              currentPick={currentPick}
              recentPicks={previousPicks}
            />
          </div>
        ) : (
          <p className="text-default-500">No draft created yet</p>
        )}
      </CardBody>
    </Card>
  );
}

function PickCarousel({
  upcoming,
  currentPick,
  recentPicks,
}: {
  upcoming: DraftPick[];
  currentPick: DraftPick;
  recentPicks: DraftPick[];
}) {
  return (
    <div
      className="relative mt-3 grid items-center gap-2"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      {/* Upcoming picks (reversed so next pick is closest to center) */}
      <div
        className="flex items-center justify-end gap-2 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent 0%, black 15%)" }}
      >
        {upcoming.map((pick, i) => (
          <Chip key={pick.id} color={i === upcoming.length - 1 ? "secondary" : "default"}>
            {pick.team?.name ?? "?"}
          </Chip>
        ))}
      </div>

      {/* Current pick */}
      <Chip data-current-pick size="lg" color="primary" className="shrink-0">
        {currentPick.team?.name ?? "TBD"}
      </Chip>

      {/* Recent picks (newest closest to center) */}
      <div
        className="flex items-center gap-2 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, black 85%, transparent 100%)" }}
      >
        {recentPicks.map((pick) => (
          <Chip
            key={pick.id}
            size="sm"
            variant="flat"
            color="default"
            className="shrink-0 opacity-60"
          >
            <span className="text-default-500 text-xs">#{pick.overall}</span>{" "}
            {pick.team?.name ?? "?"}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function AvailablePlayersCard({ players }: { players: PlayerWithUser[] }) {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const filteredPlayers = players
    .filter((p) => {
      if (search) {
        const name = formatName(p.user).toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }
      if (positionFilter && !p.position?.includes(positionFilter)) return false;
      return true;
    })
    .sort((a, b) => getRating(b) - getRating(a));

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-2">
        <h3 className="text-lg font-semibold">Available Players ({filteredPlayers.length})</h3>
        <div className="flex w-full gap-2">
          <Input
            variant="flat"
            size="sm"
            label="Search players"
            value={search}
            onValueChange={setSearch}
            className="max-w-xs"
          />
          <Select
            variant="flat"
            size="sm"
            label="Position"
            selectedKeys={positionFilter ? [positionFilter] : []}
            onSelectionChange={(keys) => setPositionFilter([...keys][0]?.toString() ?? "")}
            className="max-w-[120px]"
          >
            <SelectItem key="F">Forward</SelectItem>
            <SelectItem key="D">Defense</SelectItem>
            <SelectItem key="G">Goalie</SelectItem>
          </Select>
        </div>
      </CardHeader>
      <CardBody>
        <DataTable aria-label="Available players">
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Pos</TableColumn>
            <TableColumn>Rating</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No available players">
            {filteredPlayers.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{playerName(p)}</TableCell>
                <TableCell>{playerPosition(p)}</TableCell>
                <TableCell>{playerRating(p)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </CardBody>
    </Card>
  );
}

function TeamRosterCard({ title, team }: { title: string; team: TeamWithPlayers }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody>
        <TeamTable team={team} />
      </CardBody>
    </Card>
  );
}

function RecentPicksCard({ recentPicks }: { recentPicks: DraftPick[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recent Picks</h3>
      </CardHeader>
      <CardBody>
        <DataTable aria-label="Recent picks">
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>Team</TableColumn>
            <TableColumn>Player</TableColumn>
          </TableHeader>
          <TableBody>
            {recentPicks.slice(0, 10).map((pick) => (
              <TableRow key={pick.id}>
                <TableCell>{pick.overall}</TableCell>
                <TableCell>{teamName(pick.team)}</TableCell>
                <TableCell>{playerName(pick.player)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </CardBody>
    </Card>
  );
}

// --- Main Component ---

export default function DraftBoard({ seasonId }: { seasonId: string }) {
  const { data, loading, error, refetch } = useQuery<DraftBoardResult>(DRAFT_BOARD_QUERY, {
    variables: { seasonId },
    pollInterval: 5000,
  });

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/draft/stream?seasonId=${seasonId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "pick_update") {
          void refetch();
        }
      } catch {
        // Ignore malformed SSE data
      }
    };

    eventSource.onerror = () => {
      // SSE reconnects automatically; polling fallback is active
    };

    return () => eventSource.close();
  }, [seasonId, refetch]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
        Failed to load draft board: {error.message}
      </div>
    );
  }

  const board = data?.draftBoard;
  if (!board) return null;

  const upcomingPicks = data?.draftBoard.draftPicks.filter((p) => Predicate.isNullable(p.player));
  const previousPicks = data?.draftBoard.draftPicks.filter((p) =>
    Predicate.isNotNullable(p.player),
  );

  return (
    <div className="flex flex-col gap-6">
      <CurrentPickBanner
        currentPick={board.currentPick}
        upcomingPicks={upcomingPicks}
        previousPicks={previousPicks}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AvailablePlayersCard players={board.availablePlayers} />

        <div className="flex flex-col gap-6">
          {board.currentPick?.team && (
            <TeamRosterCard
              title={`Picking: ${board.currentPick.team.name}`}
              team={board.currentPick.team}
            />
          )}

          {board.nextPick?.team && (
            <TeamRosterCard
              title={`Up Next: ${board.nextPick.team.name}`}
              team={board.nextPick.team}
            />
          )}

          <RecentPicksCard recentPicks={previousPicks.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
}
