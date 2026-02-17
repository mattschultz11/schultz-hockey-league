"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { type CalendarDate } from "@internationalized/date";
import { type FormEvent, useState } from "react";
import { FaQuestion } from "react-icons/fa6";

const REGISTER_MUTATION = gql`
  mutation Register($data: RegistrationInput!) {
    register(data: $data) {
      id
    }
  }
`;

type RegistrationFormProps = {
  seasonId: string;
};

type FormState = "idle" | "loading" | "success" | "error";

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

export default function RegistrationForm({ seasonId }: RegistrationFormProps) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [register] = useMutation(REGISTER_MUTATION);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState<CalendarDate | null>(null);
  const [handedness, setHandedness] = useState("");
  const [gloveHand, setGloveHand] = useState("");
  const [position, setPosition] = useState("");
  const [rating, setRating] = useState("");
  const [referral, setReferral] = useState("");

  const ratingGuide = useDisclosure();
  const isGoalie = position === "G";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage("");

    const payload: Record<string, unknown> = {
      seasonId,
      email,
      firstName,
      lastName,
      phone,
      birthday: birthday!.toString(),
      position,
    };

    if (isGoalie) {
      if (gloveHand) payload.gloveHand = gloveHand;
    } else {
      if (handedness) payload.handedness = handedness;
    }
    if (referral) payload.referral = referral;
    if (rating) {
      if (isGoalie) {
        payload.goalieRating = parseFloat(rating);
      } else {
        payload.playerRating = parseFloat(rating);
      }
    }

    try {
      await register({ variables: { data: payload } });
      setFormState("success");
    } catch (err) {
      setFormState("error");
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Registration failed";
      setErrorMessage(message);
    }
  }

  function handleReset() {
    setFormState("idle");
    setErrorMessage("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setBirthday(null);
    setHandedness("");
    setGloveHand("");
    setPosition("");
    setRating("");
    setReferral("");
  }

  if (formState === "success") {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="mb-2 text-xl font-semibold text-white">Register</h1>
        <p className="text-default-800 text-sm">
          Please fill out the form below to register for the season.
        </p>
        {errorMessage && formState === "error" && (
          <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Personal Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            autoComplete="given-name"
            isRequired
            value={firstName}
            onValueChange={setFirstName}
          />
          <Input
            label="Last Name"
            autoComplete="family-name"
            isRequired
            value={lastName}
            onValueChange={setLastName}
          />
        </div>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          isRequired
          value={email}
          onValueChange={setEmail}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            isRequired
            value={phone}
            onValueChange={setPhone}
          />
          <DatePicker
            label="Birthday"
            autoComplete="bday"
            isRequired
            value={birthday}
            onChange={setBirthday}
          />
        </div>
      </div>

      {/* Player Preferences */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Player Preferences</h2>
        <Select
          label="Position"
          isRequired
          selectedKeys={position ? [position] : []}
          onSelectionChange={(keys) => {
            setPosition([...keys][0]?.toString() ?? "");
            setRating("");
          }}
        >
          {POSITION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          {isGoalie ? (
            <Select
              label="Glove Hand"
              isRequired
              selectedKeys={gloveHand ? [gloveHand] : []}
              onSelectionChange={(keys) => setGloveHand([...keys][0]?.toString() ?? "")}
            >
              {GLOVE_HAND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          ) : (
            <Select
              label="Handedness"
              isRequired
              selectedKeys={handedness ? [handedness] : []}
              onSelectionChange={(keys) => setHandedness([...keys][0]?.toString() ?? "")}
            >
              {HANDEDNESS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          )}
          <div className="flex items-center gap-2">
            <Select
              className="flex-1"
              label={isGoalie ? "Goalie Rating (5-1)" : "Player Rating (5-1)"}
              selectedKeys={rating ? [rating] : []}
              onSelectionChange={(keys) => setRating([...keys][0]?.toString() ?? "")}
            >
              {RATING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
            <Button
              isIconOnly
              color="default"
              variant="light"
              aria-label="Rating guide"
              size="lg"
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
                <ModalHeader>Player Rating Guide</ModalHeader>
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

      <Textarea
        label="Referral"
        placeholder="How did you hear about us?"
        value={referral}
        onValueChange={setReferral}
      />

      <Button type="submit" color="primary" size="lg" isLoading={formState === "loading"}>
        Register
      </Button>
    </form>
  );
}
