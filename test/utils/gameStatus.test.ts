import { getGameStatus } from "@/components/gameStatus";

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
