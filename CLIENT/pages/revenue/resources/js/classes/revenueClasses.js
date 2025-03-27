class Store extends StoreUtilities {
  static async preFetchPropertiesNames(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    UserInterface.openLoader("reading properties names", "readProperties");

    const requestOptions = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        token: accessToken,
        user: true,
      },
    };

    const getAllPropertiesData = await fetch(
      "http://localhost:4000/api/user/owner/read/properties",
      requestOptions
    );

    const { propertiesOwned, error } = await getAllPropertiesData?.json();

    if (propertiesOwned || error) UserInterface.closeLoader("readProperties");

    if (error) UserInterface.handleErrors(error);

    if (propertiesOwned) return propertiesOwned;
  }

  static async readAllPayments(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

    UserInterface.openLoader("reading payments", "readPayments");

    const requestOptions = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        token: accessToken,
        user: true,
      },
      body: JSON.stringify({ propertyId }),
    };

    const getAllPropertyPaymentData = await fetch(
      "http://localhost:4000/api/user/owner/read/property/rooms/tenants/payments",

      requestOptions
    );

    const { message, propertyRents, propertyExpectedRevenueMonthly, error } =
      await getAllPropertyPaymentData.json();

    if (propertyRents || error) UserInterface.closeLoader("readPayments");

    if (error) UserInterface.handleErrors(error);

    // console.log(message, propertyRents, propertyExpectedRevenueMonthly);

    if (propertyRents && propertyExpectedRevenueMonthly)
      return { message, propertyRents, propertyExpectedRevenueMonthly };
  }
}

class UserInterface extends UserinterfaceUtilities {
  static async renderPropertySelectionOptions(accessToken) {
    const propertiesOwned = await Store.preFetchPropertiesNames(accessToken);

    if (!propertiesOwned) return;

    const optionsBody = document.querySelector("select");
    optionsBody.querySelectorAll("option").forEach((option) => option.remove());

    const fragment = document.createDocumentFragment();

    const placeHolderOption = document.createElement("option");
    placeHolderOption.value = "";
    placeHolderOption.innerText = "SELECT PROPERTY";
    fragment.append(placeHolderOption);

    for (const key in propertiesOwned) {
      const option = document.createElement("option");
      option.value = key;
      option.id = key;
      option.innerText = propertiesOwned[key].propertyName.toUpperCase();
      fragment.append(option);
    }

    optionsBody.append(fragment);
  }

  static renderRevenueStats(
    propertyRents,
    propertyExpectedRevenueMonthly,
    selectedMonth
  ) {
    if (!propertyRents || !selectedMonth) return;

    let allPayments = [];

    for (const roomId in propertyRents) {
      for (const tenantId in propertyRents[roomId]) {
        allPayments = [...allPayments, ...propertyRents[roomId][tenantId]];
      }
    }

    const selectedMonthPayments = allPayments.filter((payment) => {
      if (payment.month === selectedMonth) return payment;
    });

    let selectedMonthTotalRevenue = 0;

    selectedMonthPayments.forEach((payment) => {
      selectedMonthTotalRevenue += +payment.amountPaid;
    });

    const selectedMonthDeficitRevenue =
      propertyExpectedRevenueMonthly - selectedMonthTotalRevenue;

    const totalRevenueAmount = document.querySelector("[data-total-revenue]");
    const projectedRevenueAmount = document.querySelector(
      "[data-projected-revenue]"
    );
    const deficitRevenueAmount = document.querySelector(
      "[data-deficit-revenue]"
    );
    selectedMonthTotalRevenue < propertyExpectedRevenueMonthly
      ? totalRevenueAmount.classList.add("text-danger")
      : totalRevenueAmount.classList.add("text-success");
    totalRevenueAmount.innerText = `KES. ${selectedMonthTotalRevenue.toLocaleString()}`;

    projectedRevenueAmount.innerText = `KES. ${propertyExpectedRevenueMonthly.toLocaleString()}`;

    selectedMonthDeficitRevenue < 0
      ? deficitRevenueAmount.classList.add("text-success")
      : deficitRevenueAmount.classList.add("text-danger");
    deficitRevenueAmount.innerText =
      selectedMonthDeficitRevenue < 0
        ? `KES. +${selectedMonthDeficitRevenue.toLocaleString().slice(1)}`
        : `KES. -${selectedMonthDeficitRevenue.toLocaleString()}`;
  }

  static async readAndRenderRevenueStats(accessToken, form, selectedMonth) {
    if (!accessToken || !form || !selectedMonth) return;

    const propertyId = form.querySelector("select")?.value;
    const propertyName =
      form.querySelector("select")?.children[propertyId].innerText;

    const { message, propertyRents, propertyExpectedRevenueMonthly } =
      await Store.readAllPayments(accessToken, propertyId);

    this.alertMessage(message, "success");
    this.updatePageHeader(propertyName);
    this.renderRevenueStats(
      propertyRents,
      propertyExpectedRevenueMonthly,
      selectedMonth
    );

    // localStorage.setItem("liparentRevenueSelectedProperty", propertyId);
  }

  static updatePageHeader(propertyName) {
    if (!propertyName) return;

    document.querySelector(
      "[data-header]"
    ).innerText = `REVENUE REPORT FOR ${propertyName}`;
  }
}
