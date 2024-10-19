class Store {
  static async readAllPropertiesOwned(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    const requestOptions = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        token: accessToken,
        user: true,
      },
    };

    const getAllPropertiesData = await fetch(
      "http://localhost:4000/api/user/owner/read/properties",
      requestOptions
    );

    const { propertiesOwned, error } = await getAllPropertiesData?.json();

    if (error && error?.toLowerCase() !== "session expired") {
      alert(error);
      return;
    }

    if (
      error &&
      error?.toLowerCase() === ("session expired" || "jwt malformed")
    )
      location?.assign("/CLIENT/login/login.html");

    if (propertiesOwned) return propertiesOwned;
  }
}

class UserInterface {
  static renderProperties(properties, tableBody) {
    if (!properties) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    for (const key in properties) {
      const propertyRow = this.createPropertyRow(properties[key], tableNumber);
      fragment.append(propertyRow);
      tableNumber++;
    }

    tableBody.append(fragment);
  }

  static createPropertyRow(property, index) {
    if (!property) return;

    const {
      propertyID,
      propertyName,
      propertyNumber,
      propertyLocation,
      propertyValue,
    } = property;

    const row = document.createElement("tr");

    const tablenumberCell = document.createElement("td");
    const tablenumberCellText = document.createTextNode(index);
    tablenumberCell.append(tablenumberCellText);
    row.append(tablenumberCell);

    const tableIdCell = document.createElement("td");
    const tableIdCellText = document.createTextNode(propertyID);
    tableIdCell.append(tableIdCellText);
    row.append(tableIdCell);

    const tablePropertyNameCell = document.createElement("td");
    const tablePropertyNameCellText = document.createTextNode(propertyName);
    tablePropertyNameCell.append(tablePropertyNameCellText);
    row.append(tablePropertyNameCell);

    const tablePropertyNumberCell = document.createElement("td");
    const tablePropertyNumberCellText = document.createTextNode(propertyNumber);
    tablePropertyNumberCell.append(tablePropertyNumberCellText);
    row.append(tablePropertyNumberCell);

    const tablePropertyLocationCell = document.createElement("td");
    const tablePropertyLocationCellText =
      document.createTextNode(propertyLocation);
    tablePropertyLocationCell.append(tablePropertyLocationCellText);
    row.append(tablePropertyLocationCell);

    const tablePropertyValueCell = document.createElement("td");
    const tablePropertyValueCellText = document.createTextNode(propertyValue);
    tablePropertyValueCell.append(tablePropertyValueCellText);
    row.append(tablePropertyValueCell);

    return row;
  }

  static addEventListenersToRows(tableBody, eventHandler) {
    if (!tableBody || !eventHandler) return;

    tableBody.querySelectorAll("tr").forEach((tableRow) => {
      tableRow.addEventListener("click", eventHandler);
    });
  }

  static clearTable(tableBody) {
    tableBody.querySelectorAll("td").forEach((row) => row.remove());
  }
}
