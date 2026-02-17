"use client";

import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { BsGrid, BsTable } from "react-icons/bs";

import { formatEnum, formatPhoneNumber, formatPosition, formatRating } from "@/utils/stringUtils";

type Registration = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthday: Date | null;
  position: string | null;
  handedness: string | null;
  gloveHand: string | null;
  playerRating: number | null;
  goalieRating: number | null;
  referral: string | null;
  createdAt: Date;
};

type RegistrationsTableProps = {
  registrations: Registration[];
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

function RegistrationCard({ reg }: { reg: Registration }) {
  const name = [reg.firstName, reg.lastName].filter(Boolean).join(" ") || "-";
  const isGoalie = reg.position === "G";

  return (
    <Card className="bg-default-200/50">
      <CardBody className="gap-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{name}</p>
            <p className="text-default-500 text-sm">{reg.email}</p>
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
          <Field
            label="Birthday"
            value={reg.birthday ? new Date(reg.birthday).toLocaleDateString() : null}
          />
          <Field
            label={isGoalie ? "Glove Hand" : "Handedness"}
            value={formatEnum((isGoalie ? reg.gloveHand : reg.handedness) ?? "")}
          />
          <Field
            label={isGoalie ? "Goalie Rating" : "Player Rating"}
            value={
              isGoalie ? formatRating(reg.goalieRating ?? 0) : formatRating(reg.playerRating ?? 0)
            }
          />
          {reg.referral && <Field label="Referral" value={reg.referral} span />}
        </div>

        <p className="text-default-600 text-xs">
          Registered {new Date(reg.createdAt).toLocaleDateString()}
        </p>
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

export default function RegistrationsTable({ registrations }: RegistrationsTableProps) {
  const [viewMode, setViewMode] = useViewMode();

  if (registrations.length === 0) {
    return <p className="py-8 text-center text-slate-400">No registrations yet</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-default-600 text-sm">
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

      {viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registrations.map((reg) => (
            <RegistrationCard key={reg.id} reg={reg} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            aria-label="Season registrations"
            removeWrapper
            classNames={{ th: "bg-primary/50 text-default-800" }}
          >
            <TableHeader>
              <TableColumn>Name</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>Phone</TableColumn>
              <TableColumn>Birthday</TableColumn>
              <TableColumn>Position</TableColumn>
              <TableColumn>Handedness</TableColumn>
              <TableColumn>Player Rating</TableColumn>
              <TableColumn>Glove Hand</TableColumn>
              <TableColumn>Goalie Rating</TableColumn>
              <TableColumn>Referral</TableColumn>
              <TableColumn>Registered</TableColumn>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => {
                const name = [reg.firstName, reg.lastName].filter(Boolean).join(" ") || "-";

                return (
                  <TableRow key={reg.id}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{formatPhoneNumber(reg.phone ?? "")}</TableCell>
                    <TableCell>
                      {reg.birthday ? new Date(reg.birthday).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{formatPosition(reg.position ?? "")}</TableCell>
                    <TableCell>{formatEnum(reg.handedness ?? "")}</TableCell>
                    <TableCell>{formatRating(reg.playerRating ?? 0)}</TableCell>
                    <TableCell>{formatEnum(reg.gloveHand ?? "")}</TableCell>
                    <TableCell>{formatRating(reg.goalieRating ?? 0)}</TableCell>
                    <TableCell>{reg.referral ?? "-"}</TableCell>
                    <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
