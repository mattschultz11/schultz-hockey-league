import SetNavItems from "@/app/SetNavItems";

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
          { label: "Teams", href: `${base}/teams` },
          { label: "Players", href: `${base}/players` },
          { label: "Games", href: `${base}/games` },
          { label: "Draft", href: `${base}/draft` },
        ]}
      />
      {children}
    </>
  );
}
