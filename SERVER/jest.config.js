// Jest configuration for the LiPARENT server (CommonJS).
// Unit tests live in tests/unit, e2e/API tests in tests/e2e.
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/helpers/"],
  collectCoverageFrom: [
    "middleware/**/*.js",
    "routes/**/*.js",
    "!middleware/models/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
};