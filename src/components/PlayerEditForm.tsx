"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { addToast, Button } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Schema } from "effect";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormInput, FormSelect } from "@/components/Form";
import type { Classification, Position, Status } from "@/graphql/generated";

// --- Form schema ---
//
// All form values are strings (that's how <input> / <Select> work). Validation
// checks ranges and formats client-side. Server-side validation in
// `src/service/validation/schemas.ts#playerUpdateSchema` remains the source of
// truth — we redefine here because the server schemas module can't be imported
// into a client component.

const OptionalInt = Schema.String.pipe(
  Schema.filter(
    (s) => {
      if (s === "") return true;
      return /^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 99;
    },
    { message: () => "Must be a whole number between 1 and 99" },
  ),
);

const OptionalRating = Schema.String.pipe(
  Schema.filter(
    (s) => {
      if (s === "") return true;
      const n = Number(s);
      return Number.isFinite(n) && n >= 1 && n <= 5;
    },
    { message: () => "Must be between 1 and 5" },
  ),
);

const ClassificationLiteral = Schema.Literal("ROSTER", "SUBSTITUTE");
const StatusLiteral = Schema.Literal("ACTIVE", "INJURED", "SUSPENDED");
const PositionLiteral = Schema.Literal("", "G", "D", "D_F", "F", "F_D");
const BooleanStringLiteral = Schema.Literal("true", "false");
const NullableBooleanStringLiteral = Schema.Literal("", "true", "false");

const NonEmptyString = Schema.String.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const playerEditFormSchema = Schema.Struct({
  classification: ClassificationLiteral,
  status: StatusLiteral,
  teamId: NonEmptyString,
  position: PositionLiteral,
  number: OptionalInt,
  playerRating: OptionalRating,
  goalieRating: OptionalRating,
  lockerRating: OptionalRating,
  registrationNumber: Schema.String,
  ratingVerified: BooleanStringLiteral,
  confirmed: NullableBooleanStringLiteral,
});

// --- Mutation ---

const UPDATE_PLAYER_MUTATION = gql`
  mutation UpdatePlayer($id: ID!, $data: PlayerUpdateInput!) {
    updatePlayer(id: $id, data: $data) {
      id
      classification
      status
      teamId
      position
      number
      playerRating
      goalieRating
      lockerRating
      registrationNumber
      ratingVerified
      confirmed
    }
  }
`;

// --- Constants ---

const FREE_AGENT_KEY = "__free_agent__";

const CLASSIFICATION_OPTIONS = [
  { value: "ROSTER", label: "Roster" },
  { value: "SUBSTITUTE", label: "Substitute" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INJURED", label: "Injured" },
  { value: "SUSPENDED", label: "Suspended" },
];

const POSITION_OPTIONS = [
  { value: "F", label: "Forward" },
  { value: "F_D", label: "Forward / Defense" },
  { value: "D_F", label: "Defense / Forward" },
  { value: "D", label: "Defense" },
  { value: "G", label: "Goalie" },
];

const VERIFIED_OPTIONS = [
  { value: "false", label: "Not verified" },
  { value: "true", label: "Verified" },
];

const CONFIRMED_OPTIONS = [
  { value: "", label: "—" },
  { value: "true", label: "Confirmed" },
  { value: "false", label: "Not confirmed" },
];

const RATING_OPTIONS = [
  { value: "", label: "—" },
  { value: "5", label: "5.0" },
  { value: "4.5", label: "4.5" },
  { value: "4", label: "4.0" },
  { value: "3.5", label: "3.5" },
  { value: "3", label: "3.0" },
  { value: "2.5", label: "2.5" },
  { value: "2", label: "2.0" },
  { value: "1.5", label: "1.5" },
  { value: "1", label: "1.0" },
];

// --- Types ---

type PlayerInput = {
  id: string;
  classification: Classification;
  status: Status;
  teamId: string | null;
  position: Position | null;
  number: number | null;
  playerRating: number | null;
  goalieRating: number | null;
  lockerRating: number | null;
  registrationNumber: string | null;
  ratingVerified: boolean;
  confirmed: boolean | null;
};

type TeamOption = {
  id: string;
  name: string;
};

type Props = {
  player: PlayerInput;
  teams: TeamOption[];
  returnHref: string;
};

type FormValues = Schema.Schema.Type<typeof playerEditFormSchema>;

// --- Helpers ---

function toRatingString(value: number | null): string {
  if (value == null) return "";
  return value.toString();
}

function parseRating(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIntField(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

// --- Component ---

export default function PlayerEditForm({ player, teams, returnHref }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [updatePlayer] = useMutation(UPDATE_PLAYER_MUTATION);

  const teamOptions = [
    { value: FREE_AGENT_KEY, label: "Free agent (no team)" },
    ...teams.map((t) => ({ value: t.id, label: t.name })),
  ];

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      classification: player.classification,
      status: player.status,
      teamId: player.teamId ?? FREE_AGENT_KEY,
      position: player.position ?? "",
      number: player.number?.toString() ?? "",
      playerRating: toRatingString(player.playerRating),
      goalieRating: toRatingString(player.goalieRating),
      lockerRating: toRatingString(player.lockerRating),
      registrationNumber: player.registrationNumber ?? "",
      ratingVerified: player.ratingVerified ? "true" : "false",
      confirmed: player.confirmed == null ? "" : player.confirmed ? "true" : "false",
    },
    resolver: effectTsResolver(playerEditFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    const data = {
      classification: values.classification as Classification,
      status: values.status as Status,
      teamId: values.teamId === FREE_AGENT_KEY ? null : values.teamId,
      position: values.position === "" ? null : (values.position as Position),
      number: parseIntField(values.number),
      playerRating: parseRating(values.playerRating),
      goalieRating: parseRating(values.goalieRating),
      lockerRating: parseRating(values.lockerRating),
      registrationNumber: values.registrationNumber === "" ? null : values.registrationNumber,
      ratingVerified: values.ratingVerified === "true",
      confirmed: values.confirmed === "" ? null : values.confirmed === "true",
    };

    try {
      await updatePlayer({ variables: { id: player.id, data } });
      addToast({
        title: "Player updated",
        color: "success",
      });
      router.push(returnHref);
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to update player";
      setSubmitError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {submitError && (
        <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          name="classification"
          control={control}
          label="Classification"
          options={CLASSIFICATION_OPTIONS}
          isRequired
        />
        <FormSelect
          name="status"
          control={control}
          label="Status"
          options={STATUS_OPTIONS}
          isRequired
        />
        <FormSelect name="position" control={control} label="Position" options={POSITION_OPTIONS} />
        <FormSelect name="teamId" control={control} label="Team" options={teamOptions} isRequired />
        <FormInput name="number" control={control} label="Jersey Number" type="number" />
        <FormSelect
          name="playerRating"
          control={control}
          label="Player Rating"
          options={RATING_OPTIONS}
        />
        <FormSelect
          name="goalieRating"
          control={control}
          label="Goalie Rating"
          options={RATING_OPTIONS}
        />
        <FormSelect
          name="lockerRating"
          control={control}
          label="Locker Rating"
          options={RATING_OPTIONS}
        />
        <FormInput name="registrationNumber" control={control} label="Registration Number" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          name="ratingVerified"
          control={control}
          label="Rating Verified"
          options={VERIFIED_OPTIONS}
          isRequired
        />
        <FormSelect
          name="confirmed"
          control={control}
          label="Confirmed"
          options={CONFIRMED_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="flat"
          onPress={() => router.push(returnHref)}
          isDisabled={formState.isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={formState.isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
