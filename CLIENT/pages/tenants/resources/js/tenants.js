(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  if (!selectedPropertyId) {
    alert("please select a property in the room section");
    return;
  }

  UserInterface.renderRoomNumbersForSelection(accessToken, selectedPropertyId);

  const tableBody = document.querySelector("[data-table]");

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

  const addNewTenantButton = document.querySelector(
    "[data-create-tenant-button]"
  );
  addNewTenantButton.addEventListener("click", () => {
    const addNewTenantModal = document.querySelector("[data-create-tenant]");
    addNewTenantModal.classList.toggle("hide");
  });

  const closeNewTenantModal = document.querySelector(
    "[data-close-create-tenant-modal]"
  );
  closeNewTenantModal.addEventListener("click", () => {
    const addNewTenantModal = document.querySelector("[data-create-tenant]");
    addNewTenantModal.classList.add("hide");
  });
})();
