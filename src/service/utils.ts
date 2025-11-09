import { Option, pipe, Predicate } from "effect";

import { ServiceContext } from "./types";

export function cleanInput<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export function assertNonNullableFields<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  fields: readonly K[],
) {
  fields.forEach((field) => {
    invariant(data[field] !== null, `${String(field)} cannot be null`);
  });
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function maybeGet<T>(
  get: (id: string, ctx: ServiceContext) => Promise<T>,
  id: string | null | undefined,
  ctx: ServiceContext,
) {
  const value = await pipe(
    id,
    Option.fromNullable,
    Option.map((id) => get(id, ctx)),
    Option.getOrNull,
  );

  return Option.fromNullable(value);
}

export class InvariantError extends Error {
  name = "InvariantError";
}

export function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new InvariantError(message ?? "Invariant failed");
}

export function checkNotNullable<T>(value: T, message?: string): NonNullable<T> {
  invariant(Predicate.isNotNullable(value), message ?? "Value cannot be null");
  return value;
}
