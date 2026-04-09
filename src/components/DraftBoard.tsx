"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  addToast,
  Button,
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
import { MdLockReset } from "react-icons/md";

import type { Position } from "@/graphql/generated";
import {
  formatName,
  formatPositionRating,
  playerName,
  playerPosition,
  teamName,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";
import EditDraftPickModal from "./EditDraftPickModal";
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
        team {
          id
          name
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
      teams {
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
  }
`;

const RECORD_PICK_MUTATION = gql`
  mutation RecordPick($teamId: ID!, $playerId: ID!) {
    recordPick(teamId: $teamId, playerId: $playerId) {
      id
      playerId
    }
  }
`;

const UPDATE_DRAFT_PICK_MUTATION = gql`
  mutation UpdateDraftPick($id: ID!, $data: DraftPickUpdateInput!) {
    updateDraftPick(id: $id, data: $data) {
      id
      playerId
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

type Team = {
  id: string;
  name: string;
};

type TeamWithPlayers = Team & {
  players: (PlayerWithUser & {
    draftPick: { id: string; overall: number; round: number; pick: number } | null;
  })[];
};

type DraftBoardData = {
  currentPick: (DraftPick & { teamId: string | null; team: Team | null }) | null;
  nextPick: (DraftPick & { teamId: string | null; team: Team | null }) | null;
  draftPicks: DraftPick[];
  availablePlayers: PlayerWithUser[];
  teams: TeamWithPlayers[];
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

function PickBanner({
  recent,
  current,
  upcoming,
}: {
  recent: DraftPick[];
  current: DraftPick | null;
  upcoming: DraftPick[];
}) {
  const isDraftComplete = !current && upcoming.length > 0;

  return (
    <Card>
      <CardBody className="text-center">
        {isDraftComplete ? (
          <div>
            <p className="text-success text-xl font-bold">Draft Complete</p>
            <p className="text-default-500">All picks have been made</p>
          </div>
        ) : current ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div>
              <p className="text-default-500 text-sm">Now Picking</p>
              <p className="text-2xl font-bold">
                Round {current.round}, Pick {current.pick}
              </p>
            </div>
            <PickCarousel recent={recent} current={current} upcoming={upcoming} />
          </div>
        ) : (
          <p className="text-default-500">No draft created yet</p>
        )}
      </CardBody>
    </Card>
  );
}

function PickCarousel({
  recent,
  current,
  upcoming,
}: {
  recent: DraftPick[];
  current: DraftPick;
  upcoming: DraftPick[];
}) {
  return (
    <div
      className="relative mt-3 grid items-center gap-2"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      {/* Recent picks (newest closest to center) */}
      <div
        className="flex items-center justify-end gap-2 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent 0%, black 15%)" }}
      >
        {recent.map((pick) => (
          <Chip key={pick.id} size="sm" variant="flat" color="default">
            <span className="text-default-500 text-xs">#{pick.overall}</span>{" "}
            {pick.team?.name ?? "?"}
          </Chip>
        ))}
      </div>

      {/* Current pick */}
      <Chip data-current-pick size="lg" color="primary">
        {current.team?.name ?? "TBD"}
      </Chip>

      {/* Upcoming picks (reversed so next pick is closest to center) */}
      <div
        className="flex items-center gap-2 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, black 85%, transparent 100%)" }}
      >
        {upcoming.map((pick, i) => (
          <Chip
            key={pick.id}
            size={i === 0 ? "md" : "sm"}
            color={i === 0 ? "secondary" : "default"}
          >
            <span className="text-default-800 text-xs">#{pick.overall}</span>{" "}
            {pick.team?.name ?? "?"}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function AvailablePlayersCard({
  players,
  currentPick,
}: {
  players: PlayerWithUser[];
  currentPick: DraftPick | null;
}) {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithUser | null>(null);

  const canPick = Predicate.isNotNullable(currentPick);

  const [recordPick, { loading }] = useMutation(RECORD_PICK_MUTATION, {
    onError: (error) =>
      addToast({
        title: "Failed to record pick",
        description: error.message,
        color: "danger",
        severity: "danger",
        timeout: Infinity,
      }),
    refetchQueries: [DRAFT_BOARD_QUERY],
  });

  function handlePick(playerId: string) {
    const teamId = currentPick?.team?.id;
    if (Predicate.isNullable(teamId)) return;

    recordPick({
      variables: { teamId, playerId },
    });
  }

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
        <DataTable
          aria-label="Available players"
          selectedKeys={selectedPlayer?.id ? [selectedPlayer.id] : []}
          selectionMode="single"
          onSelectionChange={(keys) =>
            setSelectedPlayer(filteredPlayers.find((p) => p.id === [...keys][0]) ?? null)
          }
        >
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Pos</TableColumn>
            <TableColumn>Rating</TableColumn>
            <TableColumn width={72}>Action</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No available players">
            {filteredPlayers.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{playerName(p)}</TableCell>
                <TableCell>{playerPosition(p)}</TableCell>
                <TableCell>{formatPositionRating(p)}</TableCell>
                <TableCell className="p-1">
                  {canPick && selectedPlayer?.id === p.id && (
                    <Button
                      className="h-7"
                      size="sm"
                      color="primary"
                      isLoading={loading}
                      onPress={() => handlePick(p.id)}
                    >
                      Pick
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </CardBody>
    </Card>
  );
}

function TeamRosters({
  teams,
  currentPick,
  nextPick,
}: {
  teams: TeamWithPlayers[];
  currentPick: DraftPick | null;
  nextPick: DraftPick | null;
}) {
  const [pinnedTeamId, setPinnedTeamId] = useState<string | null>(null);

  const currentTeamId = currentPick?.team?.id ?? null;
  const activeTeamId = pinnedTeamId ?? currentTeamId ?? teams[0]?.id;
  const activeIndex = teams.findIndex((t) => t.id === activeTeamId);
  const activeTeam = teams[activeIndex];
  const isPinned = pinnedTeamId !== null;

  function cycle(direction: -1 | 1) {
    const nextIndex = (activeIndex + direction + teams.length) % teams.length;
    setPinnedTeamId(teams[nextIndex].id);
  }

  if (!activeTeam || teams.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="relative mt-3 grid items-center gap-2"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" isIconOnly onPress={() => cycle(-1)}>
            &lt;
          </Button>
          {activeTeamId === currentPick?.team?.id && <Chip color="primary">Picking</Chip>}
          {activeTeamId === nextPick?.team?.id && <Chip color="secondary">Up Next</Chip>}
        </div>
        <h3 className="text-lg font-semibold">{activeTeam.name}</h3>
        <div className="flex justify-end gap-2">
          {isPinned && (
            <Button
              variant="flat"
              size="sm"
              aria-label="Show current team"
              onPress={() => setPinnedTeamId(null)}
            >
              <MdLockReset size={22} />
            </Button>
          )}
          <Button size="sm" variant="flat" isIconOnly onPress={() => cycle(1)}>
            &gt;
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <TeamTable team={activeTeam} />
      </CardBody>
    </Card>
  );
}

type PicksCardProps = {
  isAdmin: boolean;
  recent: DraftPick[];
  current: DraftPick | null;
  upcoming: DraftPick[];
  teams: TeamWithPlayers[];
  availablePlayers: PlayerWithUser[];
};

function PicksCard({
  isAdmin,
  upcoming,
  current,
  recent,
  teams,
  availablePlayers,
}: PicksCardProps) {
  const recentLimit = Math.min(recent.length, 5);
  const upcomingLimit = 9 - recentLimit;
  const limitedRecent = recent.slice(0, recentLimit);
  const limitedUpcoming = upcoming.slice(0, upcomingLimit);
  const lastPick = recent[recent.length - 1];
  const [editingPickId, setEditingPickId] = useState<string | null>(null);

  const [updateDraftPick, { loading }] = useMutation(UPDATE_DRAFT_PICK_MUTATION, {
    onError: (error) =>
      addToast({
        title: "Failed to undo last pick",
        description: error.message,
        color: "danger",
        severity: "danger",
        timeout: Infinity,
      }),
    refetchQueries: [DRAFT_BOARD_QUERY],
  });

  function handleUndo() {
    if (!lastPick) return;

    updateDraftPick({
      variables: { id: lastPick.id, data: { playerId: null } },
    });
  }

  const canUndo = Predicate.isNotNullable(lastPick) && isAdmin;
  const allPicks = [...limitedRecent, ...(current ? [current] : []), ...limitedUpcoming];
  const editingPick = allPicks.find((p) => p.id === editingPickId);

  return (
    <Card>
      <CardHeader>
        <div className="flex grow items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Picks</h3>
          {canUndo && (
            <Button
              size="sm"
              variant="flat"
              color="warning"
              isLoading={loading}
              onPress={() => handleUndo()}
            >
              Undo Last Pick
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <DataTable
          aria-label="Recent picks"
          color="primary"
          selectedKeys={current?.id ? [current.id] : []}
          selectionMode="single"
        >
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>Team</TableColumn>
            <TableColumn>Player</TableColumn>
          </TableHeader>
          <TableBody>
            <>
              {limitedRecent.map((pick) => (
                <TableRow key={pick.id} onClick={() => isAdmin && setEditingPickId(pick.id)}>
                  <TableCell>{pick.overall}</TableCell>
                  <TableCell>{teamName(pick.team)}</TableCell>
                  <TableCell>{playerName(pick.player)}</TableCell>
                </TableRow>
              ))}
              {current && (
                <TableRow key={current.id} onClick={() => isAdmin && setEditingPickId(current.id)}>
                  <TableCell>{current.overall}</TableCell>
                  <TableCell>{teamName(current.team)}</TableCell>
                  <TableCell>{playerName(current.player)}</TableCell>
                </TableRow>
              )}
              {limitedUpcoming.map((pick) => (
                <TableRow key={pick.id} onClick={() => isAdmin && setEditingPickId(pick.id)}>
                  <TableCell>{pick.overall}</TableCell>
                  <TableCell>{teamName(pick.team)}</TableCell>
                  <TableCell>{playerName(pick.player)}</TableCell>
                </TableRow>
              ))}
            </>
          </TableBody>
        </DataTable>
      </CardBody>

      {editingPick && (
        <EditDraftPickModal
          pick={editingPick}
          teams={teams}
          players={availablePlayers}
          isOpen={true}
          onOpenChange={(open) => !open && setEditingPickId(null)}
          refetchQueries={[DRAFT_BOARD_QUERY]}
        />
      )}
    </Card>
  );
}

type Props = {
  seasonId: string;
  isAdmin: boolean;
};

export default function DraftBoard({ seasonId, isAdmin }: Props) {
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
  if (Predicate.isNullable(board)) return null;

  const upcomingPicks =
    board.draftPicks.filter(
      (p) => Predicate.isNullable(p.player) && p.id !== board.currentPick?.id,
    ) ?? [];
  const recentPicks = board.draftPicks.filter((p) => Predicate.isNotNullable(p.player));

  return (
    <div className="flex flex-col gap-6">
      <PickBanner recent={recentPicks} current={board.currentPick} upcoming={upcomingPicks} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AvailablePlayersCard players={board.availablePlayers} currentPick={board.currentPick} />

        <div className="flex flex-col gap-6">
          <TeamRosters
            teams={board.teams}
            currentPick={board.currentPick}
            nextPick={board.nextPick}
          />
          <PicksCard
            isAdmin={isAdmin}
            recent={recentPicks}
            current={board.currentPick}
            upcoming={upcomingPicks}
            teams={board.teams}
            availablePlayers={board.availablePlayers}
          />
        </div>
      </div>
    </div>
  );
}
