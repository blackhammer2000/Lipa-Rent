(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? localStorage.getItem("liparentAccessToken")
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  UserInterface.renderPropertySelectionOptions(accessToken);

  const form = document.querySelector("[data-select-property]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    UserInterface.readAndRenderRevenueStats(accessToken, form, "JANUARY");
  });
})();
