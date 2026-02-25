import { Option, ParseResult, pipe, Schema } from "effect";

import { ValidationError } from "@/service/errors";

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

export async function maybeGet<R, I>(get: (input: I) => Promise<R>, input: I | null | undefined) {
  const value = await pipe(
    input,
    Option.fromNullable,
    Option.map((input) => get(input)),
    Option.getOrNull,
  );

  return Option.fromNullable(value);
}
