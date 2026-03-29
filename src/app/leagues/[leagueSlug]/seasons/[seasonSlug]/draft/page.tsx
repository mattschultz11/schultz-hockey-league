import { notFound } from "next/navigation";

import DraftHeader from "@/components/DraftHeader";
import DraftTable from "@/components/DraftTable";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function DraftPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

  const [league, session] = await Promise.all([
    prisma.league.findUnique({
      where: { slug: leagueSlug },
      select: { id: true, name: true, slug: true },
    }),
    auth(),
  ]);

  if (!league) notFound();

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, name: true, slug: true },
  });

  if (!season) notFound();

  const draftPicks = await prisma.draftPick.findMany({
    where: { seasonId: season.id },
    orderBy: { overall: "asc" },
    include: {
      team: { select: { id: true, name: true } },
      player: {
        select: {
          id: true,
          position: true,
          playerRating: true,
          goalieRating: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageLayout>
      <DraftHeader season={season} league={league} draftPicks={draftPicks} isAdmin={isAdmin} />
      <DraftTable draftPicks={draftPicks} />
    </PageLayout>
  );
}
