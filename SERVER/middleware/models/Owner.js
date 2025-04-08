const { Schema, model } = require("mongoose");

const OwnerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  nationalID: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  phoneVerified: {
    type: Boolean,
    required: true,
  },
  dateRegistered: {
    type: String,
    required: true,
  },
  paid: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

const Owner = model("owner", OwnerSchema);

module.exports = { Owner };
