import { Option, pipe } from "effect";

import type { ServerContext } from "@/types";

export function cleanInput<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function maybeGet<T>(
  get: (id: string, ctx: ServerContext) => Promise<T>,
  id: string | null | undefined,
  ctx: ServerContext,
) {
  const value = await pipe(
    id,
    Option.fromNullable,
    Option.map((id) => get(id, ctx)),
    Option.getOrNull,
  );

  return Option.fromNullable(value);
}
