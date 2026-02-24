import { notFound } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import RegistrationForm from "@/components/RegistrationForm";
import RegistrationHeader from "@/components/RegistrationHeader";
import SeasonInfo from "@/components/SeasonInfo";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function SeasonRegistrationPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!league) {
    notFound();
  }

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: {
      id: true,
      slug: true,
      name: true,
      info: true,
      startDate: true,
      endDate: true,
      sundays: true,
      mondays: true,
      tuesdays: true,
      wednesdays: true,
      thursdays: true,
      fridays: true,
      saturdays: true,
    },
  });

  if (!season) {
    notFound();
  }

  return (
    <PageLayout>
      <RegistrationHeader league={league} season={season} isAdmin={isAdmin} />
      <div className="mx-auto max-w-4xl">
        {season.info && <SeasonInfo info={season.info} />}
        <RegistrationForm seasonId={season.id} />
      </div>
    </PageLayout>
  );
}
