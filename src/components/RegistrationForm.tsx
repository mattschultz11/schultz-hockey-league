"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import type { CalendarDate } from "@internationalized/date";
import { Schema } from "effect";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaQuestion } from "react-icons/fa6";

import { FormDatePicker, FormInput, FormSelect, FormTextarea } from "@/components/Form";

// --- Form Schema ---

const Required = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
);

const RequiredEmail = Schema.Trim.pipe(
  Schema.filter((s) => s.length > 0, { message: () => "Required" }),
  Schema.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), {
    message: () => "Invalid email",
  }),
);

const registrationFormSchema = Schema.Struct({
  firstName: Required,
  lastName: Required,
  email: RequiredEmail,
  phone: Required,
  birthday: Schema.Any.pipe(Schema.filter((v) => v != null, { message: () => "Required" })),
  position: Required,
  classification: Schema.String,
  handedness: Schema.String,
  gloveHand: Schema.String,
  rating: Schema.String,
  referral: Schema.String,
});

// --- Mutation ---

const REGISTER_MUTATION = gql`
  mutation Register($data: RegistrationInput!) {
    register(data: $data) {
      id
    }
  }
`;

// --- Types ---

type RegistrationFormProps = {
  seasonId: string;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: CalendarDate | null;
  position: string;
  classification: string;
  handedness: string;
  gloveHand: string;
  rating: string;
  referral: string;
};

// --- Constants ---

const HANDEDNESS_OPTIONS = [
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

const GLOVE_HAND_OPTIONS = [
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
];

const POSITION_OPTIONS = [
  { value: "F", label: "Forward" },
  { value: "F_D", label: "Forward / Defense" },
  { value: "D_F", label: "Defense / Forward" },
  { value: "D", label: "Defense" },
  { value: "G", label: "Goalie" },
];

const CLASSIFICATION_OPTIONS = [
  { value: "ROSTER", label: "Full-time" },
  { value: "SUBSTITUTE", label: "Spare" },
];

const RATING_OPTIONS = [
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

const RATING_DESCRIPTIONS = [
  {
    rating: "5.0",
    description:
      "Many years of organized hockey experience, may have played Junior or College level. Elite skating, puck handling, shooting, and passing. Can carry the play and leads the team. Typically a good A League player.",
  },
  {
    rating: "4.0",
    description:
      "Many years of organized hockey experience, plays regularly. Strong skating, puck handling, shooting, and passing. Plays a strong supportive leadership role. Typically an A or above-average B League player.",
  },
  {
    rating: "3.0",
    description:
      'Significant organized hockey experience, plays fairly regularly. Moderate skills across the board. The "average" player — complements good players well but doesn\'t control the game alone. Typically a B or above-average C League player.',
  },
  {
    rating: "2.0",
    description:
      "May have organized hockey experience. Moderate skating skills but may be weaker in puck handling, shooting, passing, or decision making. Typically a C or D League player.",
  },
  {
    rating: "1.0",
    description:
      "Little to no organized hockey experience. Beginner-level skating with difficulties in puck handling, shooting, passing, and decision making. Typically a D League player. May also be a grizzled veteran hanging on.",
  },
];

const defaultValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: null,
  position: "",
  classification: "",
  handedness: "",
  gloveHand: "",
  rating: "",
  referral: "",
};

// --- Component ---

export default function RegistrationForm({ seasonId }: RegistrationFormProps) {
  const { control, handleSubmit, formState, reset, watch } = useForm<FormValues>({
    defaultValues,
    resolver: effectTsResolver(registrationFormSchema),
  });

  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [submitError, setSubmitError] = useState("");
  const ratingGuide = useDisclosure();

  // eslint-disable-next-line react-hooks/incompatible-library
  const position = watch("position");
  const isGoalie = position === "G";

  async function onSubmit(data: FormValues) {
    setSubmitError("");

    const payload: Record<string, unknown> = {
      seasonId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      birthday: data.birthday!.toString(),
      position: data.position,
    };

    if (data.classification) payload.classification = data.classification;
    if (isGoalie) {
      if (data.gloveHand) payload.gloveHand = data.gloveHand;
    } else {
      if (data.handedness) payload.handedness = data.handedness;
    }
    if (data.referral) payload.referral = data.referral;
    if (data.rating) {
      if (isGoalie) {
        payload.goalieRating = parseFloat(data.rating);
      } else {
        payload.playerRating = parseFloat(data.rating);
      }
    }

    try {
      await registerMutation({ variables: { data: payload } });
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Registration failed";
      setSubmitError(message);
      throw err;
    }
  }

  function handleReset() {
    reset();
    setSubmitError("");
  }

  if (formState.isSubmitSuccessful) {
    return (
      <div className="border-success-200/30 bg-success-100/10 rounded-lg border p-6 text-center">
        <h2 className="text-success mb-2 text-xl font-semibold">Registration Submitted!</h2>
        <p className="mb-2 text-slate-400">
          Your registration has been received. Please note that submitting a registration does not
          confirm your spot in the league. You will be contacted with a confirmation once rosters
          are finalized.
        </p>
        <Button color="primary" onPress={handleReset}>
          Register Another Player
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h1 className="mb-2 text-xl font-semibold text-white">Register</h1>
        <p className="text-default-800 text-sm">
          Please fill out the form below to register for the season.
        </p>
        {submitError && (
          <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
            {submitError}
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Personal Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="firstName"
            control={control}
            label="First Name"
            autoComplete="given-name"
            isRequired
          />
          <FormInput
            name="lastName"
            control={control}
            label="Last Name"
            autoComplete="family-name"
            isRequired
          />
        </div>
        <FormInput
          name="email"
          control={control}
          label="Email"
          type="email"
          autoComplete="email"
          isRequired
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="phone"
            control={control}
            label="Phone"
            type="tel"
            autoComplete="tel"
            isRequired
          />
          <FormDatePicker
            name="birthday"
            control={control}
            label="Birthday"
            autoComplete="bday"
            isRequired
          />
        </div>
      </div>

      {/* Player Preferences */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Player Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="classification"
            control={control}
            label="Registration Type"
            options={CLASSIFICATION_OPTIONS}
            isRequired
          />
          <FormSelect
            name="position"
            control={control}
            label="Position"
            options={POSITION_OPTIONS}
            isRequired
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isGoalie ? (
            <FormSelect
              key="gloveHand"
              name="gloveHand"
              control={control}
              label="Glove Hand"
              options={GLOVE_HAND_OPTIONS}
              isRequired
            />
          ) : (
            <FormSelect
              key="handedness"
              name="handedness"
              control={control}
              label="Handedness"
              options={HANDEDNESS_OPTIONS}
              isRequired
            />
          )}
          <div className="flex items-center gap-2">
            <FormSelect
              name="rating"
              control={control}
              className="flex-1"
              label="Skill Rating"
              options={RATING_OPTIONS}
            />
            <Button
              isIconOnly
              color="default"
              variant="light"
              aria-label="Rating guide"
              size="md"
              radius="full"
              onPress={ratingGuide.onOpen}
            >
              <FaQuestion size={20} />
            </Button>
            <Modal
              isOpen={ratingGuide.isOpen}
              onOpenChange={ratingGuide.onOpenChange}
              scrollBehavior="inside"
            >
              <ModalContent>
                <ModalHeader>Skill Rating Guide</ModalHeader>
                <ModalBody className="pb-6">
                  <p className="text-default-600 text-sm">
                    Use half-point ratings if you feel you fit between two categories. League
                    average is about 3.5
                  </p>
                  {RATING_DESCRIPTIONS.map((item) => (
                    <div key={item.rating}>
                      <p className="text-md font-medium text-white">{item.rating}</p>
                      <p className="text-default-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </ModalBody>
              </ModalContent>
            </Modal>
          </div>
        </div>
      </div>

      <FormTextarea
        name="referral"
        control={control}
        label="Referral"
        placeholder="How did you hear about us?"
      />

      <Button type="submit" color="primary" size="lg" isLoading={formState.isSubmitting}>
        Register
      </Button>
    </form>
  );
}
