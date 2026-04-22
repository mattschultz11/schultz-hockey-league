"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { addToast, Button, Input } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import type { CalendarDate } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { Schema } from "effect";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormDatePicker, FormInput, FormSelect } from "@/components/Form";
import type { GloveHand, Handedness, Role } from "@/graphql/generated";

// --- Form schema ---

const RoleLiteral = Schema.Literal("PLAYER", "MANAGER", "ADMIN");
const HandednessLiteral = Schema.Literal("", "LEFT", "RIGHT");
const GloveHandLiteral = Schema.Literal("", "LEFT", "RIGHT");

const userEditFormSchema = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
  phone: Schema.String,
  birthday: Schema.Any,
  handedness: HandednessLiteral,
  gloveHand: GloveHandLiteral,
  role: RoleLiteral,
});

// --- Mutation ---

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $data: UserUpdateInput!) {
    updateUser(id: $id, data: $data) {
      id
      firstName
      lastName
      phone
      birthday
      handedness
      gloveHand
      role
    }
  }
`;

// --- Constants ---

const ROLE_OPTIONS = [
  { value: "PLAYER", label: "Player" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

const HANDEDNESS_OPTIONS = [
  { value: "", label: "—" },
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

const GLOVE_HAND_OPTIONS = [
  { value: "", label: "—" },
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

// --- Types ---

type UserInput = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthday: Date | null;
  handedness: Handedness | null;
  gloveHand: GloveHand | null;
  role: Role;
};

type Props = {
  user: UserInput;
};

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  birthday: CalendarDate | null;
  handedness: "" | Handedness;
  gloveHand: "" | GloveHand;
  role: Role;
};

// --- Helpers ---

function dateToCalendarDate(date: Date | null): CalendarDate | null {
  if (!date) return null;
  const iso = new Date(date).toISOString().slice(0, 10);
  return parseDate(iso);
}

// --- Component ---

export default function UserEditForm({ user }: Props) {
  const [submitError, setSubmitError] = useState("");
  const [updateUser] = useMutation(UPDATE_USER_MUTATION);

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      birthday: dateToCalendarDate(user.birthday),
      handedness: user.handedness ?? "",
      gloveHand: user.gloveHand ?? "",
      role: user.role,
    },
    resolver: effectTsResolver(userEditFormSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitError("");

    const data = {
      firstName: values.firstName === "" ? null : values.firstName,
      lastName: values.lastName === "" ? null : values.lastName,
      phone: values.phone === "" ? null : values.phone,
      birthday: values.birthday ? new Date(values.birthday.toString()).toISOString() : null,
      handedness: values.handedness === "" ? null : values.handedness,
      gloveHand: values.gloveHand === "" ? null : values.gloveHand,
      role: values.role,
    };

    try {
      await updateUser({ variables: { id: user.id, data } });
      addToast({
        title: "User updated",
        color: "success",
      });
      reset(values);
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to update user";
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
        <FormInput
          name="firstName"
          control={control}
          label="First Name"
          autoComplete="given-name"
        />
        <FormInput name="lastName" control={control} label="Last Name" autoComplete="family-name" />
        <Input
          value={user.email}
          label="Email"
          isReadOnly
          description="Email cannot be changed here"
        />
        <FormInput name="phone" control={control} label="Phone" type="tel" autoComplete="tel" />
        <FormDatePicker name="birthday" control={control} label="Birthday" autoComplete="bday" />
        <FormSelect name="role" control={control} label="Role" options={ROLE_OPTIONS} isRequired />
        <FormSelect
          name="handedness"
          control={control}
          label="Handedness"
          options={HANDEDNESS_OPTIONS}
        />
        <FormSelect
          name="gloveHand"
          control={control}
          label="Glove Hand"
          options={GLOVE_HAND_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          color="primary"
          isLoading={formState.isSubmitting}
          isDisabled={!formState.isDirty}
        >
          Save User
        </Button>
      </div>
    </form>
  );
}
