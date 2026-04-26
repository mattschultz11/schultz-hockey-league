"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { Classification, Position } from "@/graphql/generated";
import { formatPositionRating, playerName, playerPosition } from "@/utils/stringUtils";

const SET_GAME_LINEUP_MUTATION = gql`
  mutation SetGameLineup($data: SetGameLineupInput!) {
    setGameLineup(data: $data) {
      id
      gameId
      teamId
      playerId
      number
    }
  }
`;

type AvailablePlayer = {
  id: string;
  number: number | null;
  position: Position | null;
  classification: Classification;
  teamId: string | null;
  playerRating: number | null;
  goalieRating: number | null;
  team: { name: string; abbreviation: string | null } | null;
  user: { firstName: string | null; lastName: string | null };
};

type LineupEntry = {
  playerId: string;
  number: number | null;
};

type Props = {
  gameId: string;
  teamId: string;
  rosterPlayers: AvailablePlayer[];
  availablePlayers: AvailablePlayer[];
  initialEntries: LineupEntry[];
  returnHref: string;
};

const NO_TEAM_KEY = "__no_team__";

function isOnRoster(player: AvailablePlayer, teamId: string) {
  return player.teamId === teamId && player.classification === "ROSTER";
}

function affiliationLabel(player: AvailablePlayer): string {
  if (player.classification === "SUBSTITUTE") {
    return "Spare";
  }
  return player.team ? player.team.name : "Unassigned";
}

export default function EditLineupForm({
  gameId,
  teamId,
  rosterPlayers,
  availablePlayers,
  initialEntries,
  returnHref,
}: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<Map<string, number | null>>(
    () => new Map(initialEntries.map((e) => [e.playerId, e.number])),
  );
  const [submitError, setSubmitError] = useState("");
  const [setGameLineup, { loading }] = useMutation(SET_GAME_LINEUP_MUTATION);

  const availableById = useMemo(
    () => new Map(availablePlayers.map((p) => [p.id, p])),
    [availablePlayers],
  );

  const selectedAvailable = useMemo(
    () =>
      [...entries.keys()]
        .map((id) => availableById.get(id))
        .filter((p): p is AvailablePlayer => p != null),
    [entries, availableById],
  );

  const groupedAvailable = useMemo(() => {
    const groups = new Map<string, { title: string; players: AvailablePlayer[] }>();
    for (const player of availablePlayers) {
      if (entries.has(player.id)) continue;
      const key = player.teamId ?? NO_TEAM_KEY;
      const title = player.team?.name ?? (player.teamId == null ? "Substitutes" : "Other");
      if (!groups.has(key)) groups.set(key, { title, players: [] });
      groups.get(key)!.players.push(player);
    }
    // Stable order: teams alphabetically, "Substitutes" group last.
    return [...groups.entries()]
      .sort(([aKey, a], [bKey, b]) => {
        if (aKey === NO_TEAM_KEY) return 1;
        if (bKey === NO_TEAM_KEY) return -1;
        return a.title.localeCompare(b.title);
      })
      .map(([key, value]) => ({ key, ...value }));
  }, [availablePlayers, entries]);

  function setEntry(playerId: string, number: number | null) {
    setEntries((prev) => {
      const next = new Map(prev);
      next.set(playerId, number);
      return next;
    });
  }

  function removeEntry(playerId: string) {
    setEntries((prev) => {
      const next = new Map(prev);
      next.delete(playerId);
      return next;
    });
  }

  function toggleRoster(player: AvailablePlayer, isSelected: boolean) {
    if (isSelected) {
      setEntry(player.id, isOnRoster(player, teamId) ? player.number : null);
    } else {
      removeEntry(player.id);
    }
  }

  function addAvailable(playerId: string) {
    const player = availableById.get(playerId);
    if (!player) return;
    setEntry(player.id, isOnRoster(player, teamId) ? player.number : null);
  }

  function setNumber(playerId: string, raw: string) {
    setEntries((prev) => {
      if (!prev.has(playerId)) return prev;
      const next = new Map(prev);
      const trimmed = raw.trim();
      if (trimmed === "") {
        next.set(playerId, null);
      } else {
        const parsed = Number.parseInt(trimmed, 10);
        next.set(playerId, Number.isNaN(parsed) ? null : parsed);
      }
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");
    const payload = [...entries.entries()].map(([playerId, number]) => ({
      playerId,
      number,
    }));
    try {
      await setGameLineup({
        variables: { data: { gameId, teamId, entries: payload } },
      });
      addToast({ title: "Lineup saved", color: "success" });
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to save lineup";
      setSubmitError(message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {submitError && (
        <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
          {submitError}
        </div>
      )}

      <Card>
        <CardBody className="flex flex-col gap-2">
          <h2 className="text-default-600 text-xs font-medium tracking-wide uppercase">Roster</h2>
          {rosterPlayers.length === 0 ? (
            <p className="text-default-500 text-sm">No players</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {rosterPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isSelected={entries.has(player.id)}
                  number={entries.get(player.id) ?? null}
                  onToggle={(next) => toggleRoster(player, next)}
                  onNumberChange={(raw) => setNumber(player.id, raw)}
                  showAffiliation={false}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <h2 className="text-default-600 text-xs font-medium tracking-wide uppercase">
            Substitutes
          </h2>

          <Autocomplete
            label="Add player"
            placeholder="Search subs and other teams"
            selectedKey={null}
            onSelectionChange={(key) => {
              if (key) addAvailable(key.toString());
            }}
          >
            {groupedAvailable.map((group) => (
              <AutocompleteSection key={group.key} title={group.title}>
                {group.players.map((player) => (
                  <AutocompleteItem
                    key={player.id}
                    textValue={`${playerName(player)} ${player.number ?? ""} ${affiliationLabel(player)}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-default-200 w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
                        {playerPosition(player)}
                      </span>
                      <span className="text-default-600 w-8 shrink-0 font-mono text-xs">
                        #{player.number ?? "—"}
                      </span>
                      <span className="grow text-sm font-medium">{playerName(player)}</span>
                      <span className="text-default-500 text-xs">
                        {formatPositionRating(player)}
                      </span>
                    </div>
                  </AutocompleteItem>
                ))}
              </AutocompleteSection>
            ))}
          </Autocomplete>

          {selectedAvailable.length > 0 && (
            <ul className="flex flex-col gap-1">
              {selectedAvailable.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isSelected
                  number={entries.get(player.id)}
                  onToggle={(next) => {
                    if (!next) removeEntry(player.id);
                  }}
                  onNumberChange={(raw) => setNumber(player.id, raw)}
                  showAffiliation
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <span className="text-default-600 text-sm">
          {entries.size} player{entries.size === 1 ? "" : "s"} selected
        </span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="flat"
            onPress={() => router.push(returnHref)}
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" color="primary" isLoading={loading}>
            Save Lineup
          </Button>
        </div>
      </div>
    </form>
  );
}

function PlayerRow({
  player,
  isSelected,
  number,
  onToggle,
  onNumberChange,
  showAffiliation,
}: {
  player: AvailablePlayer;
  isSelected: boolean;
  number?: number | null;
  onToggle: (next: boolean) => void;
  onNumberChange: (raw: string) => void;
  showAffiliation: boolean;
}) {
  return (
    <li className="bg-default-100 flex items-center gap-3 rounded-md p-2">
      <Checkbox isSelected={isSelected} onValueChange={onToggle} />
      <span className="bg-default-200 w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs">
        {playerPosition(player)}
      </span>
      <span className="text-foreground grow text-sm font-medium">{playerName(player)}</span>
      <span className="text-default-500 w-8 shrink-0 text-right text-sm">
        {formatPositionRating(player)}
      </span>
      {showAffiliation && (
        <Chip size="sm" variant="flat" className="shrink-0">
          {affiliationLabel(player)}
        </Chip>
      )}
      <Input
        aria-label="Jersey number"
        size="sm"
        type="number"
        min={1}
        max={99}
        value={number == null ? "" : String(number)}
        onValueChange={onNumberChange}
        isDisabled={!isSelected}
        placeholder="#"
        className="w-20 shrink-0"
      />
    </li>
  );
}
