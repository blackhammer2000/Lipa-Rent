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
    if (!user) return;

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
  static async sendSignUpOtp(form) {
    if (!form) return;

    const name = signUpForm.querySelector("[data-name]").value.toUppercase();
    const nationalID = signUpForm.querySelector("[data-national-id]").value;
    const email = signUpForm.querySelector("[data-email]").value;
    const phone = signUpForm.querySelector("[data-phone]").value;
    const password = signUpForm.querySelector("[data-password]").value;
    const confirmPassword = signUpForm.querySelector(
      "[data-confirm-password]"
    ).value;

    const user = { name, nationalID, email, phone, password, confirmPassword };

    const { message, signUpOtp, signUpToken } = await Store.sendSignUpOtp(user);

    if (message) {
      UserInterface.alertMessage(message, "success");
      return;
    }

    alert(signUpOtp);
    localStorage.setItem("signUpToken", signUpToken);
  }

  static async verifySignUpOtpAndCompleteSignUp(otpForm, token, user) {
    if (!otpForm || !token || !user) return;
    const otp = otpForm.querySelector("[data-otp]").value;

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
  }
}
