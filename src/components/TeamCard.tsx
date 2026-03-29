"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";

import type { Position } from "@/graphql/generated";

import TeamTable from "./TeamTable";

type Props = {
  team: {
    id: string;
    slug: string;
    name: string;
    abbreviation: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    players: {
      id: string;
      position: Position | null;
      playerRating: number | null;
      goalieRating: number | null;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      };
      draftPick: {
        id: string;
        overall: number;
        round: number;
        pick: number;
      } | null;
    }[];
  };
};

export default function TeamCard({ team }: Props) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{team.name}</h2>
      </CardHeader>
      <CardBody>
        <TeamTable key={team.id} team={team} />
      </CardBody>
    </Card>
  );
}
