const { Schema, model } = require("mongoose");

const PropertySchema = new Schema({
  ownerID: {
    type: String,
    required: true,
    unique: true,

  },

  propertiesOwned: {
    type: Array,
    required: true,
  },
});

const Property = model("property", PropertySchema);

module.exports = { Property };
