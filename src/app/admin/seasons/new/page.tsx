import { redirect } from "next/navigation";

import CreateSeasonForm from "@/components/CreateSeasonForm";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  searchParams: Promise<{ leagueId?: string }>;
};

export default async function AdminCreateSeasonPage({ searchParams }: Props) {
  const [session, { leagueId }] = await Promise.all([auth(), searchParams]);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  if (!leagueId) {
    redirect("/");
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { id: true, slug: true, name: true },
  });

  if (!league) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-semibold text-white">New Season — {league.name}</h1>
      <CreateSeasonForm leagueId={league.id} leagueSlug={league.slug} />
    </div>
  );
}
