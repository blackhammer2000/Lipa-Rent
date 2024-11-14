class Store extends StoreUtilities {
  static async preFetchTenantNamesForSelectedRoom(
    accessToken,
    propertyId,
    roomId
  ) {
    if (!accessToken || !propertyId || !roomId) return;

    UserInterface.openLoader("fetching tenant names", "tenantNames");

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

    if (selectedRoomOnPropertyTenants || error)
      UserInterface.closeLoader("tenantNames");

    if (error) UserInterface.handleErrors(error);

    if (selectedRoomOnPropertyTenants && message)
      return { selectedRoomOnPropertyTenants, message };
  }

  static async readAllTenantPaymentsForRoomInProperty(
    accessToken,
    propertyId,
    roomId,
    tenantId
  ) {
    if (!propertyId || !roomId || !tenantId || !accessToken) return;

    UserInterface.openLoader("fetching room tenant payments", "readPayments");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ propertyId, roomId, tenantId }),
    };

    const readRoomTenantsRequest = await fetch(
      "http://localhost:4000/api/user/owner/read/property/room/tenant/payments",
      requestOptions
    );

    const { selectedTenantPayments, message, error } =
      await readRoomTenantsRequest.json();

    if (selectedTenantPayments || message || error)
      UserInterface.closeLoader("readTenants");

    if (error) UserInterface.handleErrors(error);

    if (selectedTenantPayments && message)
      return { selectedTenantPayments, message };
  }

  static async addNewTenantPaymentToRoomInProperty(
    accessToken,
    propertyId,
    roomId,
    tenantId,
    newPayment
  ) {
    if (!propertyId || !roomId || !tenantId || !accessToken || !newPayment)
      return;

    UserInterface.openLoader("adding new tenant payment", "addTenantPayment");

    const requestOptions = {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: true,
        token: accessToken,
      },
      body: JSON.stringify({ propertyId, roomId, tenantId, newPayment }),
    };

    const addNewTenantToRoomRequest = await fetch(
      "http://localhost:4000/api/user/owner/create/property/room/tenant/payment",
      requestOptions
    );

    const { newTenantRoomRentPayments, message, error } =
      await addNewTenantToRoomRequest.json();

    if (newTenantRoomRentPayments || message || error)
      UserInterface.closeLoader("addTenantPayment");

    console.log(error, newTenantRoomRentPayments);

    if (error) UserInterface.handleErrors(error);

    if (newTenantRoomRentPayments && message)
      return { newTenantRoomRentPayments, message };
  }

  static async editTenantPaymentOnRoomInProperty(
    accessToken,
    propertyId,
    roomId,
    tenantId,
    editedPayment
  ) {
    if (!accessToken || !propertyId || !roomId || !tenantId || !editedPayment)
      return;

    UserInterface.openLoader("editing tenant payment", "editingPayment");

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
        editedPayment,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/edit/property/room/tenant/payment",
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
  static async renderTenantNamesForSelection(accessToken, propertyId, roomId) {
    if (!propertyId || !roomId || !accessToken) return;

    const { selectedRoomOnPropertyTenants, message } =
      await Store.preFetchTenantNamesForSelectedRoom(
        accessToken,
        propertyId,
        roomId
      );

    console.log(selectedRoomOnPropertyTenants);

    if (!Object.keys(selectedRoomOnPropertyTenants).length) {
      this.handleErrors(message);
      return;
    }

    const optionsBody = document.querySelector("select");
    optionsBody.querySelectorAll("option").forEach((option) => option.remove());

    const fragment = document.createDocumentFragment();

    const placeHolderOption = document.createElement("option");
    placeHolderOption.value = "";
    placeHolderOption.innerText = "SELECT TENANT";
    fragment.append(placeHolderOption);

    for (const key in selectedRoomOnPropertyTenants) {
      const option = document.createElement("option");
      option.value = key;
      option.innerText =
        selectedRoomOnPropertyTenants[key].tenantName.toUpperCase();
      option.id = key;
      fragment.append(option);
    }

    optionsBody.append(fragment);
  }

  static renderTenantPayments(tenantPayments, accessToken, tableBody) {
    if (!tenantPayments || !accessToken || !tableBody) return;

    this.clearTable(tableBody);

    const fragment = document.createDocumentFragment();

    tenantPayments.forEach((payment, index) => {
      const paymentRow = this.createPaymentRow(
        payment,
        index,
        accessToken,
        tableBody
      );

      fragment.append(paymentRow);
    });

    tableBody.append(fragment);
  }

  static createPaymentRow(payment, index, accessToken, tableBody) {
    if (!payment || !index || !accessToken || !tableBody) return;

    const {
      paymentID,
      date,
      month,
      previousPaymentBalance,
      amountPaid,
      newBalance,
      modeOfPayment,
      recieptNumber,
    } = payment;

    const row = document.createElement("tr");

    const tableNumberCell = document.createElement("td");
    const tableNumberCellText = document.createTextNode(index + 1);
    tableNumberCell.append(tableNumberCellText);
    row.append(tableNumberCell);

    const tablePaymentIdCell = document.createElement("td");
    const tablePaymentIdCellText = document.createTextNode(paymentID);
    tablePaymentIdCell.append(tablePaymentIdCellText);
    row.append(tablePaymentIdCell);

    const tablePaymentDateCell = document.createElement("td");
    const tablePaymentDateCellText = document.createTextNode(date);
    tablePaymentDateCell.append(tablePaymentDateCellText);
    row.append(tablePaymentDateCell);

    const tablePaymentMonthCell = document.createElement("td");
    const tablePaymentMonthCellText = document.createTextNode(month);
    tablePaymentMonthCell.append(tablePaymentMonthCellText);
    row.append(tablePaymentMonthCell);

    const tablePreviousBalanceCell = document.createElement("td");
    const tablePreviousBalanceCellText = document.createTextNode(
      previousPaymentBalance
    );
    tablePreviousBalanceCell.append(tablePreviousBalanceCellText);
    row.append(tablePreviousBalanceCell);

    const tableAmountPaidCell = document.createElement("td");
    const tableAmountPaidCellText = document.createTextNode(amountPaid);
    tableAmountPaidCell.append(tableAmountPaidCellText);
    row.append(tableAmountPaidCell);

    const tableNewBalanceCell = document.createElement("td");
    const tableNewBalanceCellText = document.createTextNode(newBalance);
    tableNewBalanceCell.append(tableNewBalanceCellText);
    row.append(tableNewBalanceCell);

    const tablePaymentModeCell = document.createElement("td");
    const tablePaymentModeCellText = document.createTextNode(modeOfPayment);
    tablePaymentModeCell.append(tablePaymentModeCellText);
    row.append(tablePaymentModeCell);

    const tablePaymentReceiptNumberCell = document.createElement("td");
    const tablePaymentReceiptNumberCellText =
      document.createTextNode(recieptNumber);
    tablePaymentReceiptNumberCell.append(tablePaymentReceiptNumberCellText);
    row.append(tablePaymentReceiptNumberCell);

    const rowCTAbuttonCell = document.createElement("td");

    // const editButtonCell = document.createElement("button");
    // editButtonCell.className = "btn btn-primary mr-2 edit";
    // const editButtonCellText = document.createTextNode("Edit");
    // editButtonCell.append(editButtonCellText);
    // editButtonCell.addEventListener("click", (e) => {
    //   this.populateEditTenantPaymentForm(e);
    // });
    // rowCTAbuttonCell.append(editButtonCell);

    const deleteButtonCell = document.createElement("button");
    deleteButtonCell.className = "btn btn-danger ml-2 delete";
    const deleteButtonCellText = document.createTextNode("Delete");
    deleteButtonCell.append(deleteButtonCellText);
    deleteButtonCell.addEventListener("click", (e) => {
      this.deleteTenantPaymentAndRender(e, paymentID, accessToken, tableBody);
    });
    rowCTAbuttonCell.append(deleteButtonCell);

    row.append(rowCTAbuttonCell);

    return row;
  }

  static async readAndRenderPayments(
    accessToken,
    form,
    propertyId,
    roomId,
    tableBody
  ) {
    if (!accessToken || !form || !propertyId || !roomId || !tableBody) return;

    const selectedTenantForm = form.querySelector("select");
    const selectedTenantId = form.querySelector("select")?.value;

    if (!selectedTenantId) {
      this.handleErrors("please select a tenant.");
      return;
    }

    const tenantName = selectedTenantForm.children[selectedTenantId].innerText;

    console.log(tenantName);

    const localStorageSelectedTenantId =
      localStorage.getItem("liparentSelectedTenantId") || null;

    if (
      localStorageSelectedTenantId &&
      localStorageSelectedTenantId === selectedTenantId
    )
      return;

    const { selectedTenantPayments, message } =
      await Store.readAllTenantPaymentsForRoomInProperty(
        accessToken,
        propertyId,
        roomId,
        selectedTenantId
      );

    console.log(selectedTenantPayments, message);

    if (selectedTenantPayments.length && message)
      this.alertMessage(message, "success");

    this.setSelectedTenantNameInLocalStorage(tenantName);
    this.setSelectedTenantIdInLocalStorage(selectedTenantId);
    this.updateTableDescription();

    if (!selectedTenantPayments.length && message) {
      this.clearTable(tableBody);
      this.handleErrors(message);
      return;
    }

    this.renderTenantPayments(selectedTenantPayments, accessToken, tableBody);
  }

  static async addNewTenantPaymentAndRender(
    accessToken,
    tableBody,
    propertyId,
    roomId,
    form
  ) {
    if (!accessToken || !tableBody || !propertyId || !form) return;

    const selectedTenantId = localStorage.getItem("liparentSelectedTenantId")
      ? localStorage.getItem("liparentSelectedTenantId")
      : null;

    const selectedTenantName = localStorage.getItem(
      "liparentSelectedTenantName"
    )
      ? localStorage.getItem("liparentSelectedTenantName")
      : null;

    const selectedRoomNumber = localStorage.getItem(
      "liparentSelectedRoomNumber"
    )
      ? localStorage.getItem("liparentSelectedRoomNumber")
      : null;

    if (!selectedTenantId || !selectedTenantName) return;

    const paymentAmount = form.querySelector(
      "[data-new-payment-amount]"
    )?.value;
    const paymentMonth = form.querySelector("[data-new-payment-month]")?.value;
    const paymentMode = form.querySelector("[data-new-payment-mode]")?.value;
    const paymentReceiptNumber = form.querySelector(
      "[data-new-payment-receiptNumber]"
    )?.value;

    if (
      !confirm(
        `Do you want to add a new payemnt by ${selectedTenantName} for room: ${selectedRoomNumber}?`
      )
    )
      return;

    const newPayment = {
      amount: paymentAmount,
      month: paymentMonth,
      mode: paymentMode,
      recieptNumber: paymentReceiptNumber,
    };

    const { newTenantRoomRentPayments, message } =
      await Store.addNewTenantPaymentToRoomInProperty(
        accessToken,
        propertyId,
        roomId,
        selectedTenantId,
        newPayment
      );

    if (newTenantRoomRentPayments && message) {
      this.alertMessage(message, "success");
      this.renderTenantPayments(
        newTenantRoomRentPayments,
        accessToken,
        tableBody
      );
    }
  }

  static populateEditTenantPaymentForm(e) {
    e.preventDefault();

    const editTenantPaymentModal =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement.nextElementSibling
        .nextElementSibling;

    const homeSection =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement;

    console.log(homeSection);

    editTenantPaymentModal.classList.remove("hide");
    homeSection.classList.add("blur");

    const editForm = editTenantPaymentModal.querySelector(
      "[data-edit-payment-form]"
    );

    const paymentIdSpan = editTenantPaymentModal.querySelector(
      "[data-edit-payment-id]"
    );

    const paymentId =
      e.target.parentElement.parentElement.children[1].innerText;
    const month = e.target.parentElement.parentElement.children[3].innerText;
    const amountPaid =
      e.target.parentElement.parentElement.children[5].innerText;
    const mode = e.target.parentElement.parentElement.children[7].innerText;
    const receiptNumber =
      e.target.parentElement.parentElement.children[8].innerText;

    const paymentAmountFormInput = editForm.querySelector(
      "[data-edited-amount]"
    );
    const paymentMonthFormInput = editForm.querySelector("[data-edited-month]");
    const paymentModeFormInput = editForm.querySelector("[data-edited-mode]");
    const paymentReceiptNumberFormInput = editForm.querySelector(
      "[data-edited-receiptNumber]"
    );

    paymentIdSpan.innerText = paymentId;

    paymentAmountFormInput.value = amountPaid;
    paymentMonthFormInput.value = month;
    paymentModeFormInput.value = mode;
    paymentReceiptNumberFormInput.value = receiptNumber;
  }

  static async editTenantAndRender(
    accessToken,
    tableBody,
    propertyId,
    roomId,
    form
  ) {
    if (!accessToken || !tableBody || !propertyId || !roomId || !form) return;

    const paymentId = form.parentElement.querySelector(
      "[data-edit-payment-id]"
    )?.innerText;

    if (!paymentId) return;

    if (!confirm(`Do you want to edit tenant payment with ID: "${paymentId}"?`))
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

  static async deleteTenantPaymentAndRender(
    e,
    paymentId,
    accessToken,
    tableBody
  ) {
    e.preventDefault();
    if (!paymentId || !accessToken || !tableBody) return;

    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    if (!selectedPropertyId) {
      this.handleErrors("please select a property.");
      return;
    }

    const selectedRoomId =
      localStorage.getItem("liparentSelectedRoomId") || null;

    if (!selectedRoomId) {
      this.handleErrors("please select a room.");
      return;
    }

    const selectedTenantId =
      localStorage.getItem("liparentSelectedTenantId") || null;

    if (!selectedTenantId) {
      this.handleErrors("please select a tenant.");
      return;
    }

    if (
      !confirm(`Do you want to delete tenant payment with ID: "${paymentId}"?`)
    )
      return;

    // const { deletedRoomTenants, message, error } = await Store.deleteRoomOnPorperty(
    //   accessToken,
    //   propertyId,
    //   roomId
    // );

    UserInterface.openLoader(
      "deleting tenant payment",
      "deletingTenantPayment"
    );

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
        tenantId: selectedTenantId,
        paymentId,
      }),
    };

    const readAllRoomsOnSinglePropertyRequest = await fetch(
      "http://localhost:4000/api/user/owner/delete/property/room/tenant/payment",
      requestOptions
    );

    const { deletedTenantPayments, message, error } =
      await readAllRoomsOnSinglePropertyRequest.json();

    if (deletedTenantPayments || message || error)
      UserInterface.closeLoader("deletingTenantPayment");

    if (error) {
      this.handleErrors(error);
    }

    if (deletedTenantPayments && message) {
      this.alertMessage(message, "success");
      this.renderTenantPayments(deletedTenantPayments, accessToken, tableBody);

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

    const tenantName = localStorage.getItem("liparentSelectedTenantName")
      ? localStorage.getItem("liparentSelectedTenantName")
      : null;

    if (!tenantName) {
      this.handleErrors("selected tenant name not found");
      return;
    }

    document.querySelector(
      "[data-table-description]"
    ).innerText = `Payments by ${tenantName} for Room: ${roomNumber} in: ${propertyName}.`;
  }

  static async updateTableBodyState(
    accessToken,
    tableBody,
    propertyId,
    roomId,
    selectedTenantId
  ) {
    if (
      !accessToken ||
      !tableBody ||
      !propertyId ||
      !roomId ||
      !selectedTenantId
    )
      return;

    const { selectedTenantPayments, message } =
      await Store.readAllTenantPaymentsForRoomInProperty(
        accessToken,
        propertyId,
        roomId,
        selectedTenantId
      );

    if (!selectedTenantPayments.length && message) {
      this.handleErrors(message);
      this.updateTableDescription();
      return;
    }

    this.alertMessage(message, "success");
    this.renderTenantPayments(selectedTenantPayments, accessToken, tableBody);
  }

  static setSelectedTenantIdInLocalStorage(selectedTenantId) {
    localStorage.removeItem("liparentSelectedTenantId");
    localStorage.setItem("liparentSelectedTenantId", selectedTenantId);
  }

  static setSelectedTenantNameInLocalStorage(selectedTenantName) {
    localStorage.removeItem("liparentSelectedTenantName");
    localStorage.setItem("liparentSelectedTenantName", selectedTenantName);
  }
}
