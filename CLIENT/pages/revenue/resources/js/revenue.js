(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? localStorage.getItem("liparentAccessToken")
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  UserInterface.toggleTenantsNavButtonsStatus();
  UserInterface.toggleRentsNavButtonsStatus();

  UserInterface.renderPropertySelectionOptions(accessToken);

  const form = document.querySelector("[data-select-property]");

  const selectedMonthInput = document.querySelector("[data-month]");
  const selectedYearInput = document.querySelector("[data-year]");

  UserInterface.rangeInputsEventListeners(
    selectedMonthInput,
    selectedYearInput
  );

  const selectedPropertyName = localStorage.getItem(
    "liparentRevenueSelectedPropertyName"
  );
  const selectedPropertyId = localStorage.getItem(
    "liparentRevenueSelectedPropertyId"
  );
  const selectedPropertyRange = JSON.parse(
    localStorage.getItem("liparentRevenueSelectedPropertyRange")
  );

  if (selectedPropertyId && selectedPropertyRange) {
    UserInterface.readAndRenderRevenueStats(
      accessToken,
      selectedPropertyName,
      selectedPropertyId,
      selectedPropertyRange
    );

    if (selectedPropertyRange.month) {
      selectedMonthInput.value = selectedPropertyRange.month;
      selectedMonthInput.classList.add("active");
      selectedYearInput.classList.remove("active");
      selectedYearInput.disabled = true;
    }

    if (selectedPropertyRange.year) {
      selectedYearInput.value = selectedPropertyRange.year;
      selectedYearInput.classList.add("active");
      selectedMonthInput.classList.remove("active");
      selectedMonthInput.disabled = true;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const propertyId = form.querySelector("select").value;
    const propertyName =
      form.querySelector("select").children[propertyId].innerText;

    if (!propertyId) {
      UserInterface.handleErrors("please select a property");
      return;
    }

    const selectedMonth = document.querySelector("[data-month]").value;
    const selectedYear = document.querySelector("[data-year]").value;

    if ((!selectedMonth && !selectedYear) || (selectedMonth && selectedYear)) {
      UserInterface.handleErrors(
        "Please select either a month or enter the year in the inputs below."
      );

      return;
    }

    if (selectedMonth && !selectedYear) {
      UserInterface.readAndRenderRevenueStats(
        accessToken,
        propertyName,
        propertyId,
        {
          month: selectedMonth,
        }
      );
      return;
    }

    if (!selectedMonth && selectedYear) {
      UserInterface.readAndRenderRevenueStats(
        accessToken,
        propertyName,
        propertyId,
        {
          year: selectedYear,
        }
      );
      return;
    }
  });
})();
