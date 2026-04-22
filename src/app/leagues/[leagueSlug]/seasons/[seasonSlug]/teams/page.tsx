import { notFound } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import TeamCard from "@/components/TeamCard";
import TeamsHeader from "@/components/TeamsHeader";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function TeamsPage({ params }: Props) {
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

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      abbreviation: true,
      players: {
        select: {
          id: true,
          user: { select: { id: true, firstName: true, lastName: true } },
          number: true,
          position: true,
          playerRating: true,
          goalieRating: true,
          draftPick: { select: { id: true, overall: true, round: true, pick: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageLayout>
      <TeamsHeader season={season} league={league} isAdmin={isAdmin} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} league={league} season={season} />
        ))}
      </div>
    </PageLayout>
  );
}
