const { Schema, model } = require("mongoose");

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

const Password = model("Password", PasswordSchema);

module.export = { Password };
