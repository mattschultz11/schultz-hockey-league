import { Predicate } from "effect";

export class InvariantError extends Error {
  name = "InvariantError";
}

export function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new InvariantError(message ?? "Invariant failed");
}

export function assertNotNullable<T>(value: T, message?: string): NonNullable<T> {
  invariant(Predicate.isNotNullable(value), message ?? "Value cannot be null");
  return value;
}

export function assertNonNullableFields<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  fields: readonly K[],
) {
  fields.forEach((field) => {
    invariant(data[field] !== null, `${String(field)} cannot be null`);
  });
}
