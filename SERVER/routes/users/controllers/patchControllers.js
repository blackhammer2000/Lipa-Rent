const {
  ObjectId: { isValid },
} = require("mongodb");

const { hash, compare } = require("bcrypt");

const { Owner } = require("../../../middleware/models/Owner");
const { Property } = require("../../../middleware/models/Property");
const { Room } = require("../../../middleware/models/Room");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Rent } = require("../../../middleware/models/Rent");
const { Password } = require("../../../middleware/models/Password");

const { encrypt } = require("../../helpers/cipher");

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

      const { name, nationalID, email, phone } = editedOwner;

      const ownerPropertiesDocument = await Owner.findOne({
        _id: id.toString(),
      });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const ownerUpdate = await Owner.updateOne(
        { _id: id },
        {
          $set: { name, nationalID, email, phone },
        }
      );

      if (!ownerUpdate.acknowledged)
        throw new Error(
          "Error when updating the owner details in the database."
        );

      const triggerLogOut =
        ownerPropertiesDocument.nationalID !== nationalID ||
        ownerPropertiesDocument.email !== email;

      res
        .status(203)
        .json({ message: "Owner details edited successfully", triggerLogOut });
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

      editedProperty.propertyID ? delete editedProperty.propertyID : null;

      for (const key in editedProperty) {
        if (key === "propertyID") {
          checkIfPropertyIdIsRegistered[key] =
            checkIfPropertyIdIsRegistered[key];
        } else {
          checkIfPropertyIdIsRegistered[key]
            ? (checkIfPropertyIdIsRegistered[key] = editedProperty[key])
            : null;
        }
      }

      propertiesOwned[0][checkIfPropertyIdIsRegistered.propertyID] =
        checkIfPropertyIdIsRegistered;

      const updateEditedProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } }
      );

      if (!updateEditedProperty.acknowledged)
        throw new Error("Error when updating the property in the database.");

      res.status(200).json({
        message: `Property with the ID: ${propertyId} successfully edited.`,
        editedProperties: propertiesOwned[0],
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
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.editedRoom)
        throw new Error("provide valid edited room details.");

      const { id, propertyId, roomId, editedRoom } = req.body;

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

      const propertyRooms = selectPropertyUsingPropertyID?.rooms;

      const selectRoomInPropertyUsingRoomID = propertyRooms[roomId];

      if (!selectRoomInPropertyUsingRoomID)
        throw new Error(
          "Selected room ID is not found/not registered in the property."
        );

      if (!Object.keys(propertyRooms))
        throw new Error("No rooms have been added to this property.");

      editedRoom.roomID ? delete editedRoom.roomID : null;

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
          message: `Room with the ID: ${roomId} has been successfuly edited.`,
          editedRooms: rooms[0][propertyId]?.rooms,
        });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  editTenantDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...please log in");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.editedTenant)
        throw new Error("provide a valid editedTenant.");

      const { id, propertyId, roomId, tenantId, editedTenant } = req?.body;

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

      if (!selectedTenantOnRoomOnProperty)
        throw new Error(
          "No tenant with the given tenantId has been added to this room."
        );

      editedTenant.tenantID ? delete editedTenant.tenantID : null;

      for (const key in editedTenant) {
        if (key === "tenantID") {
          selectedTenantOnRoomOnProperty[key] =
            selectedTenantOnRoomOnProperty[key];
        } else {
          selectedTenantOnRoomOnProperty[key]
            ? (selectedTenantOnRoomOnProperty[key] = editedTenant[key])
            : null;
        }
      }

      tenants[0][propertyId].tenants[roomId][tenantId] =
        selectedTenantOnRoomOnProperty;

      const updateTenants = await Tenant.updateOne(
        { ownerID: id },
        { $set: { tenants } }
      );

      if (!updateTenants.acknowledged && !updateTenants.modifiedCount)
        throw new Error("Could not update database after editing the tenant.");

      res.status(200).json({
        message: `Tenant with the ID: ${tenantId} has been successfuly edited.`,
        editedRoomTenants: tenants[0][propertyId].tenants[roomId],
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  editRentDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property Id.");

      if (!req?.body.roomId) throw new Error("provide a valid room Id.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.paymentId) throw new Error("provide a valid payment Id.");
      if (!req.body.editedRent)
        throw new Error("provide a valid edited Rent doc.");

      const { id, propertyId, roomId, tenantId, paymentId, editedRent } =
        req?.body;

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
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database."
        );

      let requestedPaymentReportIndex = null;

      const newTenantPaymentReports =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.map(
          (payment, index) => {
            if (payment.paymentID === paymentId) {
              requestedPaymentReportIndex = index;

              for (const key in editedRent) {
                if (key === "paymentID") {
                  payment[key] = payment[key];
                } else {
                  payment[key] ? (payment[key] = editedRent[key]) : null;
                }
                return payment;
              }
            } else {
              return payment;
            }
          }
        );

      if (!requestedPaymentReportIndex)
        throw new Error(
          "The requested payment report with the given payment ID was not found."
        );

      rents[0][propertyId].rentPayments[roomId][tenantId] =
        newTenantPaymentReports;

      const updateRents = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        }
      );

      if (updateRents.acknowledged && updateRents.modifiedCount)
        res.status(200).json({
          message: `Rent payment for the room with ID: ${roomId} made by tenant with ID: ${tenantId} has been successfuly edited.`,
          selectedRentPaymentEdit:
            newTenantPaymentReports[requestedPaymentReportIndex],
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  editPassword: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.newPassword) throw new Error("Provide valid password");
      if (!req.body.confirmNewPassword)
        throw new Error("Provide valid password");
      if (!req.headers.resettoken) throw new Error("Unauthorized action.");

      const { id, newPassword, confirmNewPassword } = req.body;

      const {
        headers: { resettoken },
      } = req;

      if (encrypt(newPassword) !== encrypt(confirmNewPassword))
        throw new Error("Passwords do not match.");

      const passwordDoc = await Password.findOne({ ownerID: id });

      const resetPasswordToken = passwordDoc.resetToken || null;

      if (!resetPasswordToken)
        throw new Error("Invalid Token, generate a new one.");

      const resetPasswordTokenMatch = await compare(
        encrypt(resettoken),
        resetPasswordToken
      );

      if (!resetPasswordTokenMatch)
        throw new Error("Invalid Token, generate a new one.");

      const isResetPasswordTokenVerified =
        passwordDoc.resetTokenVerified || null;

      if (
        !isResetPasswordTokenVerified ||
        isResetPasswordTokenVerified !== true
      )
        throw new Error("Invalid Token, generate a new one.");

      const hashedNewPassword = await hash(encrypt(newPassword), 10);

      if (!hashedNewPassword) throw new Error(hashedNewPassword);

      const updatePassword = await Password.updateOne(
        { ownerID: id },
        {
          $set: {
            password: hashedNewPassword,
            resetToken: null,
            resetTokenExpiry: null,
            resetTokenVerified: null,
            lastReset: Date.now(),
          },
        }
      );

      if (!updatePassword.acknowledged && !updatePassword.modifiedCount)
        throw new Error("Error in reset password in the database");

      res.status(200).json({
        message: "Password has been reset successfully",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = patchControllers;
