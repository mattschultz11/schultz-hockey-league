import { Chip } from "@heroui/react";
import Link from "next/link";

import type { Position, Strength } from "@/graphql/generated";

import GameLineup from "./GameLineup";
import TeamLogo from "./TeamLogo";
import TeamName from "./TeamName";

function teamHref(league: { slug: string }, season: { slug: string }, team: { slug: string }) {
  return `/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}`;
}

type LineupPlayer = {
  id: string;
  number: number | null;
  position: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
  teamId: string | null;
  user: { firstName: string | null; lastName: string | null };
};

type GoalPlayer = {
  id: string;
  number: number | null;
  user: { firstName: string | null; lastName: string | null };
};

type Lineup = {
  id: string;
  teamId: string;
  number: number | null;
  player: LineupPlayer;
};

type Goal = {
  id: string;
  period: number;
  time: number;
  strength: Strength;
  teamId: string;
  scorer: GoalPlayer;
  primaryAssist: GoalPlayer | null;
  secondaryAssist: GoalPlayer | null;
};

type Props = {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  game: {
    homeTeam: MatchupTeam | null;
    awayTeam: MatchupTeam | null;
    goals: Goal[];
    lineups: Lineup[];
  };
  homeLineupEditHref?: string;
  awayLineupEditHref?: string;
};

export default function GameMatchup({
  league,
  season,
  game,
  homeLineupEditHref,
  awayLineupEditHref,
}: Props) {
  const { homeTeam, awayTeam, goals } = game;

  const homeTeamGoals = goals.filter((g) => g.teamId === homeTeam?.id);
  const awayTeamGoals = goals.filter((g) => g.teamId === awayTeam?.id);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="bg-default-200 flex flex-col gap-2 rounded-lg p-3">
        <HomeTeanMatchup league={league} season={season} team={homeTeam} goals={homeTeamGoals} />
        <GameLineup
          lineup={game.lineups.filter((l) => l.teamId === homeTeam?.id)}
          editHref={homeLineupEditHref}
        />
      </div>
      <div className="bg-default-200 flex flex-col gap-2 rounded-lg p-3">
        <AwayTeanMatchup league={league} season={season} team={awayTeam} goals={awayTeamGoals} />
        <GameLineup
          lineup={game.lineups.filter((l) => l.teamId === awayTeam?.id)}
          direction="right"
          editHref={awayLineupEditHref}
        />
      </div>
    </div>
  );
}

type MatchupTeam = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

function HomeTeanMatchup({
  league,
  season,
  team,
  goals,
}: {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  team: MatchupTeam | null;
  goals: Goal[];
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <Chip size="sm" color="primary" variant="solid" className="uppercase">
          Home
        </Chip>
        {team ? (
          <div className="flex items-center gap-3">
            <TeamLogo team={team} width={36} height={36} />
            <TeamName
              as={Link}
              team={team}
              href={teamHref(league, season, team)}
              className="text-2xl font-semibold hover:underline"
            />
          </div>
        ) : (
          <span className="text-foreground text-lg font-semibold">TBD</span>
        )}
      </div>
      <span className="font-mono text-4xl font-bold">{goals.length}</span>
    </div>
  );
}

function AwayTeanMatchup({
  league,
  season,
  team,
  goals,
}: {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  team: MatchupTeam | null;
  goals: Goal[];
}) {
  return (
    <div className="flex flex-row-reverse items-center justify-between">
      <div className="flex flex-col items-end gap-2">
        <Chip size="sm" color="secondary" variant="solid" className="uppercase">
          Away
        </Chip>
        {team ? (
          <div className="flex items-center gap-3">
            <TeamLogo team={team} width={36} height={36} />
            <TeamName
              as={Link}
              team={team}
              href={teamHref(league, season, team)}
              className="text-2xl font-semibold hover:underline"
            />
          </div>
        ) : (
          <span className="text-foreground text-lg font-semibold">TBD</span>
        )}
      </div>
      <span className="font-mono text-4xl font-bold">{goals.length}</span>
    </div>
  );
}
