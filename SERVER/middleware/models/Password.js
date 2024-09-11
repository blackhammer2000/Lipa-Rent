const { Schema, model } = require("mongoose");
const { hash } = require("bcrypt");

const PasswordSchema = new Schema({
  landlordID: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
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

module.export = { Password };
