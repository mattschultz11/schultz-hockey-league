import { notFound, redirect } from "next/navigation";

import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string }>;
};

export default async function LeaguePage({ params }: Props) {
  const { leagueSlug } = await params;

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, slug: true },
  });

  if (!league) {
    notFound();
  }

  redirect(`/leagues/${leagueSlug}/seasons`);
}
