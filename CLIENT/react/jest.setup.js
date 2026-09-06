import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for jsdom (used by react-router)
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = require("util").TextEncoder;
  globalThis.TextDecoder = require("util").TextDecoder;
}

if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.getRandomValues) {
  const { webcrypto } = require("node:crypto");
  globalThis.crypto = webcrypto;
}