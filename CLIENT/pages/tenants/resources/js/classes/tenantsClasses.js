class Store extends StoreUtilities {
  static async readAllTenantsForRoomInProperty(
    propertyId,
    roomId,
    accessToken
  ) {
    if (!propertyId || !roomId || !accessToken) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ propertyId, roomId }),
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/property/room/tenants",
      requestOptions
    );

    const res = await readRoomTenantsRequest.json();

    console.log(res);
  }
}
class UserInterface extends UserinterfaceUtilities {
  static renderTenants(tenants, accessToken, tableBody) {
    if (!accessToken || !tableBody) return;

    if (!tenants) {
      alert("No tenants to show, please add tenants to the property.");
      return;
    }
    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    for (const key in tenants) {
      const roomRow = this.createRoomRow(
        tenants[key],
        tableNumber,
        accessToken,
        tableBody
      );
      fragment.append(roomRow);
      tableNumber++;
    }

    tableBody.append(fragment);
  }

  static createTenantRow(tenant, index, accessToken, tableBody) {}
}
