import { notFound } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import TeamEditForm from "@/components/TeamEditForm";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{
    leagueSlug: string;
    seasonSlug: string;
    teamSlug: string;
  }>;
};

export default async function EditTeamPage({ params }: Props) {
  const { leagueSlug, seasonSlug, teamSlug } = await params;

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

  const team = await prisma.team.findUnique({
    where: { seasonId_slug: { seasonId: season.id, slug: teamSlug } },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      managerId: true,
    },
  });

  if (!team) {
    notFound();
  }

  const players = await prisma.player.findMany({
    where: { seasonId: season.id, teamId: team.id },
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  const playerOptions = players.map((p) => ({
    id: p.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
  }));

  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-white">Edit {team.name}</h1>
        <TeamEditForm team={team} players={playerOptions} />
      </div>
    </PageLayout>
  );
}
