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

    const { selectedRoominPropertyTenants } =
      await readRoomTenantsRequest.json();

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

  static createTenantRow(tenant, index, accessToken, tableBody) {
    if (!tenant || !index || !accessToken || !tableBody) return;

    const { tenantID, tenantName, tenantNationalID, tenantPhone } = tenant;

    const row = document.createElement("tr");

    const tablenumberCell = document.createElement("td");
    const tablenumberCellText = document.createTextNode(index);
    tablenumberCell.append(tablenumberCellText);
    row.append(tablenumberCell);

    const tabTenantIdCell = document.createElement("td");
    const tableTenantIdCellText = document.createTextNode(tenantID);
    tabTenantIdCell.append(tableTenantIdCellText);
    row.append(tabTenantIdCell);

    const tableTenantNameCell = document.createElement("td");
    const tableTenantNameCellText = document.createTextNode(tenantName);
    tableTenantNameCell.append(tableTenantNameCellText);
    row.append(tableTenantNameCell);

    const tableTenantNationalIDCell = document.createElement("td");
    const tableTenantNationalIDCellText =
      document.createTextNode(tenantNationalID);
    tableTenantNationalIDCell.append(tableTenantNationalIDCellText);
    row.append(tableTenantNationalIDCell);

    const tableTenantNumberCell = document.createElement("td");
    const tableTenantNumberCellText = document.createTextNode(tenantPhone);
    tableTenantNumberCell.append(tableTenantNumberCellText);
    row.append(tableTenantNumberCell);

    const rowCTAbuttonCell = document.createElement("td");

    const editButtonCell = document.createElement("button");
    editButtonCell.className = "btn btn-primary mr-2 edit";
    const editButtonCellText = document.createTextNode("Edit");
    editButtonCell.append(editButtonCellText);
    // editButtonCell.addEventListener("click", (e) => {
    //   this.populateEditRoomForm(e);
    // });
    rowCTAbuttonCell.append(editButtonCell);

    const deleteButtonCell = document.createElement("button");
    deleteButtonCell.className = "btn btn-danger ml-2 delete";
    const deleteButtonCellText = document.createTextNode("Delete");
    deleteButtonCell.append(deleteButtonCellText);
    // deleteButtonCell.addEventListener("click", (e) => {
    //   this.deleteRoomAndRender(e, accessToken, tableBody);
    // });
    rowCTAbuttonCell.append(deleteButtonCell);

    row.append(rowCTAbuttonCell);

    return row;
  }
}
