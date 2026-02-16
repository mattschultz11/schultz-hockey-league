import { Option } from "effect";

import { Role } from "@/service/prisma";

import {
  assertLeagueAccess,
  assertManagerOfTeam,
  assertRole,
  assertSeasonAccess,
  AuthError,
  requireAdmin,
  requireAtLeast,
  requireRole,
} from "../../../src/service/auth/authService";
import { makeUser } from "../../modelFactory";
import { createCtx } from "../../utils";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

describe("assertRole", () => {
  it("allows when user has required role", () => {
    const ctx = createCtx(makeUser({ role: Role.ADMIN }));

    expect(() => assertRole(ctx, [Role.ADMIN])).not.toThrow();
  });

  it("allows when user has one of multiple allowed roles", () => {
    const ctx = createCtx(makeUser({ role: Role.MANAGER }));

    expect(() => assertRole(ctx, [Role.ADMIN, Role.MANAGER])).not.toThrow();
  });

  it("denies when user role is not allowed", () => {
    const ctx = createCtx(makeUser({ role: Role.MANAGER }));

    expect(() => assertRole(ctx, [Role.ADMIN])).toThrow(
      expect.objectContaining({
        status: 403,
      }),
    );
  });

  it("denies PLAYER role for admin-only endpoints", () => {
    const ctx = createCtx(makeUser({ role: Role.PLAYER }));

    expect(() => assertRole(ctx, [Role.ADMIN])).toThrow(
      expect.objectContaining({
        status: 403,
        message: "Forbidden",
      }),
    );
  });

  it("denies when no user is present", () => {
    const ctx = {
      ...createCtx(),
      user: Option.none(),
    };

    expect(() => assertRole(ctx, [Role.ADMIN])).toThrow(
      expect.objectContaining({
        status: 401,
        message: "Unauthorized",
      }),
    );
  });

  it("includes endpoint in log when provided", () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const ctx = createCtx(makeUser({ role: Role.ADMIN }));

    assertRole(ctx, [Role.ADMIN], "Mutation.createUser");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"endpoint":"Mutation.createUser"'),
    );
    consoleSpy.mockRestore();
  });
});

describe("requireRole", () => {
  it("returns a guard function that checks roles", () => {
    const guard = requireRole([Role.ADMIN]);
    const ctx = createCtx(makeUser({ role: Role.ADMIN }));

    expect(() => guard(ctx)).not.toThrow();
  });

  it("guard denies unauthorized roles", () => {
    const guard = requireRole([Role.ADMIN]);
    const ctx = createCtx(makeUser({ role: Role.PLAYER }));

    expect(() => guard(ctx)).toThrow(AuthError);
  });
});

describe("requireAdmin", () => {
  it("allows ADMIN role", () => {
    const guard = requireAdmin();
    const ctx = createCtx(makeUser({ role: Role.ADMIN }));

    expect(() => guard(ctx)).not.toThrow();
  });

  it("denies MANAGER role", () => {
    const guard = requireAdmin();
    const ctx = createCtx(makeUser({ role: Role.MANAGER }));

    expect(() => guard(ctx)).toThrow(
      expect.objectContaining({
        status: 403,
      }),
    );
  });

  it("denies PLAYER role", () => {
    const guard = requireAdmin();
    const ctx = createCtx(makeUser({ role: Role.PLAYER }));

    expect(() => guard(ctx)).toThrow(
      expect.objectContaining({
        status: 403,
      }),
    );
  });
});

describe("requireAtLeast", () => {
  describe("requireAtLeast(Role.ADMIN)", () => {
    it("allows ADMIN", () => {
      const guard = requireAtLeast(Role.ADMIN);
      const ctx = createCtx(makeUser({ role: Role.ADMIN }));

      expect(() => guard(ctx)).not.toThrow();
    });

    it("denies MANAGER", () => {
      const guard = requireAtLeast(Role.ADMIN);
      const ctx = createCtx(makeUser({ role: Role.MANAGER }));

      expect(() => guard(ctx)).toThrow(expect.objectContaining({ status: 403 }));
    });

    it("denies PLAYER", () => {
      const guard = requireAtLeast(Role.ADMIN);
      const ctx = createCtx(makeUser({ role: Role.PLAYER }));

      expect(() => guard(ctx)).toThrow(expect.objectContaining({ status: 403 }));
    });
  });

  describe("requireAtLeast(Role.MANAGER)", () => {
    it("allows ADMIN", () => {
      const guard = requireAtLeast(Role.MANAGER);
      const ctx = createCtx(makeUser({ role: Role.ADMIN }));

      expect(() => guard(ctx)).not.toThrow();
    });

    it("allows MANAGER", () => {
      const guard = requireAtLeast(Role.MANAGER);
      const ctx = createCtx(makeUser({ role: Role.MANAGER }));

      expect(() => guard(ctx)).not.toThrow();
    });

    it("denies PLAYER", () => {
      const guard = requireAtLeast(Role.MANAGER);
      const ctx = createCtx(makeUser({ role: Role.PLAYER }));

      expect(() => guard(ctx)).toThrow(expect.objectContaining({ status: 403 }));
    });
  });

  describe("requireAtLeast(Role.PLAYER)", () => {
    it("allows all roles", () => {
      const guard = requireAtLeast(Role.PLAYER);

      expect(() => guard(createCtx(makeUser({ role: Role.ADMIN })))).not.toThrow();
      expect(() => guard(createCtx(makeUser({ role: Role.MANAGER })))).not.toThrow();
      expect(() => guard(createCtx(makeUser({ role: Role.PLAYER })))).not.toThrow();
    });
  });
});

describe("assertManagerOfTeam", () => {
  const teamId = "team-123";

  it("allows ADMIN for any team", async () => {
    const user = makeUser({ role: Role.ADMIN });
    const ctx = createCtx(user);

    await expect(assertManagerOfTeam(ctx, teamId)).resolves.toBe(ctx);
  });

  it("denies PLAYER role", async () => {
    const user = makeUser({ role: Role.PLAYER });
    const ctx = createCtx(user);

    await expect(assertManagerOfTeam(ctx, teamId)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        message: "Forbidden",
      }),
    );
  });

  it("denies unauthenticated users", async () => {
    const ctx = {
      ...createCtx(),
      user: Option.none(),
    };

    await expect(assertManagerOfTeam(ctx, teamId)).rejects.toThrow(
      expect.objectContaining({
        status: 401,
        message: "Unauthorized",
      }),
    );
  });

  // Note: Tests for MANAGER team scoping require database mocking
  // and are covered in integration tests with a test database
});

describe("assertLeagueAccess", () => {
  const leagueId = "league-123";

  it("allows ADMIN for any league", async () => {
    const user = makeUser({ role: Role.ADMIN });
    const ctx = createCtx(user);

    await expect(assertLeagueAccess(ctx, leagueId)).resolves.toBe(ctx);
  });

  it("allows PLAYER (viewer) for any league", async () => {
    const user = makeUser({ role: Role.PLAYER });
    const ctx = createCtx(user);

    await expect(assertLeagueAccess(ctx, leagueId)).resolves.toBe(ctx);
  });

  it("denies unauthenticated users", async () => {
    const ctx = {
      ...createCtx(),
      user: Option.none(),
    };

    await expect(assertLeagueAccess(ctx, leagueId)).rejects.toThrow(
      expect.objectContaining({
        status: 401,
        message: "Unauthorized",
      }),
    );
  });

  it("logs allow for ADMIN with admin_bypass reason", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const user = makeUser({ role: Role.ADMIN });
    const ctx = createCtx(user);

    await assertLeagueAccess(ctx, leagueId, "Query.league");

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"reason":"admin_bypass"'));
    consoleSpy.mockRestore();
  });

  it("logs allow for PLAYER with viewer_read_access reason", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const user = makeUser({ role: Role.PLAYER });
    const ctx = createCtx(user);

    await assertLeagueAccess(ctx, leagueId, "Query.league");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"viewer_read_access"'),
    );
    consoleSpy.mockRestore();
  });

  // Note: MANAGER league scoping tests require database mocking
  // and are covered in integration tests with a test database
});

describe("assertSeasonAccess", () => {
  const seasonId = "season-123";

  it("allows ADMIN for any season", async () => {
    const user = makeUser({ role: Role.ADMIN });
    const ctx = createCtx(user);

    await expect(assertSeasonAccess(ctx, seasonId)).resolves.toBe(ctx);
  });

  it("allows PLAYER (viewer) for any season", async () => {
    const user = makeUser({ role: Role.PLAYER });
    const ctx = createCtx(user);

    await expect(assertSeasonAccess(ctx, seasonId)).resolves.toBe(ctx);
  });

  it("denies unauthenticated users", async () => {
    const ctx = {
      ...createCtx(),
      user: Option.none(),
    };

    await expect(assertSeasonAccess(ctx, seasonId)).rejects.toThrow(
      expect.objectContaining({
        status: 401,
        message: "Unauthorized",
      }),
    );
  });

  it("logs allow for ADMIN with admin_bypass reason", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const user = makeUser({ role: Role.ADMIN });
    const ctx = createCtx(user);

    await assertSeasonAccess(ctx, seasonId, "Query.season");

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"reason":"admin_bypass"'));
    consoleSpy.mockRestore();
  });

  it("logs allow for PLAYER with viewer_read_access reason", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const user = makeUser({ role: Role.PLAYER });
    const ctx = createCtx(user);

    await assertSeasonAccess(ctx, seasonId, "Query.season");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"viewer_read_access"'),
    );
    consoleSpy.mockRestore();
  });

  // Note: MANAGER season scoping tests require database mocking
  // and are covered in integration tests with a test database
});
