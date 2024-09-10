const { Schema, model } = require("mongoose");

const SubscriptionSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  subscription: {
    type: Object,
    start: {
      type: Number,
      required: true,
    },
    expires: {
      type: Number,
      required: true,
    },
  },
  subscription_reports: {
    type: Array,
    required: true,
  },
});

const Subscription = model("subscription", SubscriptionSchema);

module.exports = { Subscription };
