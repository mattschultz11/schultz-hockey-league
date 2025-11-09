import type { Config } from "@jest/types";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config.InitialProjectOptions = {
  testEnvironment: "jest-environment-jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx", ".mts"],
  globalSetup: "<rootDir>/test/jest.global-setup.mjs",
  globalTeardown: "<rootDir>/test/jest.global-teardown.mjs",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@prisma/client/(.*)\\.mjs$": "@prisma/client/$1.js",
  },
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!@prisma/client/)"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default createJestConfig(config);
