class Store {
  static async readAllPropertiesOwned(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    const requestOptions = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        token: accessToken,
        user: true,
      },
    };

    const getAllPropertiesData = await fetch(
      "http://localhost:4000/api/user/owner/read/properties",
      requestOptions
    );

    const { propertiesOwned, error } = await getAllPropertiesData?.json();

    if (error && error?.toLowerCase() !== "session expired") {
      alert(error);
      return;
    }

    if (
      error &&
      error?.toLowerCase() === ("session expired" || "jwt malformed")
    )
      location?.assign("/CLIENT/login/login.html");

    if (propertiesOwned) return propertiesOwned;
  }
}

class UserInterface {
  static renderProperties() {}
}
