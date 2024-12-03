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

  const editOwnerDetailsModalButton = document.querySelector(
    "[data-close-edit-modal]"
  );
  editOwnerDetailsModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
    homeSection.classList.remove("blur");
  });
})();
