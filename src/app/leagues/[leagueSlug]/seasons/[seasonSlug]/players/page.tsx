import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import PlayersSection from "@/components/PlayersSection";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function PlayersPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

  const [league, session] = await Promise.all([
    prisma.league.findUnique({
      where: { slug: leagueSlug },
      select: { id: true, name: true, slug: true },
    }),
    auth(),
  ]);

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
      team: { select: { id: true, slug: true, name: true } },
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

  const isAdmin = session?.user?.role === "ADMIN";

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
      <PlayersSection
        players={players}
        isAdmin={isAdmin}
        leagueSlug={league.slug}
        seasonSlug={season.slug}
      />
    </PageLayout>
  );
}
