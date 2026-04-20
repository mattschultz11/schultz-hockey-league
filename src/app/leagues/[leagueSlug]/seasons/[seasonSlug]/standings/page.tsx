import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import TeamsTable from "@/components/StandingsTable";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function StandingsPage({ params }: Props) {
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
    select: { id: true, name: true, slug: true },
  });

  if (!season) {
    notFound();
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [teams, goals] = await Promise.all([
    prisma.team.findMany({
      where: { seasonId: season.id },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        abbreviation: true,
        awayGames: {
          select: { id: true, awayTeamResult: true, awayTeamPoints: true, datetime: true },
          where: { datetime: { lt: today } },
        },
        homeGames: {
          select: { id: true, homeTeamResult: true, homeTeamPoints: true, datetime: true },
          where: { datetime: { lt: today } },
        },
        penalties: { select: { minutes: true } },
        _count: { select: { goals: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.goal.findMany({
      where: { game: { seasonId: season.id } },
      select: { gameId: true, teamId: true },
    }),
  ]);

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: "Leagues", href: "/leagues" },
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Standings" },
          ]}
        />
      </PageHeader>
      <TeamsTable teams={teams} goals={goals} />
    </PageLayout>
  );
}
