import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import PlayerDetailCard from "@/components/PlayerDetailCard";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";
import { playerName } from "@/utils/stringUtils";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; playerId: string }>;
};

export default async function PlayerDetailPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug, playerId }] = await Promise.all([auth(), params]);

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

  const player = await prisma.player.findFirst({
    where: { id: playerId, seasonId: season.id },
    select: {
      id: true,
      number: true,
      position: true,
      classification: true,
      playerRating: true,
      goalieRating: true,
      user: { select: { firstName: true, lastName: true } },
      team: { select: { id: true, slug: true, name: true } },
      penalties: { select: { id: true, minutes: true } },
      _count: {
        select: {
          goals: true,
          primaryAssists: true,
          secondaryAssists: true,
          lineups: true,
        },
      },
      lineups: {
        orderBy: { game: { datetime: "asc" } },
        select: {
          game: {
            select: {
              id: true,
              round: true,
              datetime: true,
              location: true,
              homeTeam: {
                select: { id: true, name: true, primaryColor: true, secondaryColor: true },
              },
              awayTeam: {
                select: { id: true, name: true, primaryColor: true, secondaryColor: true },
              },
              homeTeamResult: true,
              awayTeamResult: true,
            },
          },
        },
      },
    },
  });

  if (!player) {
    notFound();
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const games = player.lineups.map((lineup) => lineup.game);

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: "Leagues", href: "/leagues" },
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Players", href: `/leagues/${league.slug}/seasons/${season.slug}/players` },
            { label: playerName(player) },
          ]}
        />
      </PageHeader>

      <PlayerDetailCard
        player={player}
        games={games}
        league={league}
        season={season}
        isAdmin={isAdmin}
      />
    </PageLayout>
  );
}
