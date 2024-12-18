const {
  ObjectId: { isValid },
} = require("mongodb");

const { Property } = require("../../../middleware/models/Property");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Owner } = require("../../../middleware/models/Owner");
const { Room } = require("../../../middleware/models/Room");
const { Rent } = require("../../../middleware/models/Rent");
const { Otp } = require("../../../middleware/models/Otp");

///////*************************PATCHCONTROLLERS************************////////////////
const patchControllers = {
  //! the method below deletes all user's details and erases their account.
  deleteOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      const { id } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const otpDoc = await Otp.findOne({ ownerID: id.toString() });

      const isDeleteAccountOtpVerified =
        otpDoc.isDeleteAccountOtpVerified || null;

      if (!isDeleteAccountOtpVerified)
        throw new Error("Invalid Token, generate a new one.");

      const updateDeleteTokensDetails = await Otp.updateMany(
        { ownerID: id },
        {
          $set: {
            deleteAccountOtp: null,
            deleteAccountOtpExpiry: null,
            isDeleteAccountOtpVerified: null,
          },
        }
      );

      if (
        !updateDeleteTokensDetails.acknowledged &&
        !updateDeleteTokensDetails.modifiedCount
      )
        throw new Error("Error updating delete token details.");

      const ownerUpdate = await Owner.findOneAndDelete({ _id: id.toString() });

      if (!ownerUpdate.acknowledged && !ownerUpdate.modifiedCount)
        throw new Error(
          "Error when deleting the owner details in the database."
        );

      const propertyUpdate = await Property.findOneAndDelete({ ownerID: id });

      if (!propertyUpdate.acknowledged && !propertyUpdate.modifiedCount)
        throw new Error(
          "Error when deleting the property details in the database."
        );

      const roomsUpdate = await Room.findOneAndDelete({ ownerID: id });

      if (!roomsUpdate.acknowledged && !roomsUpdate.modifiedCount)
        throw new Error(
          "Error when deleting the rooms details in the database."
        );

      const tenantsUpdate = await Tenant.findOneAndDelete({ ownerID: id });

      if (!tenantsUpdate.acknowledged && !tenantsUpdate.modifiedCount)
        throw new Error(
          "Error when deleting the tenants details in the database."
        );

      const rentsUpdate = await Rent.findOneAndDelete({ ownerID: id });

      if (!rentsUpdate.acknowledged && !rentsUpdate.modifiedCount)
        throw new Error(
          "Error when deleting the tenants details in the database."
        );

      res.status(203).json({ message: "Account deleted successfully" });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  //?  below is the expected requestBody from the user when deleting a property.
  //* {
  //*   propertyNumber: "NGONG/NGONG/12058",
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  deletePropertyDetails: async (req, res) => {
    try {
      if (!req?.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req?.body.propertyNo)
        throw new Error("Provide a valid property number.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");

      const { id, propertyNo, propertyId } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      //! deleting the property
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

      delete propertiesOwned[0][propertyId];

      const deleteProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } }
      );

      if (!deleteProperty.acknowledged && !deleteProperty.modifiedCount)
        throw new Error("Error when deleting the property in the database.");

      //! deleting the rooms for the property
      const ownerRoomsDocument = await Room.findOne({ ownerID: id });

      if (!ownerRoomsDocument) throw new Error(ownerRoomsDocument);

      const { rooms } = ownerRoomsDocument;

      const propertyRooms = rooms[0][propertyId] || null;

      if (!propertyRooms)
        throw new Error("Cannot find rooms for the property.");

      delete rooms[0][propertyId];

      const deletePropertyRooms = await Room.updateOne(
        { ownerID: id },
        { $set: { rooms } }
      );

      if (
        !deletePropertyRooms.acknowledged &&
        !deletePropertyRooms.modifiedCount
      )
        throw new Error(
          "Error when deleting the property rooms in the database."
        );

      //! deleting the tenants for the property
      const ownerTenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!ownerTenantsDocument) throw new Error(ownerTenantsDocument);

      const { tenants } = ownerTenantsDocument;

      const propertyRoomsTenants = tenants[0][propertyId] || null;

      if (!propertyRoomsTenants)
        throw new Error("Cannot find tenants for the property.");

      delete tenants[0][propertyId];

      const deletePropertyRoomsTenants = await Tenant.updateOne(
        { ownerID: id },
        { $set: { tenants } }
      );

      if (
        !deletePropertyRoomsTenants.acknowledged &&
        !deletePropertyRoomsTenants.modifiedCount
      )
        throw new Error(
          "Error when deleting the property tenants in the database."
        );

      //! deleting the rents for the property
      const ownerRentsDocument = await Rent.findOne({ ownerID: id });

      if (!ownerRentsDocument) throw new Error(ownerRentsDocument);

      const { rents } = ownerRentsDocument;

      const propertyRents = rents[0][propertyId] || null;

      if (!propertyRents)
        throw new Error("Cannot find rents for the property.");

      delete rents[0][propertyId];

      const deletePropertyRents = await Rent.updateOne(
        { ownerID: id },
        { $set: { rents } }
      );

      if (
        !deletePropertyRents.acknowledged &&
        !deletePropertyRents.modifiedCount
      )
        throw new Error(
          "Error when deleting the property rents in the database."
        );

      res.status(200).json({
        message: `Property with ID: ${propertyId} and Number: ${propertyNo} has been deleted`,
        deletedProperties: propertiesOwned[0],
      });
    } catch (err) {
      if (err?.message) res.status(500).json({ error: err?.message });
    }
  },

  //?  below is the expected requestBody from the user when deleting a room on property.
  //* {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  deleteRoomDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");

      const { id, propertyId, roomId } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectPropertyUsingPropertyID = rooms[0][propertyId];

      if (!selectPropertyUsingPropertyID)
        throw new Error(
          "Selected propertyID is not found/not registered in the rooms database."
        );

      const propertyRooms = selectPropertyUsingPropertyID?.rooms;

      const selectRoomInPropertyUsingRoomID = propertyRooms[roomId];

      if (!selectRoomInPropertyUsingRoomID)
        throw new Error(
          "Selected room ID is not found/not registered in the property."
        );

      const roomNo = selectRoomInPropertyUsingRoomID.roomNumber;

      delete rooms[0][propertyId].rooms[roomId];

      const deleteRoom = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        }
      );

      //! deleting the tenants for the property
      const ownerTenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!ownerTenantsDocument) throw new Error(ownerTenantsDocument);

      const { tenants } = ownerTenantsDocument;

      const propertyRoomsTenants =
        tenants[0][propertyId].tenants[roomId] || null;

      if (!propertyRoomsTenants)
        throw new Error("Cannot find tenants for the property.");

      delete tenants[0][propertyId].tenants[roomId];

      const deletePropertyRoomsTenants = await Tenant.updateOne(
        { ownerID: id },
        { $set: { tenants } }
      );

      if (
        !deletePropertyRoomsTenants.acknowledged &&
        !deletePropertyRoomsTenants.modifiedCount
      )
        throw new Error(
          "Error when deleting the room tenants in the database."
        );

      //! deleting the rents for the property
      const ownerRentsDocument = await Rent.findOne({ ownerID: id });

      if (!ownerRentsDocument) throw new Error(ownerRentsDocument);

      const { rents } = ownerRentsDocument;

      const propertyRents = rents[0][propertyId].rentPayments[roomId] || null;

      if (!propertyRents)
        throw new Error("Cannot find rents for the property.");

      delete rents[0][propertyId].rentPayments[roomId];

      const deletePropertyRents = await Rent.updateOne(
        { ownerID: id },
        { $set: { rents } }
      );

      if (
        !deletePropertyRents.acknowledged &&
        !deletePropertyRents.modifiedCount
      )
        throw new Error("Error when deleting the room rents in the database.");

      if (deleteRoom.acknowledged && deleteRoom.modifiedCount)
        res.status(200).json({
          deletedRooms: rooms[0][propertyId]?.rooms,
          message: `Room with the Number: ${roomNo} and ID: ${roomId} has been deleted.`,
        });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when deleting a tenant for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "PK1",
  //*   tenantId: "35501094",
  //*  }

  deleteTenantDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...please log in");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant Id.");

      const { id, propertyId, roomId, tenantId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No tenants have been added to this property.");

      const selectedRoomOnPropertyTenants = selectedPropertyTenants[roomId];

      if (!selectedRoomOnPropertyTenants)
        throw new Error("No tenants have been added to this room.");

      const selectedTenantOnRoomOnProperty =
        selectedRoomOnPropertyTenants[tenantId];

      const selectedTenantOnRoomOnPropertyName =
        selectedTenantOnRoomOnProperty?.tenantName;

      if (!selectedTenantOnRoomOnProperty)
        throw new Error(
          "No tenant with the given tenantId has been added to this room."
        );

      const selectedTenantNationalID =
        selectedTenantOnRoomOnProperty.tenantNationalID;

      delete tenants[0][propertyId].tenants[roomId][tenantId];

      const deleteTenant = await Tenant.updateOne(
        { ownerID: id },
        {
          $set: {
            tenants,
          },
        }
      );

      if (!deleteTenant.acknowledged && !deleteTenant.modifiedCount)
        throw new Error(
          "Error when deleting the tenant from the tenant in the database."
        );

      //! deleting the rents for the property
      const ownerRentsDocument = await Rent.findOne({ ownerID: id });

      if (!ownerRentsDocument) throw new Error(ownerRentsDocument);

      const { rents } = ownerRentsDocument;

      const propertyRents =
        rents[0][propertyId].rentPayments[roomId][tenantId] || null;

      if (!propertyRents)
        throw new Error("Cannot find rents for the tenant being deleted.");

      delete rents[0][propertyId].rentPayments[roomId][tenantId];

      const deletePropertyRents = await Rent.updateOne(
        { ownerID: id },
        { $set: { rents } }
      );

      if (
        !deletePropertyRents.acknowledged &&
        !deletePropertyRents.modifiedCount
      )
        throw new Error(
          "Error when deleting the property rents for the tenant in the database."
        );

      //! checking if the tenant being deleted is the current tenant occupying the room and updates the rooms document
      const findRooms = await Room.findOne({ ownerID: id });

      const rooms = findRooms ? findRooms.rooms : null;

      if (!rooms) throw new Error("rooms doc prop not found.");

      const currentRoomTenantNationalID =
        rooms[0][propertyId].rooms[roomId].currentTenantID;

      if (currentRoomTenantNationalID === selectedTenantNationalID) {
        rooms[0][propertyId].rooms[roomId].currentTenantID = null;
        rooms[0][propertyId].rooms[roomId].isOccupied = false;

        const updateRooms = await Room.updateOne(
          { ownerID: id },
          {
            $set: {
              rooms,
            },
          }
        );

        if (!updateRooms.acknowledged && !updateRooms.modifiedCount)
          throw new Error(
            "Error when deleting the tenantID  for the room in the database."
          );
      }

      res.status(200).json({
        message: `Tenant with the Name: ${selectedTenantOnRoomOnPropertyName} and ID: ${tenantId} has been successfuly deleted.`,
        deletedRoomTenants: tenants[0][propertyId].tenants[roomId],
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when deleting a rent payment for a room by a tenant.
  //* {
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "paymentId": "74e168a4a95y",
  //* }

  deleteRentPaymentDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.paymentId) throw new Error("provide a valid payment Id.");

      const { id, propertyId, roomId, tenantId, paymentId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the rents database."
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the rents database."
        );

      const newTenantPaymentReports =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.filter(
          (payment) => payment.paymentID !== paymentId
        );

      if (newTenantPaymentReports === (null || undefined))
        throw new Error("Error when getting requested payment reports.");

      rents[0][propertyId].rentPayments[roomId][tenantId] =
        newTenantPaymentReports;

      const deleteRent = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        }
      );

      if (deleteRent.acknowledged && deleteRent.modifiedCount)
        res.status(200).json({
          deletedTenantPayments: newTenantPaymentReports,
          message: `Rent payment with ID: ${paymentId} has been successfuly deleted.`,
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = patchControllers;
