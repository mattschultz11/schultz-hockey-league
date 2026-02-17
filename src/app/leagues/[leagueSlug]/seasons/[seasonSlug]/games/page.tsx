import { notFound } from "next/navigation";

import DataTable from "@/app/DataTable";
import PageBreadcrumbs from "@/app/PageBreadcrumbs";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function GamesPage({ params }: Props) {
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
    select: { id: true, name: true, slug: true },
  });

  if (!season) {
    notFound();
  }

  const games = await prisma.game.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      round: true,
      date: true,
      time: true,
      location: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const columns = [
    { key: "round", label: "Round" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "home", label: "Home" },
    { key: "away", label: "Away" },
    { key: "location", label: "Location" },
  ];

  const rows = games.map((game) => ({
    key: game.id,
    round: game.round,
    date: game.date.toLocaleDateString(),
    time: game.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    home: game.homeTeam?.name ?? "TBD",
    away: game.awayTeam?.name ?? "TBD",
    location: game.location,
  }));

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Games" },
        ]}
      />
      <DataTable label="Games" columns={columns} rows={rows} emptyMessage="No games yet" />
    </>
  );
}
