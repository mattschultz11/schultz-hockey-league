import { redirect } from "next/navigation";

import CreateTeamForm from "@/components/CreateTeamForm";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function AdminCreateTeamPage({ params }: Props) {
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

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-semibold text-white">New Team — {season.name}</h1>
      <CreateTeamForm league={league} season={season} />
    </div>
  );
}
