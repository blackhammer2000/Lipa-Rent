function checkSubscriptionExpiry(subscription) {
  try {
    if (!subscription) return;

    const { expires } = subscription;

    const currentDate = Date.now();

    if (currentDate >= expires) throw new Error("Subscription expired.");

    return false;
  } catch (err) {
    if (err?.message) {
      return { error: err?.message };
    }
  }
}

module.exports = { checkSubscriptionExpiry };
