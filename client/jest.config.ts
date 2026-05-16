import type { Config } from "jest";

const config: Config = {
  collectCoverage: true,
  passWithNoTests: true,
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testRegex: "^((?!int|e2e).)*.test.tsx?$",
  setupFilesAfterEnv: ["<rootDir>/modules/testing/setup.ts"],
  coverageDirectory: "../coverage",
  coverageProvider: "v8",
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  rootDir: ".",
  moduleNameMapper: {
    "^@flagapp/(.*)$": "<rootDir>/$1",
    "^@modules/(.*)$": "<rootDir>/modules/$1",
    "^@store/(.*)$": "<rootDir>/modules/store/$1",
    "^@components/(.*)$": "<rootDir>/app/_components/$1",
    "^@presenters/(.*)$": "<rootDir>/app/presenters/$1",
    "^@/(.*)$": "<rootDir>/$1",
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/in-memory*",
    ".*\\.factory\\.ts$",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
        jsx: "react",
        target: "es2017",
        allowJs: true,
      },
    ],
  },
};

export default config;