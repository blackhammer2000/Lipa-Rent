const loginForm = document.querySelector("form");

UserinterfaceUtilities.clearLocalStorage();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  UserInterface.loginAndGetOtp(loginForm);
});
