const {
  ObjectId: { isValid },
} = require("mongodb");

const { Tenant } = require("../../../../middleware/models/Tenant");
const { Room } = require("../../../../middleware/models/Room");
const { Rent } = require("../../../../middleware/models/Rent");

const { generateOTP } = require("../../helpers/generateOtp");

const tenantControllers = {
  //! TENANT ENDPOINTS FOR DEALING WITH THE TENANT DOCUMENT IN ADDING AND READING TENANT DATA FORM THE THE DATABASE.

  //?  below is the expected requestBody from the user when creating a tenant for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "PK1",
  //*   newTenant: {
  //*    tenantName: "LIXO PESSAR",
  //*    tenantNationalID: "35501094",
  //*    tenantPhone: "254711776471",
  //*     }
  //*  }

  createTenantForRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.newTenant) throw new Error("provide a valid tenant.");

      const { id, propertyId, roomId, newTenant } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database.",
        );

      const propertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!propertyTenants)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegistered = propertyTenants[roomId];

      if (!checkIfRoomIdIsRegistered)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database.",
        );

      let checkIfTenantIsRegistered = false;

      for (const key in checkIfRoomIdIsRegistered) {
        if (
          checkIfRoomIdIsRegistered[key]?.tenantNationalID ===
          newTenant?.tenantNationalID
        ) {
          checkIfTenantIsRegistered = !checkIfTenantIsRegistered;
          break;
        }
      }

      if (checkIfTenantIsRegistered)
        throw new Error(
          "Tenant with the given National ID has already been registered in this room.",
        );

      newTenant.tenantID = generateOTP();
      newTenant.tenantMoveOut = null;

      tenants[0][propertyId].tenants[roomId][newTenant.tenantID] = newTenant;

      const updateTenants = await Tenant.updateOne(
        { ownerID: id },
        {
          $set: {
            tenants,
          },
        },
      );

      if (!updateTenants.acknowledged && !updateTenants.modifiedCount)
        throw new Error("Could not update the tenants database.");

      const findRents = await Rent.findOne({ ownerID: id });

      const rents = findRents ? findRents.rents : null;

      if (!rents) throw new Error("rents doc prop not found.");

      rents[0][propertyId].rentPayments[roomId][newTenant.tenantID] = [];

      const updateRents = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        },
      );

      if (!updateRents.acknowledged && !updateRents.modifiedCount)
        throw new Error("Could not update the rents database.");

      const findRooms = await Room.findOne({ ownerID: id });

      const rooms = findRooms ? findRooms.rooms : null;

      if (!rooms) throw new Error("rooms doc prop not found.");

      rooms[0][propertyId].rooms[roomId].currentTenantID = newTenant.tenantID;

      rooms[0][propertyId].rooms[roomId].isOccupied = rooms[0][propertyId]
        .rooms[roomId].currentTenantID
        ? true
        : false;

      const updateRooms = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        },
      );

      if (!updateRooms.acknowledged && !updateRooms.modifiedCount)
        throw new Error("Could not update the rooms database.");

      res.status(200).json({
        message: `New tenant with the Name: ${newTenant.tenantName} and ID: ${newTenant.tenantID} has been successfuly added to Room: ${roomId} on the property.`,
        newRoomTenants: tenants[0][propertyId].tenants[roomId],
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for all rooms in property
  //*  { propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   propertyNo: "NGONG/NGONG/12058",}

  readAllTenantsForAllRoomsOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database.",
        );

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No tenants have been added to this property.");

      res.status(200).json({ selectedPropertyTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "87g87tg78t8g7",
  //*  }
  readAllTenantsInRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, roomId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database.",
        );

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No rooms have been added to this property.");

      const selectedRoomOnPropertyTenants = selectedPropertyTenants[roomId];

      if (!selectedRoomOnPropertyTenants)
        throw new Error(`No tenants found found for ${roomId}.`);

      if (!Array.from(Object.keys(selectedRoomOnPropertyTenants)).length)
        res.status(200).json({
          selectedRoomOnPropertyTenants: {},
          message: `"No tenants have been added to room: "${roomId}".`,
        });
      else
        res.status(200).json({
          selectedRoomOnPropertyTenants,
          message: `Tenants for room ${roomId} have been successfully retrieved.`,
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   propertyNo: "NGONG/NGONG/12058",
  //*   roomId: "PK1",
  //*   tenantId: "35501094",
  //*  }

  readSingleTenantInRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...please log in");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property No.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant Id.");

      const { id, propertyId, propertyNo, roomId, tenantId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (
        !checkIfPropertyIdIsRegistered ||
        (!checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo)
      ) {
        if (
          !checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo
        )
          throw new Error(
            "Property with the given property Id and  property number has not been registered in the tenants database.",
          );

        if (!checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has not been registered in the tenants database.",
          );
      }

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No tenants have been added to this property.");

      const selectedRoomOnPropertyTenants = selectedPropertyTenants[roomId];

      if (!selectedRoomOnPropertyTenants)
        throw new Error("No tenants have been added to this room.");

      const selectedTenantOnRoomOnProperty =
        selectedRoomOnPropertyTenants[tenantId];

      if (!selectedTenantOnRoomOnProperty)
        throw new Error(
          "No tenant with the given tenantId has been added to this room.",
        );

      res.status(200).json({ selectedTenantOnRoomOnProperty });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = tenantControllers;
