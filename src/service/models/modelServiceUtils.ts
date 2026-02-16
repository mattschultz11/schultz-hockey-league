import { Option, ParseResult, pipe, Schema } from "effect";

import { ValidationError } from "@/service/errors";
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

export function validate<A, I>(schema: Schema.Schema<A, I>, data: unknown): A {
  try {
    return Schema.decodeUnknownSync(schema)(data);
  } catch (error) {
    if (error instanceof ParseResult.ParseError) {
      const issues = ParseResult.ArrayFormatter.formatIssueSync(error.issue);
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of issues) {
        const path = issue.path.map(String).join(".") || "_root";
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      throw new ValidationError("Validation failed", fieldErrors, error);
    }
    throw error;
  }
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
