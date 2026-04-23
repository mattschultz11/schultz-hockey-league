import { notFound } from "next/navigation";

import DraftBoard from "@/components/DraftBoard";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function LiveDraftPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

  const [league, session] = await Promise.all([
    prisma.league.findUnique({
      where: { slug: leagueSlug },
      select: { id: true, name: true, slug: true },
    }),
    auth(),
  ]);

  if (!league) notFound();

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, name: true, slug: true },
  });

  if (!season) notFound();

  const basePath = `/leagues/${league.slug}/seasons/${season.slug}`;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: basePath },
            { label: "Draft", href: `${basePath}/draft` },
            { label: "Live" },
          ]}
        />
      </PageHeader>
      <DraftBoard seasonId={season.id} isAdmin={isAdmin} />
    </PageLayout>
  );
}
