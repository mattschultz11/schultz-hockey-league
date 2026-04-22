import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import PlayersSection from "@/components/PlayersSection";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function PlayersPage({ params }: Props) {
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

  const players = await prisma.player.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      number: true,
      position: true,
      classification: true,
      playerRating: true,
      goalieRating: true,
      user: { select: { firstName: true, lastName: true } },
      penalties: { select: { id: true, minutes: true } },
      team: {
        select: { id: true, slug: true, name: true, primaryColor: true, secondaryColor: true },
      },
      draftPick: { select: { overall: true } },
      _count: {
        select: {
          goals: true,
          primaryAssists: true,
          secondaryAssists: true,
          lineups: true,
        },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: "Leagues", href: "/leagues" },
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Players" },
          ]}
        />
      </PageHeader>
      <PlayersSection players={players} league={league} season={season} />
    </PageLayout>
  );
}
