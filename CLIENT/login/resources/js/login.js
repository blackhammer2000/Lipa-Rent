const loginForm = document.querySelector("form");

UserInterface.clearLocalStorage();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  UserInterface.loginAndGetOtp(loginForm);
});

const forgotPassword = document.querySelector("[data-forgot-password]");

forgotPassword.addEventListener("click", async (e) => {});
