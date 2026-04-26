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
import type { Position, Strength } from "@/graphql/generated";
import { playerName } from "@/utils/stringUtils";

const CREATE_GOAL_MUTATION = gql`
  mutation CreateGoal($data: GoalCreateInput!) {
    createGoal(data: $data) {
      id
    }
  }
`;

const UPDATE_GOAL_MUTATION = gql`
  mutation UpdateGoal($id: ID!, $data: GoalUpdateInput!) {
    updateGoal(id: $id, data: $data) {
      id
    }
  }
`;

const DELETE_GOAL_MUTATION = gql`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id) {
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

const goalFormSchema = Schema.Struct({
  period: Required,
  minutes: Minutes,
  seconds: Seconds,
  strength: Required,
  scorerId: Required,
  primaryAssistId: Schema.String,
  secondaryAssistId: Schema.String,
});

type FormValues = Schema.Schema.Type<typeof goalFormSchema>;

// --- Constants ---

const NO_ASSIST_KEY = "__no_assist__";

const PERIOD_OPTIONS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "OT" },
];

const STRENGTH_OPTIONS: { value: Strength; label: string }[] = [
  { value: "EVEN", label: "Even" },
  { value: "POWERPLAY", label: "Power Play" },
  { value: "SHORTHANDED", label: "Shorthanded" },
  { value: "EMPTY_NET", label: "Empty Net" },
];

// --- Types ---

type LineupPlayer = {
  id: string;
  number: number | null;
  position: Position | null;
  user: { firstName: string | null; lastName: string | null };
};

type ExistingGoal = {
  id: string;
  period: number;
  time: number;
  strength: Strength;
  teamId: string;
  scorerId: string;
  primaryAssistId: string | null;
  secondaryAssistId: string | null;
};

type Props = {
  gameId: string;
  teamId: string;
  lineupPlayers: LineupPlayer[];
  goal?: ExistingGoal;
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

export default function EditGoalForm({ gameId, teamId, lineupPlayers, goal, returnHref }: Props) {
  const router = useRouter();
  const isEdit = goal != null;
  const [submitError, setSubmitError] = useState("");
  const [createGoal] = useMutation(CREATE_GOAL_MUTATION);
  const [updateGoal] = useMutation(UPDATE_GOAL_MUTATION);
  const [deleteGoal, { loading: deleting }] = useMutation(DELETE_GOAL_MUTATION);

  const playerOptions = lineupPlayers.map(lineupOption);
  const assistOptions = [{ value: NO_ASSIST_KEY, label: "(none)" }, ...playerOptions];

  const initialTime = goal ? timeParts(goal.time) : { minutes: "", seconds: "" };
  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      period: goal ? String(goal.period) : "1",
      minutes: initialTime.minutes,
      seconds: initialTime.seconds,
      strength: goal?.strength ?? "EVEN",
      scorerId: goal?.scorerId ?? "",
      primaryAssistId: goal?.primaryAssistId ?? NO_ASSIST_KEY,
      secondaryAssistId: goal?.secondaryAssistId ?? NO_ASSIST_KEY,
    },
    resolver: effectTsResolver(goalFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    const primaryAssistId =
      values.primaryAssistId === NO_ASSIST_KEY ? null : values.primaryAssistId;
    const secondaryAssistId =
      values.secondaryAssistId === NO_ASSIST_KEY ? null : values.secondaryAssistId;

    if (secondaryAssistId && !primaryAssistId) {
      setSubmitError("Cannot have a secondary assistant without a primary assistant");
      return;
    }

    const fields = {
      period: Number.parseInt(values.period, 10),
      time: Number(values.minutes) * 60 + Number(values.seconds),
      strength: values.strength as Strength,
      scorerId: values.scorerId,
      primaryAssistId,
      secondaryAssistId,
    };

    try {
      if (isEdit) {
        await updateGoal({ variables: { id: goal.id, data: fields } });
        addToast({ title: "Goal updated", color: "success" });
      } else {
        await createGoal({ variables: { data: { gameId, teamId, ...fields } } });
        addToast({ title: "Goal added", color: "success" });
      }
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to save goal";
      setSubmitError(message);
    }
  }

  async function onDelete() {
    if (!goal) return;
    if (!confirm("Delete this goal?")) return;
    setSubmitError("");
    try {
      await deleteGoal({ variables: { id: goal.id } });
      addToast({ title: "Goal deleted", color: "success" });
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to delete goal";
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
          No lineup is set for this team. Set the lineup before adding goals.
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
          name="strength"
          control={control}
          label="Strength"
          options={STRENGTH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          isRequired
        />
        <FormSelect
          name="scorerId"
          control={control}
          label="Scorer"
          options={playerOptions}
          isRequired
          isDisabled={lineupPlayers.length === 0}
        />
        <FormSelect
          name="primaryAssistId"
          control={control}
          label="Primary Assist"
          options={assistOptions}
          isDisabled={lineupPlayers.length === 0}
        />
        <FormSelect
          name="secondaryAssistId"
          control={control}
          label="Secondary Assist"
          options={assistOptions}
          isDisabled={lineupPlayers.length === 0}
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
            {isEdit ? "Save Changes" : "Add Goal"}
          </Button>
        </div>
      </div>
    </form>
  );
}
