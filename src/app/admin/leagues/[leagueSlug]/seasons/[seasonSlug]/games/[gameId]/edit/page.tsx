import { notFound } from "next/navigation";

import GameForm from "@/components/GameForm";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; gameId: string }>;
};

export default async function EditGamePage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug, gameId }] = await Promise.all([auth(), params]);

  if (session?.user?.role !== "ADMIN") {
    notFound();
  }

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

  const [game, teams] = await Promise.all([
    prisma.game.findFirst({
      where: { id: gameId, seasonId: season.id },
      select: {
        id: true,
        round: true,
        datetime: true,
        location: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeamResult: true,
        awayTeamResult: true,
        homeTeamPoints: true,
        awayTeamPoints: true,
      },
    }),
    prisma.team.findMany({
      where: { seasonId: season.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!game) {
    notFound();
  }

  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-white">Edit Game — Round {game.round}</h1>
        <GameForm mode="edit" seasonId={season.id} teams={teams} game={game} />
      </div>
    </PageLayout>
  );
}
