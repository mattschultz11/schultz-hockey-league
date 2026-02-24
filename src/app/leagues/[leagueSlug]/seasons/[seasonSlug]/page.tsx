import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageLayout from "@/components/PageLayout";
import RegistrationForm from "@/components/RegistrationForm";
import SeasonInfo from "@/components/SeasonInfo";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

const DAY_NAMES = [
  ["sundays", "Sun"],
  ["mondays", "Mon"],
  ["tuesdays", "Tue"],
  ["wednesdays", "Wed"],
  ["thursdays", "Thu"],
  ["fridays", "Fri"],
  ["saturdays", "Sat"],
] as const;

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

  const hasStarted = season.startDate <= new Date();

  if (!hasStarted) {
    return (
      <PageLayout>
        <PageBreadcrumbs
          items={[
            { label: "Leagues", href: "/leagues" },
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name },
          ]}
        />
        <div className="mx-auto max-w-4xl">
          {season.info && <SeasonInfo info={season.info} />}
          <RegistrationForm seasonId={season.id} />
        </div>
      </PageLayout>
    );
  }

  const gameDays = DAY_NAMES.filter(([key]) => season[key]).map(([, label]) => label);

  return (
    <PageLayout>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name },
        ]}
      />

      <div className="text-default-300 space-y-2">
        <p>
          {season.startDate.toLocaleDateString()} – {season.endDate.toLocaleDateString()}
        </p>
        {gameDays.length > 0 && <p>Game days: {gameDays.join(", ")}</p>}
      </div>
    </PageLayout>
  );
}
