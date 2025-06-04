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
    const propertyName =
      form.querySelector("select").children[propertyId].innerText;

    if (!propertyId && !propertyName) {
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
      UserInterface.readAndRenderRevenueStats(accessToken, form, selectedMonth);
      return;
    }

    if (!selectedMonth && selectedYear) {
      UserInterface.readAndRenderRevenueStats(accessToken, form, selectedYear);
      return;
    }
  });
})();
