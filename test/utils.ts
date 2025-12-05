import type { PrismaClient, User } from "@/lib/prisma";
import type { ServiceContext } from "@/service/types";

import prisma from "./lib/prisma";

export function createCtx(currentUser?: User): ServiceContext {
  return {
    prisma: prisma as PrismaClient,
    currentUser,
  };
}
