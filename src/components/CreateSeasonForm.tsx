"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Checkbox } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Schema } from "effect";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormDatePicker, FormInput } from "@/components/Form";

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const seasonFormSchema = Schema.Struct({
  name: Required,
  startDate: Schema.Any.pipe(Schema.filter((v) => v != null, { message: () => "Required" })),
  endDate: Schema.Any.pipe(Schema.filter((v) => v != null, { message: () => "Required" })),
});

const CREATE_SEASON_MUTATION = gql`
  mutation CreateSeason($data: SeasonCreateInput!) {
    createSeason(data: $data) {
      id
    }
  }
`;

const DAYS = [
  { key: "sundays", label: "Sun" },
  { key: "mondays", label: "Mon" },
  { key: "tuesdays", label: "Tue" },
  { key: "wednesdays", label: "Wed" },
  { key: "thursdays", label: "Thu" },
  { key: "fridays", label: "Fri" },
  { key: "saturdays", label: "Sat" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

type Props = {
  league: {
    id: string;
    slug: string;
  };
};

type FormValues = {
  name: string;
  startDate: unknown;
  endDate: unknown;
};

export default function CreateSeasonForm({ league }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<DayKey>>(new Set());
  const [createSeason] = useMutation(CREATE_SEASON_MUTATION);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { name: "", startDate: null, endDate: null },
    resolver: effectTsResolver(seasonFormSchema),
  });

  function toggleDay(day: DayKey) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function onSubmit(data: FormValues) {
    setSubmitError("");

    const dayFlags = Object.fromEntries(DAYS.map(({ key }) => [key, selectedDays.has(key)]));

    try {
      await createSeason({
        variables: {
          data: {
            leagueId: league.id,
            name: data.name,
            startDate: String(data.startDate),
            endDate: String(data.endDate),
            ...dayFlags,
          },
        },
      });
      router.push(`/leagues/${league.slug}/seasons`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to create season";
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

      <FormInput name="name" control={control} label="Name" isRequired />
      <FormDatePicker name="startDate" control={control} label="Start Date" isRequired />
      <FormDatePicker name="endDate" control={control} label="End Date" isRequired />

      <fieldset>
        <legend className="text-default-500 mb-2 text-sm">Game Days</legend>
        <div className="flex flex-wrap gap-4">
          {DAYS.map(({ key, label }) => (
            <Checkbox
              key={key}
              isSelected={selectedDays.has(key)}
              onValueChange={() => toggleDay(key)}
            >
              {label}
            </Checkbox>
          ))}
        </div>
      </fieldset>

      <Button type="submit" color="primary" size="lg" isLoading={formState.isSubmitting}>
        Create Season
      </Button>
    </form>
  );
}
