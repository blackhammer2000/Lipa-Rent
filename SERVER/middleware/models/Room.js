const { Schema, model } = require("mongoose");

const RoomsSchema = new Schema({
  landlordID: {
    type: String,
    required: true,
  },

  rooms: {
    type: Array,
    required: true,
  },
});

const Room = model("room", RoomsSchema);

module.exports = { Room };
