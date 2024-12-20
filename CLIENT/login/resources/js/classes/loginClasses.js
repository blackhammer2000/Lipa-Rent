class Store extends StoreUtilities {
  static async login(loginInfo) {
    if (!loginInfo) return;

    UserInterface.openLoader("logging in", "login");

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

    const { loginToken, error } = await loginRequest.json();

    if (error || loginToken) UserInterface.closeLoader("login");

    if (error) UserInterface.handleErrors(error);

    return { loginToken1: loginToken };
  }

  static async sendOtp(loginToken1) {
    if (!loginToken1) return;

    UserInterface.openLoader("sending OTP", "sendOtp");

    const getOtpRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        user: true,
        "Content-Type": "application/json",
        logintoken: loginToken1,
      },
    };

    const getOtpRequest = await fetch(
      "http://localhost:4000/api/user/owner/get/otp",
      getOtpRequestOptions
    );

    const { loginToken, error, newLoginOtp } = await getOtpRequest.json();

    if (error || (loginToken && newLoginOtp))
      UserInterface.closeLoader("sendOtp");

    if (error) UserInterface.handleErrors(error);

    alert(newLoginOtp);

    return { loginToken2: loginToken };
  }

  static async loginAndSendOtp(loginInfo) {
    if (!loginInfo) return;

    const { loginToken1 } = await this.login(loginInfo);

    if (!loginToken1) return;

    const { loginToken2 } = await this.sendOtp(loginToken1);

    return { loginToken: loginToken2 };
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

    const { loginToken } = await Store.loginAndSendOtp({
      email,
      nationalID,
      password,
    });

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

      const { message, token } = await Store.verifyOtp(loginToken, otp);

      if (!message && !token) return;

      this.alertMessage(message, "success");
      localStorage.setItem("liparentAccessToken", token);
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

    this.handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton);

    sendCodeAgainButton.append(newResetCodeTimer);

    sendCodeAgainButton.addEventListener("click", () => {
      this.loginAndGetOtp(loginToken, loginForm);
      sendCodeAgainButton.disabled = "true";
      this.handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton);
    });

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
    document.querySelector(".home").classList.add("blur");
  }

  static handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton) {
    var counter = 10;
    newResetCodeTimer.innerText = `(${counter})`;

    var interval = setInterval(function () {
      if (counter === 0) {
        clearInterval(interval);
        sendCodeAgainButton.disabled = "false";
      }

      counter--;
      newResetCodeTimer.innerText = `(${counter})`;
    }, 1000);
  }
}
