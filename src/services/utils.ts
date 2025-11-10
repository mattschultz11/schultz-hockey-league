export function cleanInput<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export function assertNonNullableFields<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  fields: readonly K[],
) {
  fields.forEach((field) => {
    if (data[field] === null) {
      throw new Error(`${String(field)} cannot be null`);
    }
  });
}
