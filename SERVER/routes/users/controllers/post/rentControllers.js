const {
  ObjectId: { isValid },
} = require("mongodb");

const { Room } = require("../../../../middleware/models/Room");
const { Rent } = require("../../../../middleware/models/Rent");

const { generateOTP } = require("../../helpers/generateOtp");

const rentControllers = {
  //! RENT DB ENDPOINTS DEALNG WITH THE MANAGEMENT OF RENT PAYMENTS WITH RESPECT TO THE CORRESPONDING PROPERTIES AND ROOMS

  //?  below is the expected requestBody from the user when submitting a create rent payment request
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "payment": {
  //*     "amount": "2000",
  //*     "month": "SEPTEMBER",
  //*     "mode": "MPESA",
  //*     "receiptNumber": "SH23EQHJS",
  //*   }
  //* }

  createRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");
      if (!req.body.newPayment) throw new Error("provide a valid amount.");

      const { id, propertyId, roomId, tenantId, newPayment } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database.",
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No rents have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database.",
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database.",
        );

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const checkIfPropertyIdIsRegisteredInRoomsDocument = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegisteredInRoomsDocument)
        throw new Error(
          "Property with the given property Id has not been registered in the rooms database.",
        );

      if (
        !Object.keys(checkIfPropertyIdIsRegisteredInRoomsDocument?.rooms).length
      )
        throw new Error("No rooms have been added to this property.");

      if (!checkIfPropertyIdIsRegisteredInRoomsDocument?.rooms[roomId])
        throw new Error("No room with the room Id found.");

      const roomRate = Number(
        rooms[0][propertyId]?.rooms[roomId]?.roomRatePerMonth,
      );

      const previousPaymentMonth =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
          ? checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
              ?.month
          : null;

      const isNewMonth =
        newPayment.month === previousPaymentMonth ? 0 : roomRate;

      const unpaidRentBalanceFromLastPayment =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
          ? isNewMonth
            ? checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(
                -1,
              )?.newBalance + isNewMonth
            : checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(
                -1,
              )?.newBalance
          : roomRate;

      const newRentPaymentEntry = {
        paymentID: generateOTP(),
        date: new Date().toLocaleDateString(),
        month: newPayment?.month,
        previousPaymentBalance: unpaidRentBalanceFromLastPayment,
        amountPaid: +newPayment.amount,
        newBalance: unpaidRentBalanceFromLastPayment - newPayment.amount,
        modeOfPayment: newPayment.mode,
        recieptNumber:
          newPayment.mode.toLowerCase() === "cash"
            ? "CASH"
            : newPayment.recieptNumber.toUpperCase(),
      };

      rents[0][propertyId].rentPayments[roomId][tenantId].push(
        newRentPaymentEntry,
      );

      const yearOfRentPaymentInExpectedMonthlyRevenues =
        rents[0][propertyId].expectedMonthlyRevenues[
          new Date(newRentPaymentEntry.month).getFullYear()
        ];

      if (!yearOfRentPaymentInExpectedMonthlyRevenues)
        rents[0][propertyId].expectedMonthlyRevenues[
          new Date(newRentPaymentEntry.month).getFullYear()
        ] = [];

      const updateRents = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        },
      );

      if (!updateRents.acknowledged && !updateRents.modifiedCount)
        throw new Error("Error while updating database.");

      res.status(200).json({
        newTenantRoomRentPayments:
          rents[0][propertyId].rentPayments[roomId][tenantId],
        message: "New payment successfully added.",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for all rooms
  //* {
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllRentPaymentsForAllRoomsInProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const checkIfPropertyIdIsRegisteredInRooms = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegisteredInRooms)
        throw new Error(
          "No property with the given property Id has been found in the rooms database.",
        );

      if (!Object.keys(checkIfPropertyIdIsRegisteredInRooms.rooms).length)
        throw new Error("No rooms found in the selected property.");

      let propertyExpectedRevenueMonthly = 0;

      for (const roomId in checkIfPropertyIdIsRegisteredInRooms.rooms) {
        if (
          checkIfPropertyIdIsRegisteredInRooms.rooms[roomId].isOccupied &&
          checkIfPropertyIdIsRegisteredInRooms.rooms[roomId].currentTenantID
        ) {
          propertyExpectedRevenueMonthly +=
            +checkIfPropertyIdIsRegisteredInRooms.rooms[roomId]
              .roomRatePerMonth;
        }
      }

      if (!propertyExpectedRevenueMonthly)
        throw new Error("No occupied rooms found in the selected property.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the rents database.",
        );

      if (!Object.keys(checkIfPropertyIdIsRegistered.rentPayments).length)
        throw new Error("No payments have been added to this property.");

      res.status(200).json({
        message: "Revenue details fetched successfully",
        propertyRents: checkIfPropertyIdIsRegistered.rentPayments,
        propertyExpectedRevenueMonthly,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
  //?  below is the expected requestBody from the user when reading all rent payments for a room
  //* {
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //* }

  readAllRentPaymentsForRoomInProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

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

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database.",
        );

      if (!Object.keys(checkIfRoomIdIsRegisteredUnderSelectedProperty))
        throw new Error("No payment reports for the given room were found.");

      res.status(200).json({ checkIfRoomIdIsRegisteredUnderSelectedProperty });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for a room by a tenant.
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //* }

  readAllRentPaymentsForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");

      const { id, propertyId, roomId, tenantId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database.",
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database.",
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty ===
        (null || undefined)
      )
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database.",
        );

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.length)
        res.status(200).json({
          selectedTenantPayments: [],
          message: "No payment have been made by this tenant.",
        });
      else
        res.status(200).json({
          selectedTenantPayments:
            checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty,
          message: "Rent payments retrieved successfully.",
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for a room by a tenant.
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "paymentId": "74e168a4a95y",
  //* }

  readRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property Id.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room Id.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.paymentId) throw new Error("provide a valid payment Id.");

      const { id, propertyId, propertyNo, roomId, tenantId, paymentId } =
        req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

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

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database.",
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database.",
        );

      const requestedPaymentReport =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.find(
          (payment) => payment.paymentID === paymentId,
        );

      if (!requestedPaymentReport)
        throw new Error(
          "The requested payment report with the given payment ID was not found.",
        );

      res.status(200).json({ requestedPaymentReport });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = rentControllers;
