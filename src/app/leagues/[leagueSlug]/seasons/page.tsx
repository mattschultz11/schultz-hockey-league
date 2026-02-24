import { notFound } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import SeasonsHeader from "@/components/SeasonsHeader";
import SeasonsList from "@/components/SeasonsList";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string }>;
};

export default async function SeasonsPage({ params }: Props) {
  const { leagueSlug } = await params;

  const [league, session] = await Promise.all([
    prisma.league.findUnique({
      where: { slug: leagueSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        seasons: {
          select: { id: true, slug: true, name: true, startDate: true, endDate: true },
          orderBy: { startDate: "desc" },
        },
      },
    }),
    auth(),
  ]);

  if (!league) {
    notFound();
  }

  const isAdmin = session?.user.role === "ADMIN";

  const seasons = league.seasons.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
  }));

  return (
    <PageLayout>
      <SeasonsHeader league={league} isAdmin={isAdmin} />
      <SeasonsList
        leagueId={league.id}
        leagueSlug={leagueSlug}
        leagueName={league.name}
        seasons={seasons}
        isAdmin={isAdmin}
      />
    </PageLayout>
  );
}
