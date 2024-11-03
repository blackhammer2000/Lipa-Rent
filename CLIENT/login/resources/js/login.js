const loginForm = document.querySelector("form");

UserinterfaceUtilities.clearLocalStorage();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginForm.querySelector("[data-email]").value;
  const nationalID = loginForm.querySelector("[data-national-id]").value;
  const password = loginForm.querySelector("[data-password]").value;

  const loginRequestOptions = {
    mode: "cors",
    method: "POST",
    headers: {
      user: true,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, nationalID, password }),
  };

  const loginRequest = await fetch(
    "http://localhost:4000/api/user/owner/login",
    loginRequestOptions
  );

  const { error, message, token } = await loginRequest.json();

  if (error) {
    alert(error);
    return;
  }

  if (message && token) {
    alert(message);
    localStorage.setItem("liparentAccessToken", JSON.stringify(token));
    location.assign("/CLIENT/dashboard/dashboard.html");
    return;
  }
});
