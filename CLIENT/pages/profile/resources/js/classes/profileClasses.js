class Store extends StoreUtilities {
  static async readOwnerDetails(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader("reading owner details", "readOwner");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/owner",
      requestOptions
    );

    const { owner, error } = await readRoomTenantsRequest.json();

    if (owner || error) UserInterface.closeLoader("readOwner");

    if (error) UserInterface.handleErrors(error);

    if (owner) return { owner };
  }

  static async editOwnerDetails(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader("editing owner details", "editOwner");

    const requestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify(editedOwnerDetails),
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/owner",
      requestOptions
    );

    const { owner, error } = await readRoomTenantsRequest.json();

    if (owner || error) UserInterface.closeLoader("readUser");

    if (error) UserInterface.handleErrors(error);

    if (owner) return { owner };
  }
}

class UserInterface extends UserinterfaceUtilities {}
