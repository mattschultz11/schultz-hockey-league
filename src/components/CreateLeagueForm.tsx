"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Input, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

const CREATE_LEAGUE_MUTATION = gql`
  mutation CreateLeague($data: LeagueCreateInput!) {
    createLeague(data: $data) {
      id
    }
  }
`;

type FormState = "idle" | "loading" | "success" | "error";

export default function CreateLeagueForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [createLeague] = useMutation(CREATE_LEAGUE_MUTATION);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    const data: Record<string, unknown> = { name };
    if (description) data.description = description;
    if (skillLevel) data.skillLevel = skillLevel;

    try {
      await createLeague({ variables: { data } });
      setFormState("success");
      router.push("/leagues");
    } catch (err) {
      setFormState("error");
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to create league";
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
      <Textarea label="Description" value={description} onValueChange={setDescription} />
      <Input label="Skill Level" value={skillLevel} onValueChange={setSkillLevel} />

      <Button type="submit" color="primary" size="lg" isLoading={formState === "loading"}>
        Create League
      </Button>
    </form>
  );
}
