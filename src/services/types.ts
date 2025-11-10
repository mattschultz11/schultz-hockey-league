import type { PrismaClient, User } from "@prisma/client";

export type ServiceContext = {
  prisma: PrismaClient;
  currentUser?: User;
};
