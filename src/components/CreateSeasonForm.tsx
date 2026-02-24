"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Checkbox, DatePicker, Input } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

const CREATE_SEASON_MUTATION = gql`
  mutation CreateSeason($data: SeasonCreateInput!) {
    createSeason(data: $data) {
      id
    }
  }
`;

type FormState = "idle" | "loading" | "success" | "error";

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

export default function CreateSeasonForm({ league }: Props) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [createSeason] = useMutation(CREATE_SEASON_MUTATION);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<CalendarDate | null>(null);
  const [endDate, setEndDate] = useState<CalendarDate | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<DayKey>>(new Set());

  function toggleDay(day: DayKey) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    const dayFlags = Object.fromEntries(DAYS.map(({ key }) => [key, selectedDays.has(key)]));

    try {
      await createSeason({
        variables: {
          data: {
            leagueId: league.id,
            name,
            startDate: startDate!.toString(),
            endDate: endDate!.toString(),
            ...dayFlags,
          },
        },
      });
      setFormState("success");
      router.push(`/leagues/${league.slug}/seasons`);
    } catch (err) {
      setFormState("error");
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to create season";
      setErrorMessage(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {errorMessage && formState === "error" && (
        <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
          {errorMessage}
        </div>
      )}

      <Input label="Name" isRequired value={name} onValueChange={setName} />
      <DatePicker label="Start Date" isRequired value={startDate} onChange={setStartDate} />
      <DatePicker label="End Date" isRequired value={endDate} onChange={setEndDate} />

      <fieldset>
        <legend className="text-default-600 mb-2 text-sm">Game Days</legend>
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

      <Button type="submit" color="primary" size="lg" isLoading={formState === "loading"}>
        Create Season
      </Button>
    </form>
  );
}
