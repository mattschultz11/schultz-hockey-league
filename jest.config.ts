import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config.InitialOptions = {
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
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/service/prisma/generated/**",
    "!src/graphql/generated/**",
  ],
  coverageThreshold: {
    global: {},
    "src/service/auth/": {
      statements: 80,
      branches: 75,
      functions: 70,
      lines: 80,
    },
    "src/service/models/": {
      statements: 60,
      branches: 35,
      functions: 55,
      lines: 60,
    },
  },
};

export default createJestConfig(config);
