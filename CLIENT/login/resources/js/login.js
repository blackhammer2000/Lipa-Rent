const loginForm = document.querySelector("form");

UserInterface.clearLocalStorage();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  UserInterface.loginAndGetOtp(loginForm);
});
