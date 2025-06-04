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

    const propertyId = form.querySelector("select").id;
    const propertyName = form.querySelector("select").value;

    if (!propertyId && !propertyName) {
      UserInterface.handleErrors("please select a property");
      return;
    }

    const selectedMonth = document.querySelector("[data-month]").value;
    const selectedYear = document.querySelector("[data-year]");

    if (!selectedMonth && !selectedYear) {
      UserInterface.handleErrors(
        "Please select a month or year in the inputs below."
      );

      return;
    }

    if (selectedMonth) {
      UserInterface.readAndRenderRevenueStats(accessToken, form, selectedMonth);
    }

    if (selectedYear) {
      UserInterface.readAndRenderRevenueStats(accessToken, form, selectedYear);
    }
  });
})();
