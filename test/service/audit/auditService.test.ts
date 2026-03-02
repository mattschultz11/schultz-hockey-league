import { Option } from "effect";

import { getAuditLog, logAuditEntry } from "@/service/audit/auditService";
import { parseAuditAction, parseEntityType } from "@/service/auth/rbacPolicy";
import type { User } from "@/service/prisma";
import prisma, { AuditAction, Role } from "@/service/prisma";
import type { ServerContext } from "@/types";

import { makeUser } from "../../modelFactory";
import { createCtx } from "../../utils";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

function createAuthenticatedCtx(role: Role = Role.ADMIN): ServerContext {
  const user = makeUser({ role });
  return {
    prisma,
    user: Option.some(user) as Option.Option<User>,
    requestId: "test-request-audit",
  };
}

function createUnauthenticatedCtx(): ServerContext {
  return {
    prisma,
    user: Option.none(),
    requestId: "test-request-anon",
  };
}

/** Wait for fire-and-forget promises to settle */
function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

describe("auditService", () => {
  let ctx: ServerContext;

  beforeAll(() => {
    ctx = createCtx();
  });

  describe("logAuditEntry", () => {
    it("creates an audit log record with correct fields for authenticated user", async () => {
      const authCtx = createAuthenticatedCtx(Role.ADMIN);
      const actorId = Option.match(authCtx.user, {
        onSome: (u) => u.id,
        onNone: () => "",
      });

      logAuditEntry(authCtx, {
        action: AuditAction.CREATE,
        entityType: "League",
        entityId: "league-123",
        metadata: { name: "Test League" },
        endpoint: "Mutation.createLeague",
      });

      await flushPromises();

      const logs = await prisma.auditLog.findMany({
        where: { entityId: "league-123" },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        requestId: "test-request-audit",
        actorId,
        actorRole: Role.ADMIN,
        action: AuditAction.CREATE,
        entityType: "League",
        entityId: "league-123",
        endpoint: "Mutation.createLeague",
      });
      expect(logs[0].metadata).toEqual({ name: "Test League" });
    });

    it("creates an audit log record with null actor for unauthenticated requests", async () => {
      const anonCtx = createUnauthenticatedCtx();

      logAuditEntry(anonCtx, {
        action: AuditAction.CREATE,
        entityType: "Registration",
        entityId: "reg-456",
        metadata: { email: "player@test.com" },
        endpoint: "Mutation.register",
      });

      await flushPromises();

      const logs = await prisma.auditLog.findMany({
        where: { entityId: "reg-456" },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].actorId).toBeNull();
      expect(logs[0].actorRole).toBeNull();
      expect(logs[0].entityType).toBe("Registration");
    });

    it("does not throw when audit write fails", async () => {
      // Create a context with a broken prisma client
      const brokenCtx: ServerContext = {
        prisma: {
          auditLog: {
            create: () => Promise.reject(new Error("DB connection lost")),
          },
        } as unknown as typeof prisma,
        user: Option.none(),
        requestId: "broken-request",
      };

      // Should not throw
      expect(() => {
        logAuditEntry(brokenCtx, {
          action: AuditAction.CREATE,
          entityType: "Test",
          entityId: "test-id",
          endpoint: "Mutation.test",
        });
      }).not.toThrow();

      // Wait for the rejected promise to be caught
      await flushPromises();
    });

    it("handles all audit action types", async () => {
      const authCtx = createAuthenticatedCtx(Role.ADMIN);

      for (const action of [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE]) {
        const entityId = `action-test-${action}`;
        logAuditEntry(authCtx, {
          action,
          entityType: "Team",
          entityId,
          endpoint: `Mutation.${action.toLowerCase()}Team`,
        });
      }

      await flushPromises();

      const logs = await prisma.auditLog.findMany({
        where: { entityId: { startsWith: "action-test-" } },
        orderBy: { timestamp: "asc" },
      });

      expect(logs).toHaveLength(3);
      expect(logs.map((l) => l.action)).toEqual([
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.DELETE,
      ]);
    });
  });

  describe("getAuditLog", () => {
    beforeAll(async () => {
      // Seed some audit entries for query tests
      const authCtx = createAuthenticatedCtx(Role.ADMIN);
      const actorId = Option.match(authCtx.user, {
        onSome: (u) => u.id,
        onNone: () => null,
      });

      await prisma.auditLog.createMany({
        data: [
          {
            requestId: "req-1",
            actorId,
            actorRole: Role.ADMIN,
            action: AuditAction.CREATE,
            entityType: "Season",
            entityId: "season-1",
            endpoint: "Mutation.createSeason",
          },
          {
            requestId: "req-2",
            actorId,
            actorRole: Role.ADMIN,
            action: AuditAction.UPDATE,
            entityType: "Season",
            entityId: "season-1",
            endpoint: "Mutation.updateSeason",
          },
          {
            requestId: "req-3",
            actorId: null,
            actorRole: null,
            action: AuditAction.CREATE,
            entityType: "Registration",
            entityId: "reg-1",
            endpoint: "Mutation.register",
          },
          {
            requestId: "req-4",
            actorId,
            actorRole: Role.ADMIN,
            action: AuditAction.DELETE,
            entityType: "Player",
            entityId: "player-1",
            endpoint: "Mutation.deletePlayer",
          },
        ],
      });
    });

    it("returns all audit logs with no filters", async () => {
      const logs = await getAuditLog({}, ctx);
      expect(logs.length).toBeGreaterThanOrEqual(4);
    });

    it("filters by entityType", async () => {
      const logs = await getAuditLog({ entityType: "Season" }, ctx);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every((l) => l.entityType === "Season")).toBe(true);
    });

    it("filters by action", async () => {
      const logs = await getAuditLog({ action: "CREATE" }, ctx);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every((l) => l.action === AuditAction.CREATE)).toBe(true);
    });

    it("filters by actorId", async () => {
      // Find an actorId that exists in the seeded data
      const allLogs = await getAuditLog({}, ctx);
      const logWithActor = allLogs.find((l) => l.actorId != null);
      expect(logWithActor).toBeDefined();

      const logs = await getAuditLog({ actorId: logWithActor!.actorId }, ctx);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.every((l) => l.actorId === logWithActor!.actorId)).toBe(true);
    });

    it("respects limit parameter", async () => {
      const logs = await getAuditLog({ limit: 2 }, ctx);
      expect(logs).toHaveLength(2);
    });

    it("clamps limit to maximum of 100", async () => {
      const logs = await getAuditLog({ limit: 999 }, ctx);
      // Should not exceed 100 even if requested
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it("clamps negative limit to 1", async () => {
      const logs = await getAuditLog({ limit: -5 }, ctx);
      expect(logs).toHaveLength(1);
    });

    it("clamps negative offset to 0", async () => {
      const allLogs = await getAuditLog({}, ctx);
      const negOffsetLogs = await getAuditLog({ offset: -10 }, ctx);
      expect(negOffsetLogs.length).toBe(allLogs.length);
    });

    it("respects offset parameter", async () => {
      const allLogs = await getAuditLog({}, ctx);
      const offsetLogs = await getAuditLog({ offset: 2 }, ctx);
      expect(offsetLogs.length).toBe(allLogs.length - 2);
    });

    it("returns results ordered by timestamp descending", async () => {
      const logs = await getAuditLog({}, ctx);
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i].timestamp.getTime());
      }
    });
  });
});

describe("parseAuditAction", () => {
  it("maps create mutations to CREATE", () => {
    expect(parseAuditAction("createLeague")).toBe(AuditAction.CREATE);
    expect(parseAuditAction("createUser")).toBe(AuditAction.CREATE);
  });

  it("maps add mutations to CREATE", () => {
    expect(parseAuditAction("addPlayerToLineup")).toBe(AuditAction.CREATE);
  });

  it("maps set mutations to CREATE", () => {
    expect(parseAuditAction("setGameLineup")).toBe(AuditAction.CREATE);
  });

  it("maps update mutations to UPDATE", () => {
    expect(parseAuditAction("updateLeague")).toBe(AuditAction.UPDATE);
    expect(parseAuditAction("updateUser")).toBe(AuditAction.UPDATE);
  });

  it("maps accept mutations to UPDATE", () => {
    expect(parseAuditAction("acceptRegistrations")).toBe(AuditAction.UPDATE);
  });

  it("maps delete mutations to DELETE", () => {
    expect(parseAuditAction("deleteLeague")).toBe(AuditAction.DELETE);
    expect(parseAuditAction("deleteUser")).toBe(AuditAction.DELETE);
  });

  it("maps remove mutations to DELETE", () => {
    expect(parseAuditAction("removePlayerFromLineup")).toBe(AuditAction.DELETE);
  });

  it("returns null for unrecognized field names", () => {
    expect(parseAuditAction("leagues")).toBeNull();
    expect(parseAuditAction("user")).toBeNull();
  });
});

describe("parseEntityType", () => {
  it("extracts entity type from create mutations", () => {
    expect(parseEntityType("createLeague")).toBe("League");
    expect(parseEntityType("createUser")).toBe("User");
    expect(parseEntityType("createSeason")).toBe("Season");
  });

  it("extracts entity type from update mutations", () => {
    expect(parseEntityType("updateTeam")).toBe("Team");
    expect(parseEntityType("updatePlayer")).toBe("Player");
  });

  it("extracts entity type from delete mutations", () => {
    expect(parseEntityType("deleteGoal")).toBe("Goal");
  });

  it("handles To/From in mutation names", () => {
    expect(parseEntityType("addPlayerToLineup")).toBe("Lineup");
    expect(parseEntityType("removePlayerFromLineup")).toBe("Lineup");
  });

  it("handles accept mutations", () => {
    expect(parseEntityType("acceptRegistrations")).toBe("Registrations");
  });

  it("handles set mutations", () => {
    expect(parseEntityType("setGameLineup")).toBe("GameLineup");
  });
});
