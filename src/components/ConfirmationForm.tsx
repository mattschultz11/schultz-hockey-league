"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button } from "@heroui/react";
import { useState } from "react";

const CONFIRM_PLAYER_MUTATION = gql`
  mutation ConfirmPlayer($id: ID!, $confirmed: Boolean!) {
    confirmPlayer(id: $id, confirmed: $confirmed) {
      id
      confirmed
    }
  }
`;

type Props = {
  playerId: string;
  firstName: string;
  seasonName: string;
};

export default function ConfirmationForm({ playerId, firstName, seasonName }: Props) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [confirmPlayer, { loading }] = useMutation<{
    confirmPlayer: { id: string; confirmed: boolean };
  }>(CONFIRM_PLAYER_MUTATION, {
    onCompleted: (data) => setSubmitted(data.confirmPlayer.confirmed),
    onError: (err) => setError(err.message.replace(/^[^:]+:\s*/, "")),
  });

  function handleConfirm(confirmed: boolean) {
    setError(null);
    confirmPlayer({ variables: { id: playerId, confirmed } });
  }

  if (submitted != null) {
    return (
      <p className="text-lg">
        {submitted
          ? `Thanks ${firstName}! You're confirmed for ${seasonName}.`
          : `Got it, ${firstName}. You've declined ${seasonName}.`}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-default-400 text-lg">{firstName}, are you playing this season?</p>
      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="flex justify-center gap-4">
        <Button color="success" size="lg" isLoading={loading} onPress={() => handleConfirm(true)}>
          Yes, I&apos;m in!
        </Button>
        <Button color="danger" size="lg" isLoading={loading} onPress={() => handleConfirm(false)}>
          No, count me out
        </Button>
      </div>
    </div>
  );
}
