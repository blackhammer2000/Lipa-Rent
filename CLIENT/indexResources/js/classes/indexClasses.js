class Store extends StoreUtilities {
  static async sendSignUpOtp(user) {
    if (!user) return;

    UserInterface.openLoader(
      "Please wait, sending verification code to your email...",
      "emailVerification"
    );

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
      },
      body: JSON.stringify({ user }),
    };

    const getSignUpOtpRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup/generate/otp",
      requestOptions
    );

    const { message, signUpOtp, signUpToken, error } =
      await getSignUpOtpRequest.json();

    if (signUpToken || message || error)
      UserInterface.closeLoader("emailVerification");

    if (error) UserInterface.handleErrors(error);

    if (message && signUpOtp && signUpToken)
      return { message, signUpOtp, signUpToken };
  }

  static async verifySignUpOtp(otp, token) {
    if (!otp || !token) return;

    UserInterface.openLoader(
      "Please wait, verifying your email...",
      "emailVerification"
    );

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token,
        otp,
      },
    };

    const verifySignUpOtpRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup/verify/otp",
      requestOptions
    );

    const { message, signUpToken, error } = await verifySignUpOtpRequest.json();

    if (signUpToken || message || error)
      UserInterface.closeLoader("emailVerification");

    if (error) UserInterface.handleErrors(error);

    if (message && signUpToken) return { message, signUpToken };
  }

  static async signUp(token, { password, confirmPassword }) {
    if (!token || !password || !confirmPassword) return;

    UserInterface.openLoader("Please wait, completing sign up...", "signup");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token,
      },
      body: JSON.stringify({ password, confirmPassword }),
    };

    const signUpRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup",
      requestOptions
    );

    const { message, error } = await signUpRequest.json();

    if (message || error) UserInterface.closeLoader("signup");

    if (error && !message) UserInterface.handleErrors(error);

    if (message && !error) return { message2: message };
  }
}

class UserInterface extends UserinterfaceUtilities {
  static createVerifyOtpForm(token, user) {
    if (!token || !user) return;

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
    labelText.innerText = "Enter Sign Up OTP";
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
    verifyButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (!input.value) return;
      this.verifySignUpOtpAndCompleteSignUp(input.value, token, user);
    });

    const sendCodeAgainButton = document.createElement("button");
    sendCodeAgainButton.className = "ml-2 btn btn-dark";
    sendCodeAgainButton.innerText = "Send code again";
    sendCodeAgainButton.disabled = "true";

    // const newResetCodeTimer = document.createElement("span");

    // this.handleSendCodeAgainTimer(newResetCodeTimer, sendCodeAgainButton);

    // sendCodeAgainButton.append(newResetCodeTimer);

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

  static async sendSignUpOtp(form) {
    if (!form) return;

    const name = signUpForm.querySelector("[data-name]").value;
    const nationalID = signUpForm.querySelector("[data-national-id]").value;
    const email = signUpForm.querySelector("[data-email]").value;
    const phone = signUpForm.querySelector("[data-phone]").value;
    const password = signUpForm.querySelector("[data-password]").value;
    const confirmPassword = signUpForm.querySelector(
      "[data-confirm-password]"
    ).value;

    const user = { name, nationalID, email, phone, password, confirmPassword };

    const { message, signUpOtp, signUpToken } = await Store.sendSignUpOtp(user);

    if (signUpOtp) alert(signUpOtp);

    if (message) {
      UserInterface.alertMessage(message, "success");
    }

    this.createVerifyOtpForm(signUpToken, { password, confirmPassword });
  }

  static async verifySignUpOtpAndCompleteSignUp(otp, token, user) {
    if (!otp || !token || !user) return;

    const { message, signUpToken } = await Store.verifySignUpOtp(otp, token);

    if (message) {
      UserInterface.alertMessage(message, "success");
      return;
    }

    const { message2 } = await Store.signUp(signUpToken, user);

    if (message2) {
      UserInterface.alertMessage(message2, "success");
      return;
    }

    localStorage.removeItem("signUpToken");
    document.querySelector(".enterOtpModal").remove();

    location.assign("/CLIENT/login/login.html");
  }
}
