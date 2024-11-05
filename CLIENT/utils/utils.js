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
    if (!message) return;

    const hero = document.querySelector(".hero");
    const first = hero.querySelector(".first");

    const alertBox = document.createElement("div");
    alertBox.className = `loaderBox alert text-white alert-dark bg-dark}`;

    const loader = document.createElement("div");
    loader.className =
      "loader d-flex justify-content-between align-items-center p-2 font-weight-bold";

    const loaderText = document.createElement("div");
    const text = document.createTextNode(`${message}...`);
    loaderText.append(text);
    loader.append(loaderText);

    const loaderSpinner = document.createElement("div");
    loaderSpinner.className = "loaderSpinner ml-3";
    loader.append(loaderSpinner);

    alertBox.append(loader);

    hero.insertBefore(alertBox, first);

    // const loader = document.createElement("div");
    // loader.className =
    //   "loader text-white bg-secondary d-flex justify-content-between align-items-center p-2 font-weight-bold";

    // const loaderText = document.createElement("div");
    // const text = document.createTextNode(`${message}...`);
    // loaderText.append(text);
    // loader.append(loaderText);

    // const loaderSpinner = document.createElement("div");
    // loaderSpinner.className = "loaderSpinner ml-3";
    // loader.append(loaderSpinner);

    // const body = document.querySelector("body");
    // body.append(loader);
  }

  static closeLoader() {
    const loader = document.querySelector(".alert");
    loader.remove();
  }

  static alertMessage(message, className) {
    if (!message) return;

    const alertBoxActive = document.querySelector(".alert");
    const hero = document.querySelector(".hero");
    const first = hero.querySelector(".first");

    if (alertBoxActive) {
      alertBox.remove();
      if (alertTimeOut) clearTimeout(alertTimeOut);
    }

    const alertBox = document.createElement("div");
    alertBox.className = `alert text-white alert-${className} bg-${className}`;

    const text = document.createTextNode(message);
    alertBox.append(text);

    var alertTimeOut = setTimeout(() => {
      alertBox.remove();
    }, 2000);

    hero.insertBefore(alertBox, first);
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
