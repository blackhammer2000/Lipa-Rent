class Store extends StoreUtilities {
  static async login(loginInfo) {
    if (!loginInfo) return;

    UserInterface.openLoader("Logging in", "login");

    const loginRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        user: true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...loginInfo }),
    };

    const loginRequest = await fetch(
      "http://localhost:4000/api/user/owner/login",
      loginRequestOptions
    );

    const loginRequestData = await loginRequest.json();

    if (loginRequestData.error && !loginRequestData.loginToken) {
      UserInterface.closeLoader("login");
      UserInterface.handleErrors(loginRequestData2.error);
      return;
    }

    const loginRequestOptions2 = {
      mode: "cors",
      method: "POST",
      headers: {
        user: true,
        "Content-Type": "application/json",
        logintoken: loginRequestData.loginToken,
      },
    };

    const loginRequest2 = await fetch(
      "http://localhost:4000/api/user/owner/get/otp",
      loginRequestOptions2
    );

    const loginRequestData2 = await loginRequest2.json();

    if (loginRequestData2.error || loginRequestData2.loginToken)
      UserInterface.closeLoader("login");

    if (loginRequestData2.error || !loginRequestData2.loginToken) {
      UserInterface.handleErrors(loginRequestData2.error);
      return;
    }

    alert(loginRequestData2.newLoginOtp);

    return { loginToken: loginRequestData2.loginToken };
  }

  static async verifyOtp(loginToken, otp) {
    if (!loginToken || !otp) return;

    UserInterface.openLoader("verifying otp", "verifyingOtp");

    const verifyOTPRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        loginToken,
        otp,
      },
    };

    const verifyOTPRequest = await fetch(
      "http://localhost:4000/api/user/owner/verify/otp",
      verifyOTPRequestOptions
    );

    const { error, token, message } = await verifyOTPRequest.json();

    if (error || (token && message)) UserInterface.closeLoader("verifyingOtp");

    if (error || (!token && !message)) {
      UserInterface.handleErrors(error);
      return;
    }

    return { message, token };
  }
}
class UserInterface extends UserinterfaceUtilities {
  static async loginAndGetOtp(form) {
    if (!form) return;

    const email = form.querySelector("[data-email]").value;
    const nationalID = form.querySelector("[data-national-id]").value;
    const password = form.querySelector("[data-password]").value;

    const { loginToken } = await Store.login({ email, nationalID, password });

    if (!loginToken) return;

    this.createVerifyOtpModal(loginToken, form);
  }

  static createVerifyOtpModal(loginToken, loginForm) {
    if (!loginToken) return;

    document.querySelector(".enterOtpModal")?.remove();

    const modal = document.createElement("div");
    modal.className =
      "enterOtpModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

    const fieldset = document.createElement("fieldset");
    fieldset.className =
      "container-fluid d-flex flex-column justify-content-center align-items-center";

    const legend = document.createElement("legend");
    legend.className = "container-fluid d-flex justify-content-end";

    const closeModalButton = document.createElement("button");
    closeModalButton.draggable = "true";
    closeModalButton.className = "closeResetModal btn btn-danger";
    closeModalButton.innerText = "X";
    closeModalButton.addEventListener("click", () => {
      document.querySelector(".home").classList.remove("blur");
      document.querySelector(".enterOtpModal").remove();
    });
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Enter login OTP";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    formGroup1.append(input);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-success";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      const otp =
        e.target.parentElement.previousElementSibling.querySelector(
          "form input"
        ).value;

      const verifyOtp = await Store.verifyOtp(loginToken, otp);

      if (!verifyOtp.message && !verifyOtp.token) return;

      this.alertMessage(verifyOtp.JSONmessage, "success");
      localStorage.setItem("liparentAccessToken", verifyOtp.token);
      document.querySelector(".enterOtpModal").remove();
      document.querySelector(".home").classList.remove("blur");
      location.assign("/CLIENT/dashboard/dashboard.html");
      return;
    });

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-dark";
    sendCodeAgainButton.innerText = "Send code again";
    sendCodeAgainButton.disabled = "true";

    const newResetCodeTimer = document.createElement("span");
    let counter = 10;
    newResetCodeTimer.innerText = counter;

    var interval = setInterval(() => {
      if (counter < 1) {
        clearInterval(interval);
        sendCodeAgainButton.disabled = "false";
      }

      counter--;
      newResetCodeTimer.innerText = `(${counter})`;
    }, 1000);

    sendCodeAgainButton.append(newResetCodeTimer);
    sendCodeAgainButton.addEventListener("click", () => {
      this.loginAndGetOtp(loginToken, loginForm);
      sendCodeAgainButton.disabled = "true";
      setInterval(interval);
    });

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
    document.querySelector(".home").classList.add("blur");
  }
}
