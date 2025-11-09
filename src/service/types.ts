import type { PrismaClient, User } from "@/lib/prisma";

export type ServiceContext = {
  prisma: PrismaClient;
  currentUser?: User;
};
