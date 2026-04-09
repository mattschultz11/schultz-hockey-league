"use client";

import type { DocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState } from "react";

import type { Position } from "@/graphql/generated";
import { formatPositionRating, playerName, playerPosition } from "@/utils/stringUtils";

const UPDATE_DRAFT_PICK_MUTATION = gql`
  mutation UpdateDraftPick($id: ID!, $data: DraftPickUpdateInput!) {
    updateDraftPick(id: $id, data: $data) {
      id
      teamId
      playerId
    }
  }
`;

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
};

type DraftPickData = {
  id: string;
  overall: number;
  round: number;
  pick: number;
  team: TeamOption | null;
  player: PlayerOption | null;
};

type Props = {
  pick: DraftPickData;
  teams: TeamOption[];
  players: PlayerOption[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  refetchQueries?: DocumentNode[];
};

export default function EditDraftPickModal({
  pick,
  teams,
  players,
  isOpen,
  onOpenChange,
  refetchQueries,
}: Props) {
  const [teamId, setTeamId] = useState(pick.team?.id ?? "");
  const [playerId, setPlayerId] = useState(pick.player?.id ?? "");
  const [submitError, setSubmitError] = useState("");

  const [updateDraftPick, { loading }] = useMutation(UPDATE_DRAFT_PICK_MUTATION, {
    refetchQueries,
    onCompleted: () => {
      addToast({
        title: "Draft pick updated",
        description: `Pick #${pick.overall} updated`,
        color: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => setSubmitError(error.message.replace(/^[^:]+:\s*/, "")),
  });

  // Include the currently assigned player in the player list if not already present
  const allPlayers =
    pick.player && !players.some((p) => p.id === pick.player!.id)
      ? [pick.player, ...players]
      : players;

  function handleSubmit() {
    setSubmitError("");
    updateDraftPick({
      variables: {
        id: pick.id,
        data: {
          teamId: teamId || null,
          playerId: playerId || null,
        },
      },
    });
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          Edit Pick #{pick.overall} (Round {pick.round}, Pick {pick.pick})
        </ModalHeader>
        <ModalBody>
          {submitError && (
            <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-3 text-sm">
              {submitError}
            </div>
          )}

          <Select
            label="Team"
            selectedKeys={teamId ? [teamId] : []}
            onSelectionChange={(keys) => setTeamId([...keys][0]?.toString() ?? "")}
          >
            {teams.map((t) => (
              <SelectItem key={t.id}>{t.name}</SelectItem>
            ))}
          </Select>

          <Select
            label="Player"
            selectedKeys={playerId ? [playerId] : []}
            onSelectionChange={(keys) => setPlayerId([...keys][0]?.toString() ?? "")}
          >
            {allPlayers.map((p) => (
              <SelectItem key={p.id} textValue={playerName(p) ?? ""}>
                <div className="flex items-center justify-between gap-2">
                  <span>{playerName(p)}</span>
                  <span className="text-default-400 text-xs">
                    {playerPosition(p)} {formatPositionRating(p)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          {playerId && (
            <Button
              color="warning"
              variant="flat"
              onPress={() => setPlayerId("")}
              isDisabled={loading}
            >
              Clear Player
            </Button>
          )}
          <Button color="primary" onPress={() => void handleSubmit()} isLoading={loading}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
