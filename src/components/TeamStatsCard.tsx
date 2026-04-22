import { Result } from "@/service/prisma/generated/enums";

type TeamStats = {
  rank: number;
  gp: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  plusMinus: number;
  pim: number;
};

type Team = {
  id: string;
  standing: { rank: number } | null;
  _count: { goals: number; goalsAgainst: number };
  penalties: { minutes: number }[];
  homeGames: { homeTeamResult: string | null; homeTeamPoints: number | null }[];
  awayGames: { awayTeamResult: string | null; awayTeamPoints: number | null }[];
};

function computeTeamStats(team: Team): TeamStats {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let points = 0;

  for (const game of team.homeGames) {
    if (game.homeTeamResult === Result.WIN) wins += 1;
    else if (game.homeTeamResult === Result.LOSS) losses += 1;
    else if (game.homeTeamResult === Result.TIE) ties += 1;
    points += game.homeTeamPoints ?? 0;
  }
  for (const game of team.awayGames) {
    if (game.awayTeamResult === Result.WIN) wins += 1;
    else if (game.awayTeamResult === Result.LOSS) losses += 1;
    else if (game.awayTeamResult === Result.TIE) ties += 1;
    points += game.awayTeamPoints ?? 0;
  }

  const goalsFor = team._count.goals;
  const goalsAgainst = team._count.goalsAgainst;
  const pim = team.penalties.reduce((acc, p) => acc + p.minutes, 0);

  return {
    rank: team.standing?.rank ?? 0,
    gp: wins + losses + ties,
    wins,
    losses,
    ties,
    points,
    goalsFor,
    goalsAgainst,
    plusMinus: goalsFor - goalsAgainst,
    pim,
  };
}

type Props = {
  team: Team;
};

export default function TeamStatsCard({ team }: Props) {
  const stats = computeTeamStats(team);

  const fields: { label: string; value: number | string; className?: string }[] = [
    { label: "Rank", value: stats.rank, className: "col-span-3 sm:col-span-1 bg-primary/50" },
    { label: "Games", value: stats.gp },
    { label: "Wins", value: stats.wins },
    { label: "Losses", value: stats.losses },
    { label: "Ties", value: stats.ties },
    { label: "Points", value: stats.points },
    { label: "Goals For", value: stats.goalsFor },
    { label: "Goals Agn", value: stats.goalsAgainst },
    { label: "Goal Diff", value: stats.plusMinus > 0 ? `+${stats.plusMinus}` : stats.plusMinus },
    { label: "Pen Mins", value: stats.pim },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-white">Stats</h2>
      <dl className="bg-content1 grid grid-cols-3 gap-3 rounded-lg p-4 sm:grid-cols-5 md:grid-cols-10">
        {fields.map((f) => (
          <div
            key={f.label}
            className={`bg-default-100 flex flex-col items-center justify-between rounded-lg p-3 ${f.className ?? ""}`}
          >
            <dt className="text-default-600 text-center text-xs font-medium tracking-wide uppercase">
              {f.label}
            </dt>
            <dd className="text-foreground text-xl font-bold">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
