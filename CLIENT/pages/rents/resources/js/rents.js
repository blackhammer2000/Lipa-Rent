(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const homeSection = document.querySelector(".home");
  const tableBody = document.querySelector("[data-table]");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  const selectedRoomId = localStorage.getItem("liparentSelectedRoomId")
    ? localStorage.getItem("liparentSelectedRoomId")
    : null;

  const selectedTenantId = localStorage.getItem("liparentSelectedTenantId")
    ? localStorage.getItem("liparentSelectedTenantId")
    : null;

  if (!selectedPropertyId) {
    UserInterface.handleErrors("please select a property in the room section");
    location.assign("/CLIENT/pages/rooms/rooms.html");
    return;
  }

  if (!selectedRoomId) {
    UserInterface.handleErrors("please select a room in the tenants section.");
    location.assign("/CLIENT/pages/tenants/tenants.html");
    return;
  }

  if (selectedPropertyId && selectedRoomId && selectedTenantId) {
    UserInterface.updateTableDescription();
    UserInterface.updateTableBodyState(
      accessToken,
      tableBody,
      selectedPropertyId,
      selectedRoomId,
      selectedTenantId
    );
  }

  UserInterface.renderTenantNamesForSelection(
    accessToken,
    selectedPropertyId,
    selectedRoomId
  );

  const selectTenantForm = document.querySelector("[ data-select-tenant-form]");

  selectTenantForm.addEventListener("submit", (e) => {
    e.preventDefault();
    UserInterface.readAndRenderPayments(
      accessToken,
      selectTenantForm,
      selectedPropertyId,
      selectedRoomId,
      tableBody
    );
  });

  const addNewPaymentModal = document.querySelector("[data-create-payment]");

  const addNewPaymentButton = document.querySelector(
    "[data-create-payment-button]"
  );
  addNewPaymentButton.addEventListener("click", (e) => {
    addNewPaymentModal.classList.remove("hide");
    homeSection.classList.add("blur");
  });

  const closeNewPaymentModal = document.querySelector(
    "[data-close-create-payment-modal]"
  );
  closeNewPaymentModal.addEventListener("click", () => {
    addNewPaymentModal.classList.add("hide");
    homeSection.classList.remove("blur");
  });

  const newPaymentForm = addNewPaymentModal.querySelector("form");
  newPaymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await UserInterface.addNewTenantPaymentAndRender(
      accessToken,
      tableBody,
      selectedPropertyId,
      selectedRoomId,
      newPaymentForm
    );
  });

  const editPaymentForm = document.querySelector("[data-edit-payment-form]");
  const closeEditPaymentModalButton =
    editPaymentForm.parentElement.querySelector("[data-close-edit-modal]");

  // editPaymentForm.addEventListener("submit", (e) => {
  //   e.preventDefault();
  //   UserInterface.editRoomTenantAndRender(
  //     accessToken,
  //     tableBody,
  //     selectedPropertyId,
  //     selectedRoomId,
  //     editPaymentForm
  //   );
  // });

  closeEditPaymentModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.target.parentElement.parentElement.parentElement.parentElement.classList.add(
      "hide"
    );
    homeSection.classList.remove("blur");
  });
})();
