const { Schema, model } = require("mongoose");

const RefreshTokenSchema = new Schema(
  {
    ownerID: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// TTL index: auto-delete expired refresh tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model("refreshtoken", RefreshTokenSchema);

module.exports = { RefreshToken };