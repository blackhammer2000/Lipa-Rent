const { Schema, model } = require("mongoose");

const SubscriptionSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
    unique: true,

  },
  currentSubscription: {
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
