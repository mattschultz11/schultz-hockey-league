"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Schema } from "effect";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormInput } from "@/components/Form";

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const teamFormSchema = Schema.Struct({
  name: Required,
  abbreviation: Schema.String,
});

const CREATE_TEAM_MUTATION = gql`
  mutation CreateTeam($data: TeamCreateInput!) {
    createTeam(data: $data) {
      id
    }
  }
`;

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
};

type FormValues = {
  name: string;
  abbreviation: string;
};

export default function CreateTeamForm({ league, season }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [createTeam] = useMutation(CREATE_TEAM_MUTATION);
  const returnPath = `/leagues/${league.slug}/seasons/${season.slug}/teams`;

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { name: "", abbreviation: "" },
    resolver: effectTsResolver(teamFormSchema),
  });

  async function onSubmit(data: FormValues) {
    setSubmitError("");

    try {
      await createTeam({
        variables: {
          data: {
            seasonId: season.id,
            name: data.name,
            abbreviation: data.abbreviation || undefined,
          },
        },
      });
      router.push(returnPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to create team";
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

      <FormInput name="name" control={control} label="Team Name" isRequired />
      <FormInput name="abbreviation" control={control} label="Abbreviation" />

      <Button type="submit" color="primary" size="lg" isLoading={formState.isSubmitting}>
        Create Team
      </Button>
    </form>
  );
}
