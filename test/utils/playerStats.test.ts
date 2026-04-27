import { playerStats } from "@/components/playerStats";

function makeInput(overrides: {
  goals?: number;
  primaryAssists?: number;
  secondaryAssists?: number;
  lineups?: number;
  penaltyMinutes?: number[];
}) {
  return {
    _count: {
      goals: overrides.goals ?? 0,
      primaryAssists: overrides.primaryAssists ?? 0,
      secondaryAssists: overrides.secondaryAssists ?? 0,
      lineups: overrides.lineups ?? 0,
    },
    penalties: (overrides.penaltyMinutes ?? []).map((minutes) => ({ minutes })),
  };
}

describe("playerStats", () => {
  it("returns zeros for a player with no stats", () => {
    const stats = playerStats(makeInput({}));
    expect(stats).toEqual({ goals: 0, assists: 0, points: 0, games: 0, ppg: 0, pim: 0 });
  });

  it("sums goals + (primary + secondary) assists into points", () => {
    const stats = playerStats(makeInput({ goals: 3, primaryAssists: 2, secondaryAssists: 1 }));
    expect(stats.goals).toBe(3);
    expect(stats.assists).toBe(3);
    expect(stats.points).toBe(6);
  });

  it("computes PPG as points / games", () => {
    const stats = playerStats(makeInput({ goals: 3, primaryAssists: 1, lineups: 2 }));
    expect(stats.ppg).toBe(2);
  });

  it("PPG is 0 when games is 0 even if points > 0 (avoids Infinity)", () => {
    const stats = playerStats(makeInput({ goals: 5, lineups: 0 }));
    expect(stats.ppg).toBe(0);
  });

  it("PPG is 0 when both points and games are 0 (avoids NaN)", () => {
    const stats = playerStats(makeInput({ lineups: 0 }));
    expect(stats.ppg).toBe(0);
  });

  it("sums PIM across penalties", () => {
    const stats = playerStats(makeInput({ penaltyMinutes: [2, 5, 10] }));
    expect(stats.pim).toBe(17);
  });

  it("PIM is 0 when there are no penalties", () => {
    const stats = playerStats(makeInput({}));
    expect(stats.pim).toBe(0);
  });
});
