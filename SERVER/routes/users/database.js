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
          ["PK2"]: {
            ["6113425"]: {
              tenantID: "35501094",
              tenantName: "LIXO PESSAR",
              moveInDate: "13/9/24",
              moveOutDate: null,
            },
            ["35463356"]: {
              tenantID: "35501094",
              tenantName: "LIXO PESSAR",
              moveInDate: "13/9/24",
              moveOutDate: null,
            },
          },
          ["PK3"]: {
            ["43261521"]: {
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
        propertyRates: {
          SR: "3500",
          BS: "5000",
          BR1: "9000",
          BR2: "15000",
          BR3: "20000",
        },
        rentPayments: {
          ["PK1"]: {
            ["37725864"]: [
              {
                paymentID: "HDUFGIS983HF38",
                date: "13/9/24",
                monthDue: "2",
                monthlyPayment: "6000",
                balanceFromLastMonth: "0",
                totalAmountDue: "6000",
                amountPaid: "6000",
                unpaidBalanceThisMonth: "0",
                totalRentBalance: "0",
                modeOfPayment: "MPESA",
                recieptNumber: "SH45BXDE",
              },
              {
                paymentID: "ae1eb7d1-a490-4607-bd73-74e168a4a95y",
                date: "25/09/2024",
                monthDue: "SEPTEMBER, 2024",
                monthlyPayment: "6000",
                balanceFromLastMonth: "0",
                totalAmountDue: "6000",
                amountPaid: "8500",
                unpaidBalanceThisMonth: "-2500",
                totalRentBalance: "-2500",
                modeOfPayment: "MPESA",
                recieptNumber: "SH45BXDE",
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
