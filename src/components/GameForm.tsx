"use client";

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
  useDisclosure,
} from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import type { CalendarDate } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { Schema } from "effect";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormDatePicker, FormInput, FormSelect } from "@/components/Form";

// --- Schema ---

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const RoundSchema = Schema.String.pipe(
  Schema.filter(
    (s) => {
      if (s === "") return false;
      return /^\d{1,3}$/.test(s) && Number(s) >= 1 && Number(s) <= 999;
    },
    { message: () => "Round must be between 1 and 999" },
  ),
);

const TimeSchema = Schema.String.pipe(
  Schema.filter((s) => /^\d{2}:\d{2}$/.test(s), { message: () => "Time required (HH:MM)" }),
);

const gameFormSchema = Schema.Struct({
  round: RoundSchema,
  date: Schema.Any.pipe(Schema.filter((v) => v != null, { message: () => "Date required" })),
  time: TimeSchema,
  location: Required,
  homeTeamId: Required,
  awayTeamId: Required,
});

// --- Mutations ---

const CREATE_GAME_MUTATION = gql`
  mutation CreateGame($data: GameCreateInput!) {
    createGame(data: $data) {
      id
    }
  }
`;

const UPDATE_GAME_MUTATION = gql`
  mutation UpdateGame($id: ID!, $data: GameUpdateInput!) {
    updateGame(id: $id, data: $data) {
      id
    }
  }
`;

const DELETE_GAME_MUTATION = gql`
  mutation DeleteGame($id: ID!) {
    deleteGame(id: $id) {
      id
    }
  }
`;

// --- Types ---

type TeamOption = {
  id: string;
  name: string;
};

export type GameFormInput = {
  id: string;
  round: number;
  datetime: Date;
  location: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

type Props = {
  mode: "create" | "edit";
  seasonId: string;
  teams: TeamOption[];
  game?: GameFormInput;
  returnHref: string;
};

type FormValues = {
  round: string;
  date: CalendarDate | null;
  time: string;
  location: string;
  homeTeamId: string;
  awayTeamId: string;
};

// --- Helpers ---

function datetimeToCalendarDate(datetime: Date): CalendarDate {
  const iso = new Date(datetime).toISOString().slice(0, 10);
  return parseDate(iso);
}

function datetimeToHHMM(datetime: Date): string {
  const d = new Date(datetime);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Game datetimes are stored UTC-naive: the ISO components ARE the wall-clock
// time at the rink. Any consumer that displays game.datetime must force
// `timeZone: "UTC"` so the rendered time matches what the admin typed.
function combineToISO(cd: CalendarDate, hhmm: string): string {
  const [hh, mm] = hhmm.split(":").map(Number);
  const hhStr = String(hh).padStart(2, "0");
  const mmStr = String(mm).padStart(2, "0");
  return new Date(`${cd.toString()}T${hhStr}:${mmStr}:00.000`).toISOString();
}

function cleanErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : fallback;
}

// --- Component ---

export default function GameForm({ mode, seasonId, teams, game }: Props) {
  const router = useRouter();
  const deleteModal = useDisclosure();
  const [submitError, setSubmitError] = useState("");

  const [createGame] = useMutation(CREATE_GAME_MUTATION);
  const [updateGame] = useMutation(UPDATE_GAME_MUTATION);
  const [deleteGame] = useMutation(DELETE_GAME_MUTATION);

  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  const { control, handleSubmit, formState, setError } = useForm<FormValues>({
    defaultValues: game
      ? {
          round: String(game.round),
          date: datetimeToCalendarDate(game.datetime),
          time: datetimeToHHMM(game.datetime),
          location: game.location,
          homeTeamId: game.homeTeamId ?? "",
          awayTeamId: game.awayTeamId ?? "",
        }
      : {
          round: "1",
          date: null,
          time: "19:00",
          location: "",
          homeTeamId: "",
          awayTeamId: "",
        },
    resolver: effectTsResolver(gameFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    if (values.homeTeamId === values.awayTeamId) {
      const message = "Home and away teams cannot be the same";
      setError("homeTeamId", { type: "manual", message });
      setError("awayTeamId", { type: "manual", message });
      return;
    }

    const payload = {
      round: Number(values.round),
      datetime: combineToISO(values.date!, values.time),
      location: values.location,
      homeTeamId: values.homeTeamId,
      awayTeamId: values.awayTeamId,
    };

    try {
      if (mode === "create") {
        await createGame({ variables: { data: { ...payload, seasonId } } });
      } else if (game) {
        await updateGame({ variables: { id: game.id, data: payload } });
      }
      addToast({ title: mode === "create" ? "Game created" : "Game updated", color: "success" });
      router.back();
    } catch (err) {
      setSubmitError(cleanErrorMessage(err, "Failed to save game"));
    }
  }

  async function handleDelete() {
    if (!game) return;
    setSubmitError("");
    try {
      await deleteGame({ variables: { id: game.id } });
      addToast({ title: "Game deleted", color: "success" });
      router.back();
    } catch (err) {
      setSubmitError(cleanErrorMessage(err, "Failed to delete game"));
      deleteModal.onClose();
    }
  }

  const homeTeamId = useWatch({ control, name: "homeTeamId" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {submitError && (
        <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput name="round" control={control} label="Round" type="number" isRequired />
        <FormInput name="location" control={control} label="Location" isRequired />
        <FormDatePicker name="date" control={control} label="Date" isRequired />
        <FormInput name="time" control={control} label="Time (HH:MM)" type="time" isRequired />
        <FormSelect
          name="homeTeamId"
          control={control}
          label="Home Team"
          options={teamOptions}
          isRequired
        />
        <FormSelect
          name="awayTeamId"
          control={control}
          label="Away Team"
          options={teamOptions.filter((t) => t.value !== homeTeamId)}
          isRequired
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {mode === "edit" && (
            <Button color="danger" variant="flat" onPress={deleteModal.onOpen}>
              Delete Game
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="flat"
            onPress={() => router.back()}
            isDisabled={formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" color="primary" isLoading={formState.isSubmitting}>
            {mode === "create" ? "Create Game" : "Save Changes"}
          </Button>
        </div>
      </div>

      {mode === "edit" && (
        <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
          <ModalContent>
            <ModalHeader>Delete game?</ModalHeader>
            <ModalBody>
              This cannot be undone. If the game has recorded goals, penalties, or lineups, the
              deletion will be rejected.
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={deleteModal.onClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleDelete}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </form>
  );
}
