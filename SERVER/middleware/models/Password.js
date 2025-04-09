const { Schema, model } = require("mongoose");
const { hash } = require("bcrypt");

const PasswordSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
    unique: true,

  },
  password: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Number,
  },
  resetTokenVerified: {
    type: Boolean,
  },
  lastReset: {
    type: Number,
  },
});

PasswordSchema.pre("save", async function (next) {
  try {
    const hashedPassword = await hash(this.password, 10);

    if (!hashedPassword) throw new Error(hashedPassword);

    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

const Password = model("password", PasswordSchema);

module.exports = { Password };
