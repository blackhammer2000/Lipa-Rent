(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  UserInterface.renderPropertySelectionOptions(accessToken);

  const tableBody = document.querySelector("[data-table]");
  const homeSection = document.querySelector(".home");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId")
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  const selectedPropertyName = localStorage.getItem(
    "liparentSelectedPropertyName"
  )
    ? localStorage.getItem("liparentSelectedPropertyId")
    : null;

  UserInterface.setNavButtonsStatus(selectedPropertyId);

  if (
    selectedPropertyId !== (null || undefined) &&
    selectedPropertyName !== (null || undefined)
  )
    UserInterface.readAndRenderAllRoomsOnSingleProperty(
      accessToken,
      selectedPropertyId,
      selectedPropertyName,
      tableBody
    );

  const selectPropertyForm = document.querySelector("[data-select-property]");

  selectPropertyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedPropertyIdForm = selectPropertyForm.querySelector("select");
    const propertyId = selectPropertyForm.querySelector("select")?.value.trim();

    const propertyName = selectedPropertyIdForm.children[propertyId].innerText;

    if (!propertyId) {
      UserInterface.handleErrors("Select a property!");
      return;
    }

    const selectedPropertyId = localStorage.getItem(
      "liparentSelectedPropertyId"
    )
      ? localStorage.getItem("liparentSelectedPropertyId")
      : null;

    if (selectedPropertyId && selectedPropertyId === propertyId) return;

    await UserInterface.readAndRenderAllRoomsOnSingleProperty(
      accessToken,
      propertyId,
      propertyName,
      tableBody
    );
  });

  const editPropertyForm = document.querySelector("[data-edit-room-form]");
  const closeEditPropertyModalButton =
    editPropertyForm.parentElement.querySelector("[data-close-edit-modal]");

  editPropertyForm.addEventListener("submit", (e) => {
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
    homeSection.classList.remove("blur");
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
    homeSection.classList.add("blur");
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
    homeSection.classList.remove("blur");
  });
})();
