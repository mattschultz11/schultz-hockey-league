import { notFound } from "next/navigation";

import ConfirmationForm from "@/components/ConfirmationForm";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{
    leagueSlug: string;
    seasonSlug: string;
    playerId: string;
  }>;
};

export default async function ConfirmationPage({ params }: Props) {
  const { leagueSlug, seasonSlug, playerId } = await params;

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true },
  });

  if (!league) {
    notFound();
  }

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, name: true },
  });

  if (!season) {
    notFound();
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, seasonId: true, user: { select: { firstName: true, lastName: true } } },
  });

  if (!player || player.seasonId !== season.id) {
    notFound();
  }

  const displayName = player.user.firstName || player.user.lastName || "Player";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">
          {season.name} — {league.name}
        </h1>
        <ConfirmationForm playerId={player.id} firstName={displayName} seasonName={season.name} />
      </div>
    </div>
  );
}
