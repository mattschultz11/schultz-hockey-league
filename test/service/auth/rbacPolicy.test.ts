import { Option } from "effect";

import {
  assertLeagueAccess,
  assertManagerOfTeam,
  assertSeasonAccess,
} from "@/service/auth/authService";
import { getPolicy, PolicyName, withPolicy } from "@/service/auth/rbacPolicy";
import { Role } from "@/service/prisma";

import { makeUser } from "../../modelFactory";
import { createCtx } from "../../utils";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock scope assertion functions so unit tests don't hit the database.
// Real assertRole is preserved for role-checking tests.
jest.mock("@/service/auth/authService", () => ({
  ...jest.requireActual("@/service/auth/authService"),
  assertLeagueAccess: jest.fn(),
  assertSeasonAccess: jest.fn(),
  assertManagerOfTeam: jest.fn(),
}));

const mockAssertLeagueAccess = assertLeagueAccess as jest.MockedFunction<typeof assertLeagueAccess>;
const mockAssertSeasonAccess = assertSeasonAccess as jest.MockedFunction<typeof assertSeasonAccess>;
const mockAssertManagerOfTeam = assertManagerOfTeam as jest.MockedFunction<
  typeof assertManagerOfTeam
>;

describe("PolicyName", () => {
  it("exports all expected policy names", () => {
    expect(PolicyName.ADMIN).toBe("admin");
    expect(PolicyName.MANAGER).toBe("manager");
    expect(PolicyName.MANAGER_OF_TEAM).toBe("managerOfTeam");
    expect(PolicyName.LEAGUE_ACCESS).toBe("leagueAccess");
    expect(PolicyName.SEASON_ACCESS).toBe("seasonAccess");
    expect(PolicyName.READ_ONLY).toBe("readOnly");
  });
});

describe("getPolicy", () => {
  it("returns correct config for ADMIN policy", () => {
    const config = getPolicy(PolicyName.ADMIN);

    expect(config.roles).toEqual([Role.ADMIN]);
    expect(config.requiresScope).toBeUndefined();
  });

  it("returns correct config for MANAGER policy", () => {
    const config = getPolicy(PolicyName.MANAGER);

    expect(config.roles).toEqual([Role.ADMIN, Role.MANAGER]);
    expect(config.requiresScope).toBeUndefined();
  });

  it("returns correct config for MANAGER_OF_TEAM policy", () => {
    const config = getPolicy(PolicyName.MANAGER_OF_TEAM);

    expect(config.roles).toEqual([Role.ADMIN, Role.MANAGER]);
    expect(config.requiresScope).toBe("team");
  });

  it("returns correct config for LEAGUE_ACCESS policy", () => {
    const config = getPolicy(PolicyName.LEAGUE_ACCESS);

    expect(config.roles).toEqual([Role.ADMIN, Role.MANAGER, Role.PLAYER]);
    expect(config.requiresScope).toBe("league");
  });

  it("returns correct config for SEASON_ACCESS policy", () => {
    const config = getPolicy(PolicyName.SEASON_ACCESS);

    expect(config.roles).toEqual([Role.ADMIN, Role.MANAGER, Role.PLAYER]);
    expect(config.requiresScope).toBe("season");
  });

  it("returns correct config for READ_ONLY policy", () => {
    const config = getPolicy(PolicyName.READ_ONLY);

    expect(config.roles).toEqual([Role.ADMIN, Role.MANAGER, Role.PLAYER]);
    expect(config.requiresScope).toBeUndefined();
  });
});

describe("withPolicy", () => {
  const mockInfo = {
    parentType: { name: "Mutation" },
    fieldName: "testResolver",
  } as never;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ADMIN policy", () => {
    it("allows ADMIN role", async () => {
      const mockResolver = jest.fn().mockResolvedValue("success");
      const ctx = createCtx(makeUser({ role: Role.ADMIN }));
      const wrappedResolver = withPolicy(PolicyName.ADMIN, mockResolver);

      const result = await wrappedResolver({}, {}, ctx, mockInfo);

      expect(result).toBe("success");
      expect(mockResolver).toHaveBeenCalledWith({}, {}, ctx, mockInfo);
    });

    it("denies MANAGER role with 403", async () => {
      const mockResolver = jest.fn();
      const ctx = createCtx(makeUser({ role: Role.MANAGER }));
      const wrappedResolver = withPolicy(PolicyName.ADMIN, mockResolver);

      await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
        message: "Forbidden",
        extensions: { code: 403 },
      });
      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("denies PLAYER role with 403", async () => {
      const mockResolver = jest.fn();
      const ctx = createCtx(makeUser({ role: Role.PLAYER }));
      const wrappedResolver = withPolicy(PolicyName.ADMIN, mockResolver);

      await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
        message: "Forbidden",
        extensions: { code: 403 },
      });
      expect(mockResolver).not.toHaveBeenCalled();
    });

    it("denies unauthenticated with 401", async () => {
      const mockResolver = jest.fn();
      const ctx = { ...createCtx(), user: Option.none() };
      const wrappedResolver = withPolicy(PolicyName.ADMIN, mockResolver);

      await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
        message: "Unauthorized",
        extensions: { code: 401 },
      });
      expect(mockResolver).not.toHaveBeenCalled();
    });
  });

  describe("MANAGER policy", () => {
    it("allows ADMIN role", async () => {
      const mockResolver = jest.fn().mockResolvedValue("success");
      const ctx = createCtx(makeUser({ role: Role.ADMIN }));
      const wrappedResolver = withPolicy(PolicyName.MANAGER, mockResolver);

      const result = await wrappedResolver({}, {}, ctx, mockInfo);

      expect(result).toBe("success");
    });

    it("allows MANAGER role", async () => {
      const mockResolver = jest.fn().mockResolvedValue("success");
      const ctx = createCtx(makeUser({ role: Role.MANAGER }));
      const wrappedResolver = withPolicy(PolicyName.MANAGER, mockResolver);

      const result = await wrappedResolver({}, {}, ctx, mockInfo);

      expect(result).toBe("success");
    });

    it("denies PLAYER role with 403", async () => {
      const mockResolver = jest.fn();
      const ctx = createCtx(makeUser({ role: Role.PLAYER }));
      const wrappedResolver = withPolicy(PolicyName.MANAGER, mockResolver);

      await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
        message: "Forbidden",
        extensions: { code: 403 },
      });
    });
  });

  describe("READ_ONLY policy", () => {
    it("allows all authenticated roles", async () => {
      const mockResolver = jest.fn().mockResolvedValue("success");
      const wrappedResolver = withPolicy(PolicyName.READ_ONLY, mockResolver);

      for (const role of [Role.ADMIN, Role.MANAGER, Role.PLAYER]) {
        const ctx = createCtx(makeUser({ role }));
        const result = await wrappedResolver({}, {}, ctx, mockInfo);
        expect(result).toBe("success");
      }
    });

    it("denies unauthenticated with 401", async () => {
      const mockResolver = jest.fn();
      const ctx = { ...createCtx(), user: Option.none() };
      const wrappedResolver = withPolicy(PolicyName.READ_ONLY, mockResolver);

      await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
        message: "Unauthorized",
        extensions: { code: 401 },
      });
    });
  });

  describe("multiple policies", () => {
    it("allows when all policies pass", async () => {
      const mockResolver = jest.fn().mockResolvedValue("success");
      const ctx = createCtx(makeUser({ role: Role.ADMIN }));
      const wrappedResolver = withPolicy([PolicyName.ADMIN, PolicyName.MANAGER], mockResolver);

      const result = await wrappedResolver({}, {}, ctx, mockInfo);

      expect(result).toBe("success");
    });
  });

  describe("scope enforcement", () => {
    beforeEach(() => {
      mockAssertLeagueAccess.mockImplementation((ctx) => Promise.resolve(ctx));
      mockAssertSeasonAccess.mockImplementation((ctx) => Promise.resolve(ctx));
      mockAssertManagerOfTeam.mockImplementation((ctx) => Promise.resolve(ctx));
    });

    describe("LEAGUE_ACCESS policy", () => {
      it("calls assertLeagueAccess when leagueId is in args", async () => {
        const mockResolver = jest.fn().mockResolvedValue("success");
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.LEAGUE_ACCESS, mockResolver);

        const result = await wrappedResolver({}, { leagueId: "league-123" }, ctx, mockInfo);

        expect(result).toBe("success");
        expect(mockAssertLeagueAccess).toHaveBeenCalledWith(
          ctx,
          "league-123",
          "Mutation.testResolver",
        );
      });

      it("throws INTERNAL_SERVER_ERROR when leagueId is missing from args", async () => {
        const mockResolver = jest.fn();
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.LEAGUE_ACCESS, mockResolver);

        await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
          message: expect.stringContaining("leagueId"),
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
        expect(mockResolver).not.toHaveBeenCalled();
        expect(mockAssertLeagueAccess).not.toHaveBeenCalled();
      });

      it("propagates denial from assertLeagueAccess as GraphQLError", async () => {
        const { AuthError } = jest.requireActual("@/service/auth/authService");
        mockAssertLeagueAccess.mockRejectedValue(
          new AuthError("Access denied: not in this league", 403),
        );
        const mockResolver = jest.fn();
        const ctx = createCtx(makeUser({ role: Role.MANAGER }));
        const wrappedResolver = withPolicy(PolicyName.LEAGUE_ACCESS, mockResolver);

        await expect(
          wrappedResolver({}, { leagueId: "league-123" }, ctx, mockInfo),
        ).rejects.toMatchObject({
          message: "Access denied: not in this league",
          extensions: { code: 403 },
        });
        expect(mockResolver).not.toHaveBeenCalled();
      });
    });

    describe("SEASON_ACCESS policy", () => {
      it("calls assertSeasonAccess when seasonId is in args", async () => {
        const mockResolver = jest.fn().mockResolvedValue("success");
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.SEASON_ACCESS, mockResolver);

        const result = await wrappedResolver({}, { seasonId: "season-456" }, ctx, mockInfo);

        expect(result).toBe("success");
        expect(mockAssertSeasonAccess).toHaveBeenCalledWith(
          ctx,
          "season-456",
          "Mutation.testResolver",
        );
      });

      it("throws INTERNAL_SERVER_ERROR when seasonId is missing from args", async () => {
        const mockResolver = jest.fn();
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.SEASON_ACCESS, mockResolver);

        await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
          message: expect.stringContaining("seasonId"),
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
        expect(mockResolver).not.toHaveBeenCalled();
      });
    });

    describe("MANAGER_OF_TEAM policy", () => {
      it("calls assertManagerOfTeam when teamId is in args", async () => {
        const mockResolver = jest.fn().mockResolvedValue("success");
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.MANAGER_OF_TEAM, mockResolver);

        const result = await wrappedResolver({}, { teamId: "team-789" }, ctx, mockInfo);

        expect(result).toBe("success");
        expect(mockAssertManagerOfTeam).toHaveBeenCalledWith(
          ctx,
          "team-789",
          "Mutation.testResolver",
        );
      });

      it("throws INTERNAL_SERVER_ERROR when teamId is missing from args", async () => {
        const mockResolver = jest.fn();
        const ctx = createCtx(makeUser({ role: Role.ADMIN }));
        const wrappedResolver = withPolicy(PolicyName.MANAGER_OF_TEAM, mockResolver);

        await expect(wrappedResolver({}, {}, ctx, mockInfo)).rejects.toMatchObject({
          message: expect.stringContaining("teamId"),
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
        expect(mockResolver).not.toHaveBeenCalled();
      });
    });
  });
});
