const { Schema, model } = require("mongoose");

const LandlordSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  national_id: {
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
  date_registered: {
    type: String,
    required: true,
  },
});

const Landlord = model("Landlord", LandlordSchema);

module.export = { Landlord };
