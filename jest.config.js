"use strict";

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "src/**/*.js"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 95,
      lines: 98,
      statements: 98,
    },
  },
  testEnvironment: "node",
  preset: "ts-jest",
};
