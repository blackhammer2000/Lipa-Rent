const {
  checkSubscriptionExpiry,
} = require("../../routes/users/helpers/checkSubscription");

describe("checkSubscriptionExpiry", () => {
  test("returns undefined when no subscription is provided", () => {
    expect(checkSubscriptionExpiry(undefined)).toBeUndefined();
    expect(checkSubscriptionExpiry(null)).toBeUndefined();
  });

  test("returns false when the subscription is still valid", () => {
    const future = Date.now() + 60 * 60 * 1000;
    expect(checkSubscriptionExpiry({ expires: future })).toBe(false);
  });

  test("returns an error object when the subscription has expired", () => {
    const past = Date.now() - 60 * 60 * 1000;
    expect(checkSubscriptionExpiry({ expires: past })).toEqual({
      error: "Subscription expired.",
    });
  });
});