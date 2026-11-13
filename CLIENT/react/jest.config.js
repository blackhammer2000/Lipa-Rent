// Jest configuration for the LiPARENT landlord/admin React app (ESM)
export default {
  testEnvironment: "jsdom",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.(test|spec).js?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "jest-css-modules",
    "\\.(png|jpg|jpeg|svg|gif|webp)$": "<rootDir>/src/test-utils/fileMock.js",
  },
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-router-dom)/)",
  ],
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/main.jsx", "!src/test-utils/**"],
  coverageDirectory: "coverage",
  verbose: true,
};