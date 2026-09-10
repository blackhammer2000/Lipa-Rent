const {
  ObjectId: { isValid },
} = require("mongodb");

const { Tenant } = require("../../../../middleware/models/Tenant");
const { Room } = require("../../../../middleware/models/Room");
const { Rent } = require("../../../../middleware/models/Rent");

const { generateOTP } = require("../../helpers/generateOtp");

const roomControllers = {
  //! ROOM ENDPOINTS THAT DEAL WITH THE ADDING AND READING OF THE ROOMS DATA IN THE DATABASE.

  //?  below is the expected requestBody from the user when creating a room  in property
  //*  {
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   newRoom: {
  //*   roomNumber: "PK1",
  //*   roomRatePerMonth: "6000",
  //*   roomArea: "2500sqFT",
  //*   roomType: "SingleRoom",
  //*    }
  //*  }

  createSingleRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.newRoom) throw new Error("provide a valid room.");

      const { id, propertyId, newRoom } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      if (rooms === (null || undefined))
        throw new Error("rooms property not found in the  db document.");

      const checkIfPropertyIdIsRegistered = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered.",
        );

      newRoom.isOccupied = false;
      newRoom.currentTenantID = null;
      newRoom.roomID = generateOTP();

      const propertyRooms = checkIfPropertyIdIsRegistered?.rooms;

      if (!Array.from(Object.keys(propertyRooms)).length) {
        rooms[0][propertyId].rooms[newRoom.roomID] = newRoom;
      } else {
        let checkIfRoomNumberIsRegisteredUnderTheSelectedProperty = false;

        for (const key in propertyRooms) {
          if (propertyRooms[key]?.roomNumber === newRoom?.roomNumber) {
            checkIfRoomNumberIsRegisteredUnderTheSelectedProperty =
              !checkIfRoomNumberIsRegisteredUnderTheSelectedProperty;

            break;
          }
        }

        if (checkIfRoomNumberIsRegisteredUnderTheSelectedProperty)
          throw new Error(
            "Room with the given room number has already been registered.",
          );

        rooms[0][propertyId].rooms[newRoom.roomID] = newRoom;
      }

      const updateProperties = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        },
      );

      if (updateProperties.acknowledged && updateProperties.modifiedCount) {
        const findTenants = await Tenant.findOne({ ownerID: id });

        const tenants = findTenants ? findTenants.tenants : null;

        if (!tenants) throw new Error("tenants doc prop not found.");

        tenants[0][propertyId].tenants[newRoom.roomID] = {};

        const updateTenants = await Tenant.updateOne(
          { ownerID: id },
          {
            $set: {
              tenants,
            },
          },
        );

        if (updateTenants.acknowledged && updateTenants.modifiedCount) {
          const findRents = await Rent.findOne({ ownerID: id });

          const rents = findRents ? findRents.rents : null;

          if (!rents) throw new Error("rents doc prop not found.");

          rents[0][propertyId].rentPayments[newRoom.roomID] = {};

          const updateRents = await Rent.updateOne(
            { ownerID: id },
            {
              $set: {
                rents,
              },
            },
          );

          if (updateRents.acknowledged && updateRents.modifiedCount)
            res.status(200).json({
              message: `New room with the Number: ${newRoom.roomNumber} and ID: ${newRoom.roomID} has been successfuly added to the property: ${propertyId}.`,
              propertyRooms,
            });
        }
      } else {
        throw new Error("Could not update the database.");
      }
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rooms on property.
  //* {
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllRoomsOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectUsingPropertyID = rooms[0][propertyId];

      if (!selectUsingPropertyID)
        throw new Error(
          "Selected propertyID is not found/not registered in the database.",
        );

      const propertyRooms = selectUsingPropertyID?.rooms;

      if (!Array.from(Object.keys(propertyRooms)).length)
        res.status(200).json({
          propertyRooms: {},
          message: `"No rooms have been added to property: "${propertyId}".`,
        });
      else
        res.status(200).json({
          propertyRooms,
          message: `Rooms for property: "${propertyId}" retrieved successfully.`,
        });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rooms on property.
  //* {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readSingleRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property Nd.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.roomNo) throw new Error("provide a valid room Nd.");

      const { id, propertyId, propertyNo, roomId, roomNo } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectPropertyUsingPropertyID = rooms[0][propertyId];

      if (!selectPropertyUsingPropertyID)
        throw new Error(
          "Selected propertyID Rooms are not found/not registered in the database.",
        );
      if (selectPropertyUsingPropertyID.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber Rooms are not found/not registered in the database.",
        );

      const propertyRooms = selectPropertyUsingPropertyID?.rooms;

      const selectRoomInPropertyUsingRoomID = propertyRooms[roomId];

      if (!selectRoomInPropertyUsingRoomID)
        throw new Error(
          "Selected propertyID Room is not found/not registered in the database.",
        );
      if (selectRoomInPropertyUsingRoomID.roomNumber !== roomNo)
        throw new Error(
          "Selected propertyId and propertyNumber Room do not match.",
        );

      if (!Object.keys(selectRoomInPropertyUsingRoomID))
        throw new Error("No rooms have been added to this property.");

      res.status(200).json({ selectedRoom: selectRoomInPropertyUsingRoomID });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = roomControllers;
