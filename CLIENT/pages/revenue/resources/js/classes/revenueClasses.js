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

    if (message || propertyRents || error)
      UserInterface.closeLoader("readPayments");

    if (error) {
      UserInterface.handleErrors(error);
      return;
    }

    if (message && propertyRents && propertyExpectedRevenueMonthly)
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

    if (!allPayments.length) {
      this.handleErrors("No payments found for the selected property.");
      return;
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

    // console.log(selectedRangePayments);

    // const selectedRangeTotalRevenue = selectedRangePayments.reduce(
    //   (a, b) => a.amountPaid + b.amountPaid
    // );

    let selectedRangeTotalRevenue = 0;

    selectedRangePayments.forEach((payment) => {
      selectedRangeTotalRevenue += +payment.amountPaid;
    });

    const propertyExpectedRevenueForSelectedRange = selectedRange.month
      ? propertyExpectedRevenueMonthly
      : selectedRange.year
      ? propertyExpectedRevenueMonthly * 12
      : null;

    const selectedRangeDeficitRevenue =
      propertyExpectedRevenueForSelectedRange - selectedRangeTotalRevenue;

    const totalRevenueAmount = document.querySelector("[data-total-revenue]");
    const projectedRevenueAmount = document.querySelector(
      "[data-projected-revenue]"
    );
    const deficitRevenueAmount = document.querySelector(
      "[data-deficit-revenue]"
    );

    selectedRangeTotalRevenue < propertyExpectedRevenueForSelectedRange
      ? totalRevenueAmount.classList.add("text-danger")
      : totalRevenueAmount.classList.add("text-success");

    totalRevenueAmount.innerText = `KES. ${selectedRangeTotalRevenue.toLocaleString()}`;

    projectedRevenueAmount.innerText = `KES. ${propertyExpectedRevenueForSelectedRange.toLocaleString()}`;

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
    propertyName,
    propertyId,
    selectedRange
  ) {
    if (!accessToken || !propertyName || !propertyId || !selectedRange) return;

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

    this.saveQueryDetailsToLocalStorage(
      propertyName,
      propertyId,
      selectedRange
    );
  }

  static updatePageHeader(propertyName) {
    if (!propertyName) return;

    document.querySelector(
      "[data-header]"
    ).innerText = `REVENUE REPORT FOR ${propertyName}`;
  }

  static saveQueryDetailsToLocalStorage(
    propertyName,
    propertyId,
    selectedRange
  ) {
    !localStorage.getItem("liparentRevenueSelectedPropertyName") ||
    (localStorage.getItem("liparentRevenueSelectedPropertyName") &&
      localStorage.getItem("liparentRevenueSelectedPropertyName") !==
        propertyName)
      ? localStorage.setItem(
          "liparentRevenueSelectedPropertyName",
          propertyName
        )
      : null;

    !localStorage.getItem("liparentRevenueSelectedPropertyId") ||
    (localStorage.getItem("liparentRevenueSelectedPropertyId") &&
      localStorage.getItem("liparentRevenueSelectedPropertyId") !== propertyId)
      ? localStorage.setItem("liparentRevenueSelectedPropertyId", propertyId)
      : null;

    !localStorage.getItem("liparentRevenueSelectedPropertyRange") ||
    (localStorage.getItem("liparentRevenueSelectedPropertyRange") &&
      JSON.parse(
        localStorage.getItem("liparentRevenueSelectedPropertyRange")
      ) !== selectedRange)
      ? localStorage.setItem(
          "liparentRevenueSelectedPropertyRange",
          JSON.stringify(selectedRange)
        )
      : null;
  }

  static rangeInputsEventListeners(selectedMonthInput, selectedYearInput) {
    selectedMonthInput.addEventListener("change", () => {
      if (selectedMonthInput.value) {
        selectedYearInput.setAttribute("disabled", "true");
        selectedMonthInput.previousElementSibling.classList.add("active");
      } else {
        selectedYearInput.removeAttribute("disabled");
        selectedMonthInput.previousElementSibling.classList.remove("active");
      }
    });

    selectedYearInput.addEventListener("change", () => {
      if (selectedYearInput.value) {
        selectedMonthInput.setAttribute("disabled", "true");
        selectedYearInput.previousElementSibling.classList.add("active");
      } else {
        selectedMonthInput.removeAttribute("disabled");
        selectedYearInput.previousElementSibling.classList.remove("active");
      }
    });
  }
}
