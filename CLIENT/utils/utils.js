class StoreUtilities {}
class UserinterfaceUtilities {
  static toggleTenantsNavButtonsStatus() {
    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    const tenantsButton = document.querySelector("[data-nav-tenants]");

    if (selectedPropertyId) {
      tenantsButton.removeAttribute("disabled");
      return;
    }

    tenantsButton.setAttribute("disabled", "true");
  }

  static toggleRentsNavButtonsStatus() {
    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    const selectedRoomId = localStorage.getItem("liparentSelectedRoomId")
      ? localStorage.getItem("liparentSelectedRoomId")
      : null;

    const rentsButton = document.querySelector("[data-nav-rents]");

    if (selectedPropertyId && selectedRoomId) {
      rentsButton.removeAttribute("disabled");
      return;
    }

    rentsButton.setAttribute("disabled", "true");
  }

  static createLoaderBox(message, loaderType) {
    if (!message || !loaderType) return;

    const loaderBox = document.createElement("div");
    loaderBox.className = `loaderBox  bg-secondary text-white alert text-white ${loaderType} }`;

    const loader = document.createElement("div");
    loader.className =
      "loader d-flex justify-content-around align-items-center p-2 font-weight-bold";

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

    const loaderContainerActive = document.querySelector(".loaderContainer");
    const loaderBox = this.createLoaderBox(message, loaderType);

    if (loaderContainerActive) {
      loaderContainerActive.append(loaderBox);
      return;
    }

    const loaderContainer = document.createElement("div");
    loaderContainer.className =
      "loaderContainer d-flex justify-content-center align-items-center container bg-transparent";

    loaderContainer.append(loaderBox);

    document.querySelector("body").append(loaderContainer);
  }

  static closeLoader(loaderType) {
    const loaderContainer = document.querySelector(".loaderContainer");
    loaderContainer.querySelector(`.${loaderType}`)?.remove();

    if (!loaderContainer.children) loaderContainer.remove();
  }

  static alertMessage(message, className) {
    if (!message) return;

    const alertBoxActive = document.querySelector(".alertModal");

    if (alertBoxActive) {
      alertBoxActive.remove();
      if (alertTimeOut) clearTimeout(alertTimeOut);
    }

    const alert = document.createElement("div");
    alert.className =
      "alertModal d-flex justify-content-center align-items-center container bg-transparent";
    const alertBox = document.createElement("div");
    alertBox.className = `alertBox text-center alert w-50 text-white alert-${className} bg-${className}`;

    const text = document.createTextNode(message);
    alertBox.append(text);
    alert.append(alertBox);

    var alertTimeOut = setTimeout(() => {
      alertBox.remove();
    }, 1500);

    document.querySelector("body").append(alert);
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
    localStorage.removeItem("liparentLoginToken");
    localStorage.removeItem("liparentAccessToken");
    localStorage.removeItem("liparentSelectedPropertyId");
    localStorage.removeItem("liparentSelectedPropertyName");
    localStorage.removeItem("liparentSelectedRoomId");
    localStorage.removeItem("liparentSelectedRoomNumber");
    localStorage.removeItem("liparentSelectedTenantId");
    localStorage.removeItem("liparentSelectedTenantName");
  }

  static createDropdownMenu() {
    this.deleteDropdownMenu();

    const documentBody = document.querySelector(".profile");

    const dropdown = document.createElement("div");
    dropdown.className = "userDropdown dropdown position-absolute";

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.className = "d-flex flex-column dropdown-menu list-unstyled";

    const fragment = document.createDocumentFragment();

    const isDash = document.querySelector(".dashboard") ? true : false;

    const profile = document.createElement("li");
    profile.className = "dropdown-item";
    const profileLink = document.createElement("a");
    profileLink.href = `${isDash ? "../pages" : ".."}/profile/profile.html`;
    profileLink.innerText = "My Profile";
    profile.append(profileLink);
    fragment.append(profile);

    const subscriptions = document.createElement("li");
    subscriptions.className = "dropdown-item";
    const subscriptionsLink = document.createElement("a");
    subscriptionsLink.href = `${
      isDash ? "../pages" : ".."
    }/subscriptions/subscriptions.html`;
    subscriptionsLink.innerText = "My Subscriptions";
    subscriptions.append(subscriptionsLink);
    fragment.append(subscriptions);

    dropdownMenu.append(fragment);
    dropdown.append(dropdownMenu);
    documentBody.append(dropdown);
  }

  static deleteDropdownMenu() {
    document.querySelector(".userDropdown")?.remove();
  }
}

const dropdownMenuButton = document.querySelector(".profile");
dropdownMenuButton?.addEventListener("click", () => {
  document.querySelector(".userDropdown")
    ? UserinterfaceUtilities.deleteDropdownMenu()
    : UserinterfaceUtilities.createDropdownMenu();
});

const logoutButton = document.querySelector("[data-logout]");
logoutButton?.addEventListener("click", () =>
  UserinterfaceUtilities.handleLogout()
);

const serverDomain = "http://localhost:4000";
