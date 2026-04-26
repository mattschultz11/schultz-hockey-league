"use client";

import { Button, Card, CardBody, Chip, Link } from "@heroui/react";
import NextLink from "next/link";

import { Result } from "@/service/prisma/generated/enums";

import TeamLogo from "./TeamLogo";
import TeamName from "./TeamName";

type DashboardTeam = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type RecentGame = {
  id: string;
  datetime: Date;
  location: string;
  homeTeam: DashboardTeam | null;
  awayTeam: DashboardTeam | null;
  homeTeamResult: Result | null;
  awayTeamResult: Result | null;
  goals: { teamId: string }[];
};

type UpcomingGame = {
  id: string;
  datetime: Date;
  location: string;
  homeTeam: DashboardTeam | null;
  awayTeam: DashboardTeam | null;
};

type StandingsTeam = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  homeGames: { homeTeamResult: string | null; homeTeamPoints: number | null }[];
  awayGames: { awayTeamResult: string | null; awayTeamPoints: number | null }[];
  standing: { rank: number } | null;
};

type Props = {
  league: { slug: string; name: string };
  season: { slug: string; name: string };
  recentGames: RecentGame[];
  upcomingGames: UpcomingGame[];
  teams: StandingsTeam[];
  nextUpIds: string[];
};

export default function SeasonDashboard({
  league,
  season,
  recentGames,
  upcomingGames,
  teams,
  nextUpIds,
}: Props) {
  const nextUpIdSet = new Set(nextUpIds);
  const seasonBase = `/leagues/${league.slug}/seasons/${season.slug}`;

  return (
    <>
      <DashboardSection title="Recent Games" viewAllHref={`${seasonBase}/games`}>
        {recentGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentGames.map((game) => (
              <RecentGameCard key={game.id} game={game} league={league} season={season} />
            ))}
          </div>
        ) : (
          <EmptyState message="No completed games yet." />
        )}
      </DashboardSection>

      <DashboardSection title="Upcoming Games" viewAllHref={`${seasonBase}/games`}>
        {upcomingGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcomingGames.map((game) => (
              <UpcomingGameCard
                key={game.id}
                game={game}
                league={league}
                season={season}
                isNextUp={nextUpIdSet.has(game.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No upcoming games scheduled." />
        )}
      </DashboardSection>

      <DashboardSection title="Standings" viewAllHref={`${seasonBase}/standings`}>
        {teams.length > 0 ? (
          <StandingsList teams={teams} league={league} season={season} />
        ) : (
          <EmptyState message="No teams yet." />
        )}
      </DashboardSection>

      <div className="flex justify-center pt-2 pb-4">
        <Button
          as={Link}
          href={`${seasonBase}/registration`}
          color="primary"
          size="lg"
          className="font-semibold"
        >
          Register for this season
        </Button>
      </div>
    </>
  );
}

function DashboardSection({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Link as={NextLink} href={viewAllHref} size="sm" underline="hover">
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardBody className="text-foreground/60 text-center">{message}</CardBody>
    </Card>
  );
}

function gameHref(league: { slug: string }, season: { slug: string }, gameId: string) {
  return `/leagues/${league.slug}/seasons/${season.slug}/games/${gameId}`;
}

function teamGradient(home: DashboardTeam | null, away: DashboardTeam | null) {
  const homeColor = home?.primaryColor ?? "#3f3f46";
  const awayColor = away?.primaryColor ?? "#3f3f46";
  return `linear-gradient(135deg, ${homeColor}33 0%, transparent 50%, ${awayColor}33 100%)`;
}

function RecentGameCard({
  game,
  league,
  season,
}: {
  game: RecentGame;
  league: { slug: string };
  season: { slug: string };
}) {
  const homeScore = game.homeTeam
    ? game.goals.filter((g) => g.teamId === game.homeTeam!.id).length
    : 0;
  const awayScore = game.awayTeam
    ? game.goals.filter((g) => g.teamId === game.awayTeam!.id).length
    : 0;
  const homeWin = game.homeTeamResult === Result.WIN;
  const awayWin = game.awayTeamResult === Result.WIN;
  const dateLabel = game.datetime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      as={NextLink}
      href={gameHref(league, season, game.id)}
      isPressable
      isHoverable
      style={{ backgroundImage: teamGradient(game.homeTeam, game.awayTeam) }}
      className="border-default-200 border"
    >
      <CardBody className="flex flex-col gap-2 px-4 py-3">
        <div className="text-foreground/60 flex items-center justify-between text-xs">
          <span>{dateLabel}</span>
          <Chip size="sm" color="success" variant="flat" className="h-5 px-1.5 text-xs">
            Final
          </Chip>
        </div>
        <TeamScoreRow team={game.homeTeam} score={homeScore} isWinner={homeWin} dimmed={awayWin} />
        <TeamScoreRow team={game.awayTeam} score={awayScore} isWinner={awayWin} dimmed={homeWin} />
        <div className="text-foreground/50 truncate">{game.location}</div>
      </CardBody>
    </Card>
  );
}

function TeamScoreRow({
  team,
  score,
  isWinner,
  dimmed,
}: {
  team: DashboardTeam | null;
  score: number;
  isWinner: boolean;
  dimmed: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${dimmed ? "opacity-60" : ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <TeamColorDot team={team} />
        {team ? <TeamName team={team} /> : <span className="text-foreground/60">TBD</span>}
      </div>
      <span
        className={`font-mono text-2xl tabular-nums ${
          isWinner ? "font-bold" : "text-foreground/70 font-medium"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

function UpcomingGameCard({
  game,
  league,
  season,
  isNextUp,
}: {
  game: UpcomingGame;
  league: { slug: string };
  season: { slug: string };
  isNextUp: boolean;
}) {
  const dateLabel = game.datetime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = game.datetime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card
      as={NextLink}
      href={gameHref(league, season, game.id)}
      isPressable
      isHoverable
      style={{ backgroundImage: teamGradient(game.homeTeam, game.awayTeam) }}
      className="border-default-200 border"
    >
      <CardBody className="flex flex-col gap-2 px-4 py-3">
        <div className="text-foreground/70 flex items-center justify-between text-xs">
          <span className="font-medium">
            {dateLabel} · {timeLabel}
          </span>
          {isNextUp && (
            <Chip size="sm" color="primary" variant="dot" className="h-5 px-1.5 text-xs">
              Next Up
            </Chip>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <TeamColorDot team={game.homeTeam} />
            {game.homeTeam ? (
              <TeamName team={game.homeTeam} />
            ) : (
              <span className="text-foreground/60">TBD</span>
            )}
          </div>
          <span className="text-foreground/50 px-1 text-xs font-medium uppercase">vs</span>
          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
            <TeamColorDot team={game.awayTeam} />
            {game.awayTeam ? (
              <TeamName team={game.awayTeam} />
            ) : (
              <span className="text-foreground/60">TBD</span>
            )}
          </div>
        </div>
        <div className="text-foreground/50 truncate">{game.location}</div>
      </CardBody>
    </Card>
  );
}

function TeamColorDot({ team }: { team: DashboardTeam | null }) {
  if (team?.logoUrl) {
    return <TeamLogo team={team} width={24} height={24} />;
  }
  const color = team?.primaryColor ?? "#52525b";
  const ring = team?.secondaryColor ?? "transparent";
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 shrink-0 rounded-full border-2"
      style={{ backgroundColor: color, borderColor: ring }}
    />
  );
}

function StandingsList({
  teams,
  league,
  season,
}: {
  teams: StandingsTeam[];
  league: { slug: string };
  season: { slug: string };
}) {
  const rows = teams
    .map((team) => {
      const wins =
        team.homeGames.filter((g) => g.homeTeamResult === Result.WIN).length +
        team.awayGames.filter((g) => g.awayTeamResult === Result.WIN).length;
      const losses =
        team.homeGames.filter((g) => g.homeTeamResult === Result.LOSS).length +
        team.awayGames.filter((g) => g.awayTeamResult === Result.LOSS).length;
      const ties =
        team.homeGames.filter((g) => g.homeTeamResult === Result.TIE).length +
        team.awayGames.filter((g) => g.awayTeamResult === Result.TIE).length;
      const points =
        team.homeGames.reduce((acc, g) => acc + (g.homeTeamPoints ?? 0), 0) +
        team.awayGames.reduce((acc, g) => acc + (g.awayTeamPoints ?? 0), 0);
      return {
        team,
        rank: team.standing?.rank ?? 0,
        wins,
        losses,
        ties,
        points,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  const maxPoints = Math.max(1, ...rows.map((r) => r.points));

  return (
    <Card>
      <CardBody className="p-0">
        <ul className="divide-default-200 divide-y">
          {rows.map((row, index) => {
            const teamHref = `/leagues/${league.slug}/seasons/${season.slug}/teams/${row.team.slug}`;
            const accent = row.team.primaryColor ?? "#52525b";
            const fillPct = Math.round((row.points / maxPoints) * 100);
            return (
              <li key={row.team.id}>
                <NextLink
                  href={teamHref}
                  className="hover:bg-default-100 flex items-center gap-3 px-4 py-2 transition-colors"
                  style={{ borderLeft: `4px solid ${accent}` }}
                >
                  <span
                    className={`w-6 text-center font-mono font-bold tabular-nums ${
                      index < 3 ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <TeamColorDot team={row.team} />
                  <TeamName team={row.team} className="flex-1" />
                  <span className="text-foreground/70 hidden font-mono text-xs tabular-nums sm:inline">
                    {row.wins}-{row.losses}-{row.ties}
                  </span>
                  <div className="hidden w-20 sm:block">
                    <div className="bg-default-200 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${fillPct}%`, backgroundColor: accent }}
                      />
                    </div>
                  </div>
                  <span className="w-14 text-right font-mono font-bold tabular-nums">
                    {row.points}
                    <span className="text-foreground/50 ml-1 text-xs font-normal">pts</span>
                  </span>
                </NextLink>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
