(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const tableBody = document.querySelector("[data-table]");

  const properties = await Store.readAllPropertiesOwned(accessToken);

  if (!properties) return;

  UserInterface.renderProperties(properties, accessToken, tableBody);

  const editPropertyForm = document.querySelector("[data-edit-property-form]");
  const closeEditPropertyModalButton =
    editPropertyForm.parentElement.querySelector("[data-close-edit-modal]");

  editPropertyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    UserInterface.editPropertyAndRender(
      e,
      editPropertyForm,
      accessToken,
      tableBody
    );
  });

  closeEditPropertyModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.closeEditPropertyModal(e);
  });

  const createPropertyButton = document.querySelector(
    "[data-create-property-button]"
  );
  const createPropertyModal = document.querySelector("[data-create-property]");
  const closeCreatePropertyModalButton = createPropertyModal.querySelector(
    "[data-close-create-modal]"
  );
  const createPropertyForm = createPropertyModal.querySelector("form");

  createPropertyButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.openCreatePropertyModal(createPropertyModal);
  });

  createPropertyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    UserInterface.createPropertyAndRender(
      e,
      accessToken,
      createPropertyForm,
      tableBody
    );
  });

  closeCreatePropertyModalButton.addEventListener("click", (e) => {
    e.preventDefault();
    UserInterface.closeCreatePropertyModal(e);
  });
})();
