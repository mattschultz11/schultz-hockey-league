"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import type { SortDescriptor } from "@heroui/react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BsGrid, BsTable } from "react-icons/bs";

import type { Position } from "@/graphql/generated";
import {
  formatDate,
  formatEnum,
  formatName,
  formatPhoneNumber,
  formatPosition,
  formatRating,
  playerPosition,
  playerRating,
} from "@/utils/stringUtils";

import DataTable from "./DataTable";

const ACCEPT_REGISTRATIONS_MUTATION = gql`
  mutation AcceptRegistrations($seasonId: ID!, $registrationIds: [ID!]!) {
    acceptRegistrations(seasonId: $seasonId, registrationIds: $registrationIds) {
      id
    }
  }
`;

const DELETE_PLAYER_MUTATION = gql`
  mutation DeletePlayer($id: ID!) {
    deletePlayer(id: $id) {
      id
    }
  }
`;

type Registration = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthday: Date | null;
  position: Position | null;
  handedness: string | null;
  gloveHand: string | null;
  playerRating: number | null;
  goalieRating: number | null;
  classification: string;
  referral: string | null;
  createdAt: Date;
};

type RegistrationsTableProps = {
  registrations: Registration[];
  acceptedPlayers: { id: string; user: { email: string } }[];
  seasonId: string;
};

type ViewMode = "card" | "table";

const STORAGE_KEY = "registrations-view-mode";

function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("card");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved === "card" || saved === "table") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(saved);
    } else {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      setMode(isDesktop ? "table" : "card");
    }
    setHydrated(true);
  }, []);

  function updateMode(newMode: ViewMode) {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }

  // Prevent flash — return "card" until hydrated but it doesn't matter
  // since the toggle won't visually flash
  return [hydrated ? mode : "card", updateMode];
}

function RegistrationCard({
  reg,
  accepted,
  selected,
  onToggle,
  onUnaccept,
}: {
  reg: Registration;
  accepted: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  onUnaccept: (reg: Registration) => void;
}) {
  const name = formatName(reg);
  const isGoalie = reg.position === "G";

  return (
    <Card className="bg-default-200/50">
      <CardBody className="gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {!accepted && (
              <Checkbox
                isSelected={selected}
                onValueChange={() => onToggle(reg.id)}
                className="mt-0.5"
                aria-label={`Select ${name}`}
              />
            )}
            <div>
              <p className="text-lg font-semibold text-white">{name}</p>
              <p className="text-default-500 text-sm">{reg.email}</p>
            </div>
          </div>
          {reg.position && (
            <Chip
              size="lg"
              variant="solid"
              color="primary"
              className="min-h-8 min-w-14"
              radius="lg"
            >
              {formatPosition(reg.position)}
            </Chip>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Field label="Phone" value={formatPhoneNumber(reg.phone ?? "")} />
          <Field label="Birthday" value={formatDate(reg.birthday)} />
          <Field
            label={isGoalie ? "Glove Hand" : "Handedness"}
            value={formatEnum((isGoalie ? reg.gloveHand : reg.handedness) ?? "")}
          />
          <Field label={isGoalie ? "Goalie Rating" : "Player Rating"} value={playerRating(reg)} />
          <Field label="Type" value={formatEnum(reg.classification)} />
          {reg.referral && <Field label="Referral" value={reg.referral} span />}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-default-500 text-xs">Registered {formatDate(reg.createdAt)}</p>

          {accepted && (
            <Chip
              size="sm"
              variant="dot"
              color="success"
              className="cursor-pointer"
              onClick={() => onUnaccept(reg)}
              tabIndex={-1}
            >
              Accepted
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  value,
  span,
}: {
  label: string;
  value: string | number | null | undefined;
  span?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-primary/90">{label}</p>
      <p className="text-default-800">{value}</p>
    </div>
  );
}

export default function RegistrationsTable({
  registrations,
  acceptedPlayers,
  seasonId,
}: RegistrationsTableProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useViewMode();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const acceptedSet = useMemo(
    () => new Set(acceptedPlayers.map((p) => p.user.email)),
    [acceptedPlayers],
  );

  const playerIdByEmail = useMemo(
    () => new Map(acceptedPlayers.map((p) => [p.user.email, p.id])),
    [acceptedPlayers],
  );

  const [acceptRegistrations, { loading }] = useMutation(ACCEPT_REGISTRATIONS_MUTATION);
  const [deletePlayer, { loading: deleting }] = useMutation(DELETE_PLAYER_MUTATION);
  const [unacceptTarget, setUnacceptTarget] = useState<Registration | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "createdAt",
    direction: "ascending",
  });

  const sortedRegistrations = useMemo(() => {
    const sorted = [...registrations].sort((a, b) => {
      let cmp = 0;
      switch (sortDescriptor.column) {
        case "status": {
          const aAccepted = acceptedSet.has(a.email) ? 1 : 0;
          const bAccepted = acceptedSet.has(b.email) ? 1 : 0;
          cmp = aAccepted - bAccepted;
          break;
        }
        case "name": {
          const aName = formatName(a);
          const bName = formatName(b);
          cmp = aName.localeCompare(bName);
          break;
        }
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "position":
          cmp = (a.position ?? "").localeCompare(b.position ?? "");
          break;
        case "playerRating":
          cmp = (a.playerRating ?? 0) - (b.playerRating ?? 0);
          break;
        case "goalieRating":
          cmp = (a.goalieRating ?? 0) - (b.goalieRating ?? 0);
          break;
        case "classification":
          cmp = a.classification.localeCompare(b.classification);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
    return sorted;
  }, [registrations, sortDescriptor, acceptedSet]);

  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  }, []);

  const selectableRegistrations = useMemo(
    () => registrations.filter((r) => !acceptedSet.has(r.email)),
    [registrations, acceptedSet],
  );

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === selectableRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableRegistrations.map((r) => r.id)));
    }
  }

  async function handleAccept() {
    setError("");
    try {
      await acceptRegistrations({
        variables: { seasonId, registrationIds: Array.from(selectedIds) },
      });
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept registrations");
    }
  }

  function openUnacceptModal(reg: Registration) {
    setUnacceptTarget(reg);
    onOpen();
  }

  async function handleUnaccept() {
    if (!unacceptTarget) return;
    const playerId = playerIdByEmail.get(unacceptTarget.email);
    if (!playerId) return;
    setError("");
    try {
      await deletePlayer({ variables: { id: playerId } });
      onClose();
      setUnacceptTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove player");
    }
  }

  if (registrations.length === 0) {
    return <p className="py-8 text-center text-slate-400">No registrations yet</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-default-500 text-sm">
          {registrations.length} registration{registrations.length !== 1 && "s"}
        </p>
        <ButtonGroup size="sm" variant="solid">
          <Button
            onPress={() => setViewMode("card")}
            color={viewMode === "card" ? "primary" : "default"}
            startContent={<BsGrid />}
          >
            Cards
          </Button>
          <Button
            onPress={() => setViewMode("table")}
            color={viewMode === "table" ? "primary" : "default"}
            startContent={<BsTable />}
          >
            Table
          </Button>
        </ButtonGroup>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button
          color="secondary"
          size="sm"
          variant="bordered"
          isLoading={loading}
          onPress={handleAccept}
          disabled={selectedIds.size === 0}
        >
          Accept {selectedIds.size} Registration{selectedIds.size !== 1 && "s"}
        </Button>
        <Button
          variant="light"
          size="sm"
          onPress={() => setSelectedIds(new Set())}
          isDisabled={loading || selectedIds.size === 0}
        >
          Clear Selection
        </Button>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registrations.map((reg) => (
            <RegistrationCard
              key={reg.id}
              reg={reg}
              accepted={acceptedSet.has(reg.email)}
              selected={selectedIds.has(reg.id)}
              onToggle={toggleSelection}
              onUnaccept={openUnacceptModal}
            />
          ))}
        </div>
      ) : (
        <DataTable
          aria-label="Season registrations"
          sortDescriptor={sortDescriptor}
          onSortChange={handleSortChange}
        >
          <TableHeader>
            <TableColumn>
              <Checkbox
                isSelected={
                  selectableRegistrations.length > 0 &&
                  selectedIds.size === selectableRegistrations.length
                }
                isIndeterminate={
                  selectedIds.size > 0 && selectedIds.size < selectableRegistrations.length
                }
                onValueChange={toggleAll}
                isDisabled={selectableRegistrations.length === 0}
                aria-label="Select all"
              />
            </TableColumn>
            <TableColumn key="status" allowsSorting>
              Status
            </TableColumn>
            <TableColumn key="name" allowsSorting>
              Name
            </TableColumn>
            <TableColumn key="email" allowsSorting>
              Email
            </TableColumn>
            <TableColumn>Phone</TableColumn>
            <TableColumn>Birthday</TableColumn>
            <TableColumn key="position" allowsSorting>
              Position
            </TableColumn>
            <TableColumn>Handedness</TableColumn>
            <TableColumn key="playerRating" allowsSorting>
              Player Rating
            </TableColumn>
            <TableColumn>Glove Hand</TableColumn>
            <TableColumn key="goalieRating" allowsSorting>
              Goalie Rating
            </TableColumn>
            <TableColumn key="classification" allowsSorting>
              Type
            </TableColumn>
            <TableColumn>Referral</TableColumn>
            <TableColumn key="createdAt" allowsSorting>
              Registered
            </TableColumn>
          </TableHeader>
          <TableBody>
            {sortedRegistrations.map((reg) => {
              const name = formatName(reg);
              const accepted = acceptedSet.has(reg.email);

              return (
                <TableRow key={reg.id}>
                  <TableCell>
                    {accepted ? (
                      <Checkbox isDisabled isSelected={false} aria-label="Already accepted" />
                    ) : (
                      <Checkbox
                        isSelected={selectedIds.has(reg.id)}
                        onValueChange={() => toggleSelection(reg.id)}
                        aria-label={`Select ${name}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {accepted && (
                      <Chip
                        size="sm"
                        variant="dot"
                        color="success"
                        className="cursor-pointer"
                        onClick={() => openUnacceptModal(reg)}
                        tabIndex={-1}
                      >
                        Accepted
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>{reg.email}</TableCell>
                  <TableCell>{formatPhoneNumber(reg.phone ?? "")}</TableCell>
                  <TableCell>{formatDate(reg.birthday)}</TableCell>
                  <TableCell>{playerPosition(reg)}</TableCell>
                  <TableCell>{formatEnum(reg.handedness)}</TableCell>
                  <TableCell>{formatRating(reg.playerRating)}</TableCell>
                  <TableCell>{formatEnum(reg.gloveHand)}</TableCell>
                  <TableCell>{formatRating(reg.goalieRating)}</TableCell>
                  <TableCell>{formatEnum(reg.classification)}</TableCell>
                  <TableCell>{reg.referral ?? ""}</TableCell>
                  <TableCell>{formatDate(reg.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Remove Player</ModalHeader>
          <ModalBody>
            {unacceptTarget && (
              <p>
                Are you sure you want to remove{" "}
                <strong>{formatName(unacceptTarget) || unacceptTarget.email}</strong> from the
                season? This will delete their player record.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleUnaccept} isLoading={deleting}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
