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

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const propertyId = form.querySelector("select").value;

    if (!propertyId) {
      UserInterface.handleErrors("please select a property");
      return;
    }

    console.log(propertyId, propertyName);

    const selectedMonth = document.querySelector("[data-month]").value;
    const selectedYear = document.querySelector("[data-year]").value;

    if (!selectedMonth && !selectedYear) {
      UserInterface.handleErrors(
        "Please select a month or year in the inputs below."
      );

      return;
    }

    if (selectedMonth && !selectedYear) {
      UserInterface.readAndRenderRevenueStats(
        accessToken,
        propertyId,
        selectedMonth
      );
      return;
    }

    if (!selectedMonth && selectedYear) {
      UserInterface.readAndRenderRevenueStats(
        accessToken,
        propertyId,
        selectedYear
      );
      return;
    }
  });
})();
