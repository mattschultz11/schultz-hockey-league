"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PenaltyCategory, PenaltyType, Position, Result, Strength } from "@/graphql/generated";

import GameGoalsList from "./GameGoalsList";
import GameMatchup from "./GameMatchup";
import GamePenaltiesList from "./GamePenaltiesList";
import { getGameStatus, STATUS_COLOR } from "./gameStatus";

type MatchupTeam = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type GamePlayer = {
  id: string;
  number: number | null;
  user: { firstName: string | null; lastName: string | null };
};

type LineupPlayer = GamePlayer & {
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
  teamId: string | null;
};

type Props = {
  game: {
    id: string;
    round: number;
    datetime: Date;
    location: string;
    homeTeam: MatchupTeam | null;
    awayTeam: MatchupTeam | null;
    homeTeamResult: Result | null;
    awayTeamResult: Result | null;
    homeTeamPoints: number | null;
    awayTeamPoints: number | null;
    goals: {
      id: string;
      period: number;
      time: number;
      strength: Strength;
      teamId: string;
      scorer: GamePlayer;
      primaryAssist: GamePlayer | null;
      secondaryAssist: GamePlayer | null;
    }[];
    penalties: {
      id: string;
      period: number;
      time: number;
      teamId: string;
      category: PenaltyCategory;
      type: PenaltyType;
      minutes: number;
      player: GamePlayer;
    }[];
    lineups: {
      id: string;
      teamId: string;
      player: LineupPlayer;
    }[];
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
    goals,
    penalties,
  } = game;

  const router = useRouter();
  const status = getGameStatus(datetime, homeTeamResult, awayTeamResult);
  // April 23
  const dateLabel = datetime.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const timeLabel = game.datetime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex w-full flex-col gap-2">
            <h1 className="flex flex-grow justify-between gap-1 text-2xl font-semibold">
              <span>{dateLabel}</span>
              <span>{timeLabel}</span>
              <span>{location}</span>
            </h1>
            <div className="flex items-end justify-between gap-2">
              <DetailField label="Round" value={round.toString()} />
              <Chip size="sm" color={STATUS_COLOR[status]}>
                {status}
              </Chip>
            </div>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <GameMatchup league={league} season={season} game={game} />
        </CardBody>
      </Card>

      <GameGoalsList goals={goals} homeTeam={homeTeam} awayTeam={awayTeam} />
      <GamePenaltiesList penalties={penalties} homeTeam={homeTeam} awayTeam={awayTeam} />

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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-default-600 text-xs font-medium tracking-wide uppercase">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
