import Link from "next/link";

import type { Position } from "@/graphql/generated";

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

type Lineup = {
  id: string;
  teamId: string;
  player: LineupPlayer;
};

type Props = {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  game: {
    homeTeam: MatchupTeam | null;
    awayTeam: MatchupTeam | null;
    homeTeamPoints: number | null;
    awayTeamPoints: number | null;
    lineups: Lineup[];
  };
};

export default function GameMatchup({ league, season, game }: Props) {
  const { homeTeam, awayTeam, homeTeamPoints, awayTeamPoints } = game;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="bg-default-200 flex flex-col gap-2 rounded-lg p-3">
        <Matchup
          league={league}
          season={season}
          label="Home"
          team={homeTeam}
          points={homeTeamPoints}
        />
        <GameLineup lineup={game.lineups.filter((l) => l.teamId === homeTeam?.id)} />
      </div>
      <div className="bg-default-200 flex flex-col gap-2 rounded-lg p-3">
        <Matchup
          league={league}
          season={season}
          label="Away"
          team={awayTeam}
          points={awayTeamPoints}
        />
        <GameLineup lineup={game.lineups.filter((l) => l.teamId === awayTeam?.id)} />
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

function Matchup({
  league,
  season,
  label,
  team,
  points,
}: {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  label: string;
  team: MatchupTeam | null;
  points: number | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-default-600 text-xs font-medium tracking-wide uppercase">{label}</span>
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
      {points != null && (
        <span className="text-default-600 text-sm">
          <span className="font-semibold">{points}</span> pts
        </span>
      )}
    </div>
  );
}
