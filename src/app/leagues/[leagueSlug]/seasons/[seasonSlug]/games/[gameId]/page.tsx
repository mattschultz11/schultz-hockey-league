import { notFound } from "next/navigation";

import GameDetailCard from "@/components/GameDetailCard";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; gameId: string }>;
};

export default async function GameDetailPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug, gameId }] = await Promise.all([auth(), params]);

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

  const game = await prisma.game.findFirst({
    where: { id: gameId, seasonId: season.id },
    select: {
      id: true,
      round: true,
      datetime: true,
      location: true,
      homeTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      homeTeamResult: true,
      homeTeamPoints: true,
      awayTeamResult: true,
      awayTeamPoints: true,
      goals: {
        select: {
          id: true,
          period: true,
          time: true,
          strength: true,
          teamId: true,
          scorer: {
            select: {
              id: true,
              number: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          primaryAssist: {
            select: {
              id: true,
              number: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          secondaryAssist: {
            select: {
              id: true,
              number: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: [{ period: "asc" }, { time: "asc" }],
      },
      penalties: {
        select: {
          id: true,
          period: true,
          time: true,
          teamId: true,
          category: true,
          type: true,
          minutes: true,
          player: {
            select: {
              id: true,
              number: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: [{ period: "asc" }, { time: "asc" }],
      },
      lineups: {
        select: {
          id: true,
          teamId: true,
          player: {
            select: {
              id: true,
              number: true,
              position: true,
              playerRating: true,
              goalieRating: true,
              teamId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  if (!game) {
    notFound();
  }

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Games", href: `/leagues/${league.slug}/seasons/${season.slug}/games` },
            { label: `${game.awayTeam?.name} @ ${game.homeTeam?.name} (${game.round})` },
          ]}
        />
      </PageHeader>

      <GameDetailCard isAdmin={isAdmin} game={game} league={league} season={season} />
    </PageLayout>
  );
}
