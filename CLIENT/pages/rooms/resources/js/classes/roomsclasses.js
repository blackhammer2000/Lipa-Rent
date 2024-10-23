class Store {
  static async readAllRoomsOnSingleProperty(accessToken, propertyId) {
    if (!accessToken || !propertyId) return;

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

    console.log({ propertyRooms, message, error });

    if (error) return { error };
    if (propertyRooms && message) return { propertyRooms, message, error };
  }

  static async addRoomToProperty(accessToken, propertyId, newRoom) {
    if (!accessToken || !propertyId || !newRoom) return;

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

    console.log({ propertyRooms, message, error });

    if (error) return { error };
    if (propertyRooms && message) return { propertyRooms, message, error };
  }
}

class UserInterface {
  static renderRooms(rooms, accessToken, tableBody) {
    if (!rooms || !accessToken || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

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
      `KES. ${roomRatePerMonth}`
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
    const tableRoomCurrentTenantIdCellText =
      document.createTextNode(currentTenantId);
    tableRoomCurrentTenantIdCell.append(tableRoomCurrentTenantIdCellText);

    row.append(tableRoomCurrentTenantIdCell);

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
      alert(message);

      localStorage.getItem("liparentSelectedPropertyId")
        ? localStorage.removeItem("liparentSelectedPropertyId")
        : null;
      localStorage.setItem("liparentSelectedPropertyId", propertyId);

      this.updateTableDescription(propertyId);
      this.renderRooms(propertyRooms, accessToken, tableBody);
      return;
    }
  }

  static async addRoomToPropertyAndRender(e, accessToken, form, tableBody) {
    if (!accessToken || !propertyId || !form || !tableBody) return;

    const newRoomNumber = form.querySelector("[data-new-room-number]")?.value;
    const newRoomRate = form.querySelector("[data-new-room-rate]")?.value;
    const newRoomArea = form.querySelector("[data-new-room-area]")?.value;
    const newRoomType = form.querySelector("[data-new-room-type]")?.value;

    const newRoom = {
      roomNumber: newRoomNumber,
      roomRate: newRoomRate,
      roomArea: newRoomArea,
      roomType: newRoomType,
    };

    const propertyId =
      e.target.parentElement.parentElement.parentElement.parentElement
        .querySelector("[data-table-description]")
        .innerText.trim()
        .slice(-12);

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
      alert(message);

      localStorage.getItem("liparentSelectedPropertyId")
        ? localStorage.removeItem("liparentSelectedPropertyId")
        : null;
      localStorage.setItem("liparentSelectedPropertyId", propertyId);

      this.updateTableDescription(propertyId);
      this.renderRooms(propertyRooms, accessToken, tableBody);
      return;
    }
  }

  static openCreateRoomModal(modal) {
    if (!modal) return;
    modal.classList.remove("hide");
  }

  static closeCreatePropertyModal(e) {
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
  }

  static updateTableDescription(propertyId) {
    if (!propertyId) return;
    document.querySelector(
      "[data-table-description]"
    ).innerText = `All Rooms for Property ID: ${propertyId}`;
  }

  static handleErrors(error) {
    if (!error) return;

    alert(error);
    if (error === "session expired") this.handleLogout();
  }

  static handleLogout() {
    localStorage.removeItem("liparentAccessToken");
    localStorage.removeItem("liparentSelectedPropertyId");
    location.assign("/CLIENT/login/login.html");
  }

  static clearTable(tableBody) {
    tableBody.querySelectorAll("td").forEach((row) => row.remove());
  }

  static clearFormInputs(form) {
    form.querySelectorAll("input").forEach((input) => (input.value = ""));
  }
}
