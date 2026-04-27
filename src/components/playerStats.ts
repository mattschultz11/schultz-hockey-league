export type PlayerStatsInput = {
  _count: {
    goals: number;
    primaryAssists: number;
    secondaryAssists: number;
    lineups: number;
  };
  penalties: { minutes: number }[];
};

export type PlayerStats = {
  goals: number;
  assists: number;
  points: number;
  games: number;
  ppg: number;
  pim: number;
};

export function playerStats(player: PlayerStatsInput): PlayerStats {
  const goals = player._count.goals;
  const assists = player._count.primaryAssists + player._count.secondaryAssists;
  const points = goals + assists;
  const games = player._count.lineups;
  const ppg = games > 0 ? points / games : 0;
  const pim = player.penalties.reduce((acc, penalty) => acc + penalty.minutes, 0);
  return { goals, assists, points, games, ppg, pim };
}
