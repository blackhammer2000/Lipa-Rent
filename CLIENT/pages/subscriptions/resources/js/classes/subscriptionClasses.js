class Store extends StoreUtilities {
  static async readUserSubscriptions(accessToken) {
    if (!accessToken) return;

    UserInterface.openLoader(
      "reading subscription reports",
      "readSubscrptions"
    );

    const requestOptions = {
      mode: "cors",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const readSubscriptionsRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/subscriptions",
      requestOptions
    );

    const { subscriptions, message, error } =
      await readSubscriptionsRequest.json();

    if (selectedRoomOnPropertyTenants || message || error)
      UserInterface.closeLoader("readSubscrptions");

    if (error) UserInterface.handleErrors(error);

    if (subscriptions) return { subscriptions, message };
  }
}
class UserInterface extends UserinterfaceUtilities {}
