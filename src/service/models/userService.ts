import type { UserCreateInput, UserUpdateInput } from "@/graphql/generated";
import type { Prisma } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields } from "@/utils/assertionUtils";

import { cleanInput, maybeGet } from "./modelServiceUtils";

export function getUsers(ctx: ServerContext) {
  return ctx.prisma.user.findMany();
}

export function getUserById(id: string, ctx: ServerContext) {
  return ctx.prisma.user.findUniqueOrThrow({ where: { id } });
}

export function maybeGetUserById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.user.findUnique({ where: { id } }), id, ctx);
}

export function createUser(data: UserCreateInput, ctx: ServerContext) {
  return ctx.prisma.user.create({ data: cleanInput(data) });
}

export function updateUser(id: string, data: UserUpdateInput, ctx: ServerContext) {
  const payload: UserUpdateInput = cleanInput(data);
  assertNonNullableFields(payload, ["role"] as const);

  return ctx.prisma.user.update({
    where: { id },
    data: payload as Prisma.UserUncheckedUpdateInput,
  });
}

export function deleteUser(id: string, ctx: ServerContext) {
  return ctx.prisma.user.delete({ where: { id } });
}

export function getUserSeasons(userId: string, ctx: ServerContext) {
  return ctx.prisma.user
    .findUniqueOrThrow({ where: { id: userId } })
    .seasons({ orderBy: { season: { startDate: "desc" } } });
}
