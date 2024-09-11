const { Schema, model } = require("mongoose");

const LandlordSchema = new Schema({
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
  phone: {
    type: String,
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

const Landlord = model("landlord", LandlordSchema);

module.export = { Landlord };
