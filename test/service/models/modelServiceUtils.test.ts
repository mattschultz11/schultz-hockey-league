import { Option } from "effect";

import { cleanInput, generateSlug, maybeGet } from "@/service/models/modelServiceUtils";

describe("cleanInput", () => {
  it("removes undefined values", () => {
    const result = cleanInput({ a: 1, b: undefined, c: "hello" });
    expect(result).toEqual({ a: 1, c: "hello" });
  });

  it("preserves null values", () => {
    const result = cleanInput({ a: null, b: 2 });
    expect(result).toEqual({ a: null, b: 2 });
  });

  it("preserves falsy values other than undefined", () => {
    const result = cleanInput({ a: 0, b: false, c: "", d: null });
    expect(result).toEqual({ a: 0, b: false, c: "", d: null });
  });

  it("returns empty object for all-undefined input", () => {
    const result = cleanInput({ a: undefined, b: undefined });
    expect(result).toEqual({});
  });

  it("returns all entries when no undefined values exist", () => {
    const result = cleanInput({ a: 1, b: "two" });
    expect(result).toEqual({ a: 1, b: "two" });
  });
});

describe("generateSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(generateSlug("My League")).toBe("my-league");
  });

  it("removes special characters", () => {
    expect(generateSlug("Schultz's League!")).toBe("schultzs-league");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    expect(generateSlug("Fall   2025")).toBe("fall-2025");
  });

  it("handles leading and trailing spaces", () => {
    expect(generateSlug("  Trimmed  ")).toBe("-trimmed-");
  });

  it("handles numbers", () => {
    expect(generateSlug("Season 42")).toBe("season-42");
  });

  it("removes unicode characters", () => {
    expect(generateSlug("Café League")).toBe("caf-league");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles already-slugified input", () => {
    expect(generateSlug("already-a-slug")).toBe("already-a-slug");
  });
});

describe("maybeGet", () => {
  it("returns None for null id", async () => {
    const getter = jest.fn();
    const result = await maybeGet(getter, null);

    expect(Option.isNone(result)).toBe(true);
    expect(getter).not.toHaveBeenCalled();
  });

  it("returns None for undefined id", async () => {
    const getter = jest.fn();
    const result = await maybeGet(getter, undefined);

    expect(Option.isNone(result)).toBe(true);
    expect(getter).not.toHaveBeenCalled();
  });

  it("returns Some when getter returns a value", async () => {
    const mockValue = { id: "123", name: "Test" };
    const getter = jest.fn().mockResolvedValue(mockValue);
    const result = await maybeGet(getter, "123");

    expect(Option.isSome(result)).toBe(true);
    expect(Option.getOrNull(result)).toEqual(mockValue);
    expect(getter).toHaveBeenCalledWith("123");
  });

  it("returns None when getter returns null", async () => {
    const getter = jest.fn().mockResolvedValue(null);
    const result = await maybeGet(getter, "123");

    expect(Option.isNone(result)).toBe(true);
    expect(getter).toHaveBeenCalledWith("123");
  });
});
