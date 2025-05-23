class Store extends StoreUtilities {
  static async preFetchRoomNumbersForSelectedProperty(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

    const openLoader = UserInterface.openLoader(
      "fetching room numbers",
      "roomNumbers"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/read/property/rooms`,
      requestOptions
    );

    const { propertyRooms, error } = await readRoomTenantsRequest.json();

    if (propertyRooms || error) UserInterface.closeLoader("roomNumbers");

    if (error) UserInterface.handleErrors(error);

    if (propertyRooms) return propertyRooms;
  }

  static async readAllTenantsForRoomInProperty(
    accessToken,
    propertyId,
    roomId
  ) {
    if (!propertyId || !roomId || !accessToken) return;

    const openLoader = UserInterface.openLoader(
      "fetching room tenants",
      "readTenants"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/read/property/room/tenants`,
      requestOptions
    );

    const { selectedRoomOnPropertyTenants, message, error } =
      await readRoomTenantsRequest.json();

    if (selectedRoomOnPropertyTenants || message || error)
      UserInterface.closeLoader("readTenants");

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

    const openLoader = UserInterface.openLoader(
      "adding new tenant",
      "addTenant"
    );

    if (!openLoader) return;

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
      `${serverDomain}/api/user/owner/create/property/room/tenant`,
      requestOptions
    );

    const { newRoomTenants, message, error } =
      await addNewTenantToRoomRequest.json();

    if (newRoomTenants || message || error)
      UserInterface.closeLoader("addTenant");

    if (error) UserInterface.handleErrors(error);

    if (newRoomTenants && message) return { newRoomTenants, message };
  }

  static async editTenantOnRoomInProperty(
    accessToken,
    propertyId,
    roomId,
    tenantId,
    editedTenant
  ) {
    if (!accessToken || !propertyId || !roomId || !tenantId || !editedTenant)
      return;

    const openLoader = UserInterface.openLoader(
      "editing tenant",
      "editingTenant"
    );

    if (!openLoader) return;

    const requestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        roomId,
        tenantId,
        editedTenant,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      `${serverDomain}/api/user/owner/edit/property/room/tenant`,
      requestOptions
    );

    const { editedRoomTenants, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (editedRoomTenants || message || error)
      UserInterface.closeLoader("editingTenant");

    if (error) UserInterface.handleErrors(error);
    if (editedRoomTenants && message) return { editedRoomTenants, message };
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
      option.id = key;
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

    const reversedTenants = Object.keys(tenants).reverse();

    for (const key of reversedTenants) {
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

    const {
      tenantID,
      tenantName,
      tenantNationalID,
      tenantPhone,
      moveInDate,
      moveOutDate,
    } = tenant;

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

    const tableTenantMoveInDateCell = document.createElement("td");
    const tableTenantMoveInDateCellText = document.createTextNode(moveInDate);
    tableTenantMoveInDateCell.append(tableTenantMoveInDateCellText);
    row.append(tableTenantMoveInDateCell);

    const tableTenantMoveOutDateCell = document.createElement("td");
    const tableTenantMoveOutDateCellText = document.createTextNode(moveOutDate);
    tableTenantMoveOutDateCell.append(tableTenantMoveOutDateCellText);
    row.append(tableTenantMoveOutDateCell);

    const rowCTAbuttonCell = document.createElement("td");

    const editButtonCell = document.createElement("button");
    editButtonCell.className = "btn btn-primary mr-2 edit";
    const editButtonCellText = document.createTextNode("Edit");
    editButtonCell.append(editButtonCellText);
    editButtonCell.addEventListener("click", (e) => {
      this.populateEditTenantForm(e);
    });
    rowCTAbuttonCell.append(editButtonCell);

    const deleteButtonCell = document.createElement("button");
    deleteButtonCell.className = "btn btn-danger ml-2 delete";
    const deleteButtonCellText = document.createTextNode("Delete");
    deleteButtonCell.append(deleteButtonCellText);
    deleteButtonCell.addEventListener("click", (e) => {
      this.deleteRoomTenantAndRender(e, tenantID, accessToken, tableBody);
    });
    rowCTAbuttonCell.append(deleteButtonCell);

    row.append(rowCTAbuttonCell);

    return row;
  }

  static async readAndRenderTenants(accessToken, form, propertyId, tableBody) {
    if (!accessToken || !tableBody) return;

    const selectedRoomForm = form.querySelector("select");
    const selectedRoomId = form.querySelector("select")?.value;

    const localStorageSelectedRoomId =
      localStorage.getItem("liparentSelectedRoomId") || null;

    if (!selectedRoomId) {
      this.handleErrors("please select a room.");
      return;
    }

    if (
      localStorageSelectedRoomId &&
      localStorageSelectedRoomId === selectedRoomId
    )
      return;

    const selectedRoomNumber =
      selectedRoomForm.children[selectedRoomId].innerText;

    const { selectedRoomOnPropertyTenants, message } =
      await Store.readAllTenantsForRoomInProperty(
        accessToken,
        propertyId,
        selectedRoomId
      );

    this.alertMessage(message, "success");
    this.setSelectedRoomNumberInLocalStorage(selectedRoomNumber);
    this.setSelectedRoomIdInLocalStorage(selectedRoomId);
    this.EnableRentsNavButton(propertyId, selectedRoomId);
    this.updateTableDescription();

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

    if (!selectedRoomId) this.handleErrors("please select a room");

    const tenantName = form.querySelector("[data-new-tenant-name]")?.value;
    const tenantNationalID = form.querySelector(
      "[data-new-tenant-nationalID]"
    )?.value;
    const tenantPhone = form.querySelector("[data-new-tenant-phone]")?.value;

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
      this.alertMessage(message, "success");
      this.renderTenants(newRoomTenants, accessToken, tableBody);
    }
  }

  static populateEditTenantForm(e) {
    e.preventDefault();

    const editTenantModal =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement.nextElementSibling
        .nextElementSibling;

    const homeSection =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement;

    console.log(homeSection);

    editTenantModal.classList.remove("hide");
    homeSection.classList.add("blur");

    const editForm = editTenantModal.querySelector("[data-edit-tenant-form]");

    const tenantIdSpan = editTenantModal.querySelector("[data-edit-tenant-id]");

    const tenantId = e.target.parentElement.parentElement.children[1].innerText;
    const tenantName =
      e.target.parentElement.parentElement.children[2].innerText;
    const tenantNationalID =
      e.target.parentElement.parentElement.children[3].innerText;
    const tenantPhone =
      e.target.parentElement.parentElement.children[4].innerText;
    const tenantMoveOutDate =
      e.target.parentElement.parentElement.children[6].innerText;

    const tenantNameFormInput = editForm.querySelector("[data-edited-name]");
    const tenantNationalIDFormInput = editForm.querySelector(
      "[data-edited-nationalID]"
    );
    const tenantPhoneFormInput = editForm.querySelector("[data-edited-phone]");
    const tenantMoveOutFormInput = editForm.querySelector(
      "[data-edited-moveout]"
    );

    tenantIdSpan.innerText = tenantId;

    tenantNameFormInput.value = tenantName;
    tenantNationalIDFormInput.value = tenantNationalID;
    tenantPhoneFormInput.value = tenantPhone;
    tenantMoveOutFormInput.value = tenantMoveOutDate;
  }

  static async editRoomTenantAndRender(
    accessToken,
    tableBody,
    propertyId,
    roomId,
    form
  ) {
    if (!accessToken || !tableBody || !propertyId || !roomId || !form) return;

    const tenantId = form.parentElement.querySelector(
      "[data-edit-tenant-id]"
    )?.innerText;

    if (!tenantId) return;

    if (
      !confirm(
        `Do you want to edit tenant with ID: "${tenantId}" on roomID: "${roomId}"?`
      )
    )
      return;

    const homeSection = document.querySelector(".home");

    const editedTenantName = form.querySelector("[data-edited-name]")?.value;
    const editedTenantNationalID = form.querySelector(
      "[data-edited-nationalID]"
    )?.value;
    const editedTenantPhone = form.querySelector("[data-edited-phone]")?.value;
    const editedTenantMoveOutDate = form.querySelector(
      "[data-edited-moveout]"
    )?.value;

    const editedTenant = {
      tenantName: editedTenantName,
      tenantNationalID: editedTenantNationalID,
      tenantPhone: editedTenantPhone,
      moveOutDate: editedTenantMoveOutDate,
    };

    const { message, editedRoomTenants } =
      await Store.editTenantOnRoomInProperty(
        accessToken,
        propertyId,
        roomId,
        tenantId,
        editedTenant
      );

    console.log(editedRoomTenants, message);

    if (editedRoomTenants && message) {
      homeSection.classList.remove("blur");
      this.alertMessage(message, "success");
      this.renderTenants(editedRoomTenants, accessToken, tableBody);
      form.parentElement.parentElement.classList.add("hide");
      return;
    }
  }

  static async deleteRoomTenantAndRender(e, tenantId, accessToken, tableBody) {
    e.preventDefault();
    if (!accessToken || !tableBody) return;

    const selectedPropertyId =
      localStorage.getItem("liparentSelectedPropertyId") || null;

    if (!selectedPropertyId) {
      this.handleErrors("please select a property in the room section");
      location.assign("/CLIENT/pages/rooms/rooms");
      return;
    }

    const selectedRoomId =
      localStorage.getItem("liparentSelectedRoomId") || null;

    if (!selectedRoomId) {
      this.handleErrors("please select a room.");
      return;
    }

    if (
      !confirm(
        `Do you want to delete tenant with ID: "${tenantId}" from roomID: "${selectedRoomId}"?`
      )
    )
      return;

    // const { deletedRoomTenants, message, error } = await Store.deleteRoomOnPorperty(
    //   accessToken,
    //   propertyId,
    //   roomId
    // );

    const openLoader = UserInterface.openLoader(
      "deleting tenant",
      "deletingTenant"
    );

    if (!openLoader) return;

    const requestOptions = {
      mode: "cors",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId: selectedPropertyId,
        roomId: selectedRoomId,
        tenantId,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      `${serverDomain}/api/user/owner/delete/property/room/tenant`,
      requestOptions
    );

    const { deletedRoomTenants, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (deletedRoomTenants || message || error)
      UserInterface.closeLoader("deletingTenant");

    if (error) {
      this.handleErrors(error);
    }

    if (deletedRoomTenants && message) {
      this.alertMessage(message, "success");
      this.renderTenants(deletedRoomTenants, accessToken, tableBody);

      //   const selectedRoomId =
      //     localStorage.getItem("liparentSelectedRoomId") || null;

      //   if (selectedRoomId && selectedRoomId === roomId)
      //     localStorage.removeItem("liparentSelectedRoomId");

      return;
    }
  }

  static updateTableDescription() {
    const propertyName =
      localStorage.getItem("liparentSelectedPropertyName") || null;

    if (!propertyName) {
      this.handleErrors("property name not found.");
      return;
    }

    const roomNumber =
      localStorage.getItem("liparentSelectedRoomNumber") || null;

    if (!roomNumber) {
      this.handleErrors("selected room number not found.");
      return;
    }

    document.querySelector(
      "[data-table-description]"
    ).innerText = `TENANTS FOR ${roomNumber} IN ${propertyName.toUpperCase()}`;
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

    this.alertMessage(message, "success");

    if (!Object.keys(selectedRoomOnPropertyTenants).length && message) {
      this.updateTableDescription(propertyId, selectedRoomId);
      return;
    }

    this.renderTenants(selectedRoomOnPropertyTenants, accessToken, tableBody);
  }

  static EnableRentsNavButton(propertyId, roomId) {
    if (!propertyId || !roomId) return;

    const rentsButton = document.querySelector("[data-nav-rents]");
    rentsButton.removeAttribute("disabled");
  }

  static setSelectedRoomIdInLocalStorage(selectedRoomId) {
    localStorage.removeItem("liparentSelectedRoomId");
    localStorage.setItem("liparentSelectedRoomId", selectedRoomId);
  }

  static setSelectedRoomNumberInLocalStorage(selectedRoomNumber) {
    localStorage.removeItem("liparentSelectedRoomNumber");
    localStorage.setItem("liparentSelectedRoomNumber", selectedRoomNumber);
  }
}
