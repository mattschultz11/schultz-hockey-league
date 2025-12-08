import { Option } from "effect";

import { Role } from "@/service/prisma";

import { assertRole } from "../../../src/service/auth/authService";
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

  it("denies when user role is not allowed", () => {
    const ctx = createCtx(makeUser({ role: Role.MANAGER }));

    expect(() => assertRole(ctx, [Role.ADMIN])).toThrow(
      expect.objectContaining({
        status: 403,
      }),
    );
  });

  it("denies when no user is present", () => {
    const ctx = {
      requestId: "req-3",
      user: Option.none(),
    };

    expect(() => assertRole(ctx, [Role.ADMIN])).toThrow(
      expect.objectContaining({
        status: 401,
      }),
    );
  });
});
