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

  static createLoaderBox(message, loaderType) {
    if (!message) return;

    const loaderBox = document.createElement("div");
    loaderBox.className = `loaderBox alert text-white ${loaderType} }`;

    const loader = document.createElement("div");
    loader.className =
      "loader bg-dark d-flex justify-content-around align-items-center p-2 font-weight-bold";

    const loaderText = document.createElement("div");
    const text = document.createTextNode(`Please wait, ${message}...`);
    loaderText.append(text);
    loader.append(loaderText);

    const loaderSpinner = document.createElement("div");
    loaderSpinner.className = "loaderSpinner ml-3";
    loader.append(loaderSpinner);

    loaderBox.append(loader);

    return loaderBox;
  }

  static openLoader(message, loaderType) {
    if (!message) return;

    const hero = document.querySelector(".hero");
    const first = hero.querySelector(".first");

    const loaderContainerActive = hero.querySelector(".loaderContainer");
    const loaderBox = this.createLoaderBox(message, loaderType);

    if (loaderContainerActive) {
      loaderContainerActive.append(loaderBox);
      return;
    }

    const loaderContainer = document.createElement("div");
    loaderContainer.className =
      "loaderContainer d-flex justify-content-center align-items-center container";

    loaderContainer.append(loaderBox);

    hero.insertBefore(loaderContainer, first);
  }

  static closeLoader(loaderType) {
    const loaderContainer = document.querySelector(".loaderContainer");
    loaderContainer.querySelector(`.${loaderType}`)?.remove();

    if (!loaderContainer.children) loaderContainer.remove();
  }

  static alertMessage(message, className) {
    if (!message) return;

    const alertBoxActive = document.querySelector(".alert");
    const hero = document.querySelector(".hero");
    const first = hero.querySelector(".first");

    if (alertBoxActive) {
      alertBoxActive.remove();
      if (alertTimeOut) clearTimeout(alertTimeOut);
    }

    const alert = document.createElement("div");
    alert.className =
      "d-flex justify-content-center align-items-center container";
    const alertBox = document.createElement("div");
    alertBox.className = `alertBox text-center alert w-50 text-white alert-${className} bg-${className}`;

    const text = document.createTextNode(message);
    alertBox.append(text);
    alert.append(alertBox);

    var alertTimeOut = setTimeout(() => {
      alertBox.remove();
    }, 1500);

    hero.insertBefore(alert, first);
  }

  static handleErrors(error) {
    if (!error) return;

    this.alertMessage(error, "danger");

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
    localStorage.removeItem("liparentSelectedPropertyId");
    localStorage.removeItem("liparentSelectedPropertyName");
    localStorage.removeItem("liparentSelectedRoomId");
    localStorage.removeItem("liparentSelectedRoomNumber");
    localStorage.removeItem("liparentSelectedTenantId");
    localStorage.removeItem("liparentSelectedTenantName");
  }
}

const logoutButton = document.querySelector("[data-logout]");
logoutButton.addEventListener("click", () =>
  UserinterfaceUtilities.handleLogout()
);
