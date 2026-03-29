import { redirect } from "next/navigation";

import PageLayout from "@/components/PageLayout";
import RegistrationsTable from "@/components/RegistrationsTable";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function AdminRegistrationsPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug }] = await Promise.all([auth(), params]);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  if (!leagueSlug) {
    redirect("/");
  }

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!league) {
    redirect("/");
  }

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: {
      id: true,
      slug: true,
      name: true,
      registrations: {
        orderBy: { createdAt: "asc" },
      },
      players: {
        select: { id: true, user: { select: { email: true } } },
      },
    },
  });

  if (!season) {
    redirect("/");
  }

  return (
    <PageLayout>
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-white">Registrations</h1>
        <p className="text-default-500 text-lg">{season.name}</p>
      </div>
      <RegistrationsTable
        registrations={season.registrations}
        acceptedPlayers={season.players}
        seasonId={season.id}
      />
    </PageLayout>
  );
}
