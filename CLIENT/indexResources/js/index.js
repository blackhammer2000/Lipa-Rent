const signUpForm = document.querySelector("form");

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = signUpForm.querySelector("[data-name]").trim();
  const nationalID = signUpForm.querySelector("[data-national-id]");
  const email = signUpForm.querySelector("[data-email]");
  const phone = signUpForm.querySelector("[data-phone]");
  const password = signUpForm.querySelector("[data-password]");
  const confirmPassword = signUpForm.querySelector("[data-confirm-password]");

  const signUpRequestOptions = {
    mode: "cors",
    method: "POST",
    headers: {
      user: true,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      nationalID,
      email,
      phone,
      password,
      confirmPassword,
    }),
  };

  const signUpRequest = await fetch(
    "http://localhost:4000/api/user/owner/signup",
    signUpRequestOptions
  );

  const { error, message } = await signUpRequest.json();

  if (error) {
    alert(error);
    return;
  }

  if (message) {
    alert(message);
    return;
  }
});
