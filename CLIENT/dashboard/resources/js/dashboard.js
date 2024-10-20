(async function () {
  const accessToken = localStorage.getItem("liparentAccessToken")
    ? JSON.parse(localStorage.getItem("liparentAccessToken"))
    : null;

  if (accessToken === (null || undefined))
    location.assign("/CLIENT/login/login.html");

  const tableBody = document.querySelector("[data-table]");

  const properties = await Store.readAllPropertiesOwned(accessToken);

  if (!properties) return;

  UserInterface.renderProperties(properties, tableBody);

  const editPropertyForm = document.querySelector("[data-edit-property-form]");

  editPropertyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    UserInterface.editPropertyAndRender(
      e,
      editPropertyForm,
      accessToken,
      tableBody
    );
  });
})();
