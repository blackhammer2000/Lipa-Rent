const signUpForm = document.querySelector("form");

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  UserInterface.sendSignUpOtp(signUpForm);
});
