(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  UserInterface.renderPropertySelectionOptions();

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  const tableBody = document.querySelector("[data-table]");

  if (selectedPropertyId !== (null || undefined))
    UserInterface.readAndRenderAllRoomsOnSingleProperty(
      accessToken,
      selectedPropertyId,
      tableBody
    );

  const selectPropertyForm = document.querySelector("[data-select-property]");

  selectPropertyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const propertyId = selectPropertyForm.querySelector("input")?.value.trim();

    if (propertyId)
      await UserInterface.readAndRenderAllRoomsOnSingleProperty(
        accessToken,
        propertyId,
        tableBody
      );
  });

  const editPropertyForm = document.querySelector("[data-edit-room-form]");
  const closeEditPropertyModalButton =
    editPropertyForm.parentElement.querySelector("[data-close-edit-modal]");

  editPropertyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    UserInterface.editRoomAndRender(
      e,
      editPropertyForm,
      accessToken,
      tableBody
    );
  });

  closeEditPropertyModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.closeEditRoomModal(e);
  });

  const createPropertyButton = document.querySelector(
    "[data-create-room-button]"
  );
  const createPropertyModal = document.querySelector("[data-create-room]");
  const closeCreatePropertyModalButton = createPropertyModal.querySelector(
    "[data-close-create-room-modal]"
  );
  const createPropertyForm = createPropertyModal.querySelector("form");

  createPropertyButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.openCreateRoomModal(createPropertyModal);
  });

  createPropertyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    UserInterface.addRoomToPropertyAndRender(
      e,
      accessToken,
      createPropertyForm,
      tableBody
    );
  });

  closeCreatePropertyModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.closeCreateRoomModal(e);
  });

  const logoutButton = document.querySelector("[data-logout]");
  logoutButton.addEventListener("click", () => UserInterface.handleLogout());
})();
