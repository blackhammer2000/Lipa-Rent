// Shared helpers for the e2e (supertest) API tests.
// We mount the real `routes.js` router onto a bare Express app so the full
// middleware chain (isUser -> loginValidator -> login, etc.) is exercised,
// while Mongoose models are mocked at the module level by each test file.

const express = require("express");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(require("../../routes/users/routes/routes"));
  return app;
}

// A tiny helper that returns a mock Mongoose document-like plain object used by mocks.
function mockDoc(overrides = {}) {
  return { ...overrides };
}

module.exports = { buildApp, mockDoc };