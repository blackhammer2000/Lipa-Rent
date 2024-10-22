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

    const readAllRoomsOnSinglePropertyResponse =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (readAllRoomsOnSinglePropertyResponse)
      return readAllRoomsOnSinglePropertyResponse;
  }
}

class UserInterface {
  static renderRooms(rooms, accessToken, tableBody) {
    if (!rooms || !accessToken || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    for (const key in properties) {
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

  static async readAndRenderAllRoomsOnSingleProperty(
    accessToken,
    propertyId,
    tableBody
  ) {
    if (!accessToken || !propertyId || !tableBody) return;

    const { rooms, message, error } = await Store.readAllRoomsOnSingleProperty(
      accessToken,
      propertyId
    );

    if (error) {
      alert(error);
      return;
    }

    if (rooms && message) {
      alert(message);
      UserInterface.renderRooms(rooms, accessToken, tableBody);
      return;
    }
  }

  static createRoomRow(room, index, accessToken, tableBody) {
    if (!room) return;

    const { roomID, roomNumber, roomRate, roomVacancy } = room;

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

    const tableRoomRateCell = document.createElement("td");
    const tableRoomRateCellText = document.createTextNode(`KES. ${roomRate}`);
    tableRoomRateCell.append(tableRoomRateCellText);
    row.append(tableRoomRateCell);

    const tableRoomVacancyCell = document.createElement("td");
    const tableRoomVacancyCellText = document.createTextNode(roomVacancy);
    tableRoomVacancyCell.append(tableRoomVacancyCellText);
    row.append(tableRoomVacancyCell);

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

  static clearTable(tableBody) {
    tableBody.querySelectorAll("td").forEach((row) => row.remove());
  }

  static clearFormInputs(form) {
    form.querySelectorAll("input").forEach((input) => (input.value = ""));
  }
}
