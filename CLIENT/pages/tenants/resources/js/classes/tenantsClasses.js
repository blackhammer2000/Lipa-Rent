class Store extends StoreUtilities {
  static async preFetchRoomNumbersForSelectedProperty(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ propertyId }),
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/property/rooms",
      requestOptions
    );

    const { propertyRooms, error } = await readRoomTenantsRequest.json();

    if (error) UserInterface.handleErrors(error);

    if (propertyRooms) return propertyRooms;
  }

  static async readAllTenantsForRoomInProperty(
    accessToken,
    propertyId,
    roomId
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

    const { selectedRoomOnPropertyTenants, message, error } =
      await readRoomTenantsRequest.json();

    if (error) UserInterface.handleErrors(error);

    if (selectedRoomOnPropertyTenants)
      return { selectedRoomOnPropertyTenants, message };
  }

  static async addNewTenantToRoomInProperty(
    accessToken,
    propertyId,
    roomId,
    newTenant
  ) {
    if (!propertyId || !roomId || !accessToken || !newTenant) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ propertyId, roomId, newTenant }),
    };

    const addNewTenantToRoomRequest = await fetch(
      "http://localhost:4000/api/user/owner/create/property/room/tenant",
      requestOptions
    );

    const { newRoomTenants, message, error } =
      await addNewTenantToRoomRequest.json();

    if (error) UserInterface.handleErrors(error);

    if (newRoomTenants && message) return { newRoomTenants, message };
  }
}
class UserInterface extends UserinterfaceUtilities {
  static async renderRoomNumbersForSelection(accessToken, propertyId) {
    if (!propertyId || !accessToken) return;

    const propertyRooms = await Store.preFetchRoomNumbersForSelectedProperty(
      accessToken,
      propertyId
    );

    if (!propertyRooms) return;

    const optionsBody = document.querySelector("select");
    optionsBody.querySelectorAll("option").forEach((option) => option.remove());

    const fragment = document.createDocumentFragment();

    const placeHolderOption = document.createElement("option");
    placeHolderOption.value = "";
    placeHolderOption.innerText = "SELECT ROOM";
    fragment.append(placeHolderOption);

    for (const key in propertyRooms) {
      const option = document.createElement("option");
      option.value = key;
      option.innerText = propertyRooms[key].roomNumber.toUpperCase();
      fragment.append(option);
    }

    optionsBody.append(fragment);
  }

  static renderTenants(tenants, accessToken, tableBody) {
    if (!tenants || !accessToken || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    for (const key in tenants) {
      const roomRow = this.createTenantRow(
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

  static async readAndRenderTenants(accessToken, form, propertyId, tableBody) {
    if (!accessToken || !tableBody) return;

    const selectedRoomId = form.querySelector("select")?.value;
    const localStorageSelectedRoomId =
      localStorage.getItem("liparentSelectedRoomId") || null;

    if (!selectedRoomId) {
      alert("please select a room.");
      return;
    }

    if (
      localStorageSelectedRoomId &&
      localStorageSelectedRoomId === selectedRoomId
    )
      return;

    const { selectedRoomOnPropertyTenants, message } =
      await Store.readAllTenantsForRoomInProperty(
        accessToken,
        propertyId,
        selectedRoomId
      );

    alert(message);
    this.updateTableDescription(propertyId, selectedRoomId);
    this.setSelectedRoomIdInLocalStorage(selectedRoomId);

    if (!Object.keys(selectedRoomOnPropertyTenants).length && message) {
      this.clearTable(tableBody);
      return;
    }

    this.renderTenants(selectedRoomOnPropertyTenants, accessToken, tableBody);
  }

  static async addNewTenantAndRender(accessToken, tableBody, propertyId, form) {
    if (!accessToken || !tableBody || !propertyId || !form) return;

    const selectedRoomId =
      localStorage.getItem("liparentSelectedRoomId") || null;

    if (!selectedRoomId) return;

    const tenantName = form.querySelector("[data-new-tenant-name]")?.value;
    const tenantNationalID = form.querySelector(
      "[data-new-tenant-nationalID]"
    )?.value;
    const tenantPhone = form.querySelector("[data-new-tenant-phone]")?.value;

    console.log(tenantName, tenantNationalID);

    if (
      !confirm(`Do you want to add ${tenantName} to roomID: ${selectedRoomId}?`)
    )
      return;

    const newTenant = {
      tenantName,
      tenantNationalID,
      tenantPhone,
    };

    const { newRoomTenants, message } =
      await Store.addNewTenantToRoomInProperty(
        accessToken,
        propertyId,
        selectedRoomId,
        newTenant
      );

    if (newRoomTenants && message) {
      alert(message);
      this.renderTenants(newRoomTenants, accessToken, tableBody);
    }
  }

  static updateTableDescription(propertyId, selectedRoomId) {
    if (!propertyId || !selectedRoomId) return;

    const propertyName =
      JSON.parse(localStorage.getItem("liparentProperties"))[propertyId]
        ?.propertyName || null;

    if (!propertyName) {
      alert("property name not found, cannot update table description");
      return;
    }

    document.querySelector(
      "[data-table-description]"
    ).innerText = `Tenants for room: ${selectedRoomId} in: ${propertyName.toUpperCase()}`;
  }

  static async updateTableBodyState(
    accessToken,
    tableBody,
    propertyId,
    selectedRoomId
  ) {
    if (!accessToken || !tableBody || !propertyId || !selectedRoomId) return;

    const { selectedRoomOnPropertyTenants, message } =
      await Store.readAllTenantsForRoomInProperty(
        accessToken,
        propertyId,
        selectedRoomId
      );

    alert(message);

    if (!Object.keys(selectedRoomOnPropertyTenants).length && message) {
      this.updateTableDescription(propertyId, selectedRoomId);
      return;
    }

    this.renderTenants(selectedRoomOnPropertyTenants, accessToken, tableBody);
  }

  static setSelectedRoomIdInLocalStorage(selectedRoomId) {
    localStorage.removeItem("liparentSelectedRoomId");
    localStorage.setItem("liparentSelectedRoomId", selectedRoomId);
  }
}
