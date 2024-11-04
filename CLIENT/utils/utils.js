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

  static openLoader(message) {
    const loader = document.querySelector("[ data-loader]");
    const loaderText = loader.querySelector("[ data-loaderText]");

    loaderText.innerText = `${message}...`;
    loader.classList.remove("hide");
    loader.classList.add("d-flex");
  }

  static closeLoader() {
    const loader = document.querySelector("[ data-loader]");
    const loaderText = loader.querySelector("[ data-loaderText]");

    loaderText.innerText = "";
    loader.classList.add("hide");
    loader.classList.remove("d-flex");
  }

  static handleErrors(error) {
    if (!error) return;

    alert(error);

    if (error?.toLowerCase() === ("session expired" || "jwt malformed"))
      this.handleLogout();

    return;
  }

  static handleLogout() {
    this.clearLocalStorage();
    location.assign("/CLIENT/login/login.html");
  }

  static clearTable(tableBody) {
    tableBody.querySelectorAll("tr").forEach((row) => row.remove());
  }

  static clearFormInputs(form) {
    form.querySelectorAll("input").forEach((input) => (input.value = ""));
  }

  static clearLocalStorage() {
    localStorage.removeItem("liparentAccessToken");
    localStorage.removeItem("liparentProperties");
    localStorage.removeItem("liparentSelectedPropertyId");
    localStorage.removeItem("liparentSelectedRoomId");
  }
}
