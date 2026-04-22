"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";

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

export default function TeamCard({ team, league, season }: Props) {
  const scheduleHref = `/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}`;
  return (
    <Card>
      <CardHeader>
        <Link
          href={scheduleHref}
          className="text-lg font-semibold hover:underline focus-visible:underline"
        >
          {team.name}
        </Link>
      </CardHeader>
      <CardBody>
        <TeamTable key={team.id} team={team} />
      </CardBody>
    </Card>
  );
}
