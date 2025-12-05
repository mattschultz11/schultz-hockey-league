import type { UserCreateInput, UserUpdateInput } from "@/graphql/generated";
import type { Prisma } from "@/lib/prisma";

import type { ServiceContext } from "./types";
import { assertNonNullableFields, cleanInput, maybeGet } from "./utils";

export function getUsers(ctx: ServiceContext) {
  return ctx.prisma.user.findMany();
}

export function getUserById(id: string, ctx: ServiceContext) {
  return ctx.prisma.user.findUniqueOrThrow({ where: { id } });
}

export function maybeGetUserById(id: string | null | undefined, ctx: ServiceContext) {
  return maybeGet((id) => ctx.prisma.user.findUnique({ where: { id } }), id, ctx);
}

export function createUser(data: UserCreateInput, ctx: ServiceContext) {
  return ctx.prisma.user.create({ data: cleanInput(data) });
}

export function updateUser(id: string, data: UserUpdateInput, ctx: ServiceContext) {
  const payload: UserUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["role"] as const);

  return ctx.prisma.user.update({
    where: { id },
    data: payload as Prisma.UserUncheckedUpdateInput,
  });
}

export function deleteUser(id: string, ctx: ServiceContext) {
  return ctx.prisma.user.delete({ where: { id } });
}

export function getUserSeasons(userId: string, ctx: ServiceContext) {
  return ctx.prisma.user
    .findUniqueOrThrow({ where: { id: userId } })
    .seasons({ orderBy: { season: { startDate: "desc" } } });
}
