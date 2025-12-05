import { TextDecoder, TextEncoder } from "util";

const DEFAULT_TEST_DB_URL = "file:./tmp/prisma-test.db";
const REQUIRED_ENV_DEFAULTS = {
  DATABASE_URL: DEFAULT_TEST_DB_URL,
  NEXTAUTH_SECRET: "test-nextauth-secret",
  NEXTAUTH_URL: "http://localhost:3000",
  ENABLE_REQUEST_LOGGING: "false",
};

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

if (!(global as typeof globalThis & { ReadableStream: unknown }).ReadableStream) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReadableStream } = require("node:stream/web");
  global.ReadableStream = ReadableStream;
}

if (!(global as typeof globalThis & { Request: unknown }).Request) {
  const {
    Request,
    Response,
    Headers,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require("next/dist/compiled/@edge-runtime/primitives/fetch");
  global.Request = Request;
  global.Response = global.Response ?? Response;
  global.Headers = global.Headers ?? Headers;
}

Object.entries(REQUIRED_ENV_DEFAULTS).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});
