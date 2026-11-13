// Set env secrets used by the token helpers before they run.
// The token modules read these at call time, so assigning before use is enough.
const OLD_ACCESS = process.env.ACCESS_SECRET_KEY;
const OLD_LOGIN = process.env.LOGIN_SECRET_KEY;
process.env.ACCESS_SECRET_KEY = "test_access_secret";
process.env.LOGIN_SECRET_KEY = "test_login_secret";

const { verify } = require("jsonwebtoken");
const { signAccessToken } = require("../../middleware/tokens/accessToken");
const { signLoginToken } = require("../../middleware/tokens/loginToken");

const TEST_SECRET = process.env.ACCESS_SECRET_KEY;

afterAll(() => {
  process.env.ACCESS_SECRET_KEY = OLD_ACCESS;
  process.env.LOGIN_SECRET_KEY = OLD_LOGIN;
});

describe("JWT token helpers", () => {
  describe("signAccessToken", () => {
    test("signs a token with the expected claims and 2h expiry", async () => {
      const token = await signAccessToken({
        id: "owner123",
        currentSubscription: { expires: Date.now() + 999999 },
        user: true,
        disabled: false,
      });

      const decoded = verify(token, TEST_SECRET);
      expect(decoded.id).toBe("owner123");
      expect(decoded.user).toBe(true);
      expect(decoded.iss).toBe("LipaRent Inc.");
      expect(decoded.exp - decoded.iat).toBe(2 * 60 * 60);
    });

    test("produces distinct tokens for distinct inputs", async () => {
      const payload = { id: "owner123", user: true };
      const a = await signAccessToken(payload);
      const b = await signAccessToken({ ...payload, id: "owner456" });
      expect(a).not.toBe(b);
    });
  });

  describe("signLoginToken", () => {
    test("signs a login token with a 5 minute expiry", async () => {
      const token = await signLoginToken({ id: "owner123" });
      const decoded = verify(token, process.env.LOGIN_SECRET_KEY);
      expect(decoded.id).toBe("owner123");
      expect(decoded.exp - decoded.iat).toBe(5 * 60);
    });
  });
});