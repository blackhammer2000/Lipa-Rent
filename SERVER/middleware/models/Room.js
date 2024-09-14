const { Schema, model } = require("mongoose");

const RoomsSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
  },
  rooms: {
    type: Object,
    required: true,
  },
});

const Room = model("room", RoomsSchema);

module.exports = { Room };
