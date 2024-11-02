class StoreUtilities {}
class UserinterfaceUtilities {
  static setNavButtonsStatus(selectedPropertyId) {
    const tenantsButton = document.querySelector("[data-nav-tenants]");
    const rentsButton = document.querySelector("[data-nav-rents]");

    if (selectedPropertyId) {
      tenantsButton.removeAttribute("disabled");
      rentsButton.removeAttribute("disabled");
    }

    tenantsButton.setAttribute("disabled", "true");
    rentsButton.setAttribute("disabled", "true");
  }

  static handleErrors(error) {
    if (!error) return;

    alert(error);

    if (error?.toLowerCase() === ("session expired" || "jwt malformed"))
      this.handleLogout();

    return;
  }

  static handleLogout() {
    localStorage.removeItem("liparentAccessToken");
    localStorage.removeItem("liparentProperties");
    localStorage.removeItem("liparentSelectedPropertyId");
    location.assign("/CLIENT/login/login.html");
  }

  static clearTable(tableBody) {
    tableBody.querySelectorAll("tr").forEach((row) => row.remove());
  }

  static clearFormInputs(form) {
    form.querySelectorAll("input").forEach((input) => (input.value = ""));
  }
}
