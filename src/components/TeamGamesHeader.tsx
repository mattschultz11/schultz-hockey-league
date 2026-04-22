import PageBreadcrumbs from "./PageBreadcrumbs";
import PageHeader from "./PageHeader";

type Props = {
  league: {
    slug: string;
    name: string;
  };
  season: {
    slug: string;
    name: string;
  };
  team: {
    slug: string;
    name: string;
  };
};

export default function TeamGamesHeader({ league, season, team }: Props) {
  return (
    <PageHeader>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Teams", href: `/leagues/${league.slug}/seasons/${season.slug}/teams` },
          { label: team.name },
        ]}
      />
    </PageHeader>
  );
}
