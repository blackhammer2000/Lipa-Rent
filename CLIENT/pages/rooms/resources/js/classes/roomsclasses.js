class Store extends StoreUtilities {
  static async readAllRoomsOnSingleProperty(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

    UserInterface.openLoader("reading property rooms");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/property/rooms",
      requestOptions
    );

    const { propertyRooms, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (propertyRooms || message || error) UserInterface.closeLoader();

    if (error) return { error };
    if (propertyRooms && message) return { propertyRooms, message };
  }

  static async addRoomToProperty(accessToken, propertyId, newRoom) {
    if (!accessToken || !propertyId || !newRoom) return;

    UserInterface.openLoader("adding room");
    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        newRoom,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/create/property/room",
      requestOptions
    );

    const { propertyRooms, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (propertyRooms || message || error) UserInterface.closeLoader();

    if (error) return { error };
    if (propertyRooms && message) return { propertyRooms, message, error };
  }

  static async editRoomOnProperty(accessToken, propertyId, roomId, editedRoom) {
    if (!accessToken || !propertyId || !roomId || !editedRoom) return;

    UserInterface.openLoader("editing room");

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
        editedRoom,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/property/room",
      requestOptions
    );

    const { editedRooms, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (editedRooms || message || error) UserInterface.closeLoader();

    if (error) UserInterface.handleErrors(error);
    if (editedRooms && message) return { editedRooms, message };
  }

  static async deleteRoomOnPorperty(accessToken, propertyId, roomId) {
    if (!accessToken || !propertyId || !roomId) return;

    UserInterface.openLoader("deleting room");

    const requestOptions = {
      mode: "cors",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        roomId,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete/property/room",
      requestOptions
    );

    const { deletedRooms, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if ((deletedRooms, message, error)) UserInterface.closeLoader();

    if (error) return { error };
    if (deletedRooms && message) return { deletedRooms, message };
  }
}

class UserInterface extends UserinterfaceUtilities {
  static renderPropertySelectionOptions() {
    const properties = localStorage.getItem("liparentProperties")
      ? JSON.parse(localStorage.getItem("liparentProperties"))
      : null;

    if (!properties) return;

    const optionsBody = document.querySelector("select");
    optionsBody.querySelectorAll("option").forEach((option) => option.remove());

    const fragment = document.createDocumentFragment();

    const placeHolderOption = document.createElement("option");
    placeHolderOption.value = "";
    placeHolderOption.innerText = "SELECT PROPERTY";
    fragment.append(placeHolderOption);

    for (const key in properties) {
      const option = document.createElement("option");
      option.value = key;
      option.innerText = properties[key].propertyName.toUpperCase();
      fragment.append(option);
    }

    optionsBody.append(fragment);
  }

  static renderRooms(rooms, accessToken, tableBody) {
    if (!rooms || !accessToken || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    if (!rooms) {
      alert("No rooms to show, please add rooms to the property.");
      return;
    }

    for (const key in rooms) {
      const roomRow = this.createRoomRow(
        rooms[key],
        tableNumber,
        accessToken,
        tableBody
      );
      fragment.append(roomRow);
      tableNumber++;
    }

    tableBody.append(fragment);
  }

  static createRoomRow(room, index, accessToken, tableBody) {
    if (!room) return;

    const {
      roomID,
      roomNumber,
      roomType,
      roomArea,
      roomRatePerMonth,
      currentTenantId,
      isOccupied,
    } = room;

    const row = document.createElement("tr");

    const tablenumberCell = document.createElement("td");
    const tablenumberCellText = document.createTextNode(index);
    tablenumberCell.append(tablenumberCellText);
    row.append(tablenumberCell);

    const tabRoomIdCell = document.createElement("td");
    const tableRoomIdCellText = document.createTextNode(roomID);
    tabRoomIdCell.append(tableRoomIdCellText);
    row.append(tabRoomIdCell);

    const tableRoomNumberCell = document.createElement("td");
    const tableRoomNumberCellText = document.createTextNode(roomNumber);
    tableRoomNumberCell.append(tableRoomNumberCellText);
    row.append(tableRoomNumberCell);

    const tableRoomTypeCell = document.createElement("td");
    const tableRoomTypeCellText = document.createTextNode(roomType);
    tableRoomTypeCell.append(tableRoomTypeCellText);
    row.append(tableRoomTypeCell);

    const tableRoomAreaCell = document.createElement("td");
    const tableRoomAreaCellText = document.createTextNode(roomArea);
    tableRoomAreaCell.append(tableRoomAreaCellText);
    row.append(tableRoomAreaCell);

    const tableRoomRateCell = document.createElement("td");
    const tableRoomRateCellText = document.createTextNode(
      `KES.${roomRatePerMonth}`
    );
    tableRoomRateCell.append(tableRoomRateCellText);
    row.append(tableRoomRateCell);

    const tableRoomVacancyCell = document.createElement("td");
    const tableRoomVacancyCellText = document.createTextNode(
      `${isOccupied ? "Occupied" : "Vacant"}`
    );
    tableRoomVacancyCell.append(tableRoomVacancyCellText);
    tableRoomVacancyCell.className = `${
      isOccupied ? "text-success" : "text-danger"
    }`;
    row.append(tableRoomVacancyCell);

    const tableRoomCurrentTenantIdCell = document.createElement("td");
    const tableRoomCurrentTenantIdCellText = document.createTextNode(
      currentTenantId ? currentTenantId : "none"
    );
    tableRoomCurrentTenantIdCell.append(tableRoomCurrentTenantIdCellText);

    row.append(tableRoomCurrentTenantIdCell);

    const rowCTAbuttonCell = document.createElement("td");

    const editButtonCell = document.createElement("button");
    editButtonCell.className = "btn btn-primary mr-2 edit";
    const editButtonCellText = document.createTextNode("Edit");
    editButtonCell.append(editButtonCellText);
    editButtonCell.addEventListener("click", (e) => {
      this.populateEditRoomForm(e);
    });
    rowCTAbuttonCell.append(editButtonCell);

    const deleteButtonCell = document.createElement("button");
    deleteButtonCell.className = "btn btn-danger ml-2 delete";
    const deleteButtonCellText = document.createTextNode("Delete");
    deleteButtonCell.append(deleteButtonCellText);
    deleteButtonCell.addEventListener("click", (e) => {
      this.deleteRoomAndRender(e, roomID, accessToken, tableBody);
    });
    rowCTAbuttonCell.append(deleteButtonCell);

    row.append(rowCTAbuttonCell);

    return row;
  }

  static async readAndRenderAllRoomsOnSingleProperty(
    accessToken,
    propertyId,
    tableBody
  ) {
    if (!accessToken || !propertyId || !tableBody) return;

    const { propertyRooms, message, error } =
      await Store.readAllRoomsOnSingleProperty(accessToken, propertyId);

    if (error) {
      this.handleErrors(error);
      return;
    }

    if (propertyRooms && message) {
      this.alertMessage(message, "success");
      this.setSelectedPropertyIdAndEnableNavButton(propertyId);
      this.updateTableDescription(propertyId);
      this.renderRooms(propertyRooms, accessToken, tableBody);
      return;
    }
  }

  static setSelectedPropertyIdAndEnableNavButton(propertyId) {
    localStorage.getItem("liparentSelectedPropertyId")
      ? localStorage.removeItem("liparentSelectedPropertyId")
      : null;
    localStorage.setItem("liparentSelectedPropertyId", propertyId);

    const tenantsButton = document.querySelector("[data-nav-tenants]");
    const rentsButton = document.querySelector("[data-nav-rents]");

    tenantsButton.removeAttribute("disabled");
    rentsButton.removeAttribute("disabled");
  }

  static async addRoomToPropertyAndRender(e, accessToken, form, tableBody) {
    if (!accessToken || !form || !tableBody) return;

    const newRoomNumber = form.querySelector("[data-new-room-number]")?.value;
    const newRoomRate = form.querySelector("[data-new-room-rate]")?.value;
    const newRoomArea = form.querySelector("[data-new-room-area]")?.value;
    const newRoomType = form.querySelector("[data-new-room-type]")?.value;

    const newRoom = {
      roomNumber: newRoomNumber,
      roomRatePerMonth: newRoomRate,
      roomArea: newRoomArea,
      roomType: newRoomType,
    };

    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    if (!selectedPropertyId) {
      this.handleErrors("please select a property.");
      return;
    }

    const { propertyRooms, message, error } = await Store.addRoomToProperty(
      accessToken,
      propertyId,
      newRoom
    );

    if (error) {
      this.handleErrors(error);
      return;
    }

    if (propertyRooms && message) {
      this.alertMessage(message, "success");

      localStorage.getItem("liparentSelectedPropertyId")
        ? localStorage.removeItem("liparentSelectedPropertyId")
        : null;
      localStorage.setItem("liparentSelectedPropertyId", propertyId);

      this.updateTableDescription(propertyId);
      this.renderRooms(propertyRooms, accessToken, tableBody);
      this.clearFormInputs(form);
      //   form?.parentElement.parentElement.classList.add("hide");
      return;
    }
  }

  static openCreateRoomModal(modal) {
    if (!modal) return;
    modal.classList.remove("hide");
  }

  static closeCreateRoomModal(e) {
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
  }

  static populateEditRoomForm(e) {
    e.preventDefault();

    const editRoomModal =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement.nextElementSibling
        .nextElementSibling;

    editRoomModal.classList.remove("hide");

    const editForm = editRoomModal.querySelector("[data-edit-room-form]");

    const roomIdSpan = editRoomModal.querySelector("[data-edit-room-id]");

    const roomId = e.target.parentElement.parentElement.children[1].innerText;
    const roomNumber =
      e.target.parentElement.parentElement.children[2].innerText;
    const roomType = e.target.parentElement.parentElement.children[3].innerText;
    const roomArea = e.target.parentElement.parentElement.children[4].innerText;
    const roomRate =
      e.target.parentElement.parentElement.children[5].innerText.slice(4);

    const roomNumberFormInput = editForm.querySelector("[data-edited-number]");
    const roomTypeFormInput = editForm.querySelector("[data-edited-type]");
    const roomAreaFormInput = editForm.querySelector("[data-edited-area]");
    const roomRateFormInput = editForm.querySelector("[data-edited-rate]");

    roomIdSpan.innerText = roomId;

    roomNumberFormInput.value = roomNumber;
    roomTypeFormInput.value = roomType;
    roomAreaFormInput.value = roomArea;
    roomRateFormInput.value = roomRate;
  }

  static closeEditRoomModal(e) {
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
  }

  static async editRoomAndRender(e, form, accessToken, tableBody) {
    e.preventDefault();

    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    if (!selectedPropertyId) {
      this.handleErrors("please select a property.");
      return;
    }

    const roomId = form.parentElement.querySelector(
      "[data-edit-room-id]"
    )?.innerText;

    if (
      !confirm(
        `Do you want to edit room with ID: "${roomId}" on property with ID: "${selectedPropertyId}"?`
      )
    )
      return;

    const editedRoomNumber = form.querySelector("[data-edited-number]")?.value;
    const editedRoomType = form.querySelector("[data-edited-type]")?.value;
    const editedRoomArea = form.querySelector("[data-edited-area]")?.value;
    const editedRoomRate = form.querySelector("[data-edited-rate]")?.value;

    const editedRoom = {
      roomNumber: editedRoomNumber,
      roomType: editedRoomType,
      roomArea: editedRoomArea,
      roomRatePerMonth: editedRoomRate,
    };

    const { message, editedRooms } = await Store.editRoomOnProperty(
      accessToken,
      selectedPropertyId,
      roomId,
      editedRoom
    );

    if (editedRooms && message) {
      this.alertMessage(message, "success");
      this.renderRooms(editedRooms, accessToken, tableBody);
      form.parentElement.parentElement.classList.add("hide");
      return;
    }
  }

  static async deleteRoomAndRender(e, roomId, accessToken, tableBody) {
    e.preventDefault();
    if (!accessToken || !tableBody) return;

    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    if (!selectedPropertyId) {
      this.handleErrors("please select a property.");
      return;
    }

    if (
      !confirm(
        `Do you want to delete room with ID: "${roomId}" on property with ID: "${selectedPropertyId}"?`
      )
    )
      return;

    // const { deletedRooms, message, error } = await Store.deleteRoomOnPorperty(
    //   accessToken,
    //   propertyId,
    //   roomId
    // );

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
        roomId,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete/property/room",
      requestOptions
    );

    const { deletedRooms, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (error) {
      this.handleErrors(error);
    }

    if (deletedRooms && message) {
      this.alertMessage(message, "success");
      this.renderRooms(deletedRooms, accessToken, tableBody);

      const selectedRoomId =
        localStorage.getItem("liparentSelectedRoomId") || null;

      if (selectedRoomId && selectedRoomId === roomId)
        localStorage.removeItem("liparentSelectedRoomId");

      return;
    }
  }

  static updateTableDescription(propertyId) {
    if (!propertyId) return;

    const propertyName =
      JSON.parse(localStorage.getItem("liparentProperties"))[propertyId]
        ?.propertyName || null;

    if (!propertyName) {
      alert("property name not found, cannot update table description");
      return;
    }

    document.querySelector(
      "[data-table-description]"
    ).innerText = `Rooms for ${propertyName.toUpperCase()}, Property ID: ${propertyId}`;
  }
}
