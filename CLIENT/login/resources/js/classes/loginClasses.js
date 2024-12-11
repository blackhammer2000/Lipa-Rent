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

  static async verifyOtp(loginToken) {
    if (!loginToken) return;

    UserInterface.openLoader("verifying otp", "verifyingOtp");

    const verifyOTPRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        user: true,
        "Content-Type": "application/json",
        loginToken,
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

    UserInterface.createVerifyOtpModal(loginToken);
  }

  static async verifyOtp(loginToken) {
    if (!loginToken) return;

    const { message, token } = await Store.verifyOtp(loginToken);

    if (!message && !token) return;

    UserInterface.alertMessage(message, "success");
    localStorage.setItem("liparentAccessToken", token);
    location.assign("/CLIENT/dashboard/dashboard.html");
    return;
  }

  static createVerifyOtpModal(loginToken) {}
}
