(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? localStorage.getItem("liparentAccessToken")
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const homeSection = document.querySelector(".home");

  UserInterface.toggleTenantsNavButtonsStatus();
  UserInterface.toggleRentsNavButtonsStatus();

  const changeAccountDetails = document.querySelector("[data-edit-account]");
  changeAccountDetails.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.populateEditOwnerDetailsForm(accessToken);
    homeSection.classList.add("blur");
  });
})();
