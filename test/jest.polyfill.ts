import { TextDecoder, TextEncoder } from "util";

const DEFAULT_TEST_DB_URL = "file:./tmp/prisma-test.db";

if (!global.setImmediate) {
  // @ts-expect-error jest globals are writable
  global.setImmediate = (fn: (...args: unknown[]) => unknown, ...args: unknown[]) =>
    setTimeout(fn as () => void, 0, ...args);
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  // @ts-expect-error jest globals are writable
  global.TextDecoder = TextDecoder;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_TEST_DB_URL;
}
