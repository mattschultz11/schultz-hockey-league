"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Predicate } from "effect";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Classification, Position } from "@/graphql/generated";
import {
  formatEnum,
  formatPositionRating,
  playerName,
  playerNumber,
  playerPosition,
  teamName,
} from "@/utils/stringUtils";

import type { GamesTableGame } from "./GamesTable";
import GamesTable from "./GamesTable";
import { findNextUpcomingId } from "./gameStatus";

type Props = {
  player: {
    id: string;
    number: number | null;
    position: Position | null;
    classification: Classification;
    playerRating: number | null;
    goalieRating: number | null;
    user: { firstName: string | null; lastName: string | null };
    team: { id: string; slug: string; name: string } | null;
    penalties: { id: string; minutes: number }[];
    _count: {
      goals: number;
      primaryAssists: number;
      secondaryAssists: number;
      lineups: number;
    };
  };
  games: GamesTableGame[];
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  isAdmin?: boolean;
};

export default function PlayerDetailCard({ player, games, league, season, isAdmin }: Props) {
  const router = useRouter();

  const goals = player._count.goals;
  const assists = player._count.primaryAssists + player._count.secondaryAssists;
  const points = goals + assists;
  const gp = player._count.lineups;
  const ppg = points > 0 && gp > 0 ? points / gp : 0;
  const pim = player.penalties.reduce((acc, p) => acc + p.minutes, 0);

  const teamHref = player.team
    ? `/leagues/${league.slug}/seasons/${season.slug}/teams/${player.team.slug}`
    : null;

  const nextUpId = findNextUpcomingId(games);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Card>
        <CardHeader>
          <h1 className="flex flex-grow items-center gap-3 text-2xl font-semibold">
            {Predicate.isNotNullable(player.number) && (
              <span className="text-default-600">#{playerNumber(player)}</span>
            )}
            <span>{playerName(player)}</span>
          </h1>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailField label="Position" value={playerPosition(player)} />
            <DetailField label="Rating" value={formatPositionRating(player)} />
            <DetailField label="Team" value={teamName(player.team)} href={teamHref} />
            <DetailField label="Classification" value={formatEnum(player.classification)} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Stats</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            <StatField label="Games Played" value={gp.toString()} />
            <StatField label="Goals" value={goals.toString()} />
            <StatField label="Assists" value={assists.toString()} />
            <StatField label="Points" value={points.toString()} />
            <StatField label="PPG" value={ppg.toFixed(2)} />
            <StatField label="Penalty Mins" value={pim.toString()} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Games Played</h2>
        </CardHeader>
        <CardBody>
          <GamesTable league={league} season={season} games={games} nextUpId={nextUpId} />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button onPress={() => router.back()} variant="flat" size="sm">
          ← Back
        </Button>
        {isAdmin && (
          <Button
            as={Link}
            href={`/admin/leagues/${league.slug}/seasons/${season.slug}/players/${player.id}/edit`}
            color="primary"
            size="sm"
          >
            Edit Player
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-default-600 text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground">
        {href ? (
          <Link href={href} className="hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function StatField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-default-100 flex flex-col items-center justify-between rounded-lg p-3">
      <dt className="text-default-600 text-center text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground text-xl font-bold">{value}</dd>
    </div>
  );
}
