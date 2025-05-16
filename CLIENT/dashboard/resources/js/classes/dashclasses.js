class Store extends StoreUtilities {
  static async readAllPropertiesOwned(accessToken) {
    if (accessToken === (null || undefined))
      location.assign("/CLIENT/login/login.html");

    const openLoader = UserInterface.openLoader(
      "reading properties",
      "readProperties"
    );

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

    if (propertiesOwned || error) UserInterface.closeLoader("readProperties");

    if (error) UserInterface.handleErrors(error);

    if (propertiesOwned) return propertiesOwned;
  }

  static async editProperty(
    propertyId,
    previousPropertyNo,
    editedProperty,
    accessToken
  ) {
    if (!propertyId || !previousPropertyNo || !editedProperty || !accessToken)
      return;

    const openLoader = UserInterface.openLoader(
      "editing property",
      "editProperty"
    );

    const editPropertyRequestOptions = {
      mode: "cors",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        propertyNo: previousPropertyNo,
        editedProperty,
      }),
    };

    const editPropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/property",
      editPropertyRequestOptions
    );

    const { message, editedProperties, error } =
      await editPropertyRequest.json();

    if (message || editedProperties || error)
      UserInterface.closeLoader("editProperty");

    if (error) UserInterface.handleErrors(error);
    if (message && editedProperties) return { message, editedProperties };
  }

  static async deleteProperty(accessToken, propertyId, propertyNo) {
    if (!accessToken || !propertyId || propertyNo) return;

    const openLoader = UserInterface.openLoader(
      "deleting property",
      "deleteProperty"
    );

    const deletePropertyRequestOptions = {
      mode: "cors",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        propertyNo,
      }),
    };

    const deletePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete/property",
      deletePropertyRequestOptions
    );

    const deletedPropertiesResponse = await deletePropertyRequest.json();

    if (deletedPropertiesResponse) UserInterface.closeLoader("deleteProperty");

    if (error) UserInterface.handleErrors(error);

    if (deletedProperties && message) return deletedPropertiesResponse;
  }

  static async createProperty(accessToken, newProperty) {
    if (!accessToken || !newProperty) return;

    const openLoader = UserInterface.openLoader(
      "adding new property",
      "newProperty"
    );

    const createNewPropertyRequestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        newProperty,
      }),
    };

    const createPropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/create/property",
      createNewPropertyRequestOptions
    );

    const createPropertyResponse = await createPropertyRequest?.json();

    if (createPropertyResponse) UserInterface.closeLoader("newProperty");

    return createPropertyResponse;
  }
}

class UserInterface extends UserinterfaceUtilities {
  static async readAndUpdateOwnerDetails(accessToken) {
    if (!accessToken) return;

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
    };

    const readOwnerDetailsRequest = await fetch(
      "http://localhost:4000/api/user/read/owner",
      requestOptions
    );

    const { owner } = await readOwnerDetailsRequest.json();

    document.querySelector(
      "[data-dashboard-description]"
    ).innerText = `PROPERTIES OF ${owner.name}`;
  }

  static renderProperties(properties, accessToken, tableBody) {
    if (!properties) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();
    let tableNumber = 1;

    for (const key in properties) {
      const propertyRow = this.createPropertyRow(
        properties[key],
        tableNumber,
        accessToken,
        tableBody
      );
      fragment.append(propertyRow);
      tableNumber++;
    }

    tableBody.append(fragment);
    // localStorage.setItem("liparentProperties", JSON.stringify(properties));
  }

  static createPropertyRow(property, index, accessToken, tableBody) {
    if (!property) return;

    const { propertyID, propertyName, propertyNumber, propertyLocation } =
      property;

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

    const rowCTAbuttonCell = document.createElement("td");

    const editButtonCell = document.createElement("button");
    editButtonCell.className = "btn btn-primary mr-2 edit";
    const editButtonCellText = document.createTextNode("Edit");
    editButtonCell.append(editButtonCellText);
    editButtonCell.addEventListener("click", (e) => {
      this.populateEditPropertyForm(e);
    });
    rowCTAbuttonCell.append(editButtonCell);

    const deleteButtonCell = document.createElement("button");
    deleteButtonCell.className = "btn btn-danger ml-2 delete";
    const deleteButtonCellText = document.createTextNode("Delete");
    deleteButtonCell.append(deleteButtonCellText);
    deleteButtonCell.addEventListener("click", (e) => {
      this.deletePropertyAndRender(e, propertyID, accessToken, tableBody);
    });
    rowCTAbuttonCell.append(deleteButtonCell);

    row.append(rowCTAbuttonCell);

    return row;
  }

  static async readAndRenderProperties(accessToken, tableBody) {
    const properties = await Store.readAllPropertiesOwned(accessToken);

    if (!properties) return;
    this.alertMessage("Properties fetched sucessfully.", "success");
    UserInterface.renderProperties(properties, accessToken, tableBody);
  }

  static populateEditPropertyForm(e) {
    e.preventDefault();

    const editPropertyModal =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement.nextElementSibling
        .nextElementSibling;

    const propertyIdSpan = editPropertyModal.querySelector(
      "[data-edit-property-id]"
    );
    const propertyNumberSpan = editPropertyModal.querySelector(
      "[data-edit-property-number]"
    );

    const homeSection = document.querySelector(".home");

    editPropertyModal.classList.remove("hide");
    homeSection.classList.add("blur");

    const editForm = editPropertyModal.querySelector(
      "[data-edit-property-form]"
    );

    const propertyId =
      e.target.parentElement.parentElement.children[1].innerText;
    const propertyName =
      e.target.parentElement.parentElement.children[2].innerText;
    const propertyNumber =
      e.target.parentElement.parentElement.children[3].innerText;
    const propertyLocation =
      e.target.parentElement.parentElement.children[4].innerText;

    const propertyNameFormInput = editForm.querySelector("[data-edited-name]");
    const propertyNumberFormInput = editForm.querySelector(
      "[data-edited-number]"
    );
    const propertyLocationFormInput = editForm.querySelector(
      "[data-edited-location]"
    );

    propertyIdSpan.innerText = propertyId;
    propertyNumberSpan.innerText = propertyNumber;
    propertyNameFormInput.value = propertyName;
    propertyNumberFormInput.value = propertyNumber;
    propertyLocationFormInput.value = propertyLocation;
  }

  static async editPropertyAndRender(e, form, accessToken, tableBody) {
    e.preventDefault();

    const propertyId = form.parentElement.querySelector(
      "[data-edit-property-id]"
    )?.innerText;
    const previousPropertyNo = form.parentElement.querySelector(
      "[data-edit-property-number]"
    )?.innerText;

    if (
      !confirm(
        `Do you want to edit, property with ID: "${propertyId}", with Number: "${previousPropertyNo}"?`
      )
    )
      return;

    const homeSection = document.querySelector(".home");

    const editedPropertyName = form.querySelector("[data-edited-name]")?.value;
    const editedPropertyNumber = form.querySelector(
      "[data-edited-number]"
    )?.value;
    const editedPropertyLocation = form.querySelector(
      "[data-edited-location]"
    )?.value;

    const editedProperty = {
      propertyName: editedPropertyName.toUpperCase(),
      propertyNumber: editedPropertyNumber.toUpperCase(),
      propertyLocation: editedPropertyLocation.toUpperCase(),
    };

    const { message, editedProperties } = await Store.editProperty(
      propertyId,
      previousPropertyNo,
      editedProperty,
      accessToken
    );

    if (editedProperties && message) {
      this.alertMessage(message, "success");
      form.parentElement.parentElement.classList.add("hide");
      homeSection.classList.remove("blur");
      this.renderProperties(editedProperties, accessToken, tableBody);
      return;
    }
  }

  static closeEditPropertyModal(e) {
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
  }

  static async deletePropertyAndRender(e, propertyId, accessToken, tableBody) {
    e.preventDefault();

    const propertyName =
      e.target.parentElement.parentElement.children[2].innerText;
    const propertyNo =
      e?.target.parentElement.parentElement.children[3].innerText;

    if (
      !confirm(
        `Do you want to delete, "${propertyName}", with Number: "${propertyNo}"?`
      )
    )
      return;

    // const { deletedProperties, message, error } = await Store.deleteProperty(
    //   accessToken,
    //   propertyId,
    //   propertyNo
    // );

    const deletePropertyRequestOptions = {
      mode: "cors",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({
        propertyId,
        propertyNo,
      }),
    };

    const deletePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete/property",
      deletePropertyRequestOptions
    );

    const { deletedProperties, message, error } =
      await deletePropertyRequest.json();

    if (error) this.handleErrors(error);

    if (deletedProperties && message) {
      this.alertMessage(message, "success");
      this.renderProperties(deletedProperties, accessToken, tableBody);

      const localStorageSelectedPropertyId =
        localStorage.getItem("liparentSelectedPropertyId") || null;

      if (
        localStorageSelectedPropertyId &&
        localStorageSelectedPropertyId === propertyId
      )
        localStorage.removeItem("liparentSelectedPropertyId");
      return;
    }
  }

  static openCreatePropertyModal(modal) {
    if (!modal) return;
    modal.classList.remove("hide");
  }

  static closeCreatePropertyModal(e) {
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
  }

  static async createPropertyAndRender(e, accessToken, form, tableBody) {
    e.preventDefault();

    if (!accessToken || !form || !tableBody) return;

    const newPropertyName = form.querySelector(
      "[data-new-property-name]"
    )?.value;
    const newPropertyNumber = form.querySelector(
      "[data-new-property-number]"
    )?.value;
    const newPropertyLocation = form.querySelector(
      "[data-new-property-location]"
    )?.value;

    if (
      !confirm(
        `Do you want to create property with Name: "${newPropertyName}", and Number: "${newPropertyNumber}", located at: "${newPropertyLocation}"?`
      )
    )
      return;

    const newProperty = {
      propertyName: newPropertyName,
      propertyNumber: newPropertyNumber,
      propertyLocation: newPropertyLocation,
    };

    const { message, newProperties, error } = await Store.createProperty(
      accessToken,
      newProperty
    );

    if (error) {
      this.handleErrors(error);
      return;
    }

    if (newProperties && message) {
      this.alertMessage(message, "success");
      this.renderProperties(newProperties, accessToken, tableBody);
      this.clearFormInputs(form);
      // form.parentElement.parentElement.classList.add("hide");
      return;
    }
  }
}
