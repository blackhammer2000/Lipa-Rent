const signUpForm = document.querySelector("form");

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  UserInterface.sendSignUpOtp(signUpForm);
});

const otpForm = document.querySelector("[data-otp-form]");

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("signUpToken") || null;

  const password = signUpForm.querySelector("[data-password]").value;
  const confirmPassword = signUpForm.querySelector(
    "[data-confirm-password]"
  ).value;

  const user = { password, confirmPassword };

  if (!token) return;
  UserInterface.verifySignUpOtpAndCompleteSignUp(otpForm, token, user);
});
