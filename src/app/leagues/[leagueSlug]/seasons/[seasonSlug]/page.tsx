import { notFound, redirect } from "next/navigation";

import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function SeasonPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

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

  return redirect(`/leagues/${league.slug}/seasons/${season.slug}/registration`);
}
