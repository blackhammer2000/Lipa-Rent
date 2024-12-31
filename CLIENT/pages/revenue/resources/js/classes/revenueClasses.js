class Store extends StoreUtilities {
  static async preFetchPropertiesNames(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    UserInterface.openLoader("reading properties names", "readProperties");

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

    if (propertiesOwned || error) UserInterface.closeLoader("readProperties");

    if (error) UserInterface.handleErrors(error);

    if (propertiesOwned) return propertiesOwned;
  }
}

class UserInterface extends UserinterfaceUtilities {
  static async renderPropertySelectionOptions(accessToken) {
    const propertiesOwned = await Store.preFetchPropertiesNames(accessToken);

    if (!propertiesOwned) return;

    const optionsBody = document.querySelector("select");
    optionsBody.querySelectorAll("option").forEach((option) => option.remove());

    const fragment = document.createDocumentFragment();

    const placeHolderOption = document.createElement("option");
    placeHolderOption.value = "";
    placeHolderOption.innerText = "SELECT PROPERTY";
    fragment.append(placeHolderOption);

    for (const key in propertiesOwned) {
      const option = document.createElement("option");
      option.value = key;
      option.id = key;
      option.innerText = propertiesOwned[key].propertyName.toUpperCase();
      fragment.append(option);
    }

    optionsBody.append(fragment);
  }

  static renderStats() {}
}
