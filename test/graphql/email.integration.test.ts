import type { GraphQLResolveInfo } from "graphql";
import { GraphQLError } from "graphql";

import type { ResolverFn } from "@/graphql/generated";
import type { GraphQLContext } from "@/graphql/resolvers";
import { resolvers } from "@/graphql/resolvers";
import { Role } from "@/service/prisma";

import { insertUser } from "../modelFactory";
import { createCtx } from "../utils";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

const mockCreate = jest.fn();

jest.mock("@/service/email/emailClient", () => ({
  __esModule: true,
  default: () => ({
    messages: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  }),
  MAILGUN_DOMAIN: "test.example.com",
  assertConfigured: () => {},
}));

async function invokeResolver<TResult, TParent, TArgs>(
  resolver: unknown,
  parent: TParent,
  args: TArgs,
  ctx: GraphQLContext,
): Promise<TResult> {
  if (typeof resolver === "function") {
    return (resolver as ResolverFn<TResult, TParent, GraphQLContext, TArgs>)(parent, args, ctx, {
      parentType: { name: "Mutation" },
      fieldName: "unknown",
    } as GraphQLResolveInfo);
  }
  const resolverObj = resolver as { resolve: ResolverFn<TResult, TParent, GraphQLContext, TArgs> };
  return resolverObj.resolve(parent, args, ctx, {
    parentType: { name: "Mutation" },
    fieldName: "unknown",
  } as GraphQLResolveInfo);
}

describe("Email GraphQL Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendBulkEmail mutation", () => {
    it("sends personalized emails by season + recipientEmails for admin", async () => {
      const admin = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(admin) as GraphQLContext;

      const league = await ctx.prisma.league.create({
        data: { name: "Test League", slug: "test-league" },
      });
      const season = await ctx.prisma.season.create({
        data: {
          leagueId: league.id,
          name: "Test Season",
          slug: "test-season",
          startDate: new Date(),
          endDate: new Date(),
        },
      });
      const playerUser = await insertUser({ email: "player1@test.com", firstName: "Alice" });
      await ctx.prisma.player.create({
        data: { userId: playerUser.id, seasonId: season.id },
      });

      mockCreate.mockResolvedValue({ id: "<msg-id>", message: "Queued." });

      const result = await invokeResolver<
        { emailSend: { id: string }; totalSent: number; failures: unknown[] },
        unknown,
        unknown
      >(
        resolvers.Mutation!.sendBulkEmail,
        {},
        {
          data: {
            seasonId: season.id,
            recipientEmails: ["player1@test.com"],
            subject: "Hello {{player.user.firstName}}",
            html: "<p>Hi {{player.user.firstName}} from {{player.season.league.name}}</p>",
          },
        },
        ctx,
      );

      expect(result.totalSent).toBe(1);
      expect(result.failures).toHaveLength(0);
      expect(result.emailSend.id).toBeDefined();

      // Verify template was rendered in the Mailgun call
      const sentHtml = mockCreate.mock.calls[0][1].html;
      expect(sentHtml).toBe("<p>Hi Alice from Test League</p>");
    });

    it("rejects non-admin users", async () => {
      const player = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(player) as GraphQLContext;

      await expect(
        invokeResolver(
          resolvers.Mutation!.sendBulkEmail,
          {},
          {
            data: {
              seasonId: "abc",
              recipientEmails: ["x@x.com"],
              subject: "Test",
              html: "<p>Hi</p>",
            },
          },
          ctx,
        ),
      ).rejects.toThrow(GraphQLError);
    });

    it("rejects unauthenticated users", async () => {
      const ctx = createCtx() as GraphQLContext;

      await expect(
        invokeResolver(
          resolvers.Mutation!.sendBulkEmail,
          {},
          {
            data: {
              seasonId: "abc",
              recipientEmails: ["x@x.com"],
              subject: "Test",
              html: "<p>Hi</p>",
            },
          },
          ctx,
        ),
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe("emailHistory query", () => {
    it("returns email history for admin", async () => {
      const admin = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(admin) as GraphQLContext;

      await ctx.prisma.emailSend.create({
        data: {
          subject: "History Test",
          htmlBody: "<p>Test</p>",
          recipientCount: 1,
          status: "sent",
          sentById: admin.id,
        },
      });

      const result = await invokeResolver<unknown[], unknown, unknown>(
        resolvers.Query!.emailHistory,
        {},
        {},
        ctx,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects non-admin users", async () => {
      const player = await insertUser({ role: Role.PLAYER });
      const ctx = createCtx(player) as GraphQLContext;

      await expect(invokeResolver(resolvers.Query!.emailHistory, {}, {}, ctx)).rejects.toThrow(
        GraphQLError,
      );
    });
  });

  describe("emailSend query", () => {
    it("returns email send by id for admin", async () => {
      const admin = await insertUser({ role: Role.ADMIN });
      const ctx = createCtx(admin) as GraphQLContext;

      const emailSend = await ctx.prisma.emailSend.create({
        data: {
          subject: "Detail Test",
          htmlBody: "<p>Detail</p>",
          recipientCount: 2,
          status: "sent",
          sentById: admin.id,
        },
      });

      const result = await invokeResolver<{ id: string; subject: string }, unknown, unknown>(
        resolvers.Query!.emailSend,
        {},
        { id: emailSend.id },
        ctx,
      );

      expect(result.id).toBe(emailSend.id);
      expect(result.subject).toBe("Detail Test");
    });
  });
});
