import { Option } from "effect";

import type { User } from "@/service/prisma";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

export function createCtx(user?: User): ServerContext {
  return {
    prisma,
    user: Option.fromNullable(user),
    requestId: "test-request",
  };
}
