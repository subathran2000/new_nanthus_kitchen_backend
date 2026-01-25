module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: {
          strict: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  moduleDirectories: ["node_modules", "../node_modules"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    ".module.ts",
    ".dto.ts",
    ".entity.ts",
    "main.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
