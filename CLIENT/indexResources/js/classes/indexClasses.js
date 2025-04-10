class Store extends StoreUtilities {
  static async getSignUpOtp(user) {
    if (!user) return;

    UserInterface.openLoader(
      "Sending Email verification code",
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

    const addNewTenantToRoomRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup/generate/otp",
      requestOptions
    );

    const { message, signUpOtp, signUpToken, error } =
      await addNewTenantToRoomRequest.json();

    if (signUpToken || message || error)
      UserInterface.closeLoader("emailVerification");

    // console.log(error, newTenantRoomRentPayments);

    if (error) UserInterface.handleErrors(error);

    if (message && signUpOtp && signUpToken)
      return { message, signUpOtp, signUpToken };
  }
  static async verifySignUpOtp(otp, token) {
    if (!user) return;

    UserInterface.openLoader(
      "Sending Email verification code",
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

    const addNewTenantToRoomRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup/verify/otp",
      requestOptions
    );

    const { message, signUpToken, error } =
      await addNewTenantToRoomRequest.json();

    if (signUpToken || message || error)
      UserInterface.closeLoader("emailVerification");

    // console.log(error, newTenantRoomRentPayments);

    if (error) UserInterface.handleErrors(error);

    if (message && signUpToken) return { message, signUpToken };
  }
  static async signUp(token, { password, confirmPassword }) {
    if (!token || !password || !confirmPassword) return;

    UserInterface.openLoader("Completing sign up, please wait...", "signup");

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

    const addNewTenantToRoomRequest = await fetch(
      "http://localhost:4000/api/user/owner/signup",
      requestOptions
    );

    const { message, error } = await addNewTenantToRoomRequest.json();

    if (message || error) UserInterface.closeLoader("signup");

    // console.log(error, newTenantRoomRentPayments);

    if (error && !message) UserInterface.handleErrors(error);

    if (message && !error) return { message };
  }
}

class IUserInterface extends UserinterfaceUtilities {}
