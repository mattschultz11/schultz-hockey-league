import { findNextUpcomingId, getGameStatus } from "@/components/gameStatus";

type TestGame = {
  id: string;
  datetime: Date;
  homeTeamResult: "WIN" | "LOSS" | "TIE" | null;
  awayTeamResult: "WIN" | "LOSS" | "TIE" | null;
};

describe("getGameStatus", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2026-12-31T23:59:59Z");

  it("returns Upcoming for a future datetime with both results null", () => {
    expect(getGameStatus(future, null, null, now)).toBe("Upcoming");
  });

  it("returns Upcoming at the boundary (datetime === now)", () => {
    expect(getGameStatus(now, null, null, now)).toBe("Upcoming");
  });

  it("returns Upcoming for a future datetime with one result set (partial)", () => {
    expect(getGameStatus(future, "WIN", null, now)).toBe("Upcoming");
  });

  it("returns Final when both results are set (past datetime)", () => {
    expect(getGameStatus(past, "WIN", "LOSS", now)).toBe("Final");
  });

  it("returns Final when both results are set (future datetime — precedence over datetime)", () => {
    expect(getGameStatus(future, "TIE", "TIE", now)).toBe("Final");
  });

  it("returns Awaiting for a past datetime with both results null", () => {
    expect(getGameStatus(past, null, null, now)).toBe("Awaiting");
  });

  it("returns Awaiting for a past datetime with one result set (partial)", () => {
    expect(getGameStatus(past, "WIN", null, now)).toBe("Awaiting");
  });

  it("uses the current time when `now` is omitted", () => {
    const nowMs = Date.now();
    const future = new Date(nowMs + 60_000);
    const past = new Date(nowMs - 60_000);

    expect(getGameStatus(future, null, null)).toBe("Upcoming");
    expect(getGameStatus(past, null, null)).toBe("Awaiting");
  });

  it("treats undefined results the same as null (defensive against missing select fields)", () => {
    expect(getGameStatus(past, undefined, undefined, now)).toBe("Awaiting");
    expect(getGameStatus(future, "WIN", undefined, now)).toBe("Upcoming");
    expect(getGameStatus(past, undefined, "LOSS", now)).toBe("Awaiting");
  });
});

describe("findNextUpcomingId", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  const past1 = new Date("2026-01-01T00:00:00Z");
  const past2 = new Date("2026-02-01T00:00:00Z");
  const future1 = new Date("2026-05-01T00:00:00Z");
  const future2 = new Date("2026-06-01T00:00:00Z");
  const future3 = new Date("2026-07-01T00:00:00Z");

  it("returns null for an empty game list", () => {
    expect(findNextUpcomingId([], now)).toBeNull();
  });

  it("returns null when every game is in the past with no results (all Awaiting)", () => {
    const games: TestGame[] = [
      { id: "a", datetime: past1, homeTeamResult: null, awayTeamResult: null },
      { id: "b", datetime: past2, homeTeamResult: null, awayTeamResult: null },
    ];
    expect(findNextUpcomingId(games, now)).toBeNull();
  });

  it("returns the earliest upcoming id from a mixed list", () => {
    const games: TestGame[] = [
      { id: "past", datetime: past1, homeTeamResult: null, awayTeamResult: null },
      { id: "far-future", datetime: future3, homeTeamResult: null, awayTeamResult: null },
      { id: "near-future", datetime: future1, homeTeamResult: null, awayTeamResult: null },
    ];
    expect(findNextUpcomingId(games, now)).toBe("near-future");
  });

  it("returns the earliest when all games are upcoming", () => {
    const games: TestGame[] = [
      { id: "c", datetime: future3, homeTeamResult: null, awayTeamResult: null },
      { id: "a", datetime: future1, homeTeamResult: null, awayTeamResult: null },
      { id: "b", datetime: future2, homeTeamResult: null, awayTeamResult: null },
    ];
    expect(findNextUpcomingId(games, now)).toBe("a");
  });

  it("ignores Final games even when their datetime is future (precedence)", () => {
    const games: TestGame[] = [
      // Future datetime with both results set → Final, should be skipped
      { id: "final", datetime: future1, homeTeamResult: "WIN", awayTeamResult: "LOSS" },
      // Actual next upcoming
      { id: "upcoming", datetime: future2, homeTeamResult: null, awayTeamResult: null },
    ];
    expect(findNextUpcomingId(games, now)).toBe("upcoming");
  });
});
