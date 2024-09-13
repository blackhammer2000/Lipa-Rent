class Store {
  static async readAllPropertiesOwned(accessToken) {
    if (!accessToken) location?.assign("../../../login/login.html");

    const requestOptions = {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        token: accessToken,
        user: true,
      },
    };

    const getAllPropertiesData = await fetch(
      "http://localhost:4000/api/user/landlord/read/allProperties",
      requestOptions
    );

    const { allProperties, error } = await getAllPropertiesData?.json();

    if (error && error?.toLowerCase() !== "session expired") {
      // UserInterface?.showALertMessage(error, "danger");
      alert(error);

      return;
    }

    if (error && error?.toLowerCase() === "session expired")
      location?.assign("../TEXTBOOK LOG IN/textbooklogin.html");

    if (allProperties) return allProperties;
  }
}

class UserInterface {
  static renderProperties() {}
}

(async function () {
  const properties = await Store.readAllPropertiesOwned();

  console.log(properties);
})();
