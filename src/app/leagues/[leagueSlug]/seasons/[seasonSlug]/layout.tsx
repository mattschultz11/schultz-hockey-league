import SetNavItems from "@/components/SetNavItems";

export default async function SeasonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
}) {
  const { leagueSlug, seasonSlug } = await params;
  const base = `/leagues/${leagueSlug}/seasons/${seasonSlug}`;

  return (
    <>
      <SetNavItems
        depth={2}
        items={[
          { label: "Games", href: `${base}/games` },
          { label: "Standings", href: `${base}/standings` },
          { label: "Players", href: `${base}/players` },
          { label: "Teams", href: `${base}/teams` },
          { label: "Draft", href: `${base}/draft` },
        ]}
      />
      {children}
    </>
  );
}
