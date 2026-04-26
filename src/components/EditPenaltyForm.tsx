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
import type { PenaltyCategory, PenaltyType, Position } from "@/graphql/generated";
import { PENALTY_CATEGORY_VALUES, PENALTY_TYPE_VALUES } from "@/service/validation/schemas";
import { formatEnum, playerName } from "@/utils/stringUtils";

const CREATE_PENALTY_MUTATION = gql`
  mutation CreatePenalty($data: PenaltyCreateInput!) {
    createPenalty(data: $data) {
      id
    }
  }
`;

const UPDATE_PENALTY_MUTATION = gql`
  mutation UpdatePenalty($id: ID!, $data: PenaltyUpdateInput!) {
    updatePenalty(id: $id, data: $data) {
      id
    }
  }
`;

const DELETE_PENALTY_MUTATION = gql`
  mutation DeletePenalty($id: ID!) {
    deletePenalty(id: $id) {
      id
    }
  }
`;

// --- Form schema ---

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const Minutes = Schema.String.pipe(
  Schema.filter((s) => /^\d{1,2}$/.test(s) && Number(s) >= 0 && Number(s) <= 20, {
    message: () => "Minutes (0–20)",
  }),
);

const Seconds = Schema.String.pipe(
  Schema.filter((s) => /^\d{1,2}$/.test(s) && Number(s) >= 0 && Number(s) <= 59, {
    message: () => "Seconds (0–59)",
  }),
);

const PenaltyMinutes = Schema.String.pipe(
  Schema.filter((s) => /^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 30, {
    message: () => "Length (1–30 min)",
  }),
);

const penaltyFormSchema = Schema.Struct({
  period: Required,
  minutes: Minutes,
  seconds: Seconds,
  playerId: Required,
  category: Required,
  type: Required,
  penaltyMinutes: PenaltyMinutes,
});

type FormValues = Schema.Schema.Type<typeof penaltyFormSchema>;

// --- Constants ---

const PERIOD_OPTIONS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "OT" },
  { value: "5", label: "SO" },
];

const CATEGORY_OPTIONS = PENALTY_CATEGORY_VALUES.map((value) => ({
  value,
  label: formatEnum(value),
}));

const TYPE_OPTIONS = PENALTY_TYPE_VALUES.map((value) => ({
  value,
  label: formatEnum(value),
}));

// --- Types ---

type LineupPlayer = {
  id: string;
  number: number | null;
  position: Position | null;
  user: { firstName: string | null; lastName: string | null };
};

type ExistingPenalty = {
  id: string;
  period: number;
  time: number;
  teamId: string;
  playerId: string;
  category: PenaltyCategory;
  type: PenaltyType;
  minutes: number;
};

type Props = {
  gameId: string;
  teamId: string;
  lineupPlayers: LineupPlayer[];
  penalty?: ExistingPenalty;
  returnHref: string;
};

// --- Helpers ---

function timeParts(totalSeconds: number) {
  return {
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60),
  };
}

function lineupOption(player: LineupPlayer) {
  const num = player.number != null ? `#${player.number} ` : "";
  return { value: player.id, label: `${num}${playerName(player)}` };
}

// --- Component ---

export default function EditPenaltyForm({
  gameId,
  teamId,
  lineupPlayers,
  penalty,
  returnHref,
}: Props) {
  const router = useRouter();
  const isEdit = penalty != null;
  const [submitError, setSubmitError] = useState("");
  const [createPenalty] = useMutation(CREATE_PENALTY_MUTATION);
  const [updatePenalty] = useMutation(UPDATE_PENALTY_MUTATION);
  const [deletePenalty, { loading: deleting }] = useMutation(DELETE_PENALTY_MUTATION);

  const playerOptions = lineupPlayers.map(lineupOption);

  const initialTime = penalty ? timeParts(penalty.time) : { minutes: "", seconds: "" };
  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      period: penalty ? String(penalty.period) : "1",
      minutes: initialTime.minutes,
      seconds: initialTime.seconds,
      playerId: penalty?.playerId ?? "",
      category: penalty?.category ?? "MINOR",
      type: penalty?.type ?? "",
      penaltyMinutes: penalty ? String(penalty.minutes) : "2",
    },
    resolver: effectTsResolver(penaltyFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    const fields = {
      period: Number.parseInt(values.period, 10),
      time: Number(values.minutes) * 60 + Number(values.seconds),
      playerId: values.playerId,
      category: values.category as PenaltyCategory,
      type: values.type as PenaltyType,
      minutes: Number.parseInt(values.penaltyMinutes, 10),
    };

    try {
      if (isEdit) {
        await updatePenalty({ variables: { id: penalty.id, data: fields } });
        addToast({ title: "Penalty updated", color: "success" });
      } else {
        await createPenalty({ variables: { data: { gameId, teamId, ...fields } } });
        addToast({ title: "Penalty added", color: "success" });
      }
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to save penalty";
      setSubmitError(message);
    }
  }

  async function onDelete() {
    if (!penalty) return;
    if (!confirm("Delete this penalty?")) return;
    setSubmitError("");
    try {
      await deletePenalty({ variables: { id: penalty.id } });
      addToast({ title: "Penalty deleted", color: "success" });
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to delete penalty";
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

      {lineupPlayers.length === 0 && (
        <div className="border-warning-200/30 bg-warning-50/10 text-warning-700 rounded-lg border p-4 text-sm">
          No lineup is set for this team. Set the lineup before adding penalties.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          name="period"
          control={control}
          label="Period"
          options={PERIOD_OPTIONS}
          isRequired
        />
        <div className="flex gap-2">
          <FormInput
            name="minutes"
            control={control}
            label="Minutes"
            type="number"
            min={0}
            max={20}
            placeholder="0"
            isRequired
            className="flex-1"
          />
          <FormInput
            name="seconds"
            control={control}
            label="Seconds"
            type="number"
            min={0}
            max={59}
            placeholder="00"
            isRequired
            className="flex-1"
          />
        </div>
        <FormSelect
          name="playerId"
          control={control}
          label="Player"
          options={playerOptions}
          isRequired
          isDisabled={lineupPlayers.length === 0}
        />
        <FormSelect
          name="category"
          control={control}
          label="Category"
          options={CATEGORY_OPTIONS}
          isRequired
        />
        <FormSelect name="type" control={control} label="Type" options={TYPE_OPTIONS} isRequired />
        <FormInput
          name="penaltyMinutes"
          control={control}
          label="Penalty Length (min)"
          type="number"
          min={1}
          max={30}
          placeholder="2"
          isRequired
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {isEdit ? (
          <Button
            type="button"
            color="danger"
            variant="flat"
            onPress={onDelete}
            isLoading={deleting}
            isDisabled={formState.isSubmitting}
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="flat"
            onPress={() => router.push(returnHref)}
            isDisabled={formState.isSubmitting || deleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            isLoading={formState.isSubmitting}
            isDisabled={lineupPlayers.length === 0 || deleting}
          >
            {isEdit ? "Save Changes" : "Add Penalty"}
          </Button>
        </div>
      </div>
    </form>
  );
}
