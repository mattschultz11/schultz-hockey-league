import { redirect } from "next/navigation";

import CreateDraftForm from "@/components/CreateDraftForm";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function AdminCreateDraftPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug }] = await Promise.all([auth(), params]);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!league) redirect("/");

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, slug: true, name: true },
  });

  if (!season) redirect("/");

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageLayout>
      <CreateDraftForm league={league} season={season} teams={teams} />
    </PageLayout>
  );
}
