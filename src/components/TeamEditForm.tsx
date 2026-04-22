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

// --- Form schema ---

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const teamEditFormSchema = Schema.Struct({
  name: Required,
  abbreviation: Schema.String,
  logoUrl: Schema.String,
  primaryColor: Schema.String,
  secondaryColor: Schema.String,
  managerId: Schema.String,
});

// --- Mutation ---

const UPDATE_TEAM_MUTATION = gql`
  mutation UpdateTeam($id: ID!, $data: TeamUpdateInput!) {
    updateTeam(id: $id, data: $data) {
      id
      name
      abbreviation
      logoUrl
      primaryColor
      secondaryColor
      managerId
    }
  }
`;

// --- Constants ---

const NO_MANAGER_KEY = "__no_manager__";

// --- Types ---

type TeamInput = {
  id: string;
  name: string;
  abbreviation: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  managerId: string | null;
};

type PlayerOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

type Props = {
  team: TeamInput;
  players: PlayerOption[];
};

type FormValues = Schema.Schema.Type<typeof teamEditFormSchema>;

// --- Helpers ---

function playerLabel(player: PlayerOption): string {
  const name = [player.firstName, player.lastName].filter(Boolean).join(" ");
  return name || "(no name)";
}

// --- Component ---

export default function TeamEditForm({ team, players }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [updateTeam] = useMutation(UPDATE_TEAM_MUTATION);

  const managerOptions = [
    { value: NO_MANAGER_KEY, label: "No manager" },
    ...players.map((p) => ({ value: p.id, label: playerLabel(p) })),
  ];

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      name: team.name,
      abbreviation: team.abbreviation ?? "",
      logoUrl: team.logoUrl ?? "",
      primaryColor: team.primaryColor ?? "",
      secondaryColor: team.secondaryColor ?? "",
      managerId: team.managerId ?? NO_MANAGER_KEY,
    },
    resolver: effectTsResolver(teamEditFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    const data = {
      name: values.name,
      abbreviation: values.abbreviation === "" ? null : values.abbreviation,
      logoUrl: values.logoUrl === "" ? null : values.logoUrl,
      primaryColor: values.primaryColor === "" ? null : values.primaryColor,
      secondaryColor: values.secondaryColor === "" ? null : values.secondaryColor,
      managerId: values.managerId === NO_MANAGER_KEY ? null : values.managerId,
    };

    try {
      await updateTeam({ variables: { id: team.id, data } });
      addToast({
        title: "Team updated",
        color: "success",
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to update team";
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
        <FormInput name="name" control={control} label="Team Name" isRequired />
        <FormInput name="abbreviation" control={control} label="Abbreviation" />
        <FormInput name="logoUrl" control={control} label="Logo URL" />
        <FormSelect name="managerId" control={control} label="Manager" options={managerOptions} />
        <FormInput name="primaryColor" control={control} label="Primary Color" type="color" />
        <FormInput name="secondaryColor" control={control} label="Secondary Color" type="color" />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="flat"
          onPress={() => router.back()}
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
