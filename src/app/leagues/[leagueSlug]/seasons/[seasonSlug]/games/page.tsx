import { notFound } from "next/navigation";

import GamesHeader from "@/components/GamesHeader";
import GamesSection from "@/components/GamesSection";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import type { Prisma } from "@/service/prisma";
import prisma from "@/service/prisma";

const DEFAULT_PAGE_SIZE = 25;

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function GamesPage({ params, searchParams }: Props) {
  const [session, { leagueSlug, seasonSlug }, resolvedSearchParams] = await Promise.all([
    auth(),
    params,
    searchParams,
  ]);

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true, slug: true },
  });

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

  const isAdmin = session?.user?.role === "ADMIN";

  const startDate = singleParam(resolvedSearchParams.startDate);
  const endDate = singleParam(resolvedSearchParams.endDate);
  const teamId = singleParam(resolvedSearchParams.teamId);
  const location = singleParam(resolvedSearchParams.location);
  const pageParam = Number(singleParam(resolvedSearchParams.page)) || 1;
  const page = Math.max(1, pageParam);

  const where: Prisma.GameWhereInput = { seasonId: season.id };
  if (startDate) where.datetime = { ...(where.datetime as object), gte: new Date(startDate) };
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    where.datetime = { ...(where.datetime as object), lte: end };
  }
  if (teamId) where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
  if (location) where.location = { contains: location.toLowerCase() };

  const [games, totalCount, teams] = await Promise.all([
    prisma.game.findMany({
      where,
      select: {
        id: true,
        round: true,
        datetime: true,
        location: true,
        homeTeam: { select: { id: true, name: true, primaryColor: true, secondaryColor: true } },
        awayTeam: { select: { id: true, name: true, primaryColor: true, secondaryColor: true } },
        homeTeamResult: true,
        awayTeamResult: true,
      },
      orderBy: { datetime: "asc" },
      take: DEFAULT_PAGE_SIZE,
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
    }),
    prisma.game.count({ where }),
    prisma.team.findMany({
      where: { seasonId: season.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PageLayout>
      <GamesHeader season={season} league={league} isAdmin={isAdmin} />
      <GamesSection
        games={games}
        teams={teams}
        totalCount={totalCount}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        filters={{ startDate, endDate, teamId, location }}
        league={league}
        season={season}
      />
    </PageLayout>
  );
}
