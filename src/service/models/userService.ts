import type { UserCreateInput, UserUpdateInput } from "@/graphql/generated";
import { NotFoundError } from "@/service/errors";
import type { Prisma } from "@/service/prisma";
import type { ServerContext } from "@/types";
import { assertNonNullableFields } from "@/utils/assertionUtils";

import { userCreateSchema, userUpdateSchema } from "../validation/schemas";
import { cleanInput, maybeGet, validate } from "./modelServiceUtils";

export function getUsers(ctx: ServerContext) {
  return ctx.prisma.user.findMany();
}

export async function getUserById(id: string, ctx: ServerContext) {
  const user = await ctx.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User", id);
  return user;
}

export function maybeGetUserById(id: string | null | undefined, ctx: ServerContext) {
  return maybeGet((id) => ctx.prisma.user.findUnique({ where: { id } }), id, ctx);
}

export function createUser(data: UserCreateInput, ctx: ServerContext) {
  validate(userCreateSchema, data);
  return ctx.prisma.user.create({ data: cleanInput(data) });
}

export function updateUser(id: string, data: UserUpdateInput, ctx: ServerContext) {
  validate(userUpdateSchema, data);
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

export async function getUserSeasons(userId: string, ctx: ServerContext) {
  const seasons = await ctx.prisma.user
    .findUnique({ where: { id: userId } })
    ?.seasons({ orderBy: { season: { startDate: "desc" } } });
  return seasons ?? [];
}
