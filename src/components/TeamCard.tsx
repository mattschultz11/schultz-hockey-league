"use client";

import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import Link from "next/link";

import type { Position } from "@/graphql/generated";
import { positionRating } from "@/utils/stringUtils";

import TeamLogo from "./TeamLogo";
import TeamName from "./TeamName";
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
      number: number | null;
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
  hideNumber?: boolean;
};

export default function TeamCard({ team, league, season, hideNumber }: Props) {
  const scheduleHref = `/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}`;
  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <TeamLogo team={team} width={36} height={36} isBlurred />
            <TeamName
              as={Link}
              team={team}
              href={scheduleHref}
              className="text-3xl font-semibold hover:underline focus-visible:underline"
            />
          </div>
          <Chip size="sm" variant="bordered">
            {team.players.reduce((acc, player) => acc + (positionRating(player) ?? 0), 0)}
          </Chip>
        </div>
      </CardHeader>
      <CardBody>
        <TeamTable key={team.id} team={team} hideNumber={hideNumber} />
      </CardBody>
    </Card>
  );
}
