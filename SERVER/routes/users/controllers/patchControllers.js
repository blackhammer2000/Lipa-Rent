const {
  ObjectId: { isValid },
} = require("mongodb");

const { Owner } = require("../../../middleware/models/Owner");
const { Property } = require("../../../middleware/models/Property");
const { Room } = require("../../../middleware/models/Room");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Rent } = require("../../../middleware/models/Rent");

///////*************************PATCHCONTROLLERS************************////////////////
const patchControllers = {
  editOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.editedOwner)
        throw new Error("Provide valid edited owner details.");

      const { id, editedOwner } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const { name, nationalID } = editedOwner;

      const ownerPropertiesDocument = await Owner.findOne({
        _id: id.toString(),
      });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const ownerUpdate = await Owner.updateOne(
        { _id: id },
        {
          $set: { name, nationalID },
        },
        { new: true }
      );

      if (!ownerUpdate.acknowledged)
        throw new Error(
          "Error when updating the owner details in the database."
        );

      res.status(203).json({ editedOwner });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  editPropertyDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyNo)
        throw new Error("Provide a valid property number.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.editedProperty)
        throw new Error("provide a valid property.");

      const { id, propertyNo, propertyId, editedProperty } = req.body;
      delete editedProperty.propertyID;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const ownerPropertiesDocument = await Property.findOne({ ownerID: id });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const { propertiesOwned } = ownerPropertiesDocument;

      const checkIfPropertyIdIsRegistered = propertiesOwned[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error("Property with the given property ID was not found.");

      if (checkIfPropertyIdIsRegistered.propertyNumber !== propertyNo)
        throw new Error(
          "The property number given does not match the number of the property saved in the database with the given ID."
        );

      propertiesOwned[0][checkIfPropertyIdIsRegistered.propertyID] = {
        ...editedProperty,
        propertyID: checkIfPropertyIdIsRegistered.propertyID,
      };

      const updateEditedProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } }
      );

      if (!updateEditedProperty.acknowledged)
        throw new Error("Error when updating the property in the database.");

      res.status(200).json({
        editedProperty: {
          propertyID: checkIfPropertyIdIsRegistered.propertyID,
          ...editedProperty,
        },
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  editRoomDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property Nd.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.roomNo) throw new Error("provide a valid room No.");
      if (!req.body.editedRoom)
        throw new Error("provide a valid edited property details.");

      const { id, propertyId, propertyNo, roomId, roomNo, editedRoom } =
        req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectPropertyUsingPropertyID = rooms[0][propertyId];

      if (!selectPropertyUsingPropertyID)
        throw new Error(
          "Selected propertyID Rooms are not found/not registered in the database."
        );
      if (selectPropertyUsingPropertyID.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber Rooms are not found/not registered in the database."
        );

      const propertyRooms = selectPropertyUsingPropertyID?.rooms;

      const selectRoomInPropertyUsingRoomID = propertyRooms[roomId];

      if (!selectRoomInPropertyUsingRoomID)
        throw new Error(
          "Selected room ID is not found/not registered in the property."
        );
      if (selectRoomInPropertyUsingRoomID.roomNumber !== roomNo)
        throw new Error("Selected room ID and room number Room do not match.");

      if (!Object.keys(selectRoomInPropertyUsingRoomID))
        throw new Error("No rooms have been added to this property.");

      // const newRoomDetails = {};

      for (const key in editedRoom) {
        if (key === "roomID") {
          selectRoomInPropertyUsingRoomID[key] =
            selectRoomInPropertyUsingRoomID[key];
        } else {
          selectRoomInPropertyUsingRoomID[key]
            ? (selectRoomInPropertyUsingRoomID[key] = editedRoom[key])
            : null;
        }
      }

      rooms[0][propertyId].rooms[roomId] = selectRoomInPropertyUsingRoomID;

      const updateRooms = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        }
      );

      if (updateRooms.acknowledged && updateRooms.modifiedCount)
        res.status(200).json({
          message: `Room with the Number: ${roomNo} and ID: ${roomId} has been successfuly edited.`,
          selectRoomInPropertyUsingRoomID,
        });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  editTenantDetails: async (req, res) => {},
  editRentDetails: async (req, res) => {},
};

module.exports = patchControllers;
