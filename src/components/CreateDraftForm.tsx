"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Checkbox, CheckboxGroup } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Schema } from "effect";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormInput, FormSelect } from "@/components/Form";

const draftFormSchema = Schema.Struct({
  rounds: Schema.Trim.pipe(
    Schema.filter((s) => s.length > 0, { message: () => "Required" }),
    Schema.filter((s) => !isNaN(parseInt(s, 10)) && parseInt(s, 10) >= 1, {
      message: () => "Must be at least 1",
    }),
  ),
  rotation: Schema.Trim.pipe(Schema.filter((s) => s.length > 0, { message: () => "Required" })),
  snakeStartRound: Schema.String,
});

const CREATE_DRAFT_MUTATION = gql`
  mutation CreateDraft($data: CreateDraftInput!) {
    createDraft(data: $data) {
      id
      overall
      round
      pick
      teamId
    }
  }
`;

const ROTATION_OPTIONS = [
  { value: "CYCLICAL", label: "Cyclical (same order every round)" },
  { value: "SNAKE", label: "Snake (reverses every other round)" },
  { value: "HYBRID", label: "Hybrid (cyclical then snake)" },
];

type Props = {
  league: {
    id: string;
    slug: string;
    name: string;
  };
  season: {
    id: string;
    slug: string;
    name: string;
  };
  teams: {
    id: string;
    name: string;
  }[];
};

type FormValues = {
  rounds: string;
  rotation: string;
  snakeStartRound: string;
};

export default function CreateDraftForm({ league, season, teams }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(teams.map((t) => t.id));
  const [createDraft] = useMutation(CREATE_DRAFT_MUTATION);

  const returnPath = `/leagues/${league.slug}/seasons/${season.slug}/draft/live`;

  const { control, handleSubmit, formState, watch } = useForm<FormValues>({
    defaultValues: { rounds: "10", rotation: "SNAKE", snakeStartRound: "5" },
    resolver: effectTsResolver(draftFormSchema),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const rotation = watch("rotation");

  function moveTeam(index: number, direction: -1 | 1) {
    const newOrder = [...selectedTeamIds];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setSelectedTeamIds(newOrder);
  }

  async function onSubmit(data: FormValues) {
    setSubmitError("");

    try {
      await createDraft({
        variables: {
          data: {
            seasonId: season.id,
            teamIds: selectedTeamIds,
            rounds: parseInt(data.rounds, 10),
            rotation: data.rotation,
            ...(data.rotation === "HYBRID"
              ? { snakeStartRound: parseInt(data.snakeStartRound, 10) }
              : {}),
          },
        },
      });
      router.push(returnPath);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to create draft";
      setSubmitError(message);
    }
  }

  if (teams.length < 2) {
    return (
      <div className="mx-auto max-w-lg">
        <h2 className="mb-6 text-xl font-semibold">Create Draft</h2>
        <p className="text-default-600">
          You need at least 2 teams to create a draft. Add teams first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {submitError && (
          <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
            {submitError}
          </div>
        )}

        <div>
          <h2 className="text-default-800 mb-3 text-lg font-semibold">Create Draft</h2>
          <p className="text-default-600 mb-3 text-sm">
            Select teams and arrange them in draft order. Use arrows to reorder.
          </p>
          <CheckboxGroup value={selectedTeamIds} onValueChange={setSelectedTeamIds}>
            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <Checkbox key={team.id} value={team.id}>
                  {team.name}
                </Checkbox>
              ))}
            </div>
          </CheckboxGroup>

          {selectedTeamIds.length > 0 && (
            <div className="mt-4">
              <p className="text-default-600 mb-2 text-sm font-medium">Pick Order:</p>
              <div className="flex flex-col gap-1">
                {selectedTeamIds.map((id, index) => {
                  const team = teams.find((t) => t.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-default-600 w-6 text-right text-sm">{index + 1}.</span>
                      <span className="text-default-800 flex-1">{team?.name}</span>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        isDisabled={index === 0}
                        onPress={() => moveTeam(index, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        isDisabled={index === selectedTeamIds.length - 1}
                        onPress={() => moveTeam(index, 1)}
                      >
                        ↓
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <FormInput
          name="rounds"
          control={control}
          type="number"
          label="Number of Rounds"
          isRequired
        />

        <FormSelect
          name="rotation"
          control={control}
          label="Rotation"
          options={ROTATION_OPTIONS}
          isRequired
        />

        {rotation === "HYBRID" && (
          <FormInput
            name="snakeStartRound"
            control={control}
            type="number"
            label="Snake Start Round"
            description="Round number where snake rotation begins"
            isRequired
          />
        )}

        <Button
          type="submit"
          color="primary"
          size="lg"
          isLoading={formState.isSubmitting}
          isDisabled={selectedTeamIds.length < 2}
        >
          Create Draft
        </Button>
      </form>
    </div>
  );
}
