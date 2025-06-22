const {
  login,
} = require("../../../../../SERVER/routes/users/controllers/postControllers");

class Store extends StoreUtilities {
  static async login(loginInfo) {
    if (!loginInfo) return;

    const openLoader = UserInterface.openLoader("logging in", "login");

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/login`,
      loginRequestOptions
    );

    const { loginToken, error } = await loginRequest.json();

    if (error || loginToken) UserInterface.closeLoader("login");

    if (error) UserInterface.handleErrors(error);

    return { loginToken1: loginToken };
  }

  static async sendOtp(loginToken1) {
    if (!loginToken1) return;

    const openLoader = UserInterface.openLoader("sending OTP", "sendOtp");

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/get/otp`,
      getOtpRequestOptions
    );

    const { message, loginToken, error, newLoginOtp } =
      await getOtpRequest.json();

    if (message || error || (loginToken && newLoginOtp))
      UserInterface.closeLoader("sendOtp");

    if (error) UserInterface.handleErrors(error);

    if (newLoginOtp) alert(newLoginOtp);

    if (message && loginToken) return { message, loginToken2: loginToken };
  }

  static async loginAndSendOtp(loginInfo) {
    if (!loginInfo) return;

    const { loginToken1 } = await this.login(loginInfo);

    if (!loginToken1) return;

    const { message, loginToken2 } = await this.sendOtp(loginToken1);

    if (message && loginToken2) return { message, loginToken: loginToken2 };
  }

  static async verifyOtp(loginToken, otp) {
    if (!loginToken || !otp) return;

    const openLoader = UserInterface.openLoader(
      "verifying otp",
      "verifyingOtp"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/verify/otp`,
      verifyOTPRequestOptions
    );

    const { error, token, message } = await verifyOTPRequest.json();

    if (error || (token && message)) UserInterface.closeLoader("verifyingOtp");

    if (error || (!token && !message)) {
      UserInterface.handleErrors(error);
      return;
    }

    if (message && token) return { message, token };
  }

  static async verifyUserInfo(email, nationalId) {
    if (!email || !nationalId) return;

    const openLoader = UserInterface.openLoader(
      "verifying user info",
      "verifyingUserInfo"
    );

    if (!openLoader) return;

    const verifyUserInfoRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
      },
      body: JSON.stringify({ email, nationalId }),
    };

    const verifyUserInfoRequest = await fetch(
      `${serverDomain}/api/user/owner/verify/nationalid`,
      verifyUserInfoRequestOptions
    );

    const { error, token, message } = await verifyUserInfoRequest.json();

    if (error || (token && message))
      UserInterface.closeLoader("verifyingUserInfo");

    if (error || (!token && !message)) {
      UserInterface.handleErrors(error);
      return;
    }

    return { message, token };
  }

  static async generateForgotPasswordCode(token) {
    if (!token) return;

    const openLoader = UserInterface.openLoader("sending OTP", "sendingOtp");

    if (!openLoader) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token,
      },
    };

    const getForgotPasswordCodeRequest = await fetch(
      `${serverDomain}/api/user/owner/generate/forgotToken`,
      requestOptions
    );

    const { message, resetPasswordToken, error } =
      await getForgotPasswordCodeRequest.json();

    if (message || resetPasswordToken || error)
      UserInterface.closeLoader("sendingOtp");

    if (error) UserInterface.handleErrors(error);

    if (message && resetPasswordToken) return { message, resetPasswordToken };
  }

  static async verifyForgotPasswordCode(token, resetCode) {
    if (!token || !resetCode) return;

    const openLoader = UserInterface.openLoader(
      "verifying OTP",
      "verifyingCode"
    );

    if (!openLoader) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token,
        resettoken: resetCode,
      },
    };

    const getDeleteAccountCodeRequest = await fetch(
      `${serverDomain}/api/user/owner/verify/forgotToken`,
      requestOptions
    );

    const { message, error } = await getDeleteAccountCodeRequest.json();

    if (message || error) UserInterface.closeLoader("verifyingCode");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }

  static async editPassword(newPassword, confirmNewPassword, token, resetCode) {
    if (!newPassword || !confirmNewPassword || !token || !resetCode) return;

    const openLoader = UserInterface.openLoader(
      "changing password",
      "changingPassword"
    );

    if (!openLoader) return;

    const requestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token,
        resettoken: resetCode,
      },
      body: JSON.stringify({ newPassword, confirmNewPassword }),
    };

    const changePasswordRequest = await fetch(
      `${serverDomain}/api/user/owner/edit/forgotPassword`,
      requestOptions
    );

    const { message, error } = await changePasswordRequest.json();

    if (message || error) UserInterface.closeLoader("changingPassword");

    if (error) UserInterface.handleErrors(error);

    if (message) return { message };
  }
}
class UserInterface extends UserinterfaceUtilities {
  static async loginAndGetOtp(form) {
    if (!form) return;

    const email = form.querySelector("[data-email]").value;
    const nationalID = form.querySelector("[data-national-id]").value;
    const password = form.querySelector("[data-password]").value;

    const { message, loginToken } = await Store.loginAndSendOtp({
      email,
      nationalID,
      password,
    });

    if (!loginToken) return;

    if (message && loginToken) UserInterface.alertMessage(message, "success");

    this.createVerifyOtpModal(loginToken, form);
  }

  static createVerifyOtpModal(loginToken, loginForm) {
    if (!loginToken || !loginForm) return;

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
      this.handleVerifyOtp(e, loginToken);
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

  static async handleVerifyOtp(e, loginToken) {
    if (!e || !loginToken) return;

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
  }

  static createForgotPasswordVerifyUserInfoModal() {
    document.querySelector(".verifyIdModal")?.remove();

    const modal = document.createElement("div");
    modal.className =
      "verifyIdModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

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
      document.querySelector(".verifyIdModal").remove();
    });
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Verify Details";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "email";
    input.required = true;
    input.placeholder = "Email";
    formGroup1.append(input);

    const input2 = document.createElement("input");
    input2.className = "form-control mt-3";
    input2.type = "text";
    input2.required = true;
    input2.placeholder = "National ID";
    formGroup1.append(input2);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-success container";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      this.handleVerifyUserInfo(e);
    });

    formGroup2.append(verifyButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
    document.querySelector(".home").classList.add("blur");
  }

  static async handleVerifyUserInfo(e) {
    const formInputs =
      e.target.parentElement.previousElementSibling.querySelectorAll(
        "form input"
      );

    const email = formInputs[0].value;
    const nationalId = formInputs[1].value;

    if (!email || !nationalId) this.handleErrors("Provide all details");

    const verifyUserInfo = await Store.verifyUserInfo(email, nationalId);

    if (!verifyUserInfo.message || !verifyUserInfo.token) return;

    this.alertMessage(verifyUserInfo.message, "success");

    const { message, resetPasswordToken } =
      await Store.generateForgotPasswordCode(verifyUserInfo.token);

    if (!message) return;

    this.alertMessage(message, "success");

    if (
      message.includes("has already been sent") &&
      resetPasswordToken === "null"
    ) {
      document.querySelector(".verifyIdModal").remove();
      this.createForgotPasswordVerifyOtpModal(verifyUserInfo.token);
      return;
    }

    alert(resetPasswordToken);

    document.querySelector(".verifyIdModal").remove();
    this.createForgotPasswordVerifyOtpModal(verifyUserInfo.token);
    return;
  }

  static createForgotPasswordVerifyOtpModal(token) {
    if (!token) return;

    document.querySelector(".verifyForgotOtpModal")?.remove();

    const modal = document.createElement("div");
    modal.className =
      "verifyForgotOtpModal d-flex justify-content-center align-items-center border border-success py-2 w-25";

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
      document.querySelector(".verifyForgotOtpModal").remove();
    });
    legend.append(closeModalButton);
    fieldset.append(legend);

    const form = document.createElement("form");

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group";

    const label = document.createElement("label");
    label.className = "text-center";

    const labelText = document.createElement("h5");
    labelText.innerText = "Enter password reset OTP";
    label.append(labelText);
    formGroup1.append(label);

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    input.required = true;
    formGroup1.append(input);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group";

    const verifyButton = document.createElement("button");
    verifyButton.className = "btn btn-success";
    verifyButton.innerText = "Verify";
    verifyButton.addEventListener("click", async (e) => {
      e.preventDefault();
      this.handleVerifyForgotPasswordOtp(e, token);
    });

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-dark";
    sendCodeAgainButton.innerText = "Send code again";
    sendCodeAgainButton.disabled = "true";

    const newResetCodeTimer = document.createElement("span");

    this.handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton);

    sendCodeAgainButton.append(newResetCodeTimer);

    // sendCodeAgainButton.addEventListener("click", () => {
    //   this.loginAndGetOtp(loginToken, loginForm);
    //   sendCodeAgainButton.disabled = "true";
    //   this.handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton);
    // });

    formGroup2.append(verifyButton);
    formGroup2.append(sendCodeAgainButton);
    form.append(formGroup2);

    fieldset.append(form);
    modal.append(fieldset);

    document.querySelector("body").append(modal);
    document.querySelector(".home").classList.add("blur");
  }

  static async handleVerifyForgotPasswordOtp(e, token) {
    const otp =
      e.target.parentElement.previousElementSibling.querySelector(
        "form input"
      ).value;

    const { message } = await Store.verifyForgotPasswordCode(token, otp);

    if (!message) return;

    this.alertMessage(message, "success");
    document.querySelector(".verifyForgotOtpModal").remove();
    this.createChangePasswordModal(token, otp);
    return;
  }

  static createChangePasswordModal(token, resetCode) {
    if (!token || !resetCode) return;

    const modal = document.createElement("div");
    modal.className = "changePasswordModal border border-dark px-4 pb-4 pt-2";

    const closeModal = document.createElement("div");
    closeModal.className = "closeModal w-100 d-flex justify-content-end";
    const closeModalButton = document.createElement("button");
    closeModalButton.className = "btn btn-danger";
    closeModalButton.draggable = "true";
    closeModalButton.innerText = "X";
    closeModal.append(closeModalButton);
    closeModal.addEventListener("click", () => {
      document.querySelector(".changePasswordModal")?.remove();
      document.querySelector(".home")?.classList.remove("blur");
    });
    modal.append(closeModal);

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.className = "text-center";
    legend.innerText = "Password Reset";
    fieldset.append(legend);

    const form = document.createElement("form");
    form.className = "container text-center";

    const formGroup1 = document.createElement("div");
    formGroup1.className = "form-group d-flex align-items-center w-100";

    const newPasswordInput = document.createElement("input");
    newPasswordInput.type = "password";
    newPasswordInput.required = true;
    newPasswordInput.placeholder = "New password";
    newPasswordInput.className = "form-control w-100";

    const toggleShowAndHide1 = document.createElement("i");
    toggleShowAndHide1.className = "fa fa-eye ml-3";
    toggleShowAndHide1.addEventListener("click", (e) => {
      //   this.toggleShowAndHidePassword(e);
    });
    formGroup1.append(newPasswordInput);
    formGroup1.append(toggleShowAndHide1);
    form.append(formGroup1);

    const formGroup2 = document.createElement("div");
    formGroup2.className = "form-group d-flex align-items-center w-100";

    const confirmNewPasswordInput = document.createElement("input");
    confirmNewPasswordInput.type = "password";
    confirmNewPasswordInput.required = true;
    confirmNewPasswordInput.placeholder = "Confirm new password";
    confirmNewPasswordInput.className = "form-control w-100";

    const toggleShowAndHide2 = document.createElement("i");
    toggleShowAndHide2.className = "fa fa-eye ml-3";
    toggleShowAndHide2.addEventListener("click", (e) => {
      //   this.toggleShowAndHidePassword(e);
    });
    formGroup2.append(confirmNewPasswordInput);
    formGroup2.append(toggleShowAndHide2);
    form.append(formGroup2);

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-success w-50";
    submitButton.innerText = "Submit";
    form.append(submitButton);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this.changePassword(token, resetCode, form);
    });

    fieldset.append(form);
    modal.append(fieldset);
    document.querySelector("body").append(modal);
  }

  static async changePassword(token, resetCode, form) {
    if (!token || !resetCode || !form) return;

    if (!confirm("Proceed to change password?")) return;

    const newPassword = form.querySelectorAll("input")[0].value;
    const confirmNewPassword = form.querySelectorAll("input")[1].value;

    if (newPassword !== confirmNewPassword)
      this.handleErrors("Passwords do not match");

    const { message } = await Store.editPassword(
      newPassword,
      confirmNewPassword,
      token,
      resetCode
    );

    if (!message) return;

    this.alertMessage(message, "success");
    document.querySelector(".changePasswordModal")?.remove();
    document.querySelector(".home")?.classList.remove("blur");
  }
}
