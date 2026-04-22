"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Result } from "@/graphql/generated";

import { getGameStatus, STATUS_COLOR } from "./gameStatus";

function teamHref(league: { slug: string }, season: { slug: string }, team: { slug: string }) {
  return `/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}`;
}

type Props = {
  game: {
    id: string;
    round: number;
    datetime: Date;
    location: string;
    homeTeam: { slug: string; name: string } | null;
    awayTeam: { slug: string; name: string } | null;
    homeTeamResult: Result | null;
    awayTeamResult: Result | null;
    homeTeamPoints: number | null;
    awayTeamPoints: number | null;
  };
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  isAdmin?: boolean;
};

export default function GameDetailCard({ game, league, season, isAdmin }: Props) {
  const {
    round,
    datetime,
    location,
    homeTeam,
    awayTeam,
    homeTeamResult,
    awayTeamResult,
    homeTeamPoints,
    awayTeamPoints,
  } = game;

  const router = useRouter();
  const status = getGameStatus(datetime, homeTeamResult, awayTeamResult);
  const homeTeamName = homeTeam?.name ?? "TBD";
  const awayTeamName = awayTeam?.name ?? "TBD";
  const homeTeamHref = homeTeam && teamHref(league, season, homeTeam);
  const awayTeamHref = awayTeam && teamHref(league, season, awayTeam);
  const dateLabel = datetime.toLocaleDateString();
  const timeLabel = game.datetime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <h1 className="flex flex-grow justify-between gap-1 text-2xl font-semibold">
            <span>{dateLabel}</span>
            <span>{timeLabel}</span>
            <span>{location}</span>
          </h1>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Matchup
              label="Home"
              teamName={homeTeamName}
              teamHref={homeTeamHref}
              points={homeTeamPoints}
            />
            <Matchup
              label="Away"
              teamName={awayTeamName}
              teamHref={awayTeamHref}
              points={awayTeamPoints}
            />
          </div>

          <div className="flex items-end justify-between gap-2">
            <dl className="flex flex-col gap-1">
              <DetailField label="Round" value={round.toString()} />
            </dl>
            <Chip size="sm" color={STATUS_COLOR[status]}>
              {status}
            </Chip>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button onPress={() => router.back()} variant="flat" size="sm">
          ← Back to Schedule
        </Button>
        {isAdmin && (
          <Button
            as={Link}
            href={`/admin/leagues/${league.slug}/seasons/${season.slug}/games/${game.id}/edit`}
            color="primary"
            size="sm"
          >
            Edit Game
          </Button>
        )}
      </div>
    </div>
  );
}

function Matchup({
  label,
  teamName,
  teamHref,
  points,
}: {
  label: string;
  teamName: string;
  teamHref: string | null;
  points: number | null;
}) {
  return (
    <div className="bg-default-200 flex flex-col gap-1 rounded-lg p-3">
      <span className="text-default-500 text-xs font-medium tracking-wide uppercase">{label}</span>
      {teamHref ? (
        <Link href={teamHref} className="text-foreground text-lg font-semibold hover:underline">
          {teamName}
        </Link>
      ) : (
        <span className="text-foreground text-lg font-semibold">{teamName}</span>
      )}
      {points != null && (
        <span className="text-default-600 text-sm">
          <span className="font-semibold">{points}</span> pts
        </span>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-default-500 text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
