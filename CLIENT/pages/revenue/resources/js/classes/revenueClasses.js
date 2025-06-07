class Store extends StoreUtilities {
  static async preFetchPropertiesNames(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    const openLoader = UserInterface.openLoader(
      "reading properties names",
      "readProperties"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/read/properties`,
      requestOptions
    );

    const { propertiesOwned, error } = await getAllPropertiesData?.json();

    if (propertiesOwned || error) UserInterface.closeLoader("readProperties");

    if (error) UserInterface.handleErrors(error);

    if (propertiesOwned) return propertiesOwned;
  }

  static async readAllPayments(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

    const openLoader = UserInterface.openLoader(
      "reading payments",
      "readPayments"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/read/property/rooms/tenants/payments`,

      requestOptions
    );

    const { message, propertyRents, propertyExpectedRevenueMonthly, error } =
      await getAllPropertyPaymentData.json();

    if (propertyRents || error) UserInterface.closeLoader("readPayments");

    if (error) UserInterface.handleErrors(error);

    console.log(message, propertyRents, propertyExpectedRevenueMonthly);

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
    selectedRange
  ) {
    if (!propertyRents || !selectedRange) return;

    let allPayments = [];

    for (const roomId in propertyRents) {
      for (const tenantId in propertyRents[roomId]) {
        allPayments = [...allPayments, ...propertyRents[roomId][tenantId]];
      }
    }

    const selectedRangePayments = allPayments.filter((payment) => {
      if (
        (selectedRange.month && payment.month === selectedRange.month) ||
        (selectedRange.year && payment.month.slice(0, 4) === selectedRange.year)
      )
        return payment;
    });

    if (!selectedRangePayments.length) {
      this.handleErrors("No payments found for the selected range.");
      return;
    }

    console.log(selectedRangePayments);

    // const selectedRangeTotalRevenue = selectedRangePayments.reduce(
    //   (a, b) => +a.amountPaid + +b.amountPaid
    // );

    let selectedRangeTotalRevenue = 0;

    selectedRangePayments.forEach((payment) => {
      selectedRangeTotalRevenue += +payment.amountPaid;
    });

    const selectedRangeDeficitRevenue =
      propertyExpectedRevenueMonthly - selectedRangeTotalRevenue;

    const totalRevenueAmount = document.querySelector("[data-total-revenue]");
    const projectedRevenueAmount = document.querySelector(
      "[data-projected-revenue]"
    );
    const deficitRevenueAmount = document.querySelector(
      "[data-deficit-revenue]"
    );
    selectedRangeTotalRevenue < propertyExpectedRevenueMonthly
      ? totalRevenueAmount.classList.add("text-danger")
      : totalRevenueAmount.classList.add("text-success");

    totalRevenueAmount.innerText = `KES. ${selectedRangeTotalRevenue.toLocaleString()}`;

    projectedRevenueAmount.innerText = `KES. ${propertyExpectedRevenueMonthly.toLocaleString()}`;

    selectedRangeDeficitRevenue < 0
      ? deficitRevenueAmount.classList.add("text-success")
      : deficitRevenueAmount.classList.add("text-danger");

    deficitRevenueAmount.innerText =
      selectedRangeDeficitRevenue < 0
        ? `KES. +${selectedRangeDeficitRevenue.toLocaleString().slice(1)}`
        : `KES. -${selectedRangeDeficitRevenue.toLocaleString()}`;
  }

  static async readAndRenderRevenueStats(
    accessToken,
    form,
    propertyId,
    selectedRange
  ) {
    if (!accessToken || !form || !propertyId || !selectedRange) return;

    const propertyName =
      form.querySelector("select").children[propertyId].innerText;

    if (!propertyName) return;

    const { message, propertyRents, propertyExpectedRevenueMonthly } =
      await Store.readAllPayments(accessToken, propertyId);

    if (!message || !propertyRents || !propertyExpectedRevenueMonthly) return;

    this.alertMessage(message, "success");
    this.updatePageHeader(propertyName);
    this.renderRevenueStats(
      propertyRents,
      propertyExpectedRevenueMonthly,
      selectedRange
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
