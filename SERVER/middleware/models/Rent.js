const { Schema, model } = require("mongoose");

const RentSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
  },
  rents: {
    type: Array,
    required: true,
  },
});

const Rent = model("rent", RentSchema);

module.exports = { Rent };
