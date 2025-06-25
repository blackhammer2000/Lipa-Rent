(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? localStorage.getItem("liparentAccessToken")
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  UserInterface.toggleTenantsNavButtonsStatus();
  UserInterface.toggleRentsNavButtonsStatus();

  UserInterface.renderPropertySelectionOptions(accessToken);

  const selectedMonthInput = document.querySelector("[data-month]");
  const selectedYearInput = document.querySelector("[data-year]");

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

  const form = document.querySelector("[data-select-property]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const propertyId = form.querySelector("select").value;

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
      UserInterface.readAndRenderRevenueStats(accessToken, form, propertyId, {
        month: selectedMonth,
      });
      return;
    }

    if (!selectedMonth && selectedYear) {
      UserInterface.readAndRenderRevenueStats(accessToken, form, propertyId, {
        year: selectedYear,
      });
      return;
    }
  });
})();
