import { redirect } from "next/navigation";

import CreateSeasonForm from "@/components/CreateSeasonForm";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string }>;
};

export default async function AdminCreateSeasonPage({ params }: Props) {
  const [session, { leagueSlug }] = await Promise.all([auth(), params]);

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

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-semibold text-white">New Season — {league.name}</h1>
      <CreateSeasonForm league={league} />
    </div>
  );
}
