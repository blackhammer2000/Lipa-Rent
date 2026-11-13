const { Schema, model } = require("mongoose");

const LoginAttemptSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    }, // email or IP address
    type: {
      type: String,
      enum: ["email", "ip"],
      required: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastAttemptAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for cleanup of old records
LoginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 7 }); // 7 days

const LoginAttempt = model("loginAttempt", LoginAttemptSchema);

module.exports = { LoginAttempt };