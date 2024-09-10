const { Schema, model } = require("mongoose");

const PropertySchema = new Schema({
  landlordID: {
    type: String,
    required: true,
  },

  propertiesOwned: {
    type: Array,
    required: true,
  },
});

const Property = model("property", PropertySchema);

module.exports = { Property };
