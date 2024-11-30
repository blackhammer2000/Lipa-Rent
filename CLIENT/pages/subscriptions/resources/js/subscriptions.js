(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? localStorage.getItem("liparentAccessToken")
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const tableBody = document.querySelector("[data-table]");

  UserInterface.toggleTenantsNavButtonsStatus();
  UserInterface.toggleRentsNavButtonsStatus();

  UserInterface.readAndRenderSubscriptions(accessToken, tableBody);
})();
