import { notFound } from "next/navigation";

import { findNextUpcomingId } from "@/components/gameStatus";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import SeasonDashboard from "@/components/SeasonDashboard";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

const RECENT_GAMES_LIMIT = 4;
const UPCOMING_GAMES_LIMIT = 4;

const teamSelect = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
} as const;

export default async function SeasonPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!league) {
    notFound();
  }

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, slug: true, name: true },
  });

  if (!season) {
    notFound();
  }

  const now = new Date();

  const [recentGames, upcomingGames, teams] = await Promise.all([
    prisma.game.findMany({
      where: { seasonId: season.id, homeTeamResult: { not: null } },
      select: {
        id: true,
        datetime: true,
        location: true,
        homeTeam: { select: teamSelect },
        awayTeam: { select: teamSelect },
        homeTeamResult: true,
        awayTeamResult: true,
        goals: { select: { teamId: true } },
      },
      orderBy: { datetime: "desc" },
      take: RECENT_GAMES_LIMIT,
    }),
    prisma.game.findMany({
      where: { seasonId: season.id, datetime: { gte: now } },
      select: {
        id: true,
        datetime: true,
        location: true,
        homeTeam: { select: teamSelect },
        awayTeam: { select: teamSelect },
        homeTeamResult: true,
        awayTeamResult: true,
      },
      orderBy: { datetime: "asc" },
      take: UPCOMING_GAMES_LIMIT,
    }),
    prisma.team.findMany({
      where: { seasonId: season.id },
      select: {
        ...teamSelect,
        homeGames: {
          select: { homeTeamResult: true, homeTeamPoints: true },
          where: { homeTeamResult: { not: null } },
        },
        awayGames: {
          select: { awayTeamResult: true, awayTeamPoints: true },
          where: { awayTeamResult: { not: null } },
        },
        standing: true,
      },
      orderBy: { standing: { rank: "asc" } },
    }),
  ]);

  const nextUpIds = Array.from(
    new Set(
      teams
        .map((team) =>
          findNextUpcomingId(
            upcomingGames.filter(
              (game) => game.homeTeam?.id === team.id || game.awayTeam?.id === team.id,
            ),
          ),
        )
        .filter((id): id is string => id != null),
    ),
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name },
          ]}
        />
      </PageHeader>
      <SeasonDashboard
        league={league}
        season={season}
        recentGames={recentGames}
        upcomingGames={upcomingGames}
        teams={teams}
        nextUpIds={nextUpIds}
      />
    </PageLayout>
  );
}
