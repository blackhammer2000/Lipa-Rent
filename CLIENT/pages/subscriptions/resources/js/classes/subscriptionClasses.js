class Store extends StoreUtilities {
  static async readUserSubscriptions(accessToken) {
    if (!accessToken) return;

    const openLoader = UserInterface.openLoader(
      "reading subscription reports",
      "readSubscriptions"
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
      `${serverDomain}/api/user/owner/read/subscriptions`,
      requestOptions
    );

    const { subscriptions, message, error } =
      await readSubscriptionsRequest.json();

    if (subscriptions || message || error)
      UserInterface.closeLoader("readSubscriptions");

    if (error) UserInterface.handleErrors(error);

    if (subscriptions) return { subscriptions, message };
  }
}
class UserInterface extends UserinterfaceUtilities {
  static createSubscriptionRow(subscription, index) {
    if (!subscription) return;

    const {
      subscription_id,
      currentSubscription: { start, expires },
    } = subscription;

    const row = document.createElement("tr");

    const tablenumberCell = document.createElement("td");
    const tablenumberCellText = document.createTextNode(index + 1);
    tablenumberCell.append(tablenumberCellText);
    row.append(tablenumberCell);

    const subscriptionIdCell = document.createElement("td");
    const subscriptionIdCellText = document.createTextNode(subscription_id);
    subscriptionIdCell.append(subscriptionIdCellText);
    row.append(subscriptionIdCell);

    const subscriptionStartDateCell = document.createElement("td");
    const subscriptionStartDateCellText = document.createTextNode(
      new Date(start).toLocaleDateString()
    );
    subscriptionStartDateCell.append(subscriptionStartDateCellText);
    row.append(subscriptionStartDateCell);

    const subscriptionExpiresDateCell = document.createElement("td");
    const subscriptionExpiresDateCellText = document.createTextNode(
      new Date(expires).toLocaleDateString()
    );
    subscriptionExpiresDateCell.append(subscriptionExpiresDateCellText);
    row.append(subscriptionExpiresDateCell);

    const subscriptionStatusCell = document.createElement("td");
    subscriptionStatusCell.classList.add(
      Date.now() < expires ? "text-success" : "text-danger"
    );
    const subscriptionStatusCellText = document.createTextNode(
      Date.now() < expires ? "Active" : "Expired"
    );
    subscriptionStatusCell.append(subscriptionStatusCellText);
    row.append(subscriptionStatusCell);

    return row;
  }

  static renderSubscriptions(subscriptions, tableBody) {
    if (!subscriptions || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();

    subscriptions.reverse().forEach((subscription, index) => {
      const subscriptionRow = this.createSubscriptionRow(subscription, index);
      fragment.append(subscriptionRow);
    });

    tableBody.append(fragment);
  }

  static async readAndRenderSubscriptions(accessToken, tableBody) {
    if (!accessToken || !tableBody) return;

    const { subscriptions, message } = await Store.readUserSubscriptions(
      accessToken
    );

    if (!subscriptions.length)
      this.handleErrors("No subscription reports found.");

    this.alertMessage(message, "success");
    this.updateTableDescription();
    this.renderSubscriptions(subscriptions, tableBody);
  }

  static updateTableDescription() {
    document.querySelector("[data-table-description]").innerText =
      "SUBSCRIPTION REPORTS";
  }
}
