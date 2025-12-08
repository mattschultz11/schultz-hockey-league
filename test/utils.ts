import { Option } from "effect";

import type { User } from "@/service/prisma";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { UserModel } from "./modelFactory";

export function createCtx(user?: UserModel): ServerContext {
  return {
    prisma,
    user: Option.fromNullable(user) as Option.Option<User>,
    requestId: "test-request",
  };
}
