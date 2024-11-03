(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const tableBody = document.querySelector("[data-table]");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  if (!selectedPropertyId) {
    alert("please select a property in the room section");
    location.assign("/CLIENT/pages/rooms/rooms");
    return;
  }

  const selectedRoomId = localStorage.getItem("liparentSelectedRoomId")
    ? localStorage.getItem("liparentSelectedRoomId")
    : null;

  if (selectedPropertyId && selectedRoomId) {
    UserInterface.updateTableDescription(selectedPropertyId, selectedRoomId);
    UserInterface.updateTableBodyState(
      accessToken,
      tableBody,
      selectedPropertyId,
      selectedRoomId
    );
  }

  UserInterface.renderRoomNumbersForSelection(accessToken, selectedPropertyId);

  const selectRoomForm = document.querySelector("[ data-select-room-form]");

  selectRoomForm.addEventListener("submit", (e) => {
    e.preventDefault();

    UserInterface.readAndRenderTenants(
      accessToken,
      selectRoomForm,
      selectedPropertyId,
      tableBody
    );
  });

  const addNewTenantModal = document.querySelector("[data-create-tenant]");

  const addNewTenantButton = document.querySelector(
    "[data-create-tenant-button]"
  );
  addNewTenantButton.addEventListener("click", (e) => {
    addNewTenantModal.classList.toggle("hide");
  });

  const closeNewTenantModal = document.querySelector(
    "[data-close-create-tenant-modal]"
  );
  closeNewTenantModal.addEventListener("click", () => {
    addNewTenantModal.classList.add("hide");
  });

  const newTenantForm = addNewTenantModal.querySelector("form");
  newTenantForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await UserInterface.addNewTenantAndRender(
      accessToken,
      tableBody,
      selectedPropertyId,
      newTenantForm
    );
  });
})();
