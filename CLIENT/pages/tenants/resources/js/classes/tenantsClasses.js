class Store {}
class UserInterface {
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

  static clearTable(tableBody) {
    if (!tableBody) return;

    tableBody.querySelectorAll("tr").forEach((row) => row.remove());
  }
}
