const {
  generateOTP,
  generateOTPExpiryTime,
} = require("../../routes/users/helpers/generateOtp");

describe("generateOtp", () => {
  describe("generateOTP", () => {
    test("returns a 6-character string", () => {
      expect(generateOTP()).toMatch(/^[0-9a-f]{6}$/);
    });

    test("returns different values on consecutive calls", () => {
      expect(generateOTP()).not.toBe(generateOTP());
    });
  });

  describe("generateOTPExpiryTime", () => {
    test("returns a timestamp ~10 minutes in the future", () => {
      const before = Date.now() + 10 * 60 * 1000;
      const expiry = generateOTPExpiryTime();
      const after = Date.now() + 10 * 60 * 1000;

      expect(expiry).toBeGreaterThanOrEqual(before);
      expect(expiry).toBeLessThanOrEqual(after);
    });
  });
});