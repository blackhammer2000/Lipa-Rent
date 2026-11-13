const request = require("supertest");
const { buildApp } = require("../helpers/app");

// Token signing needs the secret env vars set.
process.env.LOGIN_SECRET_KEY =
  process.env.LOGIN_SECRET_KEY || "test_login_secret";
process.env.ACCESS_SECRET_KEY =
  process.env.ACCESS_SECRET_KEY || "test_access_secret";

const { Owner } = require("../../middleware/models/Owner");
const { Password } = require("../../middleware/models/Password");
const { Subscription } = require("../../middleware/models/Subscription");

jest.mock("../../middleware/models/Owner", () => ({
  Owner: { findOne: jest.fn() },
}));
jest.mock("../../middleware/models/Password", () => ({
  Password: { findOne: jest.fn() },
}));
jest.mock("../../middleware/models/Subscription", () => ({
  Subscription: { findOne: jest.fn() },
}));
// Avoid touching the DB / network in tests.
jest.mock("../../routes/users/helpers/checkSubscription", () => ({
  checkSubscriptionExpiry: jest.fn(() => false),
}));
jest.mock("../../routes/helpers/cipher", () => ({
  encrypt: (v) => v,
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn(() => true),
  hash: jest.fn(() => "hashed"),
}));

// The middleware chain (`isUser`) requires a `user: true` request header.
const authed = (body) => ({
  user: "true",
  ...body,
});
const postLogin = (app, body) =>
  request(app).post("/api/user/owner/login").set("user", "true").send(body);

describe("POST /api/user/owner/login (e2e)", () => {
  const app = buildApp();
  const credentials = {
    email: "john@example.com",
    nationalID: "abc123",
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns a login token for valid credentials", async () => {
    Owner.findOne.mockResolvedValueOnce({
      _id: "owner123",
      emailVerified: true,
      paid: true,
      disabled: false,
    });
    Password.findOne.mockResolvedValueOnce({
      ownerID: "owner123",
      password: "password123",
    });
    Subscription.findOne.mockResolvedValueOnce({
      currentSubscription: { expires: Date.now() + 100000 },
    });

    const res = await postLogin(app, credentials);

    expect(res.status).toBe(200);
    expect(res.body.loginToken).toBeDefined();
  });

  test("rejects invalid login body via the loginValidator (400)", async () => {
    const res = await postLogin(app, {
      email: "bad",
      nationalID: "",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.response_status).toBe("danger");
  });

  test("returns 500 when the user is not found", async () => {
    Owner.findOne.mockResolvedValueOnce(null);

    const res = await postLogin(app, credentials);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Incorrect");
  });

  test("rejects an unverified or disabled account", async () => {
    Owner.findOne.mockResolvedValueOnce({
      _id: "owner123",
      emailVerified: false,
      paid: true,
      disabled: false,
    });

    const res = await postLogin(app, credentials);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unverified email.");
  });
});