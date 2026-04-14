import { notFound } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import PlayerEditForm from "@/components/PlayerEditForm";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{
    leagueSlug: string;
    seasonSlug: string;
    playerId: string;
  }>;
};

export default async function EditPlayerPage({ params }: Props) {
  const { leagueSlug, seasonSlug, playerId } = await params;

  const session = await auth();
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

  const [player, teams] = await Promise.all([
    prisma.player.findFirst({
      where: { id: playerId, seasonId: season.id },
      select: {
        id: true,
        classification: true,
        status: true,
        teamId: true,
        position: true,
        number: true,
        playerRating: true,
        goalieRating: true,
        lockerRating: true,
        registrationNumber: true,
        ratingVerified: true,
        confirmed: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.team.findMany({
      where: { seasonId: season.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!player) {
    notFound();
  }

  const returnHref = `/leagues/${league.slug}/seasons/${season.slug}/players`;
  const displayName =
    [player.user.firstName, player.user.lastName].filter(Boolean).join(" ") || "Player";

  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-white">Edit {displayName}</h1>
        <PlayerEditForm player={player} teams={teams} returnHref={returnHref} />
      </div>
    </PageLayout>
  );
}
