const propertiesDB = {
  ownerID: "sfsdfsfs",
  properties: [
    {
      ["HDFBSUEHDUIFHW783YRWUHF84YF3"]: {
        propertyNumber: "NGONG/NGONG/12058",
        propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
        propertyTitleDetails: {
          name: "PETER KARANJA",
          nationalID: "37725864",
          asWho: "SELF",
        },
        propertyLocation: "NGONG",
        propertyValue: "12.3M",
        propertyPurpose: {
          purposedUse: "commercial",
          purposeType: "lease",
        },
        modeOfPayment: "none",
        isIdle: false,
      },
      ["HDFBSUEHDUIFHW783YRWUHF84YF31"]: {
        propertyNumber: "KIS/KIS/12058",
        propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF31",
        propertyTitleDetails: {
          name: "SAMUEL MUTONGA",
          nationalID: "37725864",
          asWho: "NEXT OF KIN",
        },
        propertyLocation: "KISERIAN",
        propertyValue: "29.7M",
        propertyPurpose: {
          purposedUse: "commercial",
          purposeType: "rental real estate",
        },
        modeOfPayment: "BANK",
        isIdle: false,
      },
    },
  ],
};

const RoomsDB = {
  ownerID: "dfsfddsf",
  propertiesRooms: [
    {
      ["HDFBSUEHDUIFHW783YRWUHF84YF3"]: {
        propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
        propertyNumber: "NGONG/NGONG/12058",
        rooms: {
          ["PK1"]: {
            roomID: "PK1",
            roomNumber: "1",
            roomRatePerMonth: "6000",
            roomType: "SingleRoom",
            isOccupied: true,
          },
        },
      },
    },
  ],
};

const TenantsDB = {
  ownerID: "fsfsdf",
  propertiesTenants: [
    {
      ["HDFBSUEHDUIFHW783YRWUHF84YF3"]: {
        propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
        propertyNumber: "NGONG/NGONG/12058",
        tenants: {
          ["PK1"]: {
            ["35501094"]: {
              tenantID: "35501094",
              tenantName: "LIXO PESSAR",
              moveInDate: "13/9/24",
              moveOutDate: null,
            },
          },
        },
      },
    },
  ],
};

const RentsDB = {
  ownerID: "dsfsdfs",
  propertiesRents: [
    {
      ["HDFBSUEHDUIFHW783YRWUHF84YF3"]: {
        propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
        propertyNumber: "NGONG/NGONG/12058",
        rentPayments: {
          ["PK1"]: {
            ["37725864"]: [
              {
                paymentID: "HDUFGIS983HF38",
                date: "13/9/24",
                monthDue: "FEB",
                amountDue: "6000",
                unpaidBalance: "1200",
                totalAmountDue: "7200",
                amountPaid: "7000",
                modeOfPayment: "MPESA",
                recieptNumber: "SH45BXDE",
              },
              {
                paymentID: "UTIHUTTBGIRU8R",
                date: "13/9/24",
                monthDue: "MAR",
                amountDue: "6000",
                unpaidBalance: "200",
                totalAmountDue: "6200",
                amountPaid: "5000",
                modeOfPayment: "MPESA",
                recieptNumber: "SWQ34TRR",
              },
            ],
            ["35501094"]: [],
          },
        },
      },
    },
  ],
};

module.exports = { propertiesDB, RoomsDB, RentsDB, TenantsDB };
