import SetNavItems from "@/components/SetNavItems";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;

  return (
    <>
      <SetNavItems
        depth={1}
        items={[{ label: "Seasons", href: `/leagues/${leagueSlug}/seasons` }]}
      />
      {children}
    </>
  );
}
